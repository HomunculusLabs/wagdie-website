/**
 * useLocations hook
 * T023 [P] [US2] Create useLocations hook
 *
 * Custom React hook for fetching and caching available locations
 * Uses React Query for caching and state management
 */

import { useQuery } from '@tanstack/react-query'
import { getLocations } from '@/lib/services/map/locationService'
import { MAP_CACHE_CONFIG } from '@/types/map'

/**
 * Hook to fetch all available locations in the WAGDIE world
 *
 * Features:
 * - Caches locations for 5 minutes (stale time)
 * - Automatic refetch on window focus
 * - Error handling with retry
 *
 * @returns Query result with locations data, loading, and error states
 *
 * @example
 * ```tsx
 * function LocationList() {
 *   const { data: locations, isLoading, error } = useLocations()
 *
 *   if (isLoading) return <div>Loading locations...</div>
 *   if (error) return <div>Error loading locations</div>
 *
 *   return (
 *     <ul>
 *       {locations?.map(location => (
 *         <li key={location.id}>{location.name}</li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: getLocations,
    staleTime: 5 * 60 * 1000, // 5 minutes - locations don't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  })
}
