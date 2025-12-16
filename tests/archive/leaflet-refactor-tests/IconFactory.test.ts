/**
 * IconFactory Unit Tests
 *
 * Tests for the enhanced IconFactory with progressive loading
 * and fallback mechanisms.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock the Leaflet library since we're testing the factory logic
jest.mock('leaflet', () => ({
  icon: jest.fn().mockImplementation((options) => ({
    _url: options.iconUrl,
    options
  }))
}));

// Mock the asset loading service
jest.mock('@/lib/services/asset-loading-service', () => ({
  getAssetLoadingService: jest.fn(() => ({
    loadAsset: jest.fn(),
    getAssetState: jest.fn(),
    preloadCriticalAssets: jest.fn(),
    getPerformanceMetrics: jest.fn(() => ({}))
  }))
}));

describe('IconFactory', () => {
  // Import after mocking
  const { getIconFactory } = require('@/components/map/IconFactory');
  const { getAssetLoadingService } = require('@/lib/services/asset-loading-service');

  let iconFactory: any;
  let mockLoadingService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get fresh instances
    iconFactory = getIconFactory();
    mockLoadingService = getAssetLoadingService();
  });

  afterEach(() => {
    // Clean up after each test
    if (iconFactory) {
      iconFactory.clearCache();
    }
  });

  describe('Icon Creation', () => {
    it('should create location icon for desktop', () => {
      const icon = iconFactory.createIcon('location', false);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/mapicons/icon_location.png');
      expect(icon.options.iconSize).toEqual([32, 32]);
      expect(icon.options.className).toContain('location');
    });

    it('should create location icon for mobile with scaling', () => {
      const icon = iconFactory.createIcon('location', true);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/mapicons/icon_location.png');
      expect(icon.options.iconSize[0]).toBeGreaterThanOrEqual(44); // min touch size
      expect(icon.options.iconSize[1]).toBeGreaterThanOrEqual(44);
    });

    it('should create burn icon with correct configuration', () => {
      const icon = iconFactory.createIcon('burn', false);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/mapicons/icon_burn.png');
      expect(icon.options.iconSize).toEqual([28, 28]);
    });

    it('should create character icon with correct size', () => {
      const icon = iconFactory.createIcon('character', false);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/mapicons/icon_youarehere.png');
      expect(icon.options.iconSize).toEqual([24, 24]);
    });

    it('should cache icons to prevent recreation', () => {
      const icon1 = iconFactory.createIcon('location', false);
      const icon2 = iconFactory.createIcon('location', false);

      expect(icon1).toBe(icon2); // Should be the same cached instance
    });

    it('should create separate instances for mobile vs desktop', () => {
      const desktopIcon = iconFactory.createIcon('location', false);
      const mobileIcon = iconFactory.createIcon('location', true);

      expect(desktopIcon).not.toBe(mobileIcon); // Should be different instances
      expect(desktopIcon.options.iconSize).not.toEqual(mobileIcon.options.iconSize);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown icon type', () => {
      expect(() => {
        iconFactory.createIcon('unknown' as any, false);
      }).toThrow('No icon configuration found for type: unknown');
    });

    it('should handle loading service errors gracefully', async () => {
      // Mock loading service to throw error
      mockLoadingService.loadAsset.mockRejectedValue(new Error('Network error'));

      // This should not throw immediately, but handle the error internally
      const icon = iconFactory.createIcon('location', false);
      expect(icon).toBeDefined();

      // Error should be handled asynchronously
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  });

  describe('Asset Loading Integration', () => {
    it('should call loading service when creating icon', () => {
      iconFactory.createIcon('location', false);

      expect(mockLoadingService.loadAsset).toHaveBeenCalledWith('location');
    });

    it('should check loading state before creating icon', () => {
      mockLoadingService.getAssetState.mockReturnValue({
        assetId: 'location',
        status: 'loaded',
        loadStartTime: Date.now(),
        retryCount: 0,
        usedFallback: false
      });

      iconFactory.createIcon('location', false);

      expect(mockLoadingService.getAssetState).toHaveBeenCalledWith('location');
    });

    it('should not call load service if asset is already loaded', () => {
      mockLoadingService.getAssetState.mockReturnValue({
        assetId: 'location',
        status: 'loaded',
        loadStartTime: Date.now(),
        retryCount: 0,
        usedFallback: false
      });

      iconFactory.createIcon('location', false);

      expect(mockLoadingService.loadAsset).not.toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should provide performance metrics', () => {
      const metrics = iconFactory.getIconMetrics();

      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThanOrEqual(0);
    });

    it('should track cache size', () => {
      const initialSize = iconFactory.getCacheSize();

      // Create some icons
      iconFactory.createIcon('location', false);
      iconFactory.createIcon('burn', true);

      const finalSize = iconFactory.getCacheSize();
      expect(finalSize).toBeGreaterThan(initialSize);
    });
  });

  describe('Preloading', () => {
    it('should preload all configured icons', async () => {
      await iconFactory.preloadIcons();

      expect(mockLoadingService.preloadCriticalAssets).toHaveBeenCalled();
    });

    it('should preload both mobile and desktop versions', async () => {
      await iconFactory.preloadIcons();

      // Should call preload for all configured icon types
      expect(mockLoadingService.loadAsset).toHaveBeenCalledWith('location');
      expect(mockLoadingService.loadAsset).toHaveBeenCalledWith('character');
      expect(mockLoadingService.loadAsset).toHaveBeenCalledWith('burn');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', () => {
      // Create some icons to populate cache
      iconFactory.createIcon('location', false);
      iconFactory.createIcon('burn', false);

      expect(iconFactory.getCacheSize()).toBeGreaterThan(0);

      iconFactory.clearCache();

      expect(iconFactory.getCacheSize()).toBe(0);
    });

    it('should limit cache size to prevent memory issues', () => {
      // Create many icons to test cache size limit
      for (let i = 0; i < 150; i++) {
        iconFactory.createIcon('location', false);
        iconFactory.createIcon('burn', true);
      }

      // Cache should not exceed the configured limit (100)
      expect(iconFactory.getCacheSize()).toBeLessThanOrEqual(100);
    });
  });

  describe('Retry Logic', () => {
    it('should support retrying failed icon loads', async () => {
      await iconFactory.retryIconLoad('location');

      expect(mockLoadingService.retryAsset).toHaveBeenCalledWith('location');
    });

    it('should handle retry failures gracefully', async () => {
      mockLoadingService.retryAsset.mockRejectedValue(new Error('Retry failed'));

      await expect(iconFactory.retryIconLoad('location')).rejects.toThrow('Retry failed');
    });
  });

  describe('Icon Configuration', () => {
    it('should use correct paths for flat asset structure', () => {
      const locationIcon = iconFactory.createIcon('location', false);
      const burnIcon = iconFactory.createIcon('burn', false);

      expect(locationIcon.options.iconUrl).toBe('/images/mapicons/icon_location.png');
      expect(burnIcon.options.iconUrl).toBe('/images/mapicons/icon_burn.png');
    });

    it('should maintain backward compatibility with existing icon types', () => {
      const iconTypes = ['location', 'character', 'burn', 'death', 'fight'];

      iconTypes.forEach(type => {
        const icon = iconFactory.createIcon(type, false);
        expect(icon).toBeDefined();
        expect(icon.options.iconUrl).toContain(`icon_${type}`);
      });
    });
  });
});