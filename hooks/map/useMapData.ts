'use client';

import { useState, useEffect } from 'react';
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
    'Connecting to database',
    'Fetching locations',
    'Fetching staked characters',
    'Loading map assets',
    'Finalizing setup',
  ]);

  useEffect(() => {
    async function fetchData() {
      // Guard against SSR
      if (typeof window === 'undefined') return;

      try {
        console.log('[useMapData] Starting fetch...');
        setIsLoading(true);
        setError(null);

        // Stage 1: Initialize
        setLoadingStage('Initializing WAGDIE World');
        setLoadingProgress(10);
        await new Promise(resolve => setTimeout(resolve, 300));

        // Stage 2: Connect
        setLoadingStage('Connecting to database');
        setLoadingProgress(20);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Dynamically import repositories
        const { LocationRepository } = await import('@/lib/repositories/locationRepository');
        const { getStakedCharacters } = await import('@/lib/repositories/character-repository');

        // Stage 3: Fetch locations
        setLoadingStage('Fetching locations');
        setLoadingProgress(40);

        const locationRepo = new LocationRepository();
        let locationsData: Location[] = [];
        try {
          locationsData = await locationRepo.getAll();
        } catch {
          locationsData = [];
        }

        if (!locationsData || locationsData.length === 0) {
          console.warn('[useMapData] No locations returned, falling back to mock locations');
          locationsData = locationRepo.getMockLocations();
        }

        console.log('[useMapData] Locations loaded:', locationsData.length);
        setLocations(locationsData);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Stage 4: Fetch staked characters (wagdie_characters.location_id IS NOT NULL)
        setLoadingStage('Fetching staked characters');
        setLoadingProgress(60);

        let stakedData: CharacterWithLocation[] = [];
        try {
          stakedData = await getStakedCharacters();
        } catch {
          stakedData = [];
        }

        if (!stakedData) {
          stakedData = [];
        }

        console.log('[useMapData] Staked characters loaded:', stakedData.length);
        setStakedCharacters(stakedData);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Stage 5: Load map assets
        setLoadingStage('Loading map assets');
        setLoadingProgress(80);

        // Simulate image loading
        await new Promise(resolve => setTimeout(resolve, 400));

        // Stage 6: Finalize
        setLoadingStage('Finalizing setup');
        setLoadingProgress(100);
        await new Promise(resolve => setTimeout(resolve, 200));

        setLoadingStage('Complete');
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

  const fetchStakedCharactersFromApi = async (): Promise<CharacterWithLocation[]> => {
    const perPage = 100;
    const maxPages = 50;
    const rows: CharacterWithLocation[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await fetch(
        `/api/characters?tab=staked&page=${page}&perPage=${perPage}&sort=asc`,
        {
          method: 'GET',
          headers: { Accept: 'application/json' },
        }
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const suffix = text ? ` - ${text}` : '';
        throw new Error(
          `Failed to fetch staked characters (${response.status})${suffix}`
        );
      }

      const payload = (await response.json()) as {
        characters?: CharacterWithLocation[];
        totalCount?: number;
        hasMore?: boolean;
      };
      const pageRows = Array.isArray(payload.characters) ? payload.characters : [];
      rows.push(...pageRows);

      const hasMore =
        typeof payload.hasMore === 'boolean'
          ? payload.hasMore
          : typeof payload.totalCount === 'number'
            ? rows.length < payload.totalCount
            : pageRows.length === perPage;

      if (!hasMore) {
        break;
      }
    }

    return rows;
  };

  const refetch = async (): Promise<void> => {
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
  };

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
