/**
 * ConversationList Component
 * Displays a list of past conversations with a character
 */

'use client'

import { memo, useCallback } from 'react'
import { ConversationItem } from './ConversationItem'
import { Spinner } from '@/components/ui'
import type { Conversation } from '@/types/eliza'

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId?: string
  isLoading?: boolean
  isLoadingMore?: boolean
  hasMore?: boolean
  onSelect: (conversationId: string) => void
  onDelete?: (conversationId: string) => void
  onLoadMore?: () => void
}

function ConversationListComponent({
  conversations,
  activeConversationId,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onSelect,
  onDelete,
  onLoadMore,
}: ConversationListProps) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!onLoadMore || !hasMore || isLoadingMore) return

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      // Load more when near bottom
      if (scrollHeight - scrollTop - clientHeight < 100) {
        onLoadMore()
      }
    },
    [onLoadMore, hasMore, isLoadingMore]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2 opacity-30">💬</div>
        <p className="text-sm text-neutral-500">No conversations yet</p>
        <p className="text-xs text-neutral-600 mt-1">
          Start chatting to create your first conversation
        </p>
      </div>
    )
  }

  return (
    <div
      className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent"
      onScroll={handleScroll}
      role="list"
      aria-label="Conversation history"
    >
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isActive={conversation.id === activeConversationId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}

      {isLoadingMore && (
        <div className="flex items-center justify-center py-2">
          <Spinner size="sm" />
        </div>
      )}

      {hasMore && !isLoadingMore && (
        <button
          onClick={onLoadMore}
          className="w-full py-2 text-xs text-neutral-500 hover:text-neutral-400 transition-colors"
        >
          Load more conversations
        </button>
      )}
    </div>
  )
}

export const ConversationList = memo(ConversationListComponent)
