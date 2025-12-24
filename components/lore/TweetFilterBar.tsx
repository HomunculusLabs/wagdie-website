/**
 * TweetFilterBar Component
 * Filter controls for tweet feed (all/text/video) with translation toggle
 */

'use client'

import { Tabs, Switch } from '@/components/ui'
import type { TabItem } from '@/components/ui'
import type { TweetFilterTab, SortOrder } from '@/types/tweet'

interface TweetFilterBarProps {
  currentTab: TweetFilterTab
  currentSort: SortOrder
  translationEnabled: boolean
  onTabChange: (tab: TweetFilterTab) => void
  onSortChange: (sort: SortOrder) => void
  onTranslationToggle: () => void
  className?: string
}

const TAB_ITEMS: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'text', label: 'Text Only' },
  { id: 'video', label: 'Videos' },
]

export function TweetFilterBar({
  currentTab,
  currentSort,
  translationEnabled,
  onTabChange,
  onSortChange,
  onTranslationToggle,
  className = ''
}: TweetFilterBarProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Filter Tabs */}
      <Tabs
        items={TAB_ITEMS}
        activeId={currentTab}
        onChange={(id) => onTabChange(id as TweetFilterTab)}
      />

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center items-center">
        {/* Translation Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-eskapade tracking-widest text-neutral-500">
            Translate
          </span>
          <Switch
            checked={translationEnabled}
            onChange={onTranslationToggle}
          />
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => onSortChange(currentSort === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-800 text-neutral-500 hover:text-soul-accent hover:border-soul-accent transition-colors font-eskapade  tracking-wider text-sm"
          title={`Sort ${currentSort === 'asc' ? 'newest first' : 'oldest first'}`}
        >
          <span>{currentSort === 'asc' ? 'Oldest' : 'Newest'}</span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {currentSort === 'asc' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}
