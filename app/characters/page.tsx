/**
 * Characters Browse Page
 * Browse and filter all WAGDIE characters with infinite scroll
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TokenFilterBar } from '@/components/characters/TokenFilterBar'
import { TokenFeed } from '@/components/characters/TokenFeed'
import { useCharacters } from '@/hooks/useCharacters'
import { useWallet } from '@/hooks/useWallet'
import type { CharacterFilterTab, SortOrder } from '@/types/character'

export default function CharactersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { address } = useWallet()

  // Parse URL parameters
  const tab = (searchParams.get('tab') || 'all') as CharacterFilterTab
  const sort = (searchParams.get('sort') || 'desc') as SortOrder

  // Fetch characters using custom hook with React Query
  const {
    characters,
    hasMore,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
  } = useCharacters({
    tab,
    sort,
    wallet: address,
  })

  // Update URL when filters change
  const updateURL = useCallback((newTab: CharacterFilterTab, newSort: SortOrder) => {
    const params = new URLSearchParams()
    if (newTab !== 'all') params.set('tab', newTab)
    if (newSort !== 'desc') params.set('sort', newSort)

    const queryString = params.toString()
    router.push(`/characters${queryString ? `?${queryString}` : ''}`)
  }, [router])

  // Handle filter changes
  const handleTabChange = (newTab: CharacterFilterTab) => {
    if (newTab === tab) return
    updateURL(newTab, sort)
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return
    updateURL(tab, newSort)
  }

  // Load more handler
  const handleLoadMore = () => {
    if (!isFetchingNextPage && hasMore) {
      fetchNextPage()
    }
  }

  return (
    <div className="min-h-screen">
      <BannerHeader
        title="Characters"
        subtitle="Explore the WAGDIE collection - 6,666 unique characters"
      />

      <div className="container mx-auto px-4 py-8">
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
          <div className="bg-midnight border border-gold rounded-lg p-4 mb-8 text-center">
            <p className="text-bone">
              Connect your wallet to view your characters
            </p>
          </div>
        )}

        {/* Character Grid */}
        <TokenFeed
          characters={characters}
          hasMore={hasMore}
          isLoading={isLoading || isFetchingNextPage}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  )
}
