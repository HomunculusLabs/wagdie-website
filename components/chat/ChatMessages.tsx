/**
 * ChatMessages Component
 * Displays chat message history with auto-scroll and virtualization support
 */

import { memo, useRef, useEffect } from 'react'
import { ChatBubble } from './ChatBubble'
import { TypingIndicator } from './TypingIndicator'
import type { ChatMessage } from '@/types/eliza'

interface ChatMessagesProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  streamingContent?: string
  characterName?: string
}

function ChatMessagesComponent({
  messages,
  isStreaming = false,
  streamingContent = '',
  characterName = 'Character',
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 overscroll-contain scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
      role="log"
      aria-label="Chat messages"
      aria-live="polite"
    >
      {messages.length === 0 && !isStreaming && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-4xl mb-4 opacity-30">💬</div>
          <p className="text-neutral-500 text-md">
            Start a conversation with {characterName}
          </p>
          <p className="text-neutral-600 text-md mt-2">
            Type a message below to begin
          </p>
        </div>
      )}

      <div role="list">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <ChatBubble
            message={{ role: 'assistant', content: streamingContent }}
            isStreaming
          />
        )}

        {/* Typing indicator when waiting for first chunk */}
        {isStreaming && !streamingContent && (
          <TypingIndicator characterName={characterName} />
        )}
      </div>

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}

export const ChatMessages = memo(ChatMessagesComponent)
