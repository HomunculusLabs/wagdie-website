/**
 * Icon Factory Contract
 * Defines the interface for creating and caching map icons
 *
 * Note: This contract was originally for Leaflet-based icons.
 * The project has since migrated to Phaser for map rendering.
 */

export type IconType = 'location' | 'character' | 'burn' | 'death' | 'fight';

export interface IconConfig {
  baseSize: [number, number];
  iconUrl: string;
  mobileScale?: number;
  minTouchSize?: number;
}

/** Generic icon type (previously L.Icon from Leaflet) */
export type MapIcon = unknown;

export interface IconFactory {
  /**
   * Create or retrieve a cached icon for the specified type and screen size
   */
  createIcon(type: IconType, isMobile: boolean): MapIcon;

  /**
   * Pre-generate icons for all types (useful for performance)
   */
  preloadIcons(): void;

  /**
   * Clear icon cache (call on window resize)
   */
  clearCache(): void;

  /**
   * Get the cache size for monitoring/analytics
   */
  getCacheSize(): number;
}

/**
 * IconFactory implementation options
 */
export interface IconFactoryOptions {
  defaultIconPath?: string;
  cacheSize?: number;
  enablePreloading?: boolean;
}
