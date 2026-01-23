/**
 * Chat Message Proxy Endpoint (Streaming)
 * POST /api/eliza/chat
 *
 * Sends message to AI character and streams response via Server-Sent Events.
 * Uses SDK StreamCallbacks (onChunk, onComplete, onError) format.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient, createUserClient } from '@/lib/eliza/client'
import { requireWalletSession, requireElizaUserToken } from '@/lib/eliza/sessionAuth'
import { resolveCharacterByTokenId } from '@/lib/eliza/characterResolver'
import { getCharacter } from '@/lib/services/character-service'
import type { StreamCallbacks, ChatMessage } from '@eliza/sdk'

interface ChatRequest {
  tokenId: string
  message: string
  conversationId?: string
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get user session
    const session = await getSession()

    const walletResult = requireWalletSession(session)
    if (walletResult instanceof NextResponse) {
      return walletResult
    }

    const tokenResult = requireElizaUserToken(session)
    if (tokenResult instanceof NextResponse) {
      return tokenResult
    }

    const { accessToken } = tokenResult

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
    const wagdieCharacter = await getCharacter(parsedTokenId)
    if (!wagdieCharacter) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
        { status: 404 }
      )
    }

    const serverClient = getElizaClient()
    const userClient = createUserClient(accessToken)

    // Resolve or auto-create character in Eliza (FR-011) via centralized resolver
    // IMPORTANT: use serverClient for record resolution/creation (may require API key on live endpoint)
    const record = await resolveCharacterByTokenId({
      elizaClient: serverClient,
      tokenId: body.tokenId,
      wagdieDefaults: {
        name: wagdieCharacter.name ?? null,
        backgroundStory: wagdieCharacter.background_story ?? null,
      },
    })

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Use SDK StreamCallbacks interface
          const callbacks: StreamCallbacks = {
            onChunk: (chunk: string) => {
              // Map SDK onChunk to existing 'token' event format for frontend compatibility
              const event = `event: token\ndata: ${JSON.stringify({ token: chunk })}\n\n`
              controller.enqueue(encoder.encode(event))
            },
            onComplete: (message: ChatMessage, conversationId: string) => {
              // Include message.id and message.createdAt for improved client fidelity
              const event = `event: complete\ndata: ${JSON.stringify({
                id: message.id,
                content: message.content,
                conversationId,
                createdAt: message.createdAt,
              })}\n\n`
              controller.enqueue(encoder.encode(event))
              controller.close()
            },
            onError: (error) => {
              const message =
                error && typeof error === 'object' && 'message' in error
                  ? String(error.message)
                  : 'Chat failed'

              const event = `event: error\ndata: ${JSON.stringify({ message })}\n\n`
              controller.enqueue(encoder.encode(event))
              controller.close()
            },
          }

          // IMPORTANT: use userClient for chat streaming (user-scoped auth token)
          await userClient.chat.sendMessageStream(
            record.id,
            {
              message: body.message,
              conversationId: body.conversationId,
            },
            callbacks
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
