/**
 * PersonalityEditor Component
 * Textarea for editing AI personality description
 */

import { memo } from 'react'
import { FIELD_LIMITS } from '@/types/eliza'

interface PersonalityEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
}

function PersonalityEditorComponent({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: PersonalityEditorProps) {
  const charCount = value.length
  const isOverLimit = charCount > FIELD_LIMITS.personality

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor="personality-editor"
          className="text-xs font-display tracking-widest text-neutral-400"
        >
          Personality
        </label>
        <span
          className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-neutral-500'}`}
        >
          {charCount} / {FIELD_LIMITS.personality}
        </span>
      </div>

      <textarea
        id="personality-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readOnly}
        placeholder="Describe how this character behaves, speaks, and thinks. What are their traits, mannerisms, and quirks?"
        rows={4}
        className={`
          w-full px-3 py-2
          bg-neutral-900 border rounded-lg
          text-sm text-neutral-100 placeholder-neutral-500
          focus:outline-none focus:ring-1
          ${isOverLimit
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-neutral-700 focus:border-soul-500 focus:ring-soul-500'
          }
          ${readOnly ? 'bg-neutral-900/50 cursor-not-allowed' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          resize-y min-h-[100px]
        `}
        aria-describedby="personality-help"
      />

      <p id="personality-help" className="text-xs text-neutral-500">
        Describe the character&apos;s personality traits and how they interact with others.
      </p>
    </div>
  )
}

export const PersonalityEditor = memo(PersonalityEditorComponent)
