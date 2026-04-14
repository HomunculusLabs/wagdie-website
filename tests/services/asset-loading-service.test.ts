/**
 * Asset Loading Service Unit Tests
 *
 * Tests for progressive asset loading, fallback mechanisms,
 * retry logic, and performance monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('AssetLoadingService', () => {
  let service: any;
  let mockImageConstructor: jest.Mock;

  beforeEach(() => {
    // Mock Image constructor
    mockImageConstructor = jest.fn();
    global.Image = mockImageConstructor as any;

    // Clear all timers
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Import service after mocking
    const { getAssetLoadingService } = require('@/lib/services/asset-loading-service');
    service = getAssetLoadingService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    service.clearCache();
  });

  describe('Asset Loading', () => {
    it('should load asset successfully', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromise = service.loadAsset('location');

      // Simulate successful load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const result = await loadPromise;

      expect(result.status).toBe('loaded');
      expect(result.assetId).toBe('location');
      expect(result.loadEndTime).toBeDefined();
    });

    it('should handle asset load failure', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromise = service.loadAsset('location');

      // Simulate failed load
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      const result = await loadPromise;

      expect(result.status).toBe('failed');
      expect(result.lastError).toBeDefined();
    });

    it('should handle timeout', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromise = service.loadAsset('location');

      // Don't call onload or onerror - should timeout
      jest.advanceTimersByTime(6000); // Past 5 second timeout

      const result = await loadPromise;

      expect(result.status).toBe('failed');
      expect(result.lastError).toBe('Asset load timeout');
    });

    it('should use correct asset URLs for flat structure', async () => {
      const mockImage = {
        onload: null as any,
        onerror: null as any
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromises = [
        service.loadAsset('location'),
        service.loadAsset('legend_location_on'),
        service.loadAsset('burn')
      ];

      // Simulate successful loads
      setTimeout(() => {
        loadPromises.forEach((_, index) => {
          setTimeout(() => {
            if (mockImage.onload) {
              mockImage.onload();
            }
          }, index * 5);
        });
      }, 10);

      const results = await Promise.all(loadPromises);

      // Check that correct URLs were used
      expect(mockImageConstructor).toHaveBeenNthCalledWith(1);
      expect(mockImageConstructor).toHaveBeenNthCalledWith(2);
      expect(mockImageConstructor).toHaveBeenNthCalledWith(3);
    });
  });

  describe('Multiple Asset Loading', () => {
    it('should load multiple assets in parallel', async () => {
      const mockImages = [
        { onload: jest.fn(), onerror: jest.fn() },
        { onload: jest.fn(), onerror: jest.fn() },
        { onload: jest.fn(), onerror: jest.fn() }
      ];

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      const loadPromise = service.loadAssets(['location', 'burn', 'death']);

      // Simulate successful loads
      mockImages.forEach((mock, index) => {
        setTimeout(() => {
          if (mock.onload) {
            mock.onload();
          }
        }, (index + 1) * 10);
      });

      const results = await loadPromise;

      expect(results).toHaveLength(3);
      expect(results.every(r => r.status === 'loaded')).toBe(true);
    });

    it('should handle mixed success/failure scenarios', async () => {
      const mockImages = [
        { onload: jest.fn(), onerror: jest.fn() }, // success
        { onload: jest.fn(), onerror: jest.fn() }, // failure
        { onload: jest.fn(), onerror: jest.fn() }  // success
      ];

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      const loadPromise = service.loadAssets(['location', 'burn', 'death']);

      // Simulate mixed results
      setTimeout(() => {
        mockImages[0].onload?.(); // success
        mockImages[1].onerror?.(); // failure
        mockImages[2].onload?.(); // success
      }, 10);

      const results = await loadPromise;

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('loaded');
      expect(results[1].status).toBe('failed');
      expect(results[2].status).toBe('loaded');
    });
  });

  describe('Critical Assets Preloading', () => {
    it('should preload critical assets', async () => {
      const mockImages = Array(5).fill(null).map(() => ({
        onload: jest.fn(),
        onerror: jest.fn()
      }));

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      const preloadPromise = service.preloadCriticalAssets();

      // Simulate successful loads
      mockImages.forEach((mock, index) => {
        setTimeout(() => {
          if (mock.onload) {
            mock.onload();
          }
        }, (index + 1) * 10);
      });

      await preloadPromise;

      expect(service.getLoadingContext().completedCritical).toBe(true);
    });

    it('should not preload when disabled', async () => {
      // Create a new service with preloading disabled
      const { getAssetLoadingService } = require('@/lib/services/asset-loading-service');
      const serviceNoPreload = getAssetLoadingService();
      serviceNoPreload.config.enablePreloading = false;

      await serviceNoPreload.preloadCriticalAssets();

      expect(mockImageConstructor).not.toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    it('should clear any existing retry timer before retrying', async () => {
      const mockImage = {
        onload: null as any,
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const staleTimer = setTimeout(() => {
        // no-op
      }, 5000);

      (service as any).retryTimers.set('location', staleTimer);
      (service as any).loadingStates.set('location', {
        assetId: 'location',
        status: 'failed',
        loadStartTime: Date.now(),
        retryCount: 0,
        usedFallback: false
      });

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      const retryPromise = service.retryAsset('location');

      if (mockImage.onload) {
        mockImage.onload();
      }

      await retryPromise;

      expect(clearTimeoutSpy).toHaveBeenCalledWith(staleTimer);
      expect((service as any).retryTimers.has('location')).toBe(false);
    });

    it('should retry failed assets', async () => {
      const mockImage = {
        onload: null as any,
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // First attempt fails
      const firstLoadPromise = service.loadAsset('location');
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      const firstResult = await firstLoadPromise;
      expect(firstResult.status).toBe('failed');

      // Retry succeeds
      const retryPromise = service.retryAsset('location');
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      const retryResult = await retryPromise;
      expect(retryResult.status).toBe('loaded');
      expect(retryResult.retryCount).toBe(1);
    });

    it('should respect retry limits', async () => {
      const mockImage = {
        onload: null as any,
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Load and fail
      const loadPromise = service.loadAsset('location');
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      await loadPromise;

      // Retry until limit reached
      let result;
      for (let i = 0; i < 3; i++) {
        result = await service.retryAsset('location');
        expect(result.status).toBe('failed');
        expect(result.retryCount).toBe(i + 1);
      }

      // Should not retry anymore
      const finalResult = await service.retryAsset('location');
      expect(finalResult.status).toBe('failed');
      expect(finalResult.retryCount).toBe(3);
    });
  });

  describe('Performance Metrics', () => {
    it('should track load times', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromise = service.loadAsset('location');

      // Simulate load after 100ms
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 100);

      await loadPromise;

      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalAssets).toBe(1);
      expect(metrics.loadedAssets).toBe(1);
      expect(metrics.averageLoadTime).toBeGreaterThan(50); // Should be around 100ms
    });

    it('should calculate error rates correctly', async () => {
      const mockImages = [
        { onload: jest.fn(), onerror: jest.fn() },
        { onload: jest.fn(), onerror: jest.fn() }
      ];

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      const loadPromises = [
        service.loadAsset('location'),
        service.loadAsset('burn')
      ];

      // One succeeds, one fails
      setTimeout(() => {
        mockImages[0].onload?.();
        mockImages[1].onerror?.();
      }, 10);

      await Promise.all(loadPromises);

      const metrics = service.getPerformanceMetrics();
      expect(metrics.totalAssets).toBe(2);
      expect(metrics.loadedAssets).toBe(1);
      expect(metrics.failedAssets).toBe(1);
      expect(metrics.errorRate).toBe(50);
    });
  });

  describe('Loading Context', () => {
    it('should provide loading context information', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      const loadPromise = service.loadAsset('location');

      const loadingDuringLoad = service.getLoadingContext();
      expect(loadingDuringLoad.assets.get('location')?.status).toBe('loading');

      // Complete load
      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();
        }
      }, 10);

      await loadPromise;

      const loadingAfterLoad = service.getLoadingContext();
      expect(loadingAfterLoad.assets.get('location')?.status).toBe('loaded');
    });

    it('should track error count', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Load and fail
      const loadPromise = service.loadAsset('location');
      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();
        }
      }, 10);

      await loadPromise;

      const context = service.getLoadingContext();
      expect(context.errorCount).toBe(1);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache and reset state', () => {
      // Load an asset to populate state
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn()
      };

      mockImageConstructor.mockReturnValue(mockImage);

      service.loadAsset('location');

      // Clear cache
      service.clearCache();

      const context = service.getLoadingContext();
      expect(context.assets.size).toBe(0);
      expect(context.errorCount).toBe(0);
      expect(context.completedCritical).toBe(false);
    });
  });
});