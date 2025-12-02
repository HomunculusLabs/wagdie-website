/**
 * ConversationItem Component
 * Single conversation entry in the history list
 */

'use client'

import { memo, useState, useCallback } from 'react'
import type { Conversation } from '@/types/eliza'

interface ConversationItemProps {
  conversation: Conversation
  isActive?: boolean
  onSelect: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
}

function ConversationItemComponent({
  conversation,
  isActive = false,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Generate title from conversation or use default
  const title = conversation.title || `Conversation ${conversation.id.slice(0, 8)}`
  const lastUpdated = formatRelativeTime(conversation.updatedAt)

  const handleSelect = useCallback(() => {
    onSelect(conversation.id)
  }, [conversation.id, onSelect])

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }, [])

  const handleDeleteConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(conversation.id)
    setShowDeleteConfirm(false)
  }, [conversation.id, onDelete])

  const handleDeleteCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onSelect(conversation.id)
      }
    },
    [conversation.id, onSelect]
  )

  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`
        group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
        ${isActive
          ? 'bg-soul-900/40 border border-soul-700/50'
          : 'hover:bg-neutral-800/50 border border-transparent'
        }
      `}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`${title}, ${conversation.messageCount} messages, ${lastUpdated}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-200 truncate">{title}</span>
          {isActive && (
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-soul-500" />
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{conversation.messageCount} messages</span>
          <span>•</span>
          <span>{lastUpdated}</span>
        </div>
      </div>

      {/* Delete button / confirmation */}
      {onDelete && (
        <div className="flex-shrink-0 ml-2">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDeleteConfirm}
                className="p-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                aria-label="Confirm delete"
              >
                Delete
              </button>
              <button
                onClick={handleDeleteCancel}
                className="p-1 text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
                aria-label="Cancel delete"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="p-1 text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              aria-label={`Delete conversation: ${title}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export const ConversationItem = memo(ConversationItemComponent)
