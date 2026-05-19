import { memo } from 'react'
import type { PersonaAssistantMessage } from '@/types/eliza'

interface AssistantTranscriptProps {
  messages: PersonaAssistantMessage[]
  isLoading?: boolean
}

function formatMessageTime(createdAt: string): string {
  const date = new Date(createdAt)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AssistantTranscriptComponent({ messages, isLoading = false }: AssistantTranscriptProps) {
  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-800 bg-black/20 p-4 text-sm text-neutral-400">
        Tell the assistant what kind of character persona draft you want, then generate it for review.
      </div>
    )
  }

  return (
    <div
      className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-neutral-800 bg-black/20 p-3"
      role="log"
      aria-label="Persona assistant conversation"
    >
      {messages.map((message) => {
        const isUser = message.role === 'user'
        const time = formatMessageTime(message.createdAt)

        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                isUser
                  ? 'bg-soul-800 text-neutral-100'
                  : 'border border-neutral-700/60 bg-neutral-900/80 text-neutral-200'
              }`}
            >
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-neutral-500">
                <span>{isUser ? 'You' : 'Assistant'}</span>
                {time && <span>{time}</span>}
              </div>
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex justify-start" aria-live="polite">
          <div className="rounded-lg border border-neutral-700/60 bg-neutral-900/80 px-3 py-2 text-sm text-neutral-400">
            Assistant is thinking…
          </div>
        </div>
      )}
    </div>
  )
}

export const AssistantTranscript = memo(AssistantTranscriptComponent)
