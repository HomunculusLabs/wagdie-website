/**
 * ChatInput Component
 * Text input with send button for chat messages
 */

import { useState, useCallback, useRef, useEffect, memo, KeyboardEvent } from 'react'
import { Button } from '@/components-new'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
  placeholder?: string
}

function ChatInputComponent({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }, [message])

  const handleSend = useCallback(() => {
    const trimmed = message.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }, [message, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Send on Enter (without Shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="flex gap-2 p-4 border-t border-neutral-800 bg-black/30">
      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className="
          flex-1 min-h-[40px] max-h-[120px] px-3 py-2
          bg-neutral-900 border border-neutral-700 rounded-lg
          text-sm text-neutral-100 placeholder-neutral-500
          focus:outline-none focus:border-soul-500 focus:ring-1 focus:ring-soul-500
          disabled:opacity-50 disabled:cursor-not-allowed
          resize-none
        "
        aria-label="Chat message input"
      />
      <Button
        variant="primary"
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        aria-label="Send message"
        className="self-end h-10 px-4"
      >
        <SendIcon />
      </Button>
    </div>
  )
}

function SendIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
      />
    </svg>
  )
}

export const ChatInput = memo(ChatInputComponent)
