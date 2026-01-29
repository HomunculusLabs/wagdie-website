'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Location } from '@/lib/types/map';
import type { CharacterWithLocation } from '@/lib/repositories/character-repository';

export function useMapData() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [stakedCharacters, setStakedCharacters] = useState<CharacterWithLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingStages] = useState([
    'Initializing WAGDIE World',
    'Fetching data',
    'Loading map assets',
    'Complete',
  ]);

  useEffect(() => {
    async function fetchData() {
      // Guard against SSR
      if (typeof window === 'undefined') return;

      try {
        console.log('[useMapData] Starting fetch...');
        setIsLoading(true);
        setError(null);

        // Stage 1: Initialize and import repositories in parallel
        setLoadingStage('Initializing WAGDIE World');
        setLoadingProgress(10);

        // Dynamically import repositories in parallel
        const [{ LocationRepository }, { getStakedCharacters }] = await Promise.all([
          import('@/lib/repositories/locationRepository'),
          import('@/lib/repositories/character-repository'),
        ]);

        // Stage 2: Fetch locations and staked characters in parallel
        setLoadingStage('Fetching data');
        setLoadingProgress(30);

        const locationRepo = new LocationRepository();

        // Parallel fetch of locations and staked characters
        const [locationsResult, stakedResult] = await Promise.allSettled([
          locationRepo.getAll(),
          getStakedCharacters(),
        ]);

        // Handle locations result
        let locationsData: Location[] = [];
        if (locationsResult.status === 'fulfilled' && locationsResult.value?.length > 0) {
          locationsData = locationsResult.value;
        } else {
          console.warn('[useMapData] No locations returned, falling back to mock locations');
          locationsData = locationRepo.getMockLocations();
        }

        // Handle staked characters result
        let stakedData: CharacterWithLocation[] = [];
        if (stakedResult.status === 'fulfilled' && stakedResult.value) {
          stakedData = stakedResult.value;
        }

        setLoadingProgress(70);

        console.log('[useMapData] Locations loaded:', locationsData.length);
        console.log('[useMapData] Staked characters loaded:', stakedData.length);

        setLocations(locationsData);
        setStakedCharacters(stakedData);

        // Stage 3: Finalize
        setLoadingStage('Loading map assets');
        setLoadingProgress(90);

        setLoadingStage('Complete');
        setLoadingProgress(100);
        console.log('[useMapData] All data loaded successfully');

      } catch (err) {
        console.error('[useMapData] Failed to fetch map data:', err);
        const message =
          err instanceof Error ? err.message : 'Failed to fetch map data';
        setError(message);
        setLoadingStage('Error loading data');
      } finally {
        setIsLoading(false);
        console.log('[useMapData] Set loading to false');
      }
    }

    fetchData();
  }, []);

  const fetchStakedCharactersFromApi = useCallback(async (): Promise<CharacterWithLocation[]> => {
    const perPage = 100;
    const maxPages = 50;
    const rows: CharacterWithLocation[] = [];

    // Fetch first page to determine total
    const firstResponse = await fetch(
      `/api/characters?tab=staked&page=1&perPage=${perPage}&sort=asc`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );

    if (!firstResponse.ok) {
      const text = await firstResponse.text().catch(() => '');
      throw new Error(`Failed to fetch staked characters (${firstResponse.status})${text ? ` - ${text}` : ''}`);
    }

    const firstPayload = await firstResponse.json() as {
      characters?: CharacterWithLocation[];
      totalCount?: number;
      hasMore?: boolean;
    };

    const firstPageRows = Array.isArray(firstPayload.characters) ? firstPayload.characters : [];
    rows.push(...firstPageRows);

    // Calculate remaining pages needed
    const totalCount = firstPayload.totalCount ?? 0;
    const totalPages = Math.min(Math.ceil(totalCount / perPage), maxPages);

    if (totalPages > 1) {
      // Fetch remaining pages in parallel (with concurrency limit)
      const CONCURRENCY = 5;
      const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

      for (let i = 0; i < remainingPages.length; i += CONCURRENCY) {
        const batch = remainingPages.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
          batch.map(async (page) => {
            const response = await fetch(
              `/api/characters?tab=staked&page=${page}&perPage=${perPage}&sort=asc`,
              {
                method: 'GET',
                headers: { Accept: 'application/json' },
                cache: 'no-store',
              }
            );

            if (!response.ok) return [];

            const payload = await response.json() as { characters?: CharacterWithLocation[] };
            return Array.isArray(payload.characters) ? payload.characters : [];
          })
        );

        for (const pageRows of batchResults) {
          rows.push(...pageRows);
        }
      }
    }

    return rows;
  }, []);

  const refetch = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;

    setIsRefreshing(true);

    try {
      const rows = await fetchStakedCharactersFromApi();
      const locationMap = new Map(
        locations.map((location) => [location.id, location])
      );
      const joined = rows.map((row) => {
        const locationId =
          typeof row.location_id === 'string' ? row.location_id : null;
        const location = locationId ? locationMap.get(locationId) : null;

        return {
          ...row,
          location: location
            ? {
                id: location.id,
                name: location.name,
                metadata: location.metadata,
              }
            : null,
        } as CharacterWithLocation;
      });

      setStakedCharacters(joined);
    } catch (err) {
      console.error('[useMapData] Failed to refresh staked characters:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStakedCharactersFromApi, locations]);

  return {
    locations,
    stakedCharacters,
    isLoading,
    isRefreshing,
    error,
    loadingProgress,
    loadingStage,
    loadingStages,
    refetch,
  };
}
