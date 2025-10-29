/**
 * Lore Page
 * Display official WAGDIE tweets with filters and infinite scroll
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TweetFilterBar } from '@/components/lore/TweetFilterBar'
import { CustomTweet } from '@/components/lore/CustomTweet'
import { InfiniteScroll } from '@/components/shared/InfiniteScroll'
import { useTweets } from '@/hooks/useTweets'
import type { TweetFilterTab, SortOrder } from '@/types/tweet'

export default function LorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL parameters
  const tab = (searchParams.get('tab') || 'all') as TweetFilterTab
  const sort = (searchParams.get('sort') || 'desc') as SortOrder

  // Local UI state
  const [translationEnabled, setTranslationEnabled] = useState(false)

  // Fetch tweets using custom hook with React Query
  const {
    tweets,
    hasMore,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
  } = useTweets({
    tab,
    sort,
    refetchInterval: 20000, // Auto-refresh every 20 seconds
  })

  // Update URL when filters change
  const updateURL = useCallback((newTab: TweetFilterTab, newSort: SortOrder) => {
    const params = new URLSearchParams()
    if (newTab !== 'all') params.set('tab', newTab)
    if (newSort !== 'desc') params.set('sort', newSort)

    const queryString = params.toString()
    router.push(`/lore${queryString ? `?${queryString}` : ''}`)
  }, [router])

  // Handle filter changes
  const handleTabChange = (newTab: TweetFilterTab) => {
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
        title="Lore"
        subtitle="Follow the official WAGDIE narrative through tweets and announcements"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <TweetFilterBar
          currentTab={tab}
          currentSort={sort}
          translationEnabled={translationEnabled}
          onTabChange={handleTabChange}
          onSortChange={handleSortChange}
          onTranslationToggle={() => setTranslationEnabled(!translationEnabled)}
          className="mb-8"
        />

        {/* Tweet Feed */}
        {tweets.length === 0 && !isLoading ? (
          <div className="text-center py-20">
            <p className="text-xl text-ash">No tweets found</p>
            <p className="text-sm text-mist mt-2">Check back later for updates</p>
          </div>
        ) : (
          <InfiniteScroll
            hasMore={hasMore}
            isLoading={isLoading || isFetchingNextPage}
            onLoadMore={handleLoadMore}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tweets.map((tweet) => (
                <CustomTweet
                  key={tweet.tweet_id}
                  tweet={tweet}
                  translationEnabled={translationEnabled}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  )
}
