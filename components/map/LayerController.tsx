/**
 * Layer Controller Component
 *
 * Manages layer visibility state and filters markers based on layer settings.
 * Provides context for layer management across the map component tree.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type {
  LayerVisibility,
  LayerState,
  LayerControllerProps,
} from '@/specs/008-map-refactor/contracts/layer-controller';
import type { MarkerProps } from '@/specs/008-map-refactor/contracts/marker-component';

/**
 * Default layer visibility state
 */
const defaultLayerVisibility: LayerVisibility = {
  locations: true,
  characters: true,
  burns: true,
  deaths: true,
  fights: true,
};

/**
 * Context for layer state
 */
const LayerContext = createContext<LayerState | null>(null);

/**
 * LayerController Provider Component
 */
export const LayerController: React.FC<LayerControllerProps> = ({
  locations,
  characterLocations,
  burnMarkers,
  deathMarkers,
  fightMarkers,
  children,
}) => {
  const [visible, setVisible] = useState<LayerVisibility>(defaultLayerVisibility);

  /**
   * Toggle visibility of a specific layer with useCallback to prevent re-renders
   */
  const toggleLayer = useCallback((layer: keyof LayerVisibility) => {
    setVisible((prev) => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  /**
   * Set visibility for a specific layer with useCallback to prevent re-renders
   */
  const setLayerVisibility = useCallback((layer: keyof LayerVisibility, isVisible: boolean) => {
    setVisible((prev) => ({
      ...prev,
      [layer]: isVisible,
    }));
  }, []);

  /**
   * Check if a layer is visible with useCallback
   */
  const isLayerVisible = useCallback((layer: keyof LayerVisibility): boolean => {
    return visible[layer];
  }, [visible]);

  /**
   * Filter markers based on layer visibility
   */
  const getVisibleMarkers = <T extends MarkerProps>(markers: T[]): T[] => {
    if (!markers || markers.length === 0) {
      return [];
    }

    // Determine which layer to filter by based on marker type
    // For now, return all markers - the filtering happens at the parent level
    return markers;
  };

  /**
   * Get count of visible layers
   */
  const getVisibleLayerCount = (): number => {
    return Object.values(visible).filter(Boolean).length;
  };

  const layerState: LayerState = {
    visible,
    toggleLayer,
    setLayerVisibility,
    isLayerVisible,
    getVisibleMarkers,
    getVisibleLayerCount,
  };

  return (
    <LayerContext.Provider value={layerState}>
      {children}
    </LayerContext.Provider>
  );
};

/**
 * Hook to use layer state
 */
export const useLayerController = (): LayerState => {
  const context = useContext(LayerContext);

  if (!context) {
    throw new Error('useLayerController must be used within LayerController');
  }

  return context;
};

/**
 * Filter markers by layer visibility
 */
export const useLayerFilteredMarkers = () => {
  const { visible } = useLayerController();

  const filterMarkers = <T extends MarkerProps>(markers: T[], layerKey: keyof LayerVisibility): T[] => {
    if (!visible[layerKey]) {
      return [];
    }
    return markers;
  };

  return { filterMarkers };
};

export default LayerController;
