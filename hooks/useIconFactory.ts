/**
 * useIconFactory Hook
 *
 * React hook for interacting with the enhanced IconFactory.
 * Provides icon creation, loading states, and performance metrics.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { getAssetLoadingService } from '@/lib/services/AssetLoadingService';
import { getAssetPerformanceMonitor } from '@/lib/utils/AssetPerformance';
import type {
  IconType,
  AssetLoadingState,
  AssetPerformanceMetrics,
  UseIconFactoryReturn
} from '@/types/assets';

// Default icon configurations
const DEFAULT_ICON_CONFIGS = {
  location: { size: [32, 32], url: '/images/mapicons/icon_location.png' },
  character: { size: [24, 24], url: '/images/mapicons/icon_youarehere.png' },
  burn: { size: [28, 28], url: '/images/mapicons/icon_burn.png' },
  death: { size: [28, 28], url: '/images/mapicons/icon_death.png' },
  fight: { size: [28, 28], url: '/images/mapicons/icon_fight.png' }
};

interface UseIconFactoryOptions {
  enablePerformanceMonitoring?: boolean;
  defaultSize?: [number, number];
  fallbackIcon?: string;
}

export function useIconFactory(options: UseIconFactoryOptions = {}): UseIconFactoryReturn {
  const {
    enablePerformanceMonitoring = true,
    defaultSize = [32, 32],
    fallbackIcon = '/images/mapicons/icon_location.png'
  } = options;

  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AssetPerformanceMetrics[]>([]);

  // Service instances
  const loadingService = useMemo(() => getAssetLoadingService(), []);
  const performanceMonitor = useMemo(() => getAssetPerformanceMonitor({
    enableDetailedMetrics: enablePerformanceMonitoring
  }), [enablePerformanceMonitoring]);

  /**
   * Create icon with progressive loading
   */
  const getIcon = useCallback((type: IconType, isMobile: boolean = false): L.Icon | null => {
    try {
      const config = DEFAULT_ICON_CONFIGS[type];
      if (!config) {
        setError(`Unknown icon type: ${type}`);
        return null;
      }

      // Calculate responsive size
      const size = calculateIconSize(config.size, isMobile);
      const iconUrl = config.url;

      // Check loading state
      const loadingState = loadingService.getAssetState(type);

      // Create real Leaflet icon
      const icon = L.icon({
        iconUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [0, -size[1]],
        className: `custom-icon-${type}`
      });

      // Record cache hit if already loaded
      if (loadingState?.status === 'loaded' && enablePerformanceMonitoring) {
        performanceMonitor.recordCacheHit(type);
      } else if (loadingState?.status !== 'loading') {
        // Record cache miss and start loading
        if (enablePerformanceMonitoring) {
          performanceMonitor.recordCacheMiss(type);
        }
        loadingService.loadAsset(type).catch(err => {
          setError(`Failed to load icon ${type}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        });
      }

      return icon;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create icon';
      setError(errorMessage);

      // Return fallback icon
      return L.icon({
        iconUrl: fallbackIcon,
        iconSize: defaultSize,
        iconAnchor: [defaultSize[0] / 2, defaultSize[1]],
        popupAnchor: [0, -defaultSize[1]],
        className: 'custom-icon-fallback'
      });
    }
  }, [loadingService, performanceMonitor, enablePerformanceMonitoring, fallbackIcon, defaultSize]);

  /**
   * Create icon from custom URL
   */
  const createIconFromUrl = useCallback((
    iconUrl: string,
    fallbackUrl: string,
    size: [number, number]
  ): L.Icon => {
    return L.icon({
      iconUrl,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
      className: 'custom-icon-url'
    });
  }, []);

  /**
   * Preload critical icons
   */
  const preloadIcons = useCallback(async (types: IconType[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await loadingService.loadAssets(types);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Preload failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadingService]);

  /**
   * Get loading state for icon type
   */
  const getIconLoadingState = useCallback((type: IconType): AssetLoadingState | undefined => {
    return loadingService.getAssetState(type);
  }, [loadingService]);

  /**
   * Retry icon loading
   */
  const retryIcon = useCallback(async (type: IconType): Promise<void> => {
    try {
      setError(null);
      await loadingService.retryAsset(type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
    }
  }, [loadingService]);

  /**
   * Update performance metrics
   */
  const updateMetrics = useCallback(() => {
    if (enablePerformanceMonitoring) {
      const allMetrics = performanceMonitor.getAllAssetMetrics();
      const iconMetrics = allMetrics.filter(metric =>
        Object.keys(DEFAULT_ICON_CONFIGS).includes(metric.assetId)
      );
      setMetrics(iconMetrics);
    }
  }, [performanceMonitor, enablePerformanceMonitoring]);

  // Initialize effect
  useEffect(() => {
    // Update metrics on mount and when dependencies change
    updateMetrics();

    // Set up periodic updates
    if (enablePerformanceMonitoring) {
      const interval = setInterval(updateMetrics, 3000); // Update every 3 seconds
      return () => clearInterval(interval);
    }
  }, [updateMetrics, enablePerformanceMonitoring]);

  return {
    getIcon,
    loading,
    error,
    metrics,
    retryIcon,
    preloadIcons,
    createIconFromUrl,
    getIconLoadingState
  };
}

/**
 * Calculate icon size based on device type
 */
function calculateIconSize(baseSize: [number, number], isMobile: boolean): [number, number] {
  if (!isMobile) {
    return baseSize;
  }

  // Apply mobile scaling
  const scale = 1.5;
  const minTouchSize = 44;

  const scaledWidth = Math.max(baseSize[0] * scale, minTouchSize);
  const scaledHeight = Math.max(baseSize[1] * scale, minTouchSize);

  return [scaledWidth, scaledHeight];
}

/**
 * Hook for checking if all critical icons are loaded
 */
export function useCriticalIconsLoaded(): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const checkCriticalLoaded = () => {
      const loadingService = getAssetLoadingService();
      const context = loadingService.getLoadingContext();
      setLoaded(context.completedCritical);
    };

    checkCriticalLoaded();

    // Check periodically
    const interval = setInterval(checkCriticalLoaded, 1000);
    return () => clearInterval(interval);
  }, []);

  return loaded;
}

/**
 * Hook for getting icon loading errors
 */
export function useIconLoadingErrors(): Map<string, string> {
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const updateErrors = () => {
      const loadingService = getAssetLoadingService();
      const context = loadingService.getLoadingContext();
      const newErrors = new Map<string, string>();

      context.assets.forEach((state, assetId) => {
        if (state.status === 'failed' && state.lastError) {
          newErrors.set(assetId, state.lastError);
        }
      });

      setErrors(newErrors);
    };

    updateErrors();

    const interval = setInterval(updateErrors, 2000);
    return () => clearInterval(interval);
  }, []);

  return errors;
}