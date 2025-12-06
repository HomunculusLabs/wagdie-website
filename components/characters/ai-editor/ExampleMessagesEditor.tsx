/**
 * ExampleMessagesEditor Component
 * Editor for AI training example message pairs
 */

import { memo, useCallback } from 'react'
import { Button } from '@/components/ui'
import { FIELD_LIMITS, type ExampleMessage } from '@/types/eliza'

interface ExampleMessagesEditorProps {
  value: ExampleMessage[]
  onChange: (value: ExampleMessage[]) => void
  disabled?: boolean
  readOnly?: boolean
}

function ExampleMessagesEditorComponent({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: ExampleMessagesEditorProps) {
  const canAdd = value.length < FIELD_LIMITS.maxExampleMessages

  const handleAdd = useCallback(() => {
    if (canAdd) {
      onChange([...value, { userMessage: '', assistantMessage: '' }])
    }
  }, [value, onChange, canAdd])

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }, [value, onChange])

  const handleUpdate = useCallback((index: number, field: keyof ExampleMessage, newValue: string) => {
    const updated = [...value]
    updated[index] = { ...updated[index], [field]: newValue }
    onChange(updated)
  }, [value, onChange])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-lg font-display text-neutral-400">
          Example Messages
        </label>
        <span className="text-xs text-neutral-500">
          {value.length} / {FIELD_LIMITS.maxExampleMessages}
        </span>
      </div>

      <p className="text-md text-neutral-500">
        Add example conversations to train the AI on how this character speaks.
      </p>

      {value.length === 0 && !readOnly && (
        <div className="text-center py-6 bg-neutral-900/50 rounded-lg border border-dashed border-neutral-700">
          <p className="text-md text-neutral-500 mb-3">No examples yet</p>
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={disabled}
            className="text-md"
          >
            Add Example
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {value.map((example, index) => (
          <ExampleMessagePair
            key={index}
            index={index}
            example={example}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            disabled={disabled}
            readOnly={readOnly}
          />
        ))}
      </div>

      {value.length > 0 && canAdd && !readOnly && (
        <Button
          variant="secondary"
          onClick={handleAdd}
          disabled={disabled}
          className="w-full"
        >
          Add Another Example
        </Button>
      )}
    </div>
  )
}

interface ExampleMessagePairProps {
  index: number
  example: ExampleMessage
  onUpdate: (index: number, field: keyof ExampleMessage, value: string) => void
  onRemove: (index: number) => void
  disabled: boolean
  readOnly: boolean
}

function ExampleMessagePair({
  index,
  example,
  onUpdate,
  onRemove,
  disabled,
  readOnly,
}: ExampleMessagePairProps) {
  const userCharCount = example.userMessage.length
  const assistantCharCount = example.assistantMessage.length
  const isUserOverLimit = userCharCount > FIELD_LIMITS.userMessageExample
  const isAssistantOverLimit = assistantCharCount > FIELD_LIMITS.assistantMessageExample

  return (
    <div className="p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-display text-neutral-500">
          Example #{index + 1}
        </span>
        {!readOnly && (
          <button
            onClick={() => onRemove(index)}
            disabled={disabled}
            className="text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label={`Remove example ${index + 1}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-neutral-400">User says:</label>
          <span className={`text-xs ${isUserOverLimit ? 'text-red-400' : 'text-neutral-600'}`}>
            {userCharCount}/{FIELD_LIMITS.userMessageExample}
          </span>
        </div>
        <textarea
          value={example.userMessage}
          onChange={(e) => onUpdate(index, 'userMessage', e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="What a user might say..."
          rows={2}
          className={`
            w-full px-3 py-2
            bg-neutral-800 border rounded
            text-sm text-neutral-100 placeholder-neutral-500
            focus:outline-none focus:ring-1
            ${isUserOverLimit
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-neutral-700 focus:border-soul-500 focus:ring-soul-500'
            }
            ${readOnly ? 'cursor-not-allowed' : ''}
            resize-none
          `}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-neutral-400">Character responds:</label>
          <span className={`text-xs ${isAssistantOverLimit ? 'text-red-400' : 'text-neutral-600'}`}>
            {assistantCharCount}/{FIELD_LIMITS.assistantMessageExample}
          </span>
        </div>
        <textarea
          value={example.assistantMessage}
          onChange={(e) => onUpdate(index, 'assistantMessage', e.target.value)}
          disabled={disabled}
          readOnly={readOnly}
          placeholder="How the character would respond..."
          rows={3}
          className={`
            w-full px-3 py-2
            bg-neutral-800 border rounded
            text-sm text-neutral-100 placeholder-neutral-500
            focus:outline-none focus:ring-1
            ${isAssistantOverLimit
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-neutral-700 focus:border-soul-500 focus:ring-soul-500'
            }
            ${readOnly ? 'cursor-not-allowed' : ''}
            resize-none
          `}
        />
      </div>
    </div>
  )
}

export const ExampleMessagesEditor = memo(ExampleMessagesEditorComponent)
