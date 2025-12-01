/**
 * TokenFilterBar Component
 * Filter controls for character browsing (all/owned/infected/cured/staked)
 */

'use client'

import React from 'react';
import { Tabs } from '@/components-new'
import type { TabItem } from '@/components-new'
import type { CharacterFilterTab, SortOrder, OriginCount, AlignmentCount } from '@/types/character'
import { SheetToggle } from './SheetToggle'
import { OriginDropdown } from './OriginDropdown'
import { AlignmentDropdown } from './AlignmentDropdown'

interface TokenFilterBarProps {
  currentTab: CharacterFilterTab
  currentSort: SortOrder
  onTabChange: (tab: CharacterFilterTab) => void
  onSortChange: (sort: SortOrder) => void
  className?: string
  // NEW: Sheet filter props
  hasSheetFilter?: boolean
  onHasSheetChange?: (hasSheet: boolean) => void
  // NEW: Origin filter props
  originFilter?: string | null
  availableOrigins?: OriginCount[]
  onOriginChange?: (origin: string | null) => void
  originsLoading?: boolean
  // NEW: Alignment filter props
  alignmentFilter?: string | null
  availableAlignments?: AlignmentCount[]
  onAlignmentChange?: (alignment: string | null) => void
  alignmentsLoading?: boolean
}

const TAB_ITEMS: TabItem[] = [
  { id: 'all', label: 'All' },
  { id: 'owned', label: 'My Characters' },
  { id: 'infected', label: 'Infected' },
  { id: 'cured', label: 'Cured' },
  { id: 'staked', label: 'Staked' },
]

export function TokenFilterBar({
  currentTab,
  currentSort,
  onTabChange,
  onSortChange,
  className = '',
  hasSheetFilter = false,
  onHasSheetChange,
  originFilter = null,
  availableOrigins = [],
  onOriginChange,
  originsLoading = false,
  alignmentFilter = null,
  availableAlignments = [],
  onAlignmentChange,
  alignmentsLoading = false
}: TokenFilterBarProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Filter Tabs using new Tabs component */}
      <Tabs
        items={TAB_ITEMS}
        activeId={currentTab}
        onChange={(id) => onTabChange(id as CharacterFilterTab)}
      />

      {/* Additional Filters Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Sheet Filter Toggle */}
          {onHasSheetChange && (
            <SheetToggle
              checked={hasSheetFilter}
              onChange={onHasSheetChange}
            />
          )}

          {/* Origin Filter Dropdown */}
          {onOriginChange && (
            <OriginDropdown
              value={originFilter}
              options={availableOrigins}
              onChange={onOriginChange}
              isLoading={originsLoading}
            />
          )}

          {/* Alignment Filter Dropdown */}
          {onAlignmentChange && (
            <AlignmentDropdown
              value={alignmentFilter}
              options={availableAlignments}
              onChange={onAlignmentChange}
              isLoading={alignmentsLoading}
            />
          )}
        </div>

        {/* Sort Toggle */}
        <button
          onClick={() => onSortChange(currentSort === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2 px-4 py-2 border border-neutral-800 text-neutral-500 hover:text-soul-accent hover:border-soul-accent transition-colors font-display uppercase tracking-wider text-sm"
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
    </div>
  )
}
