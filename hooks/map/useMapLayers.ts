'use client';

import { useState, useCallback } from 'react';
import type { LayerVisibility } from '@/lib/types/map';

const DEFAULT_LAYERS: LayerVisibility = {
  locations: true,
  characters: true,
  burns: false,
  deaths: false,
  fights: false,
};

const STORAGE_KEY = 'wagdie-map-layers';

export function useMapLayers() {
  // Load layers from localStorage on mount
  const [layers, setLayers] = useState<LayerVisibility>(() => {
    // Guard against SSR
    if (typeof window === 'undefined') return DEFAULT_LAYERS;

    try {
      const savedLayers = localStorage.getItem(STORAGE_KEY);
      if (savedLayers) {
        const parsed = JSON.parse(savedLayers);
        // Merge with default to ensure all properties exist
        return { ...DEFAULT_LAYERS, ...parsed };
      }
    } catch (error) {
      console.warn('[useMapLayers] Failed to load saved layers:', error);
    }
    return DEFAULT_LAYERS;
  });

  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setLayers(prev => {
      const newLayers = {
        ...prev,
        [layer]: !prev[layer]
      };

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayers));
      } catch (error) {
        console.warn('[useMapLayers] Failed to save layers:', error);
      }

      return newLayers;
    });
  }, []);

  return { layers, toggleLayer };
}
