/**
 * Lore Page
 * Display official WAGDIE tweets with filters and infinite scroll
 */

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { TweetFilterBar } from '@/components/lore/TweetFilterBar'
import { CustomTweet } from '@/components/lore/CustomTweet'
import { InfiniteScroll } from '@/components/shared/InfiniteScroll'
import { Empty, Spinner, Button, Card, CardContent } from '@/components-new'
import type { Tweet, TweetFilterTab, SortOrder } from '@/types/tweet'

function LorePageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Parse URL parameters for initial state only
  const initialTab = (searchParams.get('tab') || 'all') as TweetFilterTab
  const initialSort = (searchParams.get('sort') || 'desc') as SortOrder

  // State - now includes filter state
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [translationEnabled, setTranslationEnabled] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [reachedLimit, setReachedLimit] = useState(false)
  const [currentTab, setCurrentTab] = useState<TweetFilterTab>(initialTab)
  const [currentSort, setCurrentSort] = useState<SortOrder>(initialSort)

  // Configuration limits
  const MAX_TWEETS = 50 // Reduced maximum total tweets to prevent excessive loading
  const MAX_PAGES = 2 // Reduced maximum pages to load (2 pages * 25 tweets = 50 tweets)
  const DISABLE_INFINITE_SCROLL = true // Temporarily disable infinite scroll for testing

  // Handle filter changes - update local state immediately, then update URL
  const handleTabChange = useCallback((newTab: TweetFilterTab) => {
    if (newTab === currentTab) return

    // Update filter state immediately
    setCurrentTab(newTab)

    // Reset pagination
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
    setIsInitialLoad(true)
    setIsLoadingMore(false)
    setReachedLimit(false)

    // Update URL
    const params = new URLSearchParams()
    if (newTab !== 'all') params.set('tab', newTab)
    if (currentSort !== 'desc') params.set('sort', currentSort)
    const queryString = params.toString()
    const newUrl = `/lore${queryString ? `?${queryString}` : ''}`

    console.log('Updating URL to:', newUrl)
    router.push(newUrl)
  }, [currentTab, currentSort, router])

  const handleSortChange = useCallback((newSort: SortOrder) => {
    if (newSort === currentSort) return

    // Update filter state immediately
    setCurrentSort(newSort)

    // Reset pagination
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
    setIsInitialLoad(true)
    setIsLoadingMore(false)
    setReachedLimit(false)

    // Update URL
    const params = new URLSearchParams()
    if (currentTab !== 'all') params.set('tab', currentTab)
    if (newSort !== 'desc') params.set('sort', newSort)
    const queryString = params.toString()
    const newUrl = `/lore${queryString ? `?${queryString}` : ''}`

    console.log('Updating URL to:', newUrl)
    router.push(newUrl)
  }, [currentTab, currentSort, router])

  // Add debug logging for filter state changes
  console.log('Current filter state:', { currentTab, currentSort })

  // Fetch tweets with React Query (auto-refresh disabled to prevent infinite loops)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tweets', currentTab, currentSort, nextCursor],
    queryFn: async () => {
      console.log('Fetching tweets with params:', { currentTab, currentSort, nextCursor })

      const params = new URLSearchParams({
        tab: currentTab,
        sort: currentSort,
        perPage: '25'
      })

      if (nextCursor) {
        params.set('startAt', nextCursor)
      }

      const response = await fetch(`/api/tweets?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch tweets')
      }

      const result = await response.json()
      console.log('API response:', result)
      return result
    },
    refetchInterval: false, // Disabled auto-refresh to prevent infinite loading
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
  })

  // Reset tweets when filters change
  useEffect(() => {
    setTweets([])
    setNextCursor(null)
    setHasMore(true)
    setIsInitialLoad(true)
    setIsLoadingMore(false)
    setReachedLimit(false)
  }, [currentTab, currentSort])

  // Update tweets when data changes
  useEffect(() => {
    if (data) {
      if (isInitialLoad) {
        // First load - replace all tweets
        setTweets(data.tweets)
        setIsInitialLoad(false)
      } else {
        // Check limits before appending
        setTweets(prev => {
          const currentTweetCount = prev.length
          const newTweetCount = currentTweetCount + data.tweets.length

          if (newTweetCount > MAX_TWEETS) {
            // We've reached our limit, don't add more tweets
            setReachedLimit(true)
            setHasMore(false)
            setIsLoadingMore(false)
            return prev
          }

          // Subsequent loads - append tweets, ensuring no duplicates
          const existingIds = new Set(prev.map((tweet: Tweet) => tweet.tweet_id))
          const uniqueNewTweets = data.tweets.filter((tweet: Tweet) => !existingIds.has(tweet.tweet_id))
          return [...prev, ...uniqueNewTweets]
        })
      }
      setHasMore(data.hasMore && !reachedLimit)
      setNextCursor(data.nextCursor)
      setIsLoadingMore(false)
    }
  }, [data, isInitialLoad, reachedLimit])

  // Load more handler with proper safeguards
  const handleLoadMore = useCallback(() => {
    console.log('handleLoadMore called', {
      isLoadingMore,
      reachedLimit,
      hasMore,
      hasNextCursor: !!data?.nextCursor,
      tweetsLength: tweets.length,
      maxTweets: MAX_TWEETS,
      maxPages: MAX_PAGES
    })

    // Don't load if we're already loading, reached limits, or no more data
    if (isLoadingMore || reachedLimit || !hasMore || !data?.nextCursor) {
      console.log('Skipping load - blocked by safeguards')
      return
    }

    // Check if we've reached the page limit
    const currentPage = Math.ceil(tweets.length / 25)
    if (currentPage >= MAX_PAGES) {
      console.log('Page limit reached', { currentPage, MAX_PAGES })
      setReachedLimit(true)
      setHasMore(false)
      return
    }

    // Check if we're approaching the tweet limit
    if (tweets.length >= MAX_TWEETS - 25) {
      console.log('Tweet limit approaching', { tweetsLength: tweets.length, MAX_TWEETS })
      setReachedLimit(true)
      setHasMore(false)
      return
    }

    console.log('Proceeding with load more')
    setIsLoadingMore(true)
    setNextCursor(data.nextCursor)
    setIsInitialLoad(false)
    refetch()
  }, [isLoadingMore, reachedLimit, hasMore, data?.nextCursor, tweets.length, refetch])

  return (
    <div className="min-h-screen">
      <BannerHeader
        title="Lore"
        subtitle="Follow the official WAGDIE narrative through tweets and announcements"
      />

      <div className="container mx-auto px-4 py-8">
        {/* Filter Bar */}
        <TweetFilterBar
          currentTab={currentTab}
          currentSort={currentSort}
          translationEnabled={translationEnabled}
          onTabChange={handleTabChange}
          onSortChange={handleSortChange}
          onTranslationToggle={() => setTranslationEnabled(prev => !prev)}
          className="mb-8"
        />

        {/* Tweet Feed */}
        {tweets.length === 0 && !isLoading ? (
          <Empty
            message="No lore entries found"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
            }
          />
        ) : (
          <>
            <InfiniteScroll
              hasMore={hasMore && !reachedLimit && !DISABLE_INFINITE_SCROLL}
              isLoading={isLoading || isLoadingMore}
              onLoadMore={DISABLE_INFINITE_SCROLL ? () => {} : handleLoadMore}
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

            {/* Limit reached message */}
            {reachedLimit && (
              <Card className="mt-6">
                <CardContent className="text-center py-8">
                  <p className="text-lg font-display  tracking-widest text-neutral-200 mb-2">
                    Maximum entries reached
                  </p>
                  <p className="text-sm text-neutral-500 font-eskapade mb-6">
                    You&apos;ve loaded {tweets.length} lore entries. Use the filters above to explore different content or refresh to start over.
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => window.location.reload()}
                  >
                    Refresh Page
                  </Button>
                </CardContent>
              </Card>
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
        <p className="text-neutral-500 font-display  tracking-widest text-sm">
          Loading Lore
        </p>
      </div>
    </div>
  )
}

export default function LorePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LorePageContent />
    </Suspense>
  )
}
