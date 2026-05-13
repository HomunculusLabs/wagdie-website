/**
 * Character browse filter controller
 * Owns URL parsing, URL updates, debounced search, pagination, and filter actions.
 */

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CharacterFilterTab, SortOrder } from '@/types/character'

export const CHARACTER_SEARCH_DEBOUNCE_MS = 400

export type CharacterBrowseFilterType =
  | 'hasSheet'
  | 'hasElizaProfile'
  | 'origin'
  | 'alignment'
  | 'the17'
  | 'armor'
  | 'back'
  | 'mask'
  | 'search'

export interface CharacterBrowseFilters {
  tab: CharacterFilterTab
  sort: SortOrder
  page: number
  searchQuery: string
  hasSheet: boolean
  hasElizaProfile: boolean
  origin: string | null
  alignment: string | null
  the17: string | null
  armor: string | null
  back: string | null
  mask: string | null
}

interface CharacterBrowseURLParams {
  tab: CharacterFilterTab
  sort: SortOrder
  page?: number
  search?: string
  hasSheet?: boolean
  hasElizaProfile?: boolean
  origin?: string | null
  alignment?: string | null
  the17?: string | null
  armor?: string | null
  back?: string | null
  mask?: string | null
}

interface SearchParamsReader {
  get(name: string): string | null
}

interface CharacterBrowseRouter {
  push(path: string): void
}

interface UseCharacterBrowseFiltersOptions {
  searchParams: SearchParamsReader
  router: CharacterBrowseRouter
  walletAddress?: string
}

const DEFAULT_TAB: CharacterFilterTab = 'all'
const DEFAULT_SORT: SortOrder = 'desc'

export function parseCharacterBrowseFilters(searchParams: SearchParamsReader): CharacterBrowseFilters {
  return {
    tab: (searchParams.get('tab') || DEFAULT_TAB) as CharacterFilterTab,
    sort: (searchParams.get('sort') || DEFAULT_SORT) as SortOrder,
    page: parseInt(searchParams.get('page') || '1', 10),
    searchQuery: searchParams.get('search') || '',
    hasSheet: searchParams.get('hasSheet') === 'true',
    hasElizaProfile: searchParams.get('hasElizaProfile') === 'true',
    origin: searchParams.get('origin') || null,
    alignment: searchParams.get('alignment') || null,
    the17: searchParams.get('the17') || null,
    armor: searchParams.get('armor') || null,
    back: searchParams.get('back') || null,
    mask: searchParams.get('mask') || null,
  }
}

export function buildCharacterBrowsePath(params: CharacterBrowseURLParams): string {
  const urlParams = new URLSearchParams()

  if (params.tab !== DEFAULT_TAB) urlParams.set('tab', params.tab)
  if (params.sort !== DEFAULT_SORT) urlParams.set('sort', params.sort)
  if (params.page && params.page > 1) urlParams.set('page', params.page.toString())
  if (params.search?.trim()) urlParams.set('search', params.search.trim())
  if (params.hasSheet) urlParams.set('hasSheet', 'true')
  if (params.hasElizaProfile) urlParams.set('hasElizaProfile', 'true')
  if (params.origin) urlParams.set('origin', params.origin)
  if (params.alignment) urlParams.set('alignment', params.alignment)
  if (params.the17) urlParams.set('the17', params.the17)
  if (params.armor) urlParams.set('armor', params.armor)
  if (params.back) urlParams.set('back', params.back)
  if (params.mask) urlParams.set('mask', params.mask)

  const queryString = urlParams.toString()
  return `/characters${queryString ? `?${queryString}` : ''}`
}

export function hasActiveCharacterBrowseFilters(filters: CharacterBrowseFilters): boolean {
  return filters.hasSheet || filters.hasElizaProfile || filters.origin !== null || filters.alignment !== null ||
    filters.the17 !== null || filters.armor !== null || filters.back !== null || filters.mask !== null ||
    filters.searchQuery.length > 0
}

function toURLParams(filters: CharacterBrowseFilters): CharacterBrowseURLParams {
  return {
    tab: filters.tab,
    sort: filters.sort,
    page: filters.page,
    search: filters.searchQuery,
    hasSheet: filters.hasSheet,
    hasElizaProfile: filters.hasElizaProfile,
    origin: filters.origin,
    alignment: filters.alignment,
    the17: filters.the17,
    armor: filters.armor,
    back: filters.back,
    mask: filters.mask,
  }
}

