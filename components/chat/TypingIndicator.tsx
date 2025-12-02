/**
 * TypingIndicator Component
 * Shows animated dots when AI is generating a response
 */

import { memo } from 'react'

interface TypingIndicatorProps {
  characterName?: string
}

function TypingIndicatorComponent({ characterName = 'Character' }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start mb-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2 px-4 py-3 bg-neutral-800/50 rounded-lg rounded-bl-none border border-neutral-700/50">
        <span className="sr-only">{characterName} is typing</span>
        <div className="flex gap-1" aria-hidden="true">
          <span
            className="w-2 h-2 bg-soul-500 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-soul-500 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-soul-500 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}

export const TypingIndicator = memo(TypingIndicatorComponent)
