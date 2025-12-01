/**
 * useCharacters Hook
 * Application layer - Character data fetching with pagination and caching
 * Uses React Query for state management and API client for data fetching
 */

'use client'

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/endpoints'
import { Character, CharacterFilterTab, SortOrder } from '@/types/character'

export interface UseCharactersOptions {
  tab: CharacterFilterTab
  sort: SortOrder
  wallet?: string
  page?: number
  perPage?: number
  search?: string
  // NEW: Additional filter options
  hasSheet?: boolean
  origin?: string
  alignment?: string
  enabled?: boolean
}

/**
 * Custom hook for fetching characters with pagination
 * Integrates with React Query for caching and background refetching
 */
export function useCharacters(options: UseCharactersOptions) {
  const { tab, sort, wallet, page = 1, perPage = 50, search, hasSheet, origin, alignment, enabled = true } = options

  const query = useQuery({
    queryKey: ['characters', tab, sort, wallet, page, perPage, search, hasSheet, origin, alignment],
    queryFn: () =>
      api.characters.getCharacters({
        tab,
        sort,
        wallet,
        page,
        perPage,
        search,
        hasSheet,
        origin,
        alignment,
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled,
  })

  const characters = query.data?.characters ?? []
  const totalCount = query.data?.totalCount ?? 0
  const totalPages = Math.ceil(totalCount / perPage)
  const hasMore = page < totalPages

  return {
    characters,
    totalCount,
    totalPages,
    currentPage: page,
    hasMore,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Custom hook for fetching characters with infinite scroll (legacy)
 */
export function useCharactersInfinite(options: Omit<UseCharactersOptions, 'page'>) {
  const { tab, sort, wallet, perPage = 50, enabled = true } = options

  const query = useInfiniteQuery({
    queryKey: ['characters-infinite', tab, sort, wallet],
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
    staleTime: 5 * 60 * 1000,
    enabled,
  })

  const characters = query.data?.pages.reduce((acc, page) => {
    if (page?.characters) {
      return [...acc, ...page.characters];
    }
    return acc;
  }, [] as Character[]) ?? []

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
