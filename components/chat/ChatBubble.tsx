/**
 * ChatBubble Component
 * Renders individual chat message bubbles with WAGDIE theming
 */

import { memo } from 'react'
import type { ChatMessage } from '@/types/eliza'

interface ChatBubbleProps {
  message: Pick<ChatMessage, 'role' | 'content'>
  isStreaming?: boolean
}

function ChatBubbleComponent({ message, isStreaming = false }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      role="listitem"
    >
      <div
        className={`
          max-w-[80%] px-4 py-3 rounded-lg
          ${isUser
            ? 'bg-soul-800 text-neutral-100 rounded-br-none'
            : 'bg-neutral-800/50 text-neutral-200 rounded-bl-none border border-neutral-700/50'
          }
          ${isStreaming ? 'animate-pulse' : ''}
        `}
      >
        {/* Role label for screen readers */}
        <span className="sr-only">
          {isUser ? 'You said:' : 'Character said:'}
        </span>

        {/* Message content */}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-soul-500 animate-pulse" aria-hidden="true" />
          )}
        </p>
      </div>
    </div>
  )
}

export const ChatBubble = memo(ChatBubbleComponent)
