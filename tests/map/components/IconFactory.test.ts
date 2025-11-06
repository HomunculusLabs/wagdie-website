/**
 * Unit tests for IconFactory
 * T008: Write unit tests for IconFactory
 *
 * Test Coverage:
 * - Icon creation for all marker types
 * - Caching behavior (memoization)
 * - Mobile/desktop responsive sizing
 * - Cache management (clear, preload)
 * - Error handling for invalid types
 */

import IconFactoryImpl, { getIconFactory } from '@/components/map/IconFactory';
import type { IconType } from '@/specs/008-map-refactor/contracts/icon-factory';

describe('IconFactory', () => {
  let factory: IconFactoryImpl;

  beforeEach(() => {
    // Create a fresh instance for each test
    const mockConfigs = new Map<IconType, any>([
      [
        'location',
        {
          baseSize: [32, 32],
          iconUrl: '/images/map-icons/icon_location.png',
          mobileScale: 1.5,
          minTouchSize: 44,
        },
      ],
      [
        'character',
        {
          baseSize: [24, 24],
          iconUrl: '/images/map-icons/icon_character.png',
          mobileScale: 1.5,
          minTouchSize: 44,
        },
      ],
    ]);

    factory = new IconFactoryImpl(mockConfigs);
  });

  describe('createIcon', () => {
    it('should create icon for location marker type', () => {
      const icon = factory.createIcon('location', false);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/map-icons/icon_location.png');
      expect(icon.options.iconSize).toEqual([32, 32]);
    });

    it('should create icon for character marker type', () => {
      const icon = factory.createIcon('character', false);

      expect(icon).toBeDefined();
      expect(icon.options.iconUrl).toBe('/images/map-icons/icon_character.png');
      expect(icon.options.iconSize).toEqual([24, 24]);
    });

    it('should create larger icons for mobile (responsive sizing)', () => {
      const desktopIcon = factory.createIcon('location', false);
      const mobileIcon = factory.createIcon('location', true);

      // Mobile icon should be larger due to scaling
      expect(mobileIcon.options.iconSize[0]).toBeGreaterThan(desktopIcon.options.iconSize[0]);
      expect(mobileIcon.options.iconSize[1]).toBeGreaterThan(desktopIcon.options.iconSize[1]);
    });

    it('should respect minimum touch size on mobile', () => {
      const icon = factory.createIcon('character', true);

      // Character icon base size is 24x24, mobile scale 1.5 = 36x36
      // But minTouchSize is 44, so it should be 44x44
      expect(icon.options.iconSize[0]).toBe(44);
      expect(icon.options.iconSize[1]).toBe(44);
    });

    it('should throw error for invalid marker type', () => {
      expect(() => {
        factory.createIcon('invalid' as IconType, false);
      }).toThrow('No icon configuration found for type: invalid');
    });
  });

  describe('caching behavior', () => {
    it('should cache icons to prevent recreation', () => {
      const icon1 = factory.createIcon('location', false);
      const icon2 = factory.createIcon('location', false);

      // Same instance should be returned
      expect(icon1).toBe(icon2);
    });

    it('should have separate cache for mobile and desktop', () => {
      const mobileIcon = factory.createIcon('location', true);
      const desktopIcon = factory.createIcon('location', false);

      // Different instances for mobile vs desktop
      expect(mobileIcon).not.toBe(desktopIcon);
    });

    it('should return cached icon on subsequent calls', () => {
      const initialCacheSize = factory.getCacheSize();

      factory.createIcon('location', false);
      factory.createIcon('character', false);

      const newCacheSize = factory.getCacheSize();

      expect(newCacheSize).toBe(initialCacheSize + 2);
    });
  });

  describe('cache management', () => {
    it('should clear cache when requested', () => {
      factory.createIcon('location', false);
      factory.createIcon('character', false);

      expect(factory.getCacheSize()).toBeGreaterThan(0);

      factory.clearCache();

      expect(factory.getCacheSize()).toBe(0);
    });

    it('should preload icons for all configured types', () => {
      const cacheSizeBefore = factory.getCacheSize();

      factory.preloadIcons();

      const cacheSizeAfter = factory.getCacheSize();

      // Should preload both mobile and desktop versions for each type
      // With 2 types in our mock config, we expect 4 icons (2 types × 2 sizes)
      expect(cacheSizeAfter).toBe(cacheSizeBefore + 4);
    });
  });

  describe('getCacheSize', () => {
    it('should return 0 for new factory instance', () => {
      expect(factory.getCacheSize()).toBe(0);
    });

    it('should return correct cache size after creating icons', () => {
      factory.createIcon('location', false);
      factory.createIcon('location', true);
      factory.createIcon('character', false);

      expect(factory.getCacheSize()).toBe(3);
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance when called multiple times', () => {
      const instance1 = getIconFactory();
      const instance2 = getIconFactory();

      expect(instance1).toBe(instance2);
    });

    it('should preload icons on singleton creation', () => {
      // Clear the singleton first
      // @ts-ignore - accessing private for testing
      const anyFactory = getIconFactory() as any;
      anyFactory.clearCache();

      const cacheSize = anyFactory.getCacheSize();

      // Should preload icons
      expect(cacheSize).toBeGreaterThan(0);
    });
  });
});
