/**
 * useInfiniteScroll Hook
 * Generic infinite scroll implementation with pagination
 */

'use client'

import { useState, useCallback, useRef } from 'react'

interface UseInfiniteScrollOptions<T> {
  initialPage?: number
  perPage?: number
}

interface UseInfiniteScrollReturn<T> {
  data: T[]
  hasMore: boolean
  isLoading: boolean
  error: Error | null
  page: number
  loadMore: () => Promise<void>
  reset: () => void
}

type FetchFunction<T> = (page: number, perPage: number) => Promise<{
  items: T[]
  hasMore: boolean
}>

export function useInfiniteScroll<T>(
  fetchFn: FetchFunction<T>,
  options: UseInfiniteScrollOptions<T> = {}
): UseInfiniteScrollReturn<T> {
  const { initialPage = 1, perPage = 50 } = options

  const [data, setData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [page, setPage] = useState(initialPage)

  // Use a ref to store the fetchFn to prevent infinite re-renders
  const fetchFnRef = useRef(fetchFn)
  fetchFnRef.current = fetchFn

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await fetchFnRef.current(page, perPage)

      setData(prev => [...prev, ...result.items])
      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, isLoading, hasMore])

  const reset = useCallback(() => {
    setData([])
    setHasMore(true)
    setIsLoading(false)
    setError(null)
    setPage(initialPage)
  }, [initialPage])

  return {
    data,
    hasMore,
    isLoading,
    error,
    page,
    loadMore,
    reset
  }
}
