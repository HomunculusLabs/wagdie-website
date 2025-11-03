/**
 * useCharacterLocation hook
 * T024 [P] [US2] Create useCharacterLocation hook
 *
 * Custom React hook for managing character location state
 * Fetches character locations for the connected wallet
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { getCharacterLocations } from '@/lib/services/map/locationService'
import { MAP_CACHE_CONFIG } from '@/types/map'

/**
 * Hook to fetch character locations for the connected wallet
 *
 * Features:
 * - Only fetches when wallet is connected
 * - Caches character locations for 30 seconds
 * - Automatic refetch on wallet address change
 * - Manual refetch function available
 *
 * @returns Query result with character locations data, loading, and error states
 *
 * @example
 * ```tsx
 * function CharacterList() {
 *   const {
 *     data: characterLocations,
 *     isLoading,
 *     error,
 *     refetch
 *   } = useCharacterLocation()
 *
 *   if (isLoading) return <div>Loading characters...</div>
 *   if (error) return <div>Error loading characters</div>
 *
 *   return (
 *     <div>
 *       {characterLocations?.map(char => (
 *         <div key={char.character_id}>
 *           Character {char.character_id} at {char.location?.name}
 *         </div>
 *       ))}
 *       <button onClick={() => refetch()}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useCharacterLocation() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['character-locations', address],
    queryFn: async () => {
      if (!address) {
        return []
      }
      return await getCharacterLocations(address)
    },
    enabled: Boolean(address && isConnected), // Only run query when wallet is connected
    staleTime: MAP_CACHE_CONFIG.queryStaleTime, // 30 seconds
    gcTime: MAP_CACHE_CONFIG.queryGcTime, // 5 minutes
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Retry after 1 second
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: 'always', // Always refetch on mount
  })

  // Manual refetch function
  const refetch = () => {
    queryClient.invalidateQueries({
      queryKey: ['character-locations', address]
    })
  }

  return {
    ...query,
    refetch
  }
}

/**
 * Hook to get character location for a specific character
 *
 * @param characterId - WAGDIE token ID to get location for
 * @returns Query result with single character location
 *
 * @example
 * ```tsx
 * function CharacterCard({ characterId }: { characterId: string }) {
 *   const { data: charLocation } = useCharacterLocationForCharacter(characterId)
 *
 *   return (
 *     <div>
 *       Character {characterId}
 *       {charLocation && (
 *         <span>Location: {charLocation.location?.name}</span>
 *       )}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCharacterLocationForCharacter(characterId: string) {
  const { address } = useAccount()

  return useQuery({
    queryKey: ['character-location', characterId],
    queryFn: async () => {
      if (!address) {
        return null
      }
      const locations = await getCharacterLocations(address)
      return locations.find(loc => loc.character_id === characterId) || null
    },
    enabled: Boolean(characterId && address),
    staleTime: MAP_CACHE_CONFIG.queryStaleTime, // 30 seconds
    gcTime: MAP_CACHE_CONFIG.queryGcTime, // 5 minutes
    retry: 2,
    retryDelay: 1000,
  })
}
