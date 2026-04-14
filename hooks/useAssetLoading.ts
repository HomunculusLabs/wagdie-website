/**
 * useAssetLoading Hook
 *
 * React hook for managing asset loading states and operations.
 * Provides loading states, error handling, and performance metrics.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getAssetLoadingService } from '@/lib/services/asset-loading-service';
import { getAssetErrorHandler } from '@/lib/services/asset-error-handler';
import { getAssetPerformanceMonitor } from '@/lib/utils/asset-performance';
import type {
  AssetLoadingState,
  PerformanceReport,
  UseAssetLoadingReturn
} from '@/types/assets';

interface UseAssetLoadingOptions {
  assetIds?: string[];
  preloadCritical?: boolean;
  enablePerformanceMonitoring?: boolean;
  onError?: (error: any) => void;
  onFallback?: (assetId: string, fallbackUrl: string) => void;
}

export function useAssetLoading(options: UseAssetLoadingOptions = {}): UseAssetLoadingReturn {
  const {
    assetIds = [],
    preloadCritical = true,
    enablePerformanceMonitoring = true,
    onError,
    onFallback
  } = options;

  // State management
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<Map<string, AssetLoadingState>>(new Map());
  const [criticalLoaded, setCriticalLoaded] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<PerformanceReport | null>(null);

  // Service instances
  const loadingService = useRef(getAssetLoadingService());
  const errorHandler = useRef(getAssetErrorHandler({
    onError: (assetError) => {
      setError(assetError.errorMessage);
      onError?.(assetError);
    },
    onFallback: (assetId, fallbackUrl) => {
      onFallback?.(assetId, fallbackUrl);
    }
  }));
  const performanceMonitor = useRef(getAssetPerformanceMonitor({
    enableDetailedMetrics: enablePerformanceMonitoring
  }));
  const initializationSignatureRef = useRef<string | null>(null);

  /**
   * Load a single asset
   */
  const loadAsset = useCallback(async (assetId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const result = await loadingService.current.loadAsset(assetId);

      // Update local state
      setAssets(prev => new Map(prev.set(assetId, result)));

      // Record performance metrics
      if (enablePerformanceMonitoring && result.loadEndTime) {
        const loadTime = result.loadEndTime - result.loadStartTime;
        const success = result.status === 'loaded' || result.status === 'fallback';
        performanceMonitor.current.recordAssetLoad(assetId, loadTime, success, result.retryCount);
      }

      // Check if critical assets are loaded
      const context = loadingService.current.getLoadingContext();
      setCriticalLoaded(context.completedCritical);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enablePerformanceMonitoring, onError, onFallback]);

  /**
   * Load multiple assets
   */
  const loadAssets = useCallback(async (assetIds: string[]): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const results = await loadingService.current.loadAssets(assetIds);

      // Update local state
      setAssets(prev => {
        const newAssets = new Map(prev);
        results.forEach(result => {
          newAssets.set(result.assetId, result);

          // Record performance metrics
          if (enablePerformanceMonitoring && result.loadEndTime) {
            const loadTime = result.loadEndTime - result.loadStartTime;
            const success = result.status === 'loaded' || result.status === 'fallback';
            performanceMonitor.current.recordAssetLoad(result.assetId, loadTime, success, result.retryCount);
          }
        });

        return newAssets;
      });

      // Check if critical assets are loaded
      const context = loadingService.current.getLoadingContext();
      setCriticalLoaded(context.completedCritical);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [enablePerformanceMonitoring]);

  /**
   * Preload assets
   */
  const preloadAssets = useCallback(async (assetIds: string[]): Promise<void> => {
    await loadAssets(assetIds);
  }, [loadAssets]);

  /**
   * Retry failed asset
   */
  const retryAsset = useCallback(async (assetId: string): Promise<void> => {
    try {
      setError(null);
      await loadingService.current.retryAsset(assetId);

      // Update local state
      const result = loadingService.current.getAssetState(assetId);
      if (result) {
        setAssets(prev => new Map(prev.set(assetId, result)));

        // Record performance metrics
        if (enablePerformanceMonitoring && result.loadEndTime) {
          const loadTime = result.loadEndTime - result.loadStartTime;
          const success = result.status === 'loaded' || result.status === 'fallback';
          performanceMonitor.current.recordAssetLoad(assetId, loadTime, success, result.retryCount);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed';
      setError(errorMessage);
    }
  }, [enablePerformanceMonitoring]);

  /**
   * Get asset state
   */
  const getAssetState = useCallback((assetId: string): AssetLoadingState | undefined => {
    return loadingService.current.getAssetState(assetId);
  }, []);

  /**
   * Update performance metrics
   */
  const updateMetrics = useCallback(() => {
    if (enablePerformanceMonitoring) {
      const report = performanceMonitor.current.generateReport(assets);
      setMetrics(report);
    }
  }, [assets, enablePerformanceMonitoring]);

  const assetIdsSignature = useMemo(() => JSON.stringify(assetIds), [assetIds]);

  // Initialize effect
  useEffect(() => {
    let mounted = true;
    const signature = `${preloadCritical}:${assetIdsSignature}`;

    if (initializationSignatureRef.current === signature) {
      return () => {
        mounted = false;
      };
    }

    initializationSignatureRef.current = signature;

    const initialize = async () => {
      try {
        // Preload critical assets if enabled
        if (preloadCritical) {
          await loadingService.current.preloadCriticalAssets();
        }

        // Load specified assets if provided
        if (assetIds.length > 0) {
          await loadAssets(assetIds);
        }

        // Update initial state
        if (mounted) {
          const context = loadingService.current.getLoadingContext();
          setAssets(new Map(context.assets));
          setCriticalLoaded(context.completedCritical);
        }

      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Initialization failed';
          setError(errorMessage);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [assetIdsSignature, assetIds, preloadCritical, loadAssets]);

  // Update metrics periodically
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [updateMetrics, enablePerformanceMonitoring]);

  return {
    loading,
    error,
    assets,
    criticalLoaded,
    loadAsset,
    loadAssets,
    getAssetState,
    retryAsset,
    preloadAssets,
    metrics
  };
}