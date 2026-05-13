/**
 * ActiveFilters Component
 * Displays currently active filters with removal options
 * WAGDIE themed styling
 */

'use client'

import React from 'react'
import type { CharacterFilterTab } from '@/types/character'

type FilterType = 'hasSheet' | 'hasElizaProfile' | 'origin' | 'alignment' | 'the17' | 'armor' | 'back' | 'mask' | 'search'

interface ActiveFiltersProps {
  filters: {
    hasSheet: boolean
    hasElizaProfile: boolean
    origin: string | null
    alignment: string | null
    the17?: string | null
    armor?: string | null
    back?: string | null
    mask?: string | null
    search: string | null
    tab: CharacterFilterTab
  }
  onRemoveFilter: (filterType: FilterType) => void
  onClearAll: () => void
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll
}: ActiveFiltersProps) {
  const activeCount = [
    filters.hasSheet,
    filters.hasElizaProfile,
    Boolean(filters.origin),
    Boolean(filters.alignment),
    Boolean(filters.the17),
    Boolean(filters.armor),
    Boolean(filters.back),
    Boolean(filters.mask),
    Boolean(filters.search?.length)
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

      {/* ElizaOS Profile Filter Badge */}
      {filters.hasElizaProfile && (
        <FilterBadge
          label="ElizaOS Profile"
          onRemove={() => onRemoveFilter('hasElizaProfile')}
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

      {/* The 17 Filter Badge */}
      {filters.the17 && (
        <FilterBadge
          label={`The 17: ${filters.the17}`}
          onRemove={() => onRemoveFilter('the17')}
        />
      )}

      {/* Equipment Filter Badges */}
      {filters.armor && (
        <FilterBadge
          label={`Armor: ${filters.armor}`}
          onRemove={() => onRemoveFilter('armor')}
        />
      )}

      {filters.back && (
        <FilterBadge
          label={`Back: ${filters.back}`}
          onRemove={() => onRemoveFilter('back')}
        />
      )}

      {filters.mask && (
        <FilterBadge
          label={`Mask: ${filters.mask}`}
          onRemove={() => onRemoveFilter('mask')}
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
          className="ml-auto text-[12px] font-eskapade  tracking-widest text-neutral-500 hover:text-soul-accent transition-colors"
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
