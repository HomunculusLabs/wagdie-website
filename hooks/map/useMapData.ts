'use client';

import { useState, useEffect } from 'react';
import type { Location, CharacterLocation } from '@/lib/types/map';

export function useMapData() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [characterLocations, setCharacterLocations] = useState<CharacterLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('');
  const [loadingStages] = useState([
    'Initializing WAGDIE World',
    'Connecting to database',
    'Fetching locations',
    'Fetching characters',
    'Loading map assets',
    'Finalizing setup',
  ]);

  useEffect(() => {
    async function fetchData() {
      // Guard against SSR
      if (typeof window === 'undefined') return;

      try {
        console.log('[useMapData] Starting fetch with mock data...');
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
        const { CharacterLocationRepository } = await import('@/lib/repositories/characterLocationRepository');

        // Stage 3: Fetch locations
        setLoadingStage('Fetching locations');
        setLoadingProgress(40);

        const locationRepo = new LocationRepository();
        const locationsData = locationRepo.getMockLocations();

        console.log('[useMapData] Locations loaded:', locationsData.length);
        setLocations(locationsData);
        await new Promise(resolve => setTimeout(resolve, 200));

        // Stage 4: Fetch characters
        setLoadingStage('Fetching characters');
        setLoadingProgress(60);

        const charLocationRepo = new CharacterLocationRepository();
        const characterLocationsData = charLocationRepo.getMockCharacterLocations();

        console.log('[useMapData] Characters loaded:', characterLocationsData.length);
        setCharacterLocations(characterLocationsData);
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
        setError(err as Error);
        setLoadingStage('Error loading data');
      } finally {
        setIsLoading(false);
        console.log('[useMapData] Set loading to false');
      }
    }

    fetchData();
  }, []);

  return {
    locations,
    characterLocations,
    isLoading,
    error,
    loadingProgress,
    loadingStage,
    loadingStages,
  };
}
