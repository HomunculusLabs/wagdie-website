/**
 * useAlignments Hook
 * Application layer - Fetch available character alignments with caching
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/endpoints'
import type { AlignmentCount } from '@/types/character'

export interface UseAlignmentsReturn {
  alignments: AlignmentCount[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  totalCharacters: number
}

/**
 * Custom hook for fetching available character alignments
 * Uses React Query for caching - alignments rarely change
 */
export function useAlignments(): UseAlignmentsReturn {
  const query = useQuery({
    queryKey: ['alignments'],
    queryFn: () => api.characters.getAlignments(),
    staleTime: 30 * 60 * 1000, // 30 minutes - alignments rarely change
    gcTime: 60 * 60 * 1000, // 1 hour cache
  })

  return {
    alignments: query.data?.alignments ?? [],
    totalCharacters: query.data?.totalCharacters ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}
