/**
 * TokenFilterBar Component
 * Filter controls for character browsing (all/owned/infected/cured/staked)
 */

'use client'

import type { CharacterFilterTab, SortOrder } from '@/types/character'

interface TokenFilterBarProps {
  currentTab: CharacterFilterTab
  currentSort: SortOrder
  onTabChange: (tab: CharacterFilterTab) => void
  onSortChange: (sort: SortOrder) => void
  className?: string
}

const TABS: { value: CharacterFilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'owned', label: 'My Characters' },
  { value: 'infected', label: 'Infected' },
  { value: 'cured', label: 'Cured' },
  { value: 'staked', label: 'Staked' },
]

export function TokenFilterBar({
  currentTab,
  currentSort,
  onTabChange,
  onSortChange,
  className = ''
}: TokenFilterBarProps) {
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

      {/* Sort Toggle */}
      <button
        onClick={() => onSortChange(currentSort === 'asc' ? 'desc' : 'asc')}
        className="flex items-center gap-2 px-4 py-2 bg-midnight text-ash hover:text-bone rounded-lg transition-colors"
        title={`Sort ${currentSort === 'asc' ? 'descending' : 'ascending'}`}
      >
        <span>Token ID</span>
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
  )
}
