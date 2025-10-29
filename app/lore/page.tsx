/**
 * Lore Page
 * Display official WAGDIE tweets with filters and infinite scroll
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TweetFilterBar } from '@/components/lore/TweetFilterBar'
import { CustomTweet } from '@/components/lore/CustomTweet'
import { InfiniteScroll } from '@/components/shared/InfiniteScroll'
import type { Tweet, TweetFilterTab, SortOrder } from '@/types/tweet'

export default function LorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL parameters
  const tab = (searchParams.get('tab') || 'all') as TweetFilterTab
  const sort = (searchParams.get('sort') || 'desc') as SortOrder

  // State
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [translationEnabled, setTranslationEnabled] = useState(false)

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
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
    updateURL(newTab, sort)
  }

  const handleSortChange = (newSort: SortOrder) => {
    if (newSort === sort) return
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
    updateURL(tab, newSort)
  }

  // Fetch tweets with React Query (auto-refresh every 20 seconds)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tweets', tab, sort, nextCursor],
    queryFn: async () => {
      const params = new URLSearchParams({
        tab,
        sort,
        perPage: '25'
      })

      if (nextCursor) {
        params.set('startAt', nextCursor)
      }

      const response = await fetch(`/api/tweets?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }

      return response.json()
    },
    refetchInterval: 20000, // Auto-refresh every 20 seconds
  })

  // Update tweets when data changes
  useEffect(() => {
    if (data) {
      setTweets(prev => nextCursor ? [...prev, ...data.tweets] : data.tweets)
      setHasMore(data.hasMore)
      setNextCursor(data.nextCursor)
    }
  }, [data, nextCursor])

  // Reset tweets when filters change
  useEffect(() => {
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
  }, [tab, sort])

  // Load more handler
  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setNextCursor(data.nextCursor)
      refetch()
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
            isLoading={isLoading}
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
