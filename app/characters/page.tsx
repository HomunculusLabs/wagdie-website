/**
 * Characters Browse Page
 * Browse and filter all WAGDIE characters with infinite scroll
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TokenFilterBar } from '@/components/characters/TokenFilterBar'
import { TokenFeed } from '@/components/characters/TokenFeed'
import type { Character, CharacterFilterTab, SortOrder } from '@/types/character'

export default function CharactersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { address } = useAccount()

  // Parse URL parameters
  const tab = (searchParams.get('tab') || 'all') as CharacterFilterTab
  const sort = (searchParams.get('sort') || 'desc') as SortOrder

  // State
  const [characters, setCharacters] = useState<Character[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)

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

    // Reset page and characters when filter changes
    setCharacters([])
    setPage(1)
    setHasMore(true)
    updateURL(newTab, sort)
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return

    // Reset page and characters when sort changes
    setCharacters([])
    setPage(1)
    setHasMore(true)
    updateURL(tab, newSort)
  }

  // Fetch characters
  const fetchCharacters = useCallback(async (currentPage: number) => {
    if (isLoading) return

    try {
      setIsLoading(true)

      const params = new URLSearchParams({
        tab,
        sort,
        page: currentPage.toString(),
        perPage: '50'
      })

      // Add wallet address if viewing "owned" tab
      if (tab === 'owned' && address) {
        params.set('wallet', address)
      }

      const response = await fetch(`/api/characters?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }

      const data = await response.json()

      setCharacters(prev => currentPage === 1 ? data.characters : [...prev, ...data.characters])
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Error fetching characters:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [tab, sort, address, isLoading])

  // Load more handler
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchCharacters(nextPage)
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    setCharacters([])
    setPage(1)
    setHasMore(true)
    fetchCharacters(1)
  }, [tab, sort, address])

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
          isLoading={isLoading}
          onLoadMore={handleLoadMore}
        />
      </div>
    </div>
  )
}
