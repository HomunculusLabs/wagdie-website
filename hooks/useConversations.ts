/**
 * useConversations Hook
 * Manages conversation list operations for a character
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { readApiRaw } from '@/lib/api/client-response'
import type { Conversation, ConversationDetail, ChatMessage } from '@/types/eliza'

interface ConversationsListResponse {
  conversations: Conversation[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

interface UseConversationsOptions {
  /** Character ID (Eliza) to filter conversations */
  characterId?: string
  /** WAGDIE token ID (server will translate to Eliza character record ID) */
  tokenId?: string
  /** Initial page size */
  pageSize?: number
  /** Auto-fetch on mount */
  autoFetch?: boolean
}

interface UseConversationsReturn {
  /** List of conversations */
  conversations: Conversation[]
  /** Currently selected conversation with messages */
  activeConversation: ConversationDetail | null
  /** Whether conversations list is loading */
  isLoading: boolean
  /** Whether a specific conversation is loading */
  isLoadingConversation: boolean
  /** Whether more conversations are being loaded */
  isLoadingMore: boolean
  /** Whether deleting a conversation */
  isDeleting: boolean
  /** Error message if any */
  error: string | null
  /** Total number of conversations */
  total: number
  /** Whether there are more conversations to load */
  hasMore: boolean
  /** Fetch conversations list */
  fetchConversations: (reset?: boolean) => Promise<void>
  /** Load more conversations (pagination) */
  loadMore: () => Promise<void>
  /** Select and load a conversation */
  selectConversation: (conversationId: string) => Promise<void>
  /** Clear active conversation */
  clearActiveConversation: () => void
  /** Delete a conversation */
  deleteConversation: (conversationId: string) => Promise<boolean>
  /** Load more messages for active conversation */
  loadMoreMessages: () => Promise<void>
  /** Add a message to active conversation (optimistic) */
  addMessage: (message: ChatMessage) => void
  /** Clear error */
  clearError: () => void
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const { characterId, tokenId, pageSize = 20, autoFetch = true } = options

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  const pageRef = useRef(1)
  const oldestMessageIdRef = useRef<string | null>(null)

  // Fetch conversations list
  const fetchConversations = useCallback(async (reset = true) => {
    if (reset) {
      setIsLoading(true)
      pageRef.current = 1
    } else {
      setIsLoadingMore(true)
    }
    setError(null)

    try {
      const params = new URLSearchParams({
        page: pageRef.current.toString(),
        pageSize: pageSize.toString(),
      })

      if (characterId) {
        params.set('characterId', characterId)
      } else if (tokenId) {
        params.set('tokenId', tokenId)
      }

      const response = await fetch(`/api/eliza/conversations?${params}`, {
        credentials: 'include',
      })
      const result = await readApiRaw<ConversationsListResponse>(
        response,
        'Failed to fetch conversations'
      )

      if (reset) {
        setConversations(result.conversations)
      } else {
        setConversations((prev) => [...prev, ...result.conversations])
      }

      setTotal(result.total)
      setHasMore(result.hasMore)
      pageRef.current = result.page + 1 // Next page
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations'
      setError(message)
      console.error('[useConversations] Fetch error:', err)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [characterId, tokenId, pageSize])

  // Load more conversations
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    await fetchConversations(false)
  }, [fetchConversations, isLoadingMore, hasMore])

  // Select and load a conversation with messages
  const selectConversation = useCallback(async (conversationId: string) => {
    setIsLoadingConversation(true)
    setError(null)
    oldestMessageIdRef.current = null

    try {
      const response = await fetch(`/api/eliza/conversations/${conversationId}`, {
        credentials: 'include',
      })
      const conversation = await readApiRaw<ConversationDetail>(
        response,
        'Failed to fetch conversation'
      )
      setActiveConversation(conversation)

      // Track oldest message for pagination
      if (conversation.messages.length > 0) {
        oldestMessageIdRef.current = conversation.messages[0].id
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversation'
      setError(message)
      console.error('[useConversations] Select error:', err)
    } finally {
      setIsLoadingConversation(false)
    }
  }, [])

  // Clear active conversation
  const clearActiveConversation = useCallback(() => {
    setActiveConversation(null)
    oldestMessageIdRef.current = null
  }, [])

  // Delete a conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/eliza/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      await readApiRaw<{ success: boolean }>(response, 'Failed to delete conversation')

      // Remove from list
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
      setTotal((prev) => Math.max(0, prev - 1))

      // Clear active if it was the deleted one
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete conversation'
      setError(message)
      console.error('[useConversations] Delete error:', err)
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [activeConversation])

  // Load more messages for active conversation
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || !activeConversation.hasMore || !oldestMessageIdRef.current) {
      return
    }

    setIsLoadingConversation(true)

    try {
      const params = new URLSearchParams({
        limit: '50',
        before: oldestMessageIdRef.current,
      })

      const response = await fetch(
        `/api/eliza/conversations/${activeConversation.id}?${params}`,
        { credentials: 'include' }
      )
      const result = await readApiRaw<ConversationDetail>(
        response,
        'Failed to load more messages'
      )

      // Prepend older messages
      setActiveConversation((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...result.messages, ...prev.messages],
          hasMore: result.hasMore,
        }
      })

      // Update oldest message reference
      if (result.messages.length > 0) {
        oldestMessageIdRef.current = result.messages[0].id
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more messages'
      setError(message)
      console.error('[useConversations] Load more messages error:', err)
    } finally {
      setIsLoadingConversation(false)
    }
  }, [activeConversation])

  // Add a message optimistically (called from chat)
  const addMessage = useCallback((message: ChatMessage) => {
    setActiveConversation((prev) => {
      if (!prev) return null
      return {
        ...prev,
        messages: [...prev.messages, message],
        messageCount: prev.messageCount + 1,
        updatedAt: message.createdAt,
      }
    })

    // Also update the conversation in the list
    setConversations((prev) =>
      prev.map((c) =>
        c.id === message.conversationId
          ? { ...c, messageCount: c.messageCount + 1, updatedAt: message.createdAt }
          : c
      )
    )
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchConversations()
    }
  }, [autoFetch, fetchConversations])

  return {
    conversations,
    activeConversation,
    isLoading,
    isLoadingConversation,
    isLoadingMore,
    isDeleting,
    error,
    total,
    hasMore,
    fetchConversations,
    loadMore,
    selectConversation,
    clearActiveConversation,
    deleteConversation,
    loadMoreMessages,
    addMessage,
    clearError,
  }
}
