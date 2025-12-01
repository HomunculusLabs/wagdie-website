/**
 * useOrigins Hook
 * Application layer - Fetch available character origins with caching
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/endpoints'
import type { OriginCount } from '@/types/character'

export interface UseOriginsReturn {
  origins: OriginCount[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  totalCharacters: number
}

/**
 * Custom hook for fetching available character origins
 * Uses React Query for caching - origins rarely change
 */
export function useOrigins(): UseOriginsReturn {
  const query = useQuery({
    queryKey: ['origins'],
    queryFn: () => api.characters.getOrigins(),
    staleTime: 30 * 60 * 1000, // 30 minutes - origins rarely change
    gcTime: 60 * 60 * 1000, // 1 hour cache
  })

  return {
    origins: query.data?.origins ?? [],
    totalCharacters: query.data?.totalCharacters ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
