/**
 * Chat Message Proxy Endpoint (Streaming)
 * POST /api/eliza/chat
 *
 * Sends message to AI character and streams response via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import { createClient } from '@supabase/supabase-js'
// ErrorResponse type used indirectly through NextResponse.json

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChatRequest {
  tokenId: string
  message: string
  conversationId?: string
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get user session
    const session = await getSession()
    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: ChatRequest = await request.json()

    // Validate request
    if (!body.tokenId || !body.message) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'tokenId and message are required' },
        { status: 400 }
      )
    }

    const parsedTokenId = parseInt(body.tokenId, 10)
    if (isNaN(parsedTokenId) || parsedTokenId < 0) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN_ID', message: 'Invalid token ID' },
        { status: 400 }
      )
    }

    // Verify character exists in WAGDIE database
    const { data: wagdieCharacter, error: dbError } = await supabase
      .from(CHARACTERS_TABLE)
      .select('token_id, name, background_story')
      .eq('token_id', parsedTokenId)
      .single()

    if (dbError || !wagdieCharacter) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
        { status: 404 }
      )
    }

    const elizaClient = getElizaClient()

    // Get or create AI character
    let aiCharacter = await elizaClient.characters.getByExternalId(body.tokenId)

    if (!aiCharacter) {
      // Auto-create AI character on first chat (FR-011)
      aiCharacter = await elizaClient.characters.create({
        externalId: body.tokenId,
        name: wagdieCharacter.name || `Character #${body.tokenId}`,
        personality: `A mysterious character from the world of WAGDIE. Character #${body.tokenId}.`,
        backstory: wagdieCharacter.background_story || '',
      })
    }

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await elizaClient.chat.sendMessageStream(
            {
              characterId: aiCharacter!.id,
              message: body.message,
              conversationId: body.conversationId,
            },
            {
              onChunk: (chunk: string) => {
                const event = `event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`
                controller.enqueue(encoder.encode(event))
              },
              onComplete: (message, conversationId) => {
                const event = `event: complete\ndata: ${JSON.stringify({
                  id: message.id,
                  content: message.content,
                  conversationId,
                })}\n\n`
                controller.enqueue(encoder.encode(event))
                controller.close()
              },
              onError: (error) => {
                const event = `event: error\ndata: ${JSON.stringify({
                  message: error.message || 'Chat failed',
                })}\n\n`
                controller.enqueue(encoder.encode(event))
                controller.close()
              },
            }
          )
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Chat failed'
          const event = `event: error\ndata: ${JSON.stringify({ message })}\n\n`
          controller.enqueue(encoder.encode(event))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Eliza Chat] Streaming failed:', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Chat request failed' },
      { status: 500 }
    )
  }
}
