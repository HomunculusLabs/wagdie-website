/**
 * useCharacterChat Hook
 * Manages chat state and streaming responses for character conversations
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { ChatMessage } from '@/types/eliza'

interface UseCharacterChatReturn {
  /** All messages in current conversation */
  messages: ChatMessage[]
  /** Send a new message */
  sendMessage: (content: string) => Promise<void>
  /** Whether a message is currently streaming */
  isStreaming: boolean
  /** Current streaming content (partial response) */
  streamingContent: string
  /** Current conversation ID */
  conversationId: string | null
  /** Start a new conversation */
  newConversation: () => void
  /** Set conversation ID (for loading history) */
  setConversationId: (id: string | null) => void
  /** Load messages for a conversation */
  loadMessages: (messages: ChatMessage[]) => void
  /** Error message if chat failed */
  error: string | null
  /** Clear error */
  clearError: () => void
}

export function useCharacterChat(tokenId: string): UseCharacterChatReturn {
  const { isConnected } = useAccount()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  // Send a message and handle streaming response
  const sendMessage = useCallback(async (content: string) => {
    if (!isConnected) {
      setError('Please connect your wallet to chat')
      return
    }

    if (isStreaming) {
      return
    }

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversationId: conversationId || '',
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])

    setIsStreaming(true)
    setStreamingContent('')
    setError(null)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/eliza/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tokenId,
          message: content,
          conversationId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Chat request failed')
      }

      // Handle SSE stream
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete events in buffer
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue

          const lines = event.split('\n')
          let eventType = ''
          let eventData = ''

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7)
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6)
            }
          }

          if (!eventData) continue

          try {
            const data = JSON.parse(eventData)

            switch (eventType) {
              case 'token':
                fullContent += data.token
                setStreamingContent(fullContent)
                break

              case 'complete':
                // Add assistant message (use server createdAt when available)
                const assistantMessage: ChatMessage = {
                  id: data.id,
                  conversationId: data.conversationId,
                  role: 'assistant',
                  content: data.content,
                  createdAt: data.createdAt ?? new Date().toISOString(),
                }
                setMessages(prev => [...prev, assistantMessage])
                setConversationId(data.conversationId)
                break

              case 'error':
                throw new Error(data.message || 'Chat failed')
            }
          } catch (parseError) {
            console.error('[useCharacterChat] Failed to parse event:', parseError)
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled
        return
      }

      const message = err instanceof Error ? err.message : 'Chat failed'
      setError(message)
      console.error('[useCharacterChat] Error:', err)

      // Remove optimistic user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }, [isConnected, isStreaming, conversationId, tokenId])

  // Start a new conversation
  const newConversation = useCallback(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setMessages([])
    setConversationId(null)
    setIsStreaming(false)
    setStreamingContent('')
    setError(null)
  }, [])

  // Load messages for a conversation
  const loadMessages = useCallback((newMessages: ChatMessage[]) => {
    setMessages(newMessages)
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    messages,
    sendMessage,
    isStreaming,
    streamingContent,
    conversationId,
    newConversation,
    setConversationId,
    loadMessages,
    error,
    clearError,
  }
}
