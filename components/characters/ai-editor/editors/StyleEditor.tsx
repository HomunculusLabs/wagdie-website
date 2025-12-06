/**
 * StyleEditor Component
 * Editor for communication style rules organized by context (all/chat/post)
 */

'use client'

import { memo, useCallback } from 'react'
import { ArrayFieldEditor } from '../shared'
import { FIELD_LIMITS } from '@/types/eliza'
import type { StyleConfig } from '@/types/eliza'

interface StyleEditorProps {
  /** Style configuration object */
  value: StyleConfig
  /** Callback when style changes */
  onChange: (value: StyleConfig) => void
  /** Whether the editor is disabled */
  disabled?: boolean
  /** Whether the editor is read-only */
  readOnly?: boolean
}

function StyleEditorComponent({
  value,
  onChange,
  disabled = false,
  readOnly = false,
}: StyleEditorProps) {
  const handleAllChange = useCallback(
    (rules: string[]) => {
      onChange({ ...value, all: rules })
    },
    [value, onChange]
  )

  const handleChatChange = useCallback(
    (rules: string[]) => {
      onChange({ ...value, chat: rules })
    },
    [value, onChange]
  )

  const handlePostChange = useCallback(
    (rules: string[]) => {
      onChange({ ...value, post: rules })
    },
    [value, onChange]
  )

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="pb-2 border-b border-neutral-800">
        <h4 className="text-xs font-display tracking-normal text-neutral-400 uppercase">
          Communication Style
        </h4>
        <p className="text-xs text-neutral-500 mt-1">
          Define how the character communicates. Rules in &quot;All&quot; apply universally,
          while Chat and Post rules are context-specific.
        </p>
      </div>

      {/* Universal style rules */}
      <div className="pl-4 border-l-2 border-neutral-700">
        <ArrayFieldEditor
          label="All (Universal Rules)"
          helpText="Guidelines that apply to all AI outputs regardless of context."
          value={value.all || []}
          onChange={handleAllChange}
          maxItems={FIELD_LIMITS.maxStyleRules}
          maxCharsPerItem={FIELD_LIMITS.styleRule}
          placeholder="Enter a universal style rule (e.g., 'Use short, punchy sentences')..."
          disabled={disabled}
          readOnly={readOnly}
          minRows={1}
          showIndices={false}
        />
      </div>

      {/* Chat-specific style rules */}
      <div className="pl-4 border-l-2 border-soul-700/50">
        <ArrayFieldEditor
          label="Chat (Conversation Rules)"
          helpText="Style guidelines specific to direct conversations and chat interactions."
          value={value.chat || []}
          onChange={handleChatChange}
          maxItems={FIELD_LIMITS.maxStyleRules}
          maxCharsPerItem={FIELD_LIMITS.styleRule}
          placeholder="Enter a chat-specific rule (e.g., 'Ask follow-up questions')..."
          disabled={disabled}
          readOnly={readOnly}
          minRows={1}
          showIndices={false}
        />
      </div>

      {/* Post-specific style rules */}
      <div className="pl-4 border-l-2 border-amber-700/50">
        <ArrayFieldEditor
          label="Post (Social Media Rules)"
          helpText="Style guidelines for social media posts and public broadcasts."
          value={value.post || []}
          onChange={handlePostChange}
          maxItems={FIELD_LIMITS.maxStyleRules}
          maxCharsPerItem={FIELD_LIMITS.styleRule}
          placeholder="Enter a post-specific rule (e.g., 'Include relevant hashtags')..."
          disabled={disabled}
          readOnly={readOnly}
          minRows={1}
          showIndices={false}
        />
      </div>
    </div>
  )
}

export const StyleEditor = memo(StyleEditorComponent)