export function useCharacterBrowseFilters({
  searchParams,
  router,
  walletAddress,
}: UseCharacterBrowseFiltersOptions) {
  const filters = parseCharacterBrowseFilters(searchParams)
  const [searchInput, setSearchInput] = useState(filters.searchQuery)

  const updateURL = useCallback((params: CharacterBrowseURLParams) => {
    router.push(buildCharacterBrowsePath(params))
  }, [router])

  // Ref stores latest URL filter values for debounced search, preventing stale closures
  // when other filters change before the search timer fires.
  const latestFiltersRef = useRef(filters)
  useEffect(() => {
    latestFiltersRef.current = filters
  }, [filters])

  // Sync local input when URL search changes, including browser back/forward.
  useEffect(() => {
    setSearchInput(filters.searchQuery)
  }, [filters.searchQuery])

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = latestFiltersRef.current
      if (searchInput !== current.searchQuery) {
        updateURL({
          ...toURLParams(current),
          page: 1,
          search: searchInput,
        })
      }
    }, CHARACTER_SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput, updateURL])

  const updateFilters = useCallback((overrides: Partial<CharacterBrowseURLParams>, resetPage = true) => {
    updateURL({
      ...toURLParams(latestFiltersRef.current),
      ...overrides,
      page: resetPage ? 1 : overrides.page,
    })
  }, [updateURL])

  const handleTabChange = useCallback((newTab: CharacterFilterTab) => {
    if (newTab === latestFiltersRef.current.tab) return
    updateFilters({ tab: newTab })
  }, [updateFilters])

  const handleSortChange = useCallback((newSort: SortOrder) => {
    if (newSort === latestFiltersRef.current.sort) return
    updateFilters({ sort: newSort })
  }, [updateFilters])

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === latestFiltersRef.current.page) return
    updateFilters({ page: newPage }, false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [updateFilters])

  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    updateFilters({ search: '' })
  }, [updateFilters])

  const handleHasSheetChange = useCallback((hasSheet: boolean) => {
    updateFilters({ hasSheet })
  }, [updateFilters])

  const handleHasElizaProfileChange = useCallback((hasElizaProfile: boolean) => {
    updateFilters({ hasElizaProfile })
  }, [updateFilters])

  const handleOriginChange = useCallback((origin: string | null) => {
    updateFilters({ origin })
  }, [updateFilters])

  const handleAlignmentChange = useCallback((alignment: string | null) => {
    updateFilters({ alignment })
  }, [updateFilters])

  const handleThe17Change = useCallback((the17: string | null) => {
    updateFilters({ the17 })
  }, [updateFilters])

  const handleArmorChange = useCallback((armor: string | null) => {
    updateFilters({ armor })
  }, [updateFilters])

  const handleBackChange = useCallback((back: string | null) => {
    updateFilters({ back })
  }, [updateFilters])

  const handleMaskChange = useCallback((mask: string | null) => {
    updateFilters({ mask })
  }, [updateFilters])

  const handleClearAllFilters = useCallback(() => {
    setSearchInput('')
    updateURL({
      tab: DEFAULT_TAB,
      sort: DEFAULT_SORT,
      page: 1,
      search: '',
      hasSheet: false,
      hasElizaProfile: false,
      origin: null,
      alignment: null,
      the17: null,
      armor: null,
      back: null,
      mask: null,
    })
  }, [updateURL])

  const handleRemoveFilter = useCallback((filterType: CharacterBrowseFilterType) => {
    switch (filterType) {
      case 'hasSheet':
        updateFilters({ hasSheet: false })
        break
      case 'hasElizaProfile':
        updateFilters({ hasElizaProfile: false })
        break
      case 'origin':
        updateFilters({ origin: null })
        break
      case 'alignment':
        updateFilters({ alignment: null })
        break
      case 'the17':
        updateFilters({ the17: null })
        break
      case 'armor':
        updateFilters({ armor: null })
        break
      case 'back':
        updateFilters({ back: null })
        break
      case 'mask':
        updateFilters({ mask: null })
        break
      case 'search':
        setSearchInput('')
        updateFilters({ search: '' })
        break
    }
  }, [updateFilters])

  const walletForQuery = filters.tab === 'owned' ? walletAddress : undefined
  const canQuery = filters.tab !== 'owned' || !!walletAddress
  const hasActiveFilters = useMemo(() => hasActiveCharacterBrowseFilters(filters), [filters])

  return {
    filters,
    searchInput,
    setSearchInput,
    hasActiveFilters,
    walletForQuery,
    canQuery,
    handlers: {
      onTabChange: handleTabChange,
      onSortChange: handleSortChange,
      onPageChange: handlePageChange,
      onClearSearch: handleClearSearch,
      onHasSheetChange: handleHasSheetChange,
      onHasElizaProfileChange: handleHasElizaProfileChange,
      onOriginChange: handleOriginChange,
      onAlignmentChange: handleAlignmentChange,
      onThe17Change: handleThe17Change,
      onArmorChange: handleArmorChange,
      onBackChange: handleBackChange,
      onMaskChange: handleMaskChange,
      onClearAllFilters: handleClearAllFilters,
      onRemoveFilter: handleRemoveFilter,
    },
  }
}
