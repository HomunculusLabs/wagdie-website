/**
 * useTweets Hook
 * Application layer - Tweet data fetching with cursor-based pagination
 * Uses React Query for state management and API client for data fetching
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { TweetFilterTab, SortOrder } from '@/types/tweet'

export interface UseTweetsOptions {
  tab: TweetFilterTab
  sort: SortOrder
  perPage?: number
  enabled?: boolean
  refetchInterval?: number
}

/**
 * Custom hook for fetching tweets with cursor-based pagination
 * Integrates with React Query for caching and auto-refresh
 */
export function useTweets(options: UseTweetsOptions) {
  const {
    tab,
    sort,
    perPage = 25,
    enabled = true,
    refetchInterval = 20000, // 20 seconds default
  } = options

  const query = useInfiniteQuery({
    queryKey: ['tweets', tab, sort],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      api.tweets.getTweets({
        tab,
        sort,
        perPage,
        startAt: pageParam,
      }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextCursor : undefined
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 10 * 1000, // 10 seconds (fresh for auto-refresh)
    refetchInterval, // Auto-refresh for real-time lore
    enabled,
  })

  // Flatten paginated results
  const tweets = query.data?.pages.flatMap((page) => page.tweets) ?? []
  const hasMore = query.hasNextPage ?? false

  return {
    tweets,
    hasMore,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    isError: query.isError,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
  }
}
