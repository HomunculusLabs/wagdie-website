/**
 * useCharacterDetail Hook
 * Application layer - Single character data fetching and mutation
 * Uses React Query for state management and API client for data fetching
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Character } from '@/types/character'

/**
 * Custom hook for fetching a single character
 */
export function useCharacterDetail(tokenId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['character', tokenId],
    queryFn: () => api.characters.getCharacter(tokenId!),
    enabled: enabled && tokenId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Custom hook for updating character data
 */
export function useUpdateCharacter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tokenId, updates }: {
      tokenId: number
      updates: Partial<Pick<Character, 'background_story' | 'equipment'>>
    }) => api.characters.updateCharacter(tokenId, updates),
    onSuccess: (updatedCharacter) => {
      // Invalidate and refetch character queries
      queryClient.invalidateQueries({ queryKey: ['character', updatedCharacter.token_id] })
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

/**
 * Custom hook for fetching character concords
 */
export function useCharacterConcords(tokenId: number | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['character', tokenId, 'concords'],
    queryFn: () => api.characters.getCharacterConcords(tokenId!),
    enabled: enabled && tokenId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
