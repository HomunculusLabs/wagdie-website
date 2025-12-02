/**
 * ActiveFilters Component
 * Displays currently active filters with removal options
 * WAGDIE themed styling
 */

'use client'

import React from 'react'
import type { CharacterFilterTab } from '@/types/character'

interface ActiveFiltersProps {
  filters: {
    hasSheet: boolean
    origin: string | null
    alignment: string | null
    search: string | null
    tab: CharacterFilterTab
  }
  onRemoveFilter: (filterType: 'hasSheet' | 'origin' | 'alignment' | 'search') => void
  onClearAll: () => void
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll
}: ActiveFiltersProps) {
  const activeCount = [
    filters.hasSheet,
    filters.origin !== null,
    filters.alignment !== null,
    filters.search !== null && filters.search.length > 0
  ].filter(Boolean).length

  if (activeCount === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 py-2 px-3 bg-black/20 border border-neutral-800/50 rounded-sm">
      <span className="text-[14px] text-neutral-500 mr-2">
        Active Filters:
      </span>

      {/* Has Sheet Filter Badge */}
      {filters.hasSheet && (
        <FilterBadge
          label="Has Sheet"
          onRemove={() => onRemoveFilter('hasSheet')}
        />
      )}

      {/* Origin Filter Badge */}
      {filters.origin && (
        <FilterBadge
          label={`Origin: ${filters.origin}`}
          onRemove={() => onRemoveFilter('origin')}
        />
      )}

      {/* Alignment Filter Badge */}
      {filters.alignment && (
        <FilterBadge
          label={`Alignment: ${filters.alignment}`}
          onRemove={() => onRemoveFilter('alignment')}
        />
      )}

      {/* Search Filter Badge */}
      {filters.search && (
        <FilterBadge
          label={`Search: "${filters.search}"`}
          onRemove={() => onRemoveFilter('search')}
        />
      )}

      {/* Clear All Button */}
      {activeCount > 1 && (
        <button
          onClick={onClearAll}
          className="ml-auto text-[12px] font-display  tracking-widest text-neutral-500 hover:text-soul-accent transition-colors"
        >
          Clear All
        </button>
      )}
    </div>
  )
}

interface FilterBadgeProps {
  label: string
  onRemove: () => void
}

function FilterBadge({ label, onRemove }: FilterBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-soul-accent/10 border border-soul-accent/30 rounded-sm">
      <span className="text-md font-eskapade text-soul-accent truncate max-w-[150px]">
        {label}
      </span>
      <button
        onClick={onRemove}
        className="text-soul-accent/70 hover:text-soul-accent transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  )
}
