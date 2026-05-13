/**
 * Type Contracts for Character Filter Feature
 * These types define the interface between frontend and backend
 */

// ============================================================================
// Filter Types (Extended from existing)
// ============================================================================

/**
 * Character filter tabs - existing + unchanged
 */
export type CharacterFilterTab = 'all' | 'owned' | 'infected' | 'cured' | 'staked'

/**
 * Sort order - existing + unchanged
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Extended character filters with new options
 */
export interface CharacterFilters {
  // Existing fields
  tab: CharacterFilterTab
  wallet?: string
  sort: SortOrder
  page: number
  perPage: number
  search?: string

  // NEW: Character sheet filter
  hasSheet?: boolean

  // NEW: ElizaOS profile filter
  hasElizaProfile?: boolean

  // NEW: Origin/body type filter
  origin?: string
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Origin count for dropdown population
 */
export interface OriginCount {
  origin: string
  count: number
}

/**
 * Origins endpoint response
 */
export interface OriginsResponse {
  origins: OriginCount[]
  totalCharacters: number
}

// ============================================================================
// URL Parameter Types
// ============================================================================

/**
 * URL search params for /characters page
 */
export interface CharacterPageParams {
  tab?: CharacterFilterTab
  sort?: SortOrder
  page?: string
  search?: string
  hasSheet?: 'true'  // Only present when true
  hasElizaProfile?: 'true'  // Only present when true
  origin?: string
}

// ============================================================================
// Component Props Contracts
// ============================================================================

/**
 * Props for TokenFilterBar component (extended)
 */
export interface TokenFilterBarProps {
  // Existing
  currentTab: CharacterFilterTab
  currentSort: SortOrder
  onTabChange: (tab: CharacterFilterTab) => void
  onSortChange: (sort: SortOrder) => void
  className?: string

  // NEW: Sheet/profile filters
  hasSheetFilter: boolean
  onHasSheetChange: (hasSheet: boolean) => void
  hasElizaProfileFilter: boolean
  onHasElizaProfileChange: (hasElizaProfile: boolean) => void

  // NEW: Origin filter
  originFilter: string | null
  availableOrigins: OriginCount[]
  onOriginChange: (origin: string | null) => void

  // NEW: Clear all
  onClearAllFilters: () => void
  hasActiveFilters: boolean
}

/**
 * Props for OriginDropdown component (new)
 */
export interface OriginDropdownProps {
  value: string | null
  options: OriginCount[]
  onChange: (origin: string | null) => void
  disabled?: boolean
  className?: string
}

/**
 * Props for SheetToggle component (new)
 */
export interface SheetToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  title?: string
  className?: string
}

/**
 * Props for ActiveFilters display component (new)
 */
export interface ActiveFiltersProps {
  filters: {
    hasSheet: boolean
    hasElizaProfile: boolean
    origin: string | null
    search: string | null
    tab: CharacterFilterTab
  }
  onRemoveFilter: (filterType: 'hasSheet' | 'hasElizaProfile' | 'origin' | 'search') => void
  onClearAll: () => void
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return type for useCharacterFilters hook
 */
export interface UseCharacterFiltersReturn {
  // Current filter state
  filters: CharacterFilters

  // Filter setters
  setTab: (tab: CharacterFilterTab) => void
  setSort: (sort: SortOrder) => void
  setPage: (page: number) => void
  setSearch: (search: string) => void
  setHasSheet: (hasSheet: boolean) => void
  setHasElizaProfile: (hasElizaProfile: boolean) => void
  setOrigin: (origin: string | null) => void

  // Bulk operations
  clearAllFilters: () => void
  hasActiveFilters: boolean

  // URL sync
  syncToURL: () => void
}

/**
 * Return type for useOrigins hook
 */
export interface UseOriginsReturn {
  origins: OriginCount[]
  isLoading: boolean
  error: Error | null
}
