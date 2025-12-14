'use client'

import { memo } from 'react'
import { useChatDock } from '@/contexts/ChatDockContext'
import { Button } from '@/components-new'

function ChatToggleButtonComponent() {
  const { isOpen, target, toggleChat } = useChatDock()

  if (!target) return null

  const ariaLabel = isOpen ? 'Close chat drawer' : 'Open chat drawer'

  const positionClassName = isOpen ? 'right-4 md:right-[520px]' : 'right-4'

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 ${positionClassName} z-[70]`}
    >
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => toggleChat()}
        aria-label={ariaLabel}
        title={ariaLabel}
        className="rounded-full shadow-lg bg-black/40 backdrop-blur-sm border-neutral-700 hover:border-neutral-500"
      >
        <ChatToggleIcon isOpen={isOpen} />
      </Button>
    </div>
  )
}

function ChatToggleIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    )
  }

  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h8M8 14h5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  )
}

export const ChatToggleButton = memo(ChatToggleButtonComponent)