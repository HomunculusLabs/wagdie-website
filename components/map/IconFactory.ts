/**
 * Icon Factory Utility
 *
 * Creates and caches map icons for all marker types with memoization.
 * Ensures consistent icon creation across all markers and optimizes performance
 * by caching icons to prevent recreation on re-renders.
 */

import L from 'leaflet';
import type { IconType, IconConfig, IconFactoryOptions } from '@/specs/008-map-refactor/contracts/icon-factory';

class IconFactoryImpl {
  private cache: Map<string, L.Icon> = new Map();
  private config: Map<IconType, IconConfig>;
  private options: Required<IconFactoryOptions>;

  constructor(config: Map<IconType, IconConfig>, options: IconFactoryOptions = {}) {
    this.config = config;
    this.options = {
      defaultIconPath: '/images/map-icons/',
      cacheSize: 100,
      enablePreloading: false,
      ...options,
    };
  }

  /**
   * Create or retrieve a cached icon for the specified type and screen size
   */
  createIcon(type: IconType, isMobile: boolean): L.Icon {
    const iconConfig = this.config.get(type);

    if (!iconConfig) {
      throw new Error(`No icon configuration found for type: ${type}`);
    }

    // Generate cache key based on type and mobile/desktop
    const cacheKey = `${type}-${isMobile ? 'mobile' : 'desktop'}`;

    // Return cached icon if exists
    const cachedIcon = this.cache.get(cacheKey);
    if (cachedIcon) {
      return cachedIcon;
    }

    // Calculate responsive size
    const size = this.calculateIconSize(iconConfig, isMobile);

    // Create new icon
    const icon = L.icon({
      iconUrl: iconConfig.iconUrl,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1]],
      popupAnchor: [0, -size[1]],
    });

    // Cache the icon with size management
    this.cache.set(cacheKey, icon);

    // If cache exceeds max size, clear oldest entries (simple FIFO)
    if (this.cache.size > this.options.cacheSize) {
      const firstCacheKey = this.cache.keys().next().value;
      if (firstCacheKey !== undefined) {
        this.cache.delete(firstCacheKey);
      }
    }

    return icon;
  }

  /**
   * Pre-generate icons for all configured types (useful for performance)
   */
  preloadIcons(): void {
    // Iterate over actual configured types instead of hardcoded list
    Array.from(this.config.keys()).forEach((type) => {
      // Pre-create both mobile and desktop versions
      this.createIcon(type, true);
      this.createIcon(type, false);
    });
  }

  /**
   * Clear icon cache (call on window resize)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get the cache size for monitoring/analytics
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Calculate icon size based on screen type and config
   */
  private calculateIconSize(config: IconConfig, isMobile: boolean): [number, number] {
    const [width, height] = config.baseSize;

    if (!isMobile) {
      return [width, height];
    }

    // Apply mobile scaling
    const scale = config.mobileScale || 1.5;
    const minTouchSize = config.minTouchSize || 44;

    const scaledWidth = Math.max(width * scale, minTouchSize);
    const scaledHeight = Math.max(height * scale, minTouchSize);

    return [scaledWidth, scaledHeight];
  }
}

/**
 * Default icon configuration for all marker types
 */
const defaultIconConfigs: Map<IconType, IconConfig> = new Map([
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
      iconUrl: '/images/map-icons/icon_youarehere.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'burn',
    {
      baseSize: [28, 28],
      iconUrl: '/images/map-icons/icon_burn.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'death',
    {
      baseSize: [28, 28],
      iconUrl: '/images/map-icons/icon_death.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'fight',
    {
      baseSize: [28, 28],
      iconUrl: '/images/map-icons/icon_fight.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
]);

/**
 * Singleton instance of IconFactory
 */
let iconFactoryInstance: IconFactoryImpl | null = null;

/**
 * Get or create the IconFactory singleton
 */
export function getIconFactory(): IconFactoryImpl {
  if (!iconFactoryInstance) {
    iconFactoryInstance = new IconFactoryImpl(defaultIconConfigs, {
      enablePreloading: true,
      cacheSize: 100,
    });

    // Preload icons if enabled
    if (iconFactoryInstance) {
      iconFactoryInstance.preloadIcons();
    }
  }

  return iconFactoryInstance;
}

export default IconFactoryImpl;
