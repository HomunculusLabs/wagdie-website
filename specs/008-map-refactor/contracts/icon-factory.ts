/**
 * Icon Factory Contract
 * Defines the interface for creating and caching map icons
 */

export type IconType = 'location' | 'character' | 'burn' | 'death' | 'fight';

export interface IconConfig {
  baseSize: [number, number];
  iconUrl: string;
  mobileScale?: number;
  minTouchSize?: number;
}

export interface IconFactory {
  /**
   * Create or retrieve a cached icon for the specified type and screen size
   */
  createIcon(type: IconType, isMobile: boolean): L.Icon;

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
