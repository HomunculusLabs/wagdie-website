/**
 * Characters Browse Page
 * Browse and filter all WAGDIE characters with pagination
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useCallback, useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { FilterSidebar } from '@/components/characters/FilterSidebar'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { ActiveFilters } from '@/components/characters/ActiveFilters'
import { Alert, Spinner, Pagination, Empty } from '@/components/ui'
import { useCharacters } from '@/hooks/useCharacters'
import { useOrigins } from '@/hooks/useOrigins'
import { useAlignments } from '@/hooks/useAlignments'
import { useArmorTraits, useBackTraits, useMaskTraits } from '@/hooks/useTraitCounts'
import { useWallet } from '@/hooks/useWallet'
import type { CharacterFilterTab, SortOrder } from '@/types/character'

const ITEMS_PER_PAGE = 50

function CharactersPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { address } = useWallet()

  // Parse URL parameters
  const tab = (searchParams.get('tab') || 'all') as CharacterFilterTab
  const sort = (searchParams.get('sort') || 'desc') as SortOrder
  const page = parseInt(searchParams.get('page') || '1', 10)
  const searchQuery = searchParams.get('search') || ''
  // Parse trait filters from URL
  const hasSheet = searchParams.get('hasSheet') === 'true'
  const origin = searchParams.get('origin') || null
  const alignment = searchParams.get('alignment') || null
  // Equipment filters
  const armor = searchParams.get('armor') || null
  const back = searchParams.get('back') || null
  const mask = searchParams.get('mask') || null

  // Local search input state (for debouncing)
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Fetch available trait options for dropdowns
  const { origins, isLoading: originsLoading } = useOrigins()
  const { alignments, isLoading: alignmentsLoading } = useAlignments()
  const { traits: armorTraits, isLoading: armorLoading } = useArmorTraits()
  const { traits: backTraits, isLoading: backLoading } = useBackTraits()
  const { traits: maskTraits, isLoading: maskLoading } = useMaskTraits()

  // Update URL when filters or page change
  interface UpdateURLParams {
    tab: CharacterFilterTab
    sort: SortOrder
    page?: number
    search?: string
    hasSheet?: boolean
    origin?: string | null
    alignment?: string | null
    armor?: string | null
    back?: string | null
    mask?: string | null
  }

  const updateURL = useCallback((params: UpdateURLParams) => {
    const urlParams = new URLSearchParams()
    if (params.tab !== 'all') urlParams.set('tab', params.tab)
    if (params.sort !== 'desc') urlParams.set('sort', params.sort)
    if (params.page && params.page > 1) urlParams.set('page', params.page.toString())
    if (params.search?.trim()) urlParams.set('search', params.search.trim())
    // Trait filters
    if (params.hasSheet) urlParams.set('hasSheet', 'true')
    if (params.origin) urlParams.set('origin', params.origin)
    if (params.alignment) urlParams.set('alignment', params.alignment)
    // Equipment filters
    if (params.armor) urlParams.set('armor', params.armor)
    if (params.back) urlParams.set('back', params.back)
    if (params.mask) urlParams.set('mask', params.mask)

    const queryString = urlParams.toString()
    router.push(`/characters${queryString ? `?${queryString}` : ''}`)
  }, [router])

  // Ref to store latest filter values for debounced search
  // This prevents the stale closure bug where the debounced effect
  // could use outdated filter values when it fires
  const latestFiltersRef = useRef({ tab, sort, hasSheet, origin, alignment, armor, back, mask, searchQuery })
  useEffect(() => {
    latestFiltersRef.current = { tab, sort, hasSheet, origin, alignment, armor, back, mask, searchQuery }
  }, [tab, sort, hasSheet, origin, alignment, armor, back, mask, searchQuery])

  // Sync search input with URL on mount/change
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Debounced search - update URL after user stops typing
  // Uses ref to always access current filter values, avoiding stale closure issues
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = latestFiltersRef.current
      if (searchInput !== current.searchQuery) {
        updateURL({
          tab: current.tab,
          sort: current.sort,
          page: 1,
          search: searchInput,
          hasSheet: current.hasSheet,
          origin: current.origin,
          alignment: current.alignment,
          armor: current.armor,
          back: current.back,
          mask: current.mask
        })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput, updateURL])

  // Only pass wallet for 'owned' tab - other tabs are global views
  const walletForQuery = tab === 'owned' ? address : undefined
  // Disable query when 'owned' tab is selected but no wallet is connected
  const canQuery = tab !== 'owned' || !!address

  // Fetch characters using custom hook with React Query
  const {
    characters,
    totalCount,
    totalPages,
    isLoading,
    isFetching,
    isError,
  } = useCharacters({
    tab,
    sort,
    wallet: walletForQuery,
    page,
    perPage: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
    hasSheet: hasSheet || undefined,
    origin: origin || undefined,
    alignment: alignment || undefined,
    armor: armor || undefined,
    back: back || undefined,
    mask: mask || undefined,
    enabled: canQuery,
  })

  // Compute whether any filters are active (beyond defaults)
  const hasActiveFilters = useMemo(() => {
    return hasSheet || origin !== null || alignment !== null ||
      armor !== null || back !== null || mask !== null ||
      searchQuery.length > 0
  }, [hasSheet, origin, alignment, armor, back, mask, searchQuery])

  const handleTabChange = (newTab: CharacterFilterTab) => {
    if (newTab === tab) return
    updateURL({ tab: newTab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor, back, mask })
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return
    updateURL({ tab, sort: newSort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor, back, mask })
  }

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return
    updateURL({ tab, sort, page: newPage, search: searchQuery, hasSheet, origin, alignment, armor, back, mask })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    updateURL({ tab, sort, page: 1, search: '', hasSheet, origin, alignment, armor, back, mask })
  }

  const handleHasSheetChange = (newHasSheet: boolean) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet: newHasSheet, origin, alignment, armor, back, mask })
  }

  const handleOriginChange = (newOrigin: string | null) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet, origin: newOrigin, alignment, armor, back, mask })
  }

  const handleAlignmentChange = (newAlignment: string | null) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment: newAlignment, armor, back, mask })
  }

  // Equipment filter handlers
  const handleArmorChange = (newArmor: string | null) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor: newArmor, back, mask })
  }

  const handleBackChange = (newBack: string | null) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor, back: newBack, mask })
  }

  const handleMaskChange = (newMask: string | null) => {
    updateURL({ tab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor, back, mask: newMask })
  }

  const handleClearAllFilters = () => {
    setSearchInput('')
    updateURL({ tab: 'all', sort: 'desc', page: 1, search: '', hasSheet: false, origin: null, alignment: null, armor: null, back: null, mask: null })
  }

  type FilterType = 'hasSheet' | 'origin' | 'alignment' | 'armor' | 'back' | 'mask' | 'search'

  const handleRemoveFilter = (filterType: FilterType) => {
    const baseParams = { tab, sort, page: 1, search: searchQuery, hasSheet, origin, alignment, armor, back, mask }
    switch (filterType) {
      case 'hasSheet':
        updateURL({ ...baseParams, hasSheet: false })
        break
      case 'origin':
        updateURL({ ...baseParams, origin: null })
        break
      case 'alignment':
        updateURL({ ...baseParams, alignment: null })
        break
      case 'armor':
        updateURL({ ...baseParams, armor: null })
        break
      case 'back':
        updateURL({ ...baseParams, back: null })
        break
      case 'mask':
        updateURL({ ...baseParams, mask: null })
        break
      case 'search':
        setSearchInput('')
        updateURL({ ...baseParams, search: '' })
        break
    }
  }

  const handleCharacterClick = (tokenId: number) => {
    router.push(`/characters/${tokenId}`)
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <BannerHeader
        title="Characters"
        subtitle="Explore the WAGDIE collection - 6,666 unique characters"
      />

      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          currentTab={tab}
          currentSort={sort}
          onTabChange={handleTabChange}
          onSortChange={handleSortChange}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onClearSearch={handleClearSearch}
          hasSheetFilter={hasSheet}
          onHasSheetChange={handleHasSheetChange}
          originFilter={origin}
          availableOrigins={origins}
          onOriginChange={handleOriginChange}
          originsLoading={originsLoading}
          alignmentFilter={alignment}
          availableAlignments={alignments}
          onAlignmentChange={handleAlignmentChange}
          alignmentsLoading={alignmentsLoading}
          armorFilter={armor}
          availableArmor={armorTraits}
          onArmorChange={handleArmorChange}
          armorLoading={armorLoading}
          backFilter={back}
          availableBack={backTraits}
          onBackChange={handleBackChange}
          backLoading={backLoading}
          maskFilter={mask}
          availableMask={maskTraits}
          onMaskChange={handleMaskChange}
          maskLoading={maskLoading}
          onClearAllFilters={handleClearAllFilters}
          totalCount={totalCount}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="px-6 py-8">
            {/* Active Filters Display (mobile-visible summary) */}
            {hasActiveFilters && (
              <ActiveFilters
                filters={{
                  hasSheet,
                  origin,
                  alignment,
                  armor,
                  back,
                  mask,
                  search: searchQuery || null,
                  tab
                }}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
              />
            )}

            {/* Owned tab warning */}
            {tab === 'owned' && !address && (
              <Alert
                variant="warning"
                title="Wallet Required"
                className="mb-8"
              >
                Connect your wallet to view your characters
              </Alert>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            )}

            {isError && (
              <Alert
                variant="error"
                title="Error"
                className="mb-8"
              >
                Failed to load characters. Please try again.
              </Alert>
            )}

            {/* Empty State */}
            {!isLoading && !isError && characters.length === 0 && (
              <Empty
                message={hasActiveFilters
                  ? "No characters match your current filters"
                  : "No characters found"
                }
                className="my-12"
              />
            )}

            {/* Character Grid */}
            {!isLoading && characters.length > 0 && (
              <>
                {/* Results count */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-md font-eskapade text-neutral-500">
                    Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount} characters
                  </p>
                  {isFetching && !isLoading && (
                    <Spinner size="sm" />
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
                  {characters.filter(character => character && character.token_id).map((character) => (
                    <CharacterCard
                      key={character.token_id}
                      character={character}
                      onClick={handleCharacterClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center py-8 border-t border-neutral-800">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soul-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-500 font-eskapade text-md">
          Loading Characters
        </p>
      </div>
    </div>
  )
}

export default function CharactersPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CharactersPageContent />
    </Suspense>
  )
}
