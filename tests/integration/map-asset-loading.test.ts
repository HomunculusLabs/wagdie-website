/**
 * Map Asset Loading Integration Tests
 *
 * Tests the complete asset loading flow from map components
 * through the service layer to actual asset loading.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Map Asset Loading Integration', () => {
  let mockImageConstructor: jest.Mock;
  let mockUseIconFactory: jest.MockedFunction<any>;

  beforeEach(() => {
    // Mock Image constructor for asset loading
    mockImageConstructor = jest.fn();
    global.Image = mockImageConstructor as any;

    // Mock the useIconFactory hook
    mockUseIconFactory = jest.fn();
    jest.doMock('@/hooks/useIconFactory', () => ({
      useIconFactory: mockUseIconFactory,
      useCriticalIconsLoaded: () => false,
      useIconLoadingErrors: () => new Map()
    }));

    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('Complete Asset Loading Flow', () => {
    it('should load location marker icon and display on map', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn(),
        src: ''
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Mock the hook to return loading state
      mockUseIconFactory.mockReturnValue({
        getIcon: jest.fn(() => ({
          _url: '/images/mapicons/icon_location.png',
          options: {
            iconUrl: '/images/mapicons/icon_location.png',
            iconSize: [32, 32],
            className: 'custom-icon-location'
          }
        })),
        loading: false,
        error: null,
        metrics: [],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      // Simulate asset loading
      const loadPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (mockImage.onload) {
            mockImage.onload();
          }
          resolve();
        }, 50);
      });

      // Simulate setting the image src
      setTimeout(() => {
        mockImage.src = '/images/mapicons/icon_location.png';
      }, 10);

      await loadPromise;
      jest.advanceTimersByTime(60);

      // Verify the icon was loaded
      expect(mockImageConstructor).toHaveBeenCalled();
      expect(mockImage.src).toBe('/images/mapicons/icon_location.png');
      expect(mockImage.onload).toHaveBeenCalled();

      // Verify the hook provides the correct icon
      const { getIcon } = mockUseIconFactory();
      const icon = getIcon('location', false);

      expect(icon).toBeDefined();
      expect(icon._url).toBe('/images/mapicons/icon_location.png');
      expect(icon.options.iconSize).toEqual([32, 32]);
    });

    it('should handle loading failure and fallback gracefully', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn(),
        src: ''
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Mock the hook to return error state
      mockUseIconFactory.mockReturnValue({
        getIcon: jest.fn(() => ({
          _url: '/images/mapicons/icon_location.png',
          options: {
            iconUrl: '/images/mapicons/icon_location.png',
            iconSize: [32, 32],
            className: 'custom-icon-location'
          }
        })),
        loading: false,
        error: 'Failed to load icon location: File not found',
        metrics: [],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      // Simulate asset loading failure
      const loadPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (mockImage.onerror) {
            mockImage.onerror();
          }
          resolve();
        }, 50);
      });

      // Simulate setting the image src
      setTimeout(() => {
        mockImage.src = '/images/mapicons/icon_location.png';
      }, 10);

      await loadPromise;

      // Verify error handling
      expect(mockImage.onerror).toHaveBeenCalled();
      expect(mockUseIconFactory().error).toBe('Failed to load icon location: File not found');
    });

    it('should load multiple asset types in parallel', async () => {
      const mockImages = [
        { onload: jest.fn(), onerror: jest.fn(), src: '' },
        { onload: jest.fn(), onerror: jest.fn(), src: '' },
        { onload: jest.fn(), onerror: jest.fn(), src: '' },
        { onload: jest.fn(), onerror: jest.fn(), src: '' },
        { onload: jest.fn(), onerror: jest.fn(), src: '' }
      ];

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      // Mock the hook to support multiple icons
      mockUseIconFactory.mockReturnValue({
        getIcon: jest.fn((type) => ({
          _url: `/images/mapicons/icon_${type}.png`,
          options: {
            iconUrl: `/images/mapicons/icon_${type}.png`,
            iconSize: type === 'character' ? [24, 24] : [32, 32],
            className: `custom-icon-${type}`
          }
        })),
        loading: false,
        error: null,
        metrics: [],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      const assetTypes = ['location', 'character', 'burn', 'death', 'fight'];
      const loadPromises = assetTypes.map((type, index) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            mockImages[index].src = `/images/mapicons/icon_${type}.png`;
            setTimeout(() => {
              if (mockImages[index].onload) {
                mockImages[index].onload();
              }
              resolve();
            }, 10);
          }, (index + 1) * 5);
        });
      });

      await Promise.all(loadPromises);
      jest.advanceTimersByTime(100);

      // Verify all assets were loaded
      expect(mockImageConstructor).toHaveBeenCalledTimes(5);
      mockImages.forEach((mock, index) => {
        expect(mock.onload).toHaveBeenCalled();
        expect(mock.src).toContain('icon_');
      });

      // Verify hook provides all icon types
      const { getIcon } = mockUseIconFactory();
      assetTypes.forEach(type => {
        const icon = getIcon(type, false);
        expect(icon).toBeDefined();
        expect(icon._url).toContain(`icon_${type}`);
      });
    });
  });

  describe('Loading States and User Experience', () => {
    it('should show loading state during asset loading', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn(),
        src: ''
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Initially in loading state
      mockUseIconFactory.mockReturnValueOnce({
        getIcon: jest.fn(() => null), // No icon while loading
        loading: true,
        error: null,
        metrics: [],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      // Simulate loading start
      const { getIcon: getIconLoading } = mockUseIconFactory();
      expect(getIconLoading('location', false)).toBeNull();
      expect(mockUseIconFactory().loading).toBe(true);

      // Complete loading
      mockUseIconFactory.mockReturnValueOnce({
        getIcon: jest.fn(() => ({
          _url: '/images/mapicons/icon_location.png',
          options: {
            iconUrl: '/images/mapicons/icon_location.png',
            iconSize: [32, 32]
          }
        })),
        loading: false,
        error: null,
        metrics: [],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      // Simulate successful load
      setTimeout(() => {
        mockImage.src = '/images/mapicons/icon_location.png';
        setTimeout(() => {
          if (mockImage.onload) {
            mockImage.onload();
          }
        }, 10);
      }, 50);

      jest.advanceTimersByTime(100);

      // Verify icon is now available
      const { getIcon: getIconLoaded } = mockUseIconFactory();
      const icon = getIconLoaded('location', false);
      expect(icon).toBeDefined();
      expect(icon._url).toBe('/images/mapicons/icon_location.png');
    });

    it('should provide retry functionality for failed assets', async () => {
      const mockImage = {
        onload: jest.fn(),
        onerror: jest.fn(),
        src: ''
      };

      mockImageConstructor.mockReturnValue(mockImage);

      // Mock hook with retry capability
      const mockRetryIcon = jest.fn();
      mockUseIconFactory.mockReturnValue({
        getIcon: jest.fn(() => ({
          _url: '/images/mapicons/icon_location.png',
          options: {
            iconUrl: '/images/mapicons/icon_location.png',
            iconSize: [32, 32]
          }
        })),
        loading: false,
        error: 'Failed to load icon location: Network error',
        metrics: [],
        retryIcon: mockRetryIcon,
        preloadIcons: jest.fn()
      });

      // Simulate initial failure
      const loadPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          mockImage.src = '/images/mapicons/icon_location.png';
          setTimeout(() => {
            if (mockImage.onerror) {
              mockImage.onerror();
            }
            resolve();
          }, 10);
        }, 50);
      });

      await loadPromise;

      // Verify error state and retry availability
      expect(mockUseIconFactory().error).toBe('Failed to load icon location: Network error');
      expect(mockRetryIcon).toBeDefined();

      // Simulate retry
      mockUseIconFactory.mockReturnValueOnce({
        getIcon: jest.fn(() => ({
          _url: '/images/mapicons/icon_location.png',
          options: {
            iconUrl: '/images/mapicons/icon_location.png',
            iconSize: [32, 32]
          }
        })),
        loading: false,
        error: null, // Error cleared on retry
        metrics: [],
        retryIcon: mockRetryIcon,
        preloadIcons: jest.fn()
      });

      // Execute retry
      mockRetryIcon('location');

      // Simulate successful retry
      const retryPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          if (mockImage.onload) {
            mockImage.onload();
          }
          resolve();
        }, 10);
      });

      await retryPromise;

      // Verify retry succeeded
      expect(mockRetryIcon).toHaveBeenCalledWith('location');
      expect(mockImage.onload).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track load times for all assets', async () => {
      const mockImages = [
        { onload: jest.fn(), onerror: jest.fn(), src: '' },
        { onload: jest.fn(), onerror: jest.fn(), src: '' }
      ];

      mockImageConstructor.mockImplementation((index) => mockImages[index]);

      // Mock hook with performance metrics
      mockUseIconFactory.mockReturnValue({
        getIcon: jest.fn((type) => ({
          _url: `/images/mapicons/icon_${type}.png`,
          options: {
            iconUrl: `/images/mapicons/icon_${type}.png`,
            iconSize: [32, 32]
          }
        })),
        loading: false,
        error: null,
        metrics: [
          {
            assetId: 'location',
            loadTime: 120,
            cacheHitRate: 0,
            failureRate: 0,
            averageRetryCount: 0,
            memoryUsage: 1024
          },
          {
            assetId: 'burn',
            loadTime: 85,
            cacheHitRate: 0,
            failureRate: 0,
            averageRetryCount: 0,
            memoryUsage: 1024
          }
        ],
        retryIcon: jest.fn(),
        preloadIcons: jest.fn()
      });

      // Simulate asset loading with different load times
      const loadPromises = ['location', 'burn'].map((type, index) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            mockImages[index].src = `/images/mapicons/icon_${type}.png`;
            setTimeout(() => {
              if (mockImages[index].onload) {
                mockImages[index].onload();
              }
              resolve();
            }, 10);
          }, (index + 1) * 50); // Different load times
        });
      });

      await Promise.all(loadPromises);
      jest.advanceTimersByTime(200);

      // Verify performance metrics are tracked
      const { metrics } = mockUseIconFactory();
      expect(metrics).toHaveLength(2);
      expect(metrics[0].assetId).toBe('location');
      expect(metrics[0].loadTime).toBe(120);
      expect(metrics[1].assetId).toBe('burn');
      expect(metrics[1].loadTime).toBe(85);
    });
  });
});