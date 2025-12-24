/**
 * Chat Message Proxy Endpoint (Streaming)
 * POST /api/eliza/chat
 *
 * Sends message to AI character and streams response via Server-Sent Events
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { createUserClient } from '@/lib/eliza/client'
import { resolveCharacterByTokenId } from '@/lib/eliza/characterResolver'
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

    // Require user-scoped Eliza auth token (SIWE flow)
    const accessToken = session.eliza?.tokens?.accessToken
    const expiresAt = session.eliza?.tokens?.expiresAt
    const now = Date.now()

    if (
      typeof accessToken !== 'string' ||
      accessToken.trim().length === 0 ||
      typeof expiresAt !== 'number' ||
      expiresAt <= now
    ) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message:
            'Eliza authentication required. Call /api/eliza/auth/nonce (then /api/eliza/auth/verify) to obtain a user-scoped token.',
        },
        { status: 401 }
      )
    }

    // Create user-scoped Eliza client
    const elizaClient = createUserClient(accessToken)

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

    // Resolve or auto-create character in Eliza (FR-011) via centralized resolver
    const record = await resolveCharacterByTokenId({
      elizaClient,
      tokenId: body.tokenId,
      wagdieDefaults: {
        name: wagdieCharacter.name ?? null,
        backgroundStory: wagdieCharacter.background_story ?? null,
      },
    })

    // Create SSE stream (event format must stay identical for frontend compatibility)
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // The streaming callback interface may differ from SDK types at runtime
          interface RuntimeStreamCallbacks {
            onToken: (token: string) => void
            onComplete: (response: { message: { id: string; content: string }; conversationId: string }) => void
            onError: (error: unknown) => void
          }
          const streamApi = elizaClient.chat.sendMessageStream as unknown as (
            input: { characterId: string; message: string; conversationId?: string },
            callbacks: RuntimeStreamCallbacks
          ) => Promise<void>

          await streamApi(
            {
              characterId: record.id,
              message: body.message,
              conversationId: body.conversationId,
            },
            {
              onToken: (token: string) => {
                const event = `event: token\ndata: ${JSON.stringify({ token })}\n\n`
                controller.enqueue(encoder.encode(event))
              },
              onComplete: (response) => {
                const event = `event: complete\ndata: ${JSON.stringify({
                  id: response.message.id,
                  content: response.message.content,
                  conversationId: response.conversationId,
                })}\n\n`
                controller.enqueue(encoder.encode(event))
                controller.close()
              },
              onError: (error) => {
                const message =
                  (error &&
                  typeof error === 'object' &&
                  'message' in error &&
                  typeof (error as { message?: unknown }).message === 'string'
                    ? (error as { message: string }).message
                    : null) || 'Chat failed'

                const event = `event: error\ndata: ${JSON.stringify({ message })}\n\n`
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
        Connection: 'keep-alive',
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
