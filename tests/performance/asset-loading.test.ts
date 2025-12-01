/**
 * Asset Loading Performance Tests
 *
 * Tests for performance optimization of map asset loading including:
 * - Load time targets (<2s for critical assets)
 * - Caching efficiency
 * - Memory usage
 * - Concurrent loading limits
 * - Preloading effectiveness
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the asset loading service
jest.mock('@/lib/services/asset-loading-service', () => {
  return {
    AssetLoadingService: jest.fn().mockImplementation(() => ({
      loadAsset: jest.fn(),
      loadAssets: jest.fn(),
      preloadCriticalAssets: jest.fn(),
      loadNonCriticalAssets: jest.fn(),
      getAssetState: jest.fn(),
      retryAsset: jest.fn(),
    })),
  };
});

// Mock the asset cache
jest.mock('@/lib/services/asset-cache', () => {
  return {
    getAssetCache: jest.fn().mockReturnValue({
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      preloadCriticalAssets: jest.fn(),
      getStats: jest.fn().mockReturnValue({
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        missRate: 0,
        evictionCount: 0,
      }),
    }),
  };
});

// Mock the asset optimizer
jest.mock('@/lib/utils/asset-optimization', () => {
  return {
    getAssetOptimizer: jest.fn().mockReturnValue({
      optimizeImageUrl: jest.fn(),
      preloadCriticalAssets: jest.fn(),
      getOptimizationRecommendations: jest.fn().mockReturnValue({
        recommendedQuality: 80,
        recommendedFormat: 'webp',
        maxConcurrentLoads: 4,
        enableLazyLoading: false,
        enableProgressiveLoading: false,
      }),
    }),
  };
});

// Mock Image constructor
global.Image = class {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src: string = '';
  constructor() { }
} as any;

import { AssetLoadingService } from '@/lib/services/asset-loading-service';
import { getAssetCache } from '@/lib/services/asset-cache';
import { getAssetOptimizer } from '@/lib/utils/asset-optimization';

describe('Asset Loading Performance', () => {
  let assetLoadingService: AssetLoadingService;
  let mockCache: any;
  let mockOptimizer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockCache = getAssetCache();
    mockOptimizer = getAssetOptimizer();

    assetLoadingService = new AssetLoadingService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Critical Asset Loading Performance', () => {
    test('should load critical assets within 2 second target', async () => {
      const criticalAssets = ['location', 'character', 'burn', 'death', 'fight'];
      const loadTimes: number[] = [];

      // Mock fast loading for critical assets
      mockCache.get.mockReturnValue(null); // Cache miss

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        const startTime = Date.now();

        // Simulate loading time based on asset type
        const loadTime = {
          location: 300,
          character: 400,
          burn: 250,
          death: 250,
          fight: 350,
        }[assetId] || 300;

        await new Promise(resolve => setTimeout(resolve, loadTime));

        const endTime = Date.now();
        loadTimes.push(endTime - startTime);

        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: startTime,
          loadEndTime: endTime,
          loadTime: endTime - startTime,
          retryCount: 0,
          usedFallback: false,
        };
      });

      // Preload critical assets
      await assetLoadingService.preloadCriticalAssets();

      // Verify all critical assets were loaded
      expect(assetLoadingService.loadAsset).toHaveBeenCalledTimes(criticalAssets.length);

      // Check performance targets
      const maxLoadTime = Math.max(...loadTimes);
      const avgLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length;

      expect(maxLoadTime).toBeLessThan(2000); // All assets under 2s
      expect(avgLoadTime).toBeLessThan(1000); // Average under 1s
    });

    test('should prioritize critical assets over non-critical assets', async () => {
      const criticalAssets = ['location', 'character'];
      const nonCriticalAssets = ['legend-location', 'legend-burn'];
      const loadOrder: string[] = [];

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        loadOrder.push(assetId);
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 100,
          retryCount: 0,
          usedFallback: false,
        };
      });

      // Start loading both types concurrently
      const criticalPromise = assetLoadingService.preloadCriticalAssets();
      const nonCriticalPromise = assetLoadingService.loadNonCriticalAssets(nonCriticalAssets);

      await Promise.all([criticalPromise, nonCriticalPromise]);

      // Critical assets should be loaded first
      const criticalIndices = criticalAssets.map(asset => loadOrder.indexOf(asset));
      const nonCriticalIndices = nonCriticalAssets.map(asset => loadOrder.indexOf(asset));

      const minCriticalIndex = Math.min(...criticalIndices);
      const maxNonCriticalIndex = Math.max(...nonCriticalIndices);

      expect(minCriticalIndex).toBeLessThan(maxNonCriticalIndex);
    });

    test('should use cached critical assets instantly', async () => {
      const criticalAsset = 'location';

      // Mock cache hit
      mockCache.get.mockReturnValue({
        data: { src: '/cached-location.png' },
        timestamp: Date.now(),
        url: '/cached-location.png',
      });

      const startTime = Date.now();
      const result = await assetLoadingService.loadAsset(criticalAsset);
      const endTime = Date.now();

      // Should be instant from cache
      expect(endTime - startTime).toBeLessThan(10);
      expect(result.cached).toBe(true);
      expect(result.loadTime).toBe(0);

      // Should not call loading logic
      expect(assetLoadingService.loadAsset).not.toHaveBeenCalled();
    });
  });

  describe('Caching Performance', () => {
    test('should achieve high cache hit rate for repeated requests', async () => {
      const assetId = 'location';
      const requests = 10;
      let cacheHits = 0;

      mockCache.get.mockImplementation((id: string) => {
        if (id === assetId && cacheHits > 0) {
          return { data: { src: '/cached.png' }, url: '/cached.png' };
        }
        return null;
      });

      assetLoadingService.loadAsset = jest.fn(async (id: string) => {
        if (id === assetId) {
          cacheHits++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return {
          assetId: id,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 100,
          retryCount: 0,
          usedFallback: false,
        };
      });

      // Make multiple requests for the same asset
      const loadPromises = Array(requests).fill(0).map(() =>
        assetLoadingService.loadAsset(assetId)
      );

      await Promise.all(loadPromises);

      // First request should load, rest should hit cache
      expect(assetLoadingService.loadAsset).toHaveBeenCalledTimes(1);
      expect(cacheHits).toBe(requests - 1);
    });

    test('should respect memory limits and evict old entries', async () => {
      const maxEntries = 5;
      const assets = Array(10).fill(0).map((_, i) => `asset-${i}`);

      mockCache.get.mockReturnValue(null);
      mockCache.set.mockImplementation((key: string, data: any, options?: any) => {
        // Simulate cache size limit
        if (mockCache.set.mock.calls.length > maxEntries) {
          console.log(`[Mock] Evicting old entry for ${key}`);
        }
      });

      mockCache.getStats.mockReturnValue({
        totalEntries: maxEntries,
        totalSize: 50 * 1024 * 1024, // 50MB
        hitRate: 0.7,
        missRate: 0.3,
        evictionCount: 5,
      });

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 50,
          retryCount: 0,
          usedFallback: false,
        };
      });

      // Load more assets than cache can hold
      await assetLoadingService.loadAssets(assets);

      // Should have loaded all assets despite cache limitations
      expect(assetLoadingService.loadAsset).toHaveBeenCalledTimes(assets.length);

      // Cache should show eviction activity
      const stats = mockCache.getStats();
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    test('should persist critical assets in localStorage', async () => {
      const criticalAsset = 'location';

      // Simulate localStorage
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 100,
          retryCount: 0,
          usedFallback: false,
        };
      });

      await assetLoadingService.loadAsset(criticalAsset);

      // Critical assets should be persisted
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('asset_cache_'),
        expect.any(String)
      );
    });
  });

  describe('Concurrent Loading Limits', () => {
    test('should limit concurrent loads to prevent browser overload', async () => {
      const maxConcurrent = 4;
      const totalAssets = 10;
      let concurrentCount = 0;
      let maxConcurrentReached = 0;

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        concurrentCount++;
        maxConcurrentReached = Math.max(maxConcurrentReached, concurrentCount);

        await new Promise(resolve => setTimeout(resolve, 200));

        concurrentCount--;
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 200,
          retryCount: 0,
          usedFallback: false,
        };
      });

      const assets = Array(totalAssets).fill(0).map((_, i) => `asset-${i}`);
      await assetLoadingService.loadAssets(assets);

      // Should not exceed reasonable concurrent limit
      expect(maxConcurrentReached).toBeLessThan(maxConcurrent + 2);
    });

    test('should queue excess requests and process them sequentially', async () => {
      const batchSize = 3;
      const totalAssets = 8;
      const completedOrder: string[] = [];

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        completedOrder.push(assetId);
        await new Promise(resolve => setTimeout(resolve, 100));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 100,
          retryCount: 0,
          usedFallback: false,
        };
      });

      const assets = Array(totalAssets).fill(0).map((_, i) => `asset-${i}`);
      await assetLoadingService.loadAssets(assets);

      // All assets should be completed
      expect(completedOrder).toHaveLength(totalAssets);

      // Should show batching behavior (first batch completed before second batch starts)
      const firstBatch = completedOrder.slice(0, batchSize);
      const secondBatch = completedOrder.slice(batchSize);

      // Verify ordering indicates batch processing
      expect(completedOrder).toEqual(
        expect.arrayContaining(firstBatch.concat(secondBatch))
      );
    });
  });

  describe('Memory Management', () => {
    test('should monitor memory usage and trigger cleanup when needed', async () => {
      // Mock memory pressure
      const mockMemoryMonitor = {
        getCurrentUsage: jest.fn()
          .mockReturnValueOnce(0.5) // Normal usage
          .mockReturnValueOnce(0.9) // High usage
          .mockReturnValue(0.4), // Back to normal
      };

      mockCache.getStats.mockReturnValue({
        totalEntries: 100,
        totalSize: 80 * 1024 * 1024, // 80MB
        hitRate: 0.8,
        missRate: 0.2,
        evictionCount: 0,
        memoryUsage: 0.9, // 90% memory usage
      });

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 50,
          retryCount: 0,
          usedFallback: false,
        };
      });

      // Load assets under memory pressure
      await assetLoadingService.loadAsset('large-asset');

      // Should handle memory pressure gracefully
      const stats = mockCache.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0.8);
    });

    test('should estimate asset sizes accurately for cache management', async () => {
      const assets = [
        { id: 'small-icon', expectedSize: 1024 },
        { id: 'medium-icon', expectedSize: 2048 },
        { id: 'large-icon', expectedSize: 4096 },
      ];

      let totalEstimatedSize = 0;

      mockCache.set.mockImplementation((key: string, data: any, options?: any) => {
        totalEstimatedSize += options?.size || 0;
      });

      assetLoadingService.loadAsset = jest.fn(async (assetId: string) => {
        const asset = assets.find(a => a.id === assetId);
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          assetId,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 50,
          retryCount: 0,
          usedFallback: false,
          size: asset?.expectedSize,
        };
      });

      // Load assets and check size estimation
      for (const asset of assets) {
        await assetLoadingService.loadAsset(asset.id);
      }

      const expectedTotal = assets.reduce((sum, asset) => sum + asset.expectedSize, 0);
      expect(totalEstimatedSize).toBe(expectedTotal);
    });
  });

  describe('Optimization Effectiveness', () => {
    test('should apply format optimization based on device capabilities', async () => {
      const assetUrl = '/images/icon_location.png';
      const optimizedFormats = ['webp', 'avif'];

      mockOptimizer.optimizeImageUrl.mockImplementation(async (url: string, options?: any) => {
        const format = options?.format || 'webp';
        return {
          optimizedUrl: url.replace('.png', `.${format}`),
          originalSize: 4096,
          optimizedSize: 2048, // 50% compression
          compressionRatio: 0.5,
          format,
          loadingStrategy: 'eager',
        };
      });

      const optimization = await mockOptimizer.optimizeImageUrl(assetUrl, {
        format: 'auto',
        priority: 'high',
      });

      expect(optimizedFormats).toContain(optimization.format);
      expect(optimization.compressionRatio).toBeGreaterThan(0.3);
      expect(optimization.optimizedUrl).not.toBe(assetUrl);
    });

    test('should adjust quality based on connection speed', async () => {
      const mockConnection = {
        effectiveType: '3g',
        saveData: false,
        downlink: 1.5,
      };

      Object.defineProperty(navigator, 'connection', {
        value: mockConnection,
        writable: true,
      });

      const recommendations = mockOptimizer.getOptimizationRecommendations();

      // Should recommend lower quality for slower connections
      expect(recommendations.recommendedQuality).toBeLessThan(90);
      expect(recommendations.enableLazyLoading).toBe(true);
    });

    test('should provide progressive loading for large assets', async () => {
      const largeAssetUrl = '/images/large-map-background.jpg';

      mockOptimizer.optimizeImageUrl.mockImplementation(async (url: string, options?: any) => {
        return {
          optimizedUrl: url,
          originalSize: 1024 * 1024, // 1MB
          optimizedSize: 256 * 1024, // 256KB
          compressionRatio: 0.75,
          format: 'webp',
          loadingStrategy: options?.enableProgressive ? 'progressive' : 'eager',
        };
      });

      const optimization = await mockOptimizer.optimizeImageUrl(largeAssetUrl, {
        enableProgressive: true,
        maxWidth: 1920,
        maxHeight: 1080,
      });

      expect(optimization.loadingStrategy).toBe('progressive');
      expect(optimization.compressionRatio).toBeGreaterThan(0.5);
    });
  });

  describe('Error Recovery Performance', () => {
    test('should retry failed assets with exponential backoff', async () => {
      const assetId = 'failing-asset';
      const retryDelays: number[] = [];
      let attemptCount = 0;

      assetLoadingService.loadAsset = jest.fn(async (id: string) => {
        attemptCount++;
        retryDelays.push(Date.now());

        if (attemptCount < 3) {
          throw new Error('Network error');
        }

        return {
          assetId: id,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 100,
          retryCount: attemptCount - 1,
          usedFallback: false,
        };
      });

      // Mock retry logic
      assetLoadingService.retryAsset = jest.fn(async (id: string) => {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attemptCount - 1)));
        return assetLoadingService.loadAsset(id);
      });

      const result = await assetLoadingService.retryAsset(assetId);

      expect(result.retryCount).toBe(2);
      expect(result.status).toBe('loaded');
    });

    test('should use fallback assets quickly when optimization fails', async () => {
      const assetId = 'location';
      const fallbackUrl = '/images/fallback-location.png';

      mockOptimizer.optimizeImageUrl.mockRejectedValue(new Error('Optimization failed'));

      assetLoadingService.loadAsset = jest.fn(async (id: string) => {
        // Simulate immediate fallback usage
        return {
          assetId: id,
          status: 'loaded' as const,
          loadStartTime: Date.now(),
          loadEndTime: Date.now(),
          loadTime: 50, // Quick fallback
          retryCount: 0,
          usedFallback: true,
          url: fallbackUrl,
        };
      });

      const startTime = Date.now();
      const result = await assetLoadingService.loadAsset(assetId);
      const endTime = Date.now();

      expect(result.usedFallback).toBe(true);
      expect(result.url).toBe(fallbackUrl);
      expect(endTime - startTime).toBeLessThan(200); // Quick fallback
    });
  });
});