/**
 * Eliza Conversations List Proxy
 * GET /api/eliza/conversations
 *
 * Returns list of conversations for the authenticated user.
 * Optionally filtered by character.
 *
 * Query params:
 * - characterId: Filter by specific character
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 50)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import type { Conversation, ErrorResponse } from '@/types/eliza'

interface ConversationsListResponse {
  conversations: Conversation[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ConversationsListResponse | ErrorResponse>> {
  try {
    // Get user session
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

    // Get Eliza client
    const elizaClient = getElizaClient()

    // Fetch conversations from Eliza API
    // SDK automatically scopes to authenticated user via auth token
    // Use listForCharacter if filtering by character, otherwise list all
    const response = characterId
      ? await elizaClient.conversations.listForCharacter(characterId, { page, pageSize })
      : await elizaClient.conversations.list({ page, pageSize })

    // Map SDK response to our types
    // SDK returns { items, total, page, pageSize, hasMore }
    const conversations: Conversation[] = response.items.map((conv: { id: string; characterId: string; messageCount: number; createdAt: string; lastMessageAt: string }) => ({
      id: conv.id,
      characterId: conv.characterId,
      userId: session.address!.toLowerCase(), // User is always current user (SDK scopes by auth)
      title: null, // SDK Conversation type doesn't have title
      messageCount: conv.messageCount,
      createdAt: conv.createdAt,
      updatedAt: conv.lastMessageAt, // SDK uses lastMessageAt
    }))

    return NextResponse.json({
      conversations,
      total: response.total,
      page: response.page,
      pageSize: response.pageSize,
      hasMore: response.hasMore,
    })
  } catch (error) {
    console.error('[Eliza Conversations] List failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication failed' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
