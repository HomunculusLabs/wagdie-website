/**
 * SystemPromptEditor Component
 * Textarea for editing AI system prompt
 */

import { memo } from 'react'
import { FIELD_LIMITS } from '@/types/eliza'

interface SystemPromptEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
}

function SystemPromptEditorComponent({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: SystemPromptEditorProps) {
  const charCount = value.length
  const isOverLimit = charCount > FIELD_LIMITS.systemPrompt

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="system-prompt-editor"
          className="text-xs font-display tracking-widest text-neutral-400"
        >
          System Prompt (Advanced)
        </label>
        <span
          className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-neutral-500'}`}
        >
          {charCount} / {FIELD_LIMITS.systemPrompt}
        </span>
      </div>

      <textarea
        id="system-prompt-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder="Optional: Custom instructions for the AI. This overrides default behavior."
        rows={6}
        className={`
          w-full px-3 py-2
          bg-neutral-900 border rounded-lg
          text-sm text-neutral-100 placeholder-neutral-500 font-mono
          focus:outline-none focus:ring-1
          ${isOverLimit
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-neutral-700 focus:border-soul-500 focus:ring-soul-500'
          }
          ${readOnly ? 'bg-neutral-900/50 cursor-not-allowed' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          resize-y min-h-[150px]
        `}
        aria-describedby="system-prompt-help"
      />

      <p id="system-prompt-help" className="text-xs text-neutral-500">
        Advanced: Custom instructions that control how the AI responds. Leave empty to use personality and backstory.
      </p>
    </div>
  )
}

export const SystemPromptEditor = memo(SystemPromptEditorComponent)
