/**
 * useCharacters Hook
 * Application layer - Character data fetching with infinite scroll and caching
 * Uses React Query for state management and API client for data fetching
 */

'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CharacterFilterTab, SortOrder } from '@/types/character'

export interface UseCharactersOptions {
  tab: CharacterFilterTab
  sort: SortOrder
  wallet?: string
  perPage?: number
  enabled?: boolean
}

/**
 * Custom hook for fetching characters with infinite scroll
 * Integrates with React Query for caching and background refetching
 */
export function useCharacters(options: UseCharactersOptions) {
  const { tab, sort, wallet, perPage = 50, enabled = true } = options

  const query = useInfiniteQuery({
    queryKey: ['characters', tab, sort, wallet],
    queryFn: ({ pageParam = 1 }) =>
      api.characters.getCharacters({
        tab,
        sort,
        wallet,
        page: pageParam,
        perPage,
      }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  })

  // Flatten paginated results
  const characters = query.data?.pages.flatMap((page) => page.characters) ?? []
  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const hasMore = query.hasNextPage ?? false

  return {
    characters,
    totalCount,
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
