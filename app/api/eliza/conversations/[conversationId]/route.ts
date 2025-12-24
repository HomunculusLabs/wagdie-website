/**
 * Eliza Single Conversation Proxy
 * GET /api/eliza/conversations/[conversationId] - Fetch conversation with messages
 * DELETE /api/eliza/conversations/[conversationId] - Delete conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import type { ConversationDetail, ChatMessage, ErrorResponse } from '@/types/eliza'

interface RouteParams {
  params: Promise<{ conversationId: string }>
}

/**
 * GET /api/eliza/conversations/[conversationId]
 * Fetches a single conversation with its messages
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<ConversationDetail | ErrorResponse>> {
  try {
    // Get user session
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    const userAddress = session.address.toLowerCase()
    const { conversationId } = await params

    // Get Eliza client
    const elizaClient = getElizaClient()

    // Fetch conversation details
    // SDK returns ConversationDetail with { id, characterId, characterName, messageCount, lastMessageAt, createdAt, messages }
    const sdkConversation = await elizaClient.conversations.get(conversationId)

    // Map SDK messages to our types
    const messages: ChatMessage[] = sdkConversation.messages.map((msg: { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }) => ({
      id: msg.id,
      conversationId: conversationId,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
    }))

    const response: ConversationDetail = {
      id: sdkConversation.id,
      characterId: sdkConversation.characterId,
      userId: userAddress, // SDK scopes to current user via auth
      title: null, // SDK doesn't have title field
      messageCount: sdkConversation.messageCount,
      createdAt: sdkConversation.createdAt,
      updatedAt: sdkConversation.lastMessageAt, // SDK uses lastMessageAt
      messages,
      hasMore: false, // SDK doesn't support pagination in single get
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[Eliza Conversations] Get failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Conversation not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication failed' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/eliza/conversations/[conversationId]
 * Deletes a conversation and all its messages
 * SDK scopes to authenticated user - can only delete own conversations
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    // Get user session
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    const { conversationId } = await params

    // Get Eliza client
    const elizaClient = getElizaClient()

    // Delete the conversation
    // SDK automatically scopes to authenticated user - can only delete own conversations
    await elizaClient.conversations.delete(conversationId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Eliza Conversations] Delete failed:', error)

    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Conversation not found' },
          { status: 404 }
        )
      }
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Authentication failed' },
          { status: 401 }
        )
      }
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Cannot delete this conversation' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete conversation' },
      { status: 500 }
    )
  }
}
