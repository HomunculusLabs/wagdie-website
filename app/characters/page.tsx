/**
 * Characters Browse Page
 * Browse and filter all WAGDIE characters with pagination
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useCallback, useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TokenFilterBar } from '@/components/characters/TokenFilterBar'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { Alert, Spinner, Pagination, Empty, Input } from '@/components-new'
import { useCharacters } from '@/hooks/useCharacters'
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

  // Local search input state (for debouncing)
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Sync search input with URL on mount/change
  useEffect(() => {
    setSearchInput(searchQuery)
  }, [searchQuery])

  // Debounced search - update URL after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        updateURL(tab, sort, 1, searchInput)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch characters using custom hook with React Query
  const {
    characters,
    totalCount,
    totalPages,
    isLoading,
    isFetching,
  } = useCharacters({
    tab,
    sort,
    wallet: address,
    page,
    perPage: ITEMS_PER_PAGE,
    search: searchQuery || undefined,
  })

  // Update URL when filters or page change
  const updateURL = useCallback((newTab: CharacterFilterTab, newSort: SortOrder, newPage: number = 1, newSearch: string = '') => {
    const params = new URLSearchParams()
    if (newTab !== 'all') params.set('tab', newTab)
    if (newSort !== 'desc') params.set('sort', newSort)
    if (newPage > 1) params.set('page', newPage.toString())
    if (newSearch.trim()) params.set('search', newSearch.trim())

    const queryString = params.toString()
    router.push(`/characters${queryString ? `?${queryString}` : ''}`)
  }, [router])

  const handleTabChange = (newTab: CharacterFilterTab) => {
    if (newTab === tab) return
    updateURL(newTab, sort, 1, searchQuery) // Reset to page 1 on filter change
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return
    updateURL(tab, newSort, 1, searchQuery) // Reset to page 1 on sort change
  }

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return
    updateURL(tab, sort, newPage, searchQuery)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClearSearch = () => {
    setSearchInput('')
    updateURL(tab, sort, 1, '')
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-neutral-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or token ID..."
              className="w-full bg-black/40 border border-neutral-800 rounded-sm py-2.5 pl-10 pr-10 text-sm font-serif text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-soul-accent/50 focus:ring-1 focus:ring-soul-accent/30 transition-all"
            />
            {searchInput && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-500 hover:text-neutral-300 transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-xs text-neutral-500 font-serif">
              Searching for &ldquo;{searchQuery}&rdquo;
            </p>
          )}
        </div>

        {/* Filter Bar */}
        <TokenFilterBar
          currentTab={tab}
          currentSort={sort}
          onTabChange={handleTabChange}
          onSortChange={handleSortChange}
          className="mb-8"
        />

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

        {/* Empty State */}
        {!isLoading && characters.length === 0 && (
          <Empty message="No characters found" className="my-12" />
        )}

        {/* Character Grid */}
        {!isLoading && characters.length > 0 && (
          <>
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-display uppercase tracking-widest text-neutral-500">
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
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-soul-950">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-neutral-500 font-display uppercase tracking-widest text-sm">
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
