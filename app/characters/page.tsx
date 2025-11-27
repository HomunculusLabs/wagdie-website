/**
 * Characters Browse Page
 * Browse and filter all WAGDIE characters with pagination
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TokenFilterBar } from '@/components/characters/TokenFilterBar'
import { CharacterCard } from '@/components/characters/CharacterCard'
import { Alert, Spinner, Pagination, Empty } from '@/components-new'
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
  })

  // Update URL when filters or page change
  const updateURL = useCallback((newTab: CharacterFilterTab, newSort: SortOrder, newPage: number = 1) => {
    const params = new URLSearchParams()
    if (newTab !== 'all') params.set('tab', newTab)
    if (newSort !== 'desc') params.set('sort', newSort)
    if (newPage > 1) params.set('page', newPage.toString())

    const queryString = params.toString()
    router.push(`/characters${queryString ? `?${queryString}` : ''}`)
  }, [router])

  const handleTabChange = (newTab: CharacterFilterTab) => {
    if (newTab === tab) return
    updateURL(newTab, sort, 1) // Reset to page 1 on filter change
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return
    updateURL(tab, newSort, 1) // Reset to page 1 on sort change
  }

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return
    updateURL(tab, sort, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
