/**
 * TweetFilterBar Component
 * Filter controls for tweet feed (all/text/video) with translation toggle
 */

'use client'

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

const TABS: { value: TweetFilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'text', label: 'Text Only' },
  { value: 'video', label: 'Videos' },
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
    <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between ${className}`}>
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentTab === tab.value
                ? 'bg-gold text-abyss'
                : 'bg-midnight text-ash hover:text-bone hover:bg-shadow'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Translation Toggle */}
        <button
          onClick={onTranslationToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            translationEnabled
              ? 'bg-gold text-abyss'
              : 'bg-midnight text-ash hover:text-bone hover:bg-shadow'
          }`}
          title="Toggle translation"
        >
          Translate
        </button>

        {/* Sort Toggle */}
        <button
          onClick={() => onSortChange(currentSort === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-4 py-2 bg-midnight text-ash hover:text-bone rounded-lg transition-colors"
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
