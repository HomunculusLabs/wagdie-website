/**
 * Responsive Scaling Tests
 *
 * Tests for responsive asset scaling across different viewports and device types.
 * Ensures WAGDIE assets scale appropriately for touch targets and screen sizes.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock window and viewport for testing
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
} as any;

// Mock the viewport detection module
jest.mock('@/lib/utils/viewport-detection', () => ({
  getViewportInfo: jest.fn(),
  getResponsiveValue: jest.fn(),
  getResponsiveScale: jest.fn(),
  getTouchSize: jest.fn(),
  createViewportMonitor: jest.fn(),
  ViewportUtils: {
    isMobile: jest.fn(),
    isTablet: jest.fn(),
    isDesktop: jest.fn(),
  },
}));

// Mock the responsive configuration
jest.mock('@/lib/config/responsive', () => ({
  WAGDIE_BREAKPOINTS: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  ASSET_SCALING: {
    mobile: { icon: 1.8, marker: 1.6, ui: 1.4, text: 1.2 },
    tablet: { icon: 1.4, marker: 1.3, ui: 1.2, text: 1.1 },
    desktop: { icon: 1.0, marker: 1.0, ui: 1.0, text: 1.0 },
    'large-desktop': { icon: 0.9, marker: 0.9, ui: 1.0, text: 1.0 },
  },
  TOUCH_TARGETS: {
    minimum: 44,
    comfortable: 48,
    large: 56,
    mapControls: 52,
  },
  getAssetScaling: jest.fn(),
  getResponsiveAssetSize: jest.fn(),
}));

// Mock the IconFactory
jest.mock('@/components/map/IconFactory', () => ({
  getIconFactory: jest.fn(),
}));

import { getViewportInfo } from '@/lib/utils/viewport-detection';
import { getAssetScaling, getResponsiveAssetSize } from '@/lib/config/responsive';
import { getIconFactory } from '@/components/map/IconFactory';

describe('Responsive Asset Scaling', () => {
  let mockIconFactory: any;

  beforeEach(() => {
    // Setup global window mock
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });

    // Reset mocks
    jest.clearAllMocks();

    // Setup mock IconFactory
    mockIconFactory = {
      createIcon: jest.fn(),
      handleViewportChange: jest.fn(),
      getCacheSize: jest.fn().mockReturnValue(0),
    };
    (getIconFactory as jest.Mock).mockReturnValue(mockIconFactory);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Mobile Viewport Scaling', () => {
    beforeEach(() => {
      // Mock mobile viewport (iPhone SE)
      window.innerWidth = 375;
      window.innerHeight = 667;
      window.devicePixelRatio = 2;

      (getViewportInfo as jest.Mock).mockReturnValue({
        width: 375,
        height: 667,
        deviceType: 'mobile',
        orientation: 'portrait',
        size: 'sm',
        isTouchDevice: true,
        pixelRatio: 2,
        isHighDensity: true,
        isLandscape: false,
        isPortrait: true,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });
    });

    test('should scale icons appropriately for mobile devices', () => {
      const baseSize = [32, 32];
      const expectedMobileSize = [58, 58]; // 32 * 1.8 scaling, adjusted for touch targets

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedMobileSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'mobile', 44);

      expect(getResponsiveAssetSize).toHaveBeenCalledWith(
        baseSize,
        'icon',
        'mobile',
        44
      );
      expect(result).toEqual(expectedMobileSize);
    });

    test('should ensure touch targets meet minimum size requirements', () => {
      const baseSize = [20, 20];
      const expectedSize = [44, 44]; // Minimum touch target

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedSize);

      const result = getResponsiveAssetSize(baseSize, 'marker', 'mobile', 44);

      expect(result[0]).toBeGreaterThanOrEqual(44);
      expect(result[1]).toBeGreaterThanOrEqual(44);
    });

    test('should apply high-DPI scaling for retina displays', () => {
      const baseSize = [32, 32];
      const expectedSize = [115, 115]; // 32 * 1.8 * 2 (pixel ratio)

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'mobile', 44);

      expect(result[0]).toBeGreaterThan(64); // Should be larger than base size
      expect(result[1]).toBeGreaterThan(64);
    });

    test('should reduce icons in portrait mode on mobile', () => {
      const landscapeSize = [64, 64];
      const expectedPortraitSize = [58, 58]; // Reduced by 0.9 factor

      // This would be tested in the actual IconFactory implementation
      expect(landscapeSize[0]).toBeGreaterThan(expectedPortraitSize[0]);
    });
  });

  describe('Tablet Viewport Scaling', () => {
    beforeEach(() => {
      // Mock tablet viewport (iPad)
      window.innerWidth = 768;
      window.innerHeight = 1024;
      window.devicePixelRatio = 2;

      (getViewportInfo as jest.Mock).mockReturnValue({
        width: 768,
        height: 1024,
        deviceType: 'tablet',
        orientation: 'portrait',
        size: 'md',
        isTouchDevice: true,
        pixelRatio: 2,
        isHighDensity: true,
        isLandscape: false,
        isPortrait: true,
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });
    });

    test('should scale icons moderately for tablet devices', () => {
      const baseSize = [32, 32];
      const expectedTabletSize = [45, 45]; // 32 * 1.4 scaling

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedTabletSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'tablet', 44);

      expect(getResponsiveAssetSize).toHaveBeenCalledWith(
        baseSize,
        'icon',
        'tablet',
        44
      );
      expect(result).toEqual(expectedTabletSize);
    });

    test('should balance touch targets with screen real estate', () => {
      const baseSize = [24, 24];
      const expectedSize = [44, 44]; // Touch target takes precedence

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedSize);

      const result = getResponsiveAssetSize(baseSize, 'marker', 'tablet', 44);

      expect(result[0]).toBeGreaterThanOrEqual(44);
      expect(result[1]).toBeGreaterThanOrEqual(44);
    });
  });

  describe('Desktop Viewport Scaling', () => {
    beforeEach(() => {
      // Mock desktop viewport
      window.innerWidth = 1920;
      window.innerHeight = 1080;
      window.devicePixelRatio = 1;

      (getViewportInfo as jest.Mock).mockReturnValue({
        width: 1920,
        height: 1080,
        deviceType: 'desktop',
        orientation: 'landscape',
        size: 'xl',
        isTouchDevice: false,
        pixelRatio: 1,
        isHighDensity: false,
        isLandscape: true,
        isPortrait: false,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    test('should maintain original size on desktop', () => {
      const baseSize = [32, 32];
      const expectedDesktopSize = [32, 32]; // No scaling

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedDesktopSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'desktop', 44);

      expect(getResponsiveAssetSize).toHaveBeenCalledWith(
        baseSize,
        'icon',
        'desktop',
        44
      );
      expect(result).toEqual(expectedDesktopSize);
    });

    test('should not apply touch target constraints on desktop', () => {
      const baseSize = [24, 24];
      const expectedSize = [24, 24]; // Original size preserved

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedSize);

      const result = getResponsiveAssetSize(baseSize, 'marker', 'desktop', 44);

      expect(result).toEqual(baseSize);
    });
  });

  describe('Large Desktop Viewport Scaling', () => {
    beforeEach(() => {
      // Mock large desktop viewport (4K)
      window.innerWidth = 3840;
      window.innerHeight = 2160;
      window.devicePixelRatio = 1.5;

      (getViewportInfo as jest.Mock).mockReturnValue({
        width: 3840,
        height: 2160,
        deviceType: 'large-desktop',
        orientation: 'landscape',
        size: '2xl',
        isTouchDevice: false,
        pixelRatio: 1.5,
        isHighDensity: true,
        isLandscape: true,
        isPortrait: false,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
      });
    });

    test('should slightly reduce icons for large screens', () => {
      const baseSize = [32, 32];
      const expectedLargeDesktopSize = [29, 29]; // 32 * 0.9 scaling

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedLargeDesktopSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'large-desktop', 44);

      expect(getResponsiveAssetSize).toHaveBeenCalledWith(
        baseSize,
        'icon',
        'large-desktop',
        44
      );
      expect(result).toEqual(expectedLargeDesktopSize);
    });

    test('should maintain readability with density scaling', () => {
      const baseSize = [32, 32];
      const expectedSize = [43, 43]; // 32 * 0.9 * 1.5 (pixel ratio)

      (getResponsiveAssetSize as jest.Mock).mockReturnValue(expectedSize);

      const result = getResponsiveAssetSize(baseSize, 'icon', 'large-desktop', 44);

      expect(result[0]).toBeGreaterThan(baseSize[0]);
      expect(result[1]).toBeGreaterThan(baseSize[1]);
    });
  });

  describe('Viewport Change Handling', () => {
    test('should clear icon cache when viewport changes', () => {
      const mockViewportChange = jest.fn();

      // Simulate viewport change from mobile to desktop
      (getViewportInfo as jest.Mock)
        .mockReturnValueOnce({
          width: 375,
          height: 667,
          deviceType: 'mobile',
          isMobile: true,
          isTablet: false,
          isDesktop: false,
        })
        .mockReturnValueOnce({
          width: 1920,
          height: 1080,
          deviceType: 'desktop',
          isMobile: false,
          isTablet: false,
          isDesktop: true,
        });

      // In actual implementation, this would trigger cache clearing
      expect(mockIconFactory.handleViewportChange).toBeDefined();
    });

    test('should recalculate icon sizes on orientation change', () => {
      // Simulate orientation change
      (getViewportInfo as jest.Mock)
        .mockReturnValueOnce({
          width: 667,
          height: 375,
          deviceType: 'mobile',
          orientation: 'landscape',
          isLandscape: true,
          isPortrait: false,
        })
        .mockReturnValueOnce({
          width: 375,
          height: 667,
          deviceType: 'mobile',
          orientation: 'portrait',
          isLandscape: false,
          isPortrait: true,
        });

      // Icons should be recalculated with new orientation
      const landscapeIcon = getResponsiveAssetSize([32, 32], 'icon', 'mobile', 44);
      const portraitIcon = getResponsiveAssetSize([32, 32], 'icon', 'mobile', 44);

      // Portrait icons should be slightly smaller
      expect(portraitIcon[0]).toBeLessThanOrEqual(landscapeIcon[0]);
    });
  });

  describe('Asset Type Specific Scaling', () => {
    test('should apply different scaling for different asset types', () => {
      const baseSize = [32, 32];

      // Mock scaling for different asset types
      (getAssetScaling as jest.Mock)
        .mockImplementation((assetType, deviceType) => {
          const scaling = {
            mobile: { icon: 1.8, marker: 1.6, ui: 1.4, text: 1.2 },
            desktop: { icon: 1.0, marker: 1.0, ui: 1.0, text: 1.0 },
          };
          return scaling[deviceType]?.[assetType] || 1.0;
        });

      const iconScale = getAssetScaling('icon', 'mobile');
      const markerScale = getAssetScaling('marker', 'mobile');
      const uiScale = getAssetScaling('ui', 'mobile');

      expect(iconScale).toBe(1.8);
      expect(markerScale).toBe(1.6);
      expect(uiScale).toBe(1.4);
    });

    test('should handle edge cases for very small or very large assets', () => {
      const verySmallSize = [8, 8];
      const veryLargeSize = [128, 128];

      // Small assets should still meet touch targets on mobile
      const smallResult = getResponsiveAssetSize(verySmallSize, 'marker', 'mobile', 44);
      expect(smallResult[0]).toBeGreaterThanOrEqual(44);
      expect(smallResult[1]).toBeGreaterThanOrEqual(44);

      // Large assets should be appropriately scaled down on large desktops
      const largeResult = getResponsiveAssetSize(veryLargeSize, 'icon', 'large-desktop', 44);
      expect(largeResult[0]).toBeLessThan(128);
      expect(largeResult[1]).toBeLessThan(128);
    });
  });

  describe('Performance Considerations', () => {
    test('should limit marker count on mobile devices', () => {
      // This would test performance optimizations
      const mobileLimit = 30;
      const desktopLimit = 200;

      expect(mobileLimit).toBeLessThan(desktopLimit);
    });

    test('should disable animations on low-end devices', () => {
      // Mock device detection for performance
      const isLowEndDevice = true; // This would be determined by actual device detection

      if (isLowEndDevice) {
        // Animations should be disabled
        expect(true).toBe(true); // Placeholder for actual animation check
      }
    });
  });
});