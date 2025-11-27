/**
 * Enhanced Icon Factory Utility
 *
 * Creates and caches map icons for all marker types with memoization.
 * Enhanced with progressive loading, fallback mechanisms, and performance monitoring.
 * Ensures consistent icon creation across all markers and optimizes performance
 * by caching icons to prevent recreation on re-renders.
 */

import L from 'leaflet';
import type { IconType, IconConfig, IconFactoryOptions } from '@/specs/008-map-refactor/contracts/icon-factory';

// Debug configuration - set to false to reduce console spam
const DEBUG_ASSET_LOADING = false;
import type {
  EnhancedIconConfig,
  AssetLoadingState,
  AssetPerformanceMetrics,
  EnhancedIconFactory as IEnhancedIconFactory,
  IconType as NewIconType
} from '@/types/assets';
import { getAssetLoadingService } from '@/lib/services/AssetLoadingService';
import { getAssetErrorHandler } from '@/lib/services/AssetErrorHandler';
import { getAssetPerformanceMonitor } from '@/lib/utils/AssetPerformance';
import { getViewportInfo } from '@/lib/utils/ViewportDetection';
import {
  getAssetScaling,
  getResponsiveAssetSize as getConfiguredSize,
  TOUCH_TARGETS
} from '@/lib/config/responsive';

class EnhancedIconFactoryImpl implements IEnhancedIconFactory {
  private cache: Map<string, L.Icon> = new Map();
  private config: Map<IconType | NewIconType, EnhancedIconConfig>;
  private options: Required<IconFactoryOptions>;
  private loadingService = getAssetLoadingService();
  private errorHandler = getAssetErrorHandler();
  private performanceMonitor = getAssetPerformanceMonitor();

  constructor(config: Map<IconType, IconConfig>, options: IconFactoryOptions = {}) {
    // Convert legacy configs to enhanced configs
    this.config = this.convertLegacyConfigs(config);

    this.options = {
      defaultIconPath: '/images/',
      cacheSize: 100,
      enablePreloading: true,
      ...options,
    };

    // Set up error handling
    this.errorHandler = getAssetErrorHandler({
      onError: (error) => {
        if (DEBUG_ASSET_LOADING) console.error(`[IconFactory] Asset loading error: ${error.assetId} - ${error.errorMessage}`);
      },
      onFallback: (assetId, fallbackUrl) => {
        if (DEBUG_ASSET_LOADING) console.warn(`[IconFactory] Using fallback for ${assetId}: ${fallbackUrl}`);
      },
      enableLogging: DEBUG_ASSET_LOADING
    });

    // Preload icons if enabled
    if (this.options.enablePreloading) {
      this.preloadCriticalIcons().catch(console.warn);
    }
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
      this.performanceMonitor.recordCacheHit(type);
      return cachedIcon;
    }

    // Record cache miss
    this.performanceMonitor.recordCacheMiss(type);

    // Calculate responsive size
    const size = this.calculateIconSize(iconConfig, isMobile);

    // Create new icon with progressive loading
    const icon = this.createIconWithProgressiveLoading(
      iconConfig.iconUrl,
      iconConfig.fallbackUrl,
      size,
      type
    );

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
   * Create icon from custom URL with progressive loading
   */
  createIconFromUrl(iconUrl: string, fallbackUrl: string, size: [number, number]): L.Icon {
    return this.createIconWithProgressiveLoading(iconUrl, fallbackUrl, size, 'location' as IconType);
  }

  /**
   * Get loading state for icon type
   */
  getIconLoadingState(type: IconType | NewIconType): AssetLoadingState | undefined {
    return this.loadingService.getAssetState(type);
  }

  /**
   * Retry failed icon loading
   */
  async retryIconLoad(type: IconType | NewIconType): Promise<void> {
    try {
      await this.loadingService.retryAsset(type);

      // Clear cache to force recreation with new state
      this.clearIconCache(type);
    } catch (error) {
      if (DEBUG_ASSET_LOADING) console.error(`[IconFactory] Failed to retry icon ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get performance metrics for icons
   */
  getIconMetrics(): AssetPerformanceMetrics[] {
    const allMetrics = this.performanceMonitor.getAllAssetMetrics();
    const iconTypes = Array.from(this.config.keys());

    return allMetrics.filter(metric =>
      iconTypes.includes(metric.assetId as IconType | NewIconType)
    );
  }

  /**
   * Clear icon cache (call on window resize)
   */
  clearCache(): void {
    this.cache.clear();
    this.performanceMonitor.clearMetrics();
  }

  /**
   * Clear cache for specific icon type
   */
  private clearIconCache(type: IconType | NewIconType): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}-`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get the cache size for monitoring/analytics
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Handle viewport changes by clearing relevant cache entries
   */
  handleViewportChange(): void {
    const currentViewport = getViewportInfo();

    // Clear cache entries that might be affected by viewport changes
    const keysToDelete: string[] = [];

    for (const cacheKey of this.cache.keys()) {
      // Keys contain device type information, so clear all and let them be recreated
      keysToDelete.push(cacheKey);
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (DEBUG_ASSET_LOADING) console.log(`[IconFactory] Cleared ${keysToDelete.length} cached icons due to viewport change`);
  }

  /**
   * Pre-generate icons for all configured types (useful for performance)
   */
  async preloadCriticalIcons(): Promise<void> {
    // Preload critical icons using the loading service
    const criticalIcons = Array.from(this.config.keys()).filter(
      type => this.config.get(type)?.priority === 'critical'
    ) as (IconType | NewIconType)[];

    try {
      await this.loadingService.preloadCriticalAssets();
      if (DEBUG_ASSET_LOADING) console.log(`[IconFactory] Preloaded ${criticalIcons.length} critical icons`);
    } catch (error) {
      if (DEBUG_ASSET_LOADING) console.error('[IconFactory] Failed to preload critical icons:', error);
      throw error;
    }
  }

  /**
   * Convert legacy IconConfig to EnhancedIconConfig
   */
  private convertLegacyConfigs(legacyConfigs: Map<IconType, IconConfig>): Map<IconType | NewIconType, EnhancedIconConfig> {
    const enhancedConfigs = new Map<IconType | NewIconType, EnhancedIconConfig>();

    // Convert legacy configs
    for (const [type, legacyConfig] of legacyConfigs) {
      const enhancedConfig: EnhancedIconConfig = {
        baseSize: legacyConfig.baseSize,
        iconUrl: this.convertLegacyPath(legacyConfig.iconUrl),
        fallbackUrl: this.convertLegacyPath(legacyConfig.iconUrl), // Use same as initial fallback
        mobileScale: legacyConfig.mobileScale || 1.5,
        minTouchSize: legacyConfig.minTouchSize || 44,
        priority: this.getPriorityForType(type),
        category: this.getCategoryForType(type)
      };

      enhancedConfigs.set(type, enhancedConfig);
    }

    // Add additional enhanced configs for new asset types
    const additionalConfigs: Partial<Record<NewIconType, EnhancedIconConfig>> = {
      'legend_location_on': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_location_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_location_on.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_location_off': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_location_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_location_off.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_burn_on': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_burn_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_burn_on.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_burn_off': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_burn_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_burn_off.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_death_on': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_death_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_death_on.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_death_off': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_death_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_death_off.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_fight_on': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_fight_on.png',
        fallbackUrl: '/images/legendicons/legend_icon_fight_on.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      },
      'legend_fight_off': {
        baseSize: [24, 24],
        iconUrl: '/images/legendicons/legend_icon_fight_off.png',
        fallbackUrl: '/images/legendicons/legend_icon_fight_off.png',
        mobileScale: 1.5,
        minTouchSize: 44,
        priority: 'non-critical',
        category: 'legend'
      }
    };

    Object.entries(additionalConfigs).forEach(([type, config]) => {
      if (config) {
        enhancedConfigs.set(type as NewIconType, config);
      }
    });

    return enhancedConfigs;
  }

  /**
   * Convert legacy path to flat structure path
   */
  private convertLegacyPath(legacyPath: string): string {
    // Convert from legacy structure like '/images/map-icons/icon_location.png'
    // to flat structure or preserve if already flat
    if (legacyPath.includes('/mapicons/')) {
      return legacyPath; // Already using flat structure
    }

    // Handle other legacy paths
    if (legacyPath.includes('/legendicons/')) {
      return legacyPath; // Already flat
    }

    return legacyPath; // Return as-is for unknown formats
  }

  /**
   * Get priority for icon type
   */
  private getPriorityForType(type: IconType | NewIconType): 'critical' | 'non-critical' {
    const criticalTypes: (IconType | NewIconType)[] = [
      'location', 'character', 'burn', 'death', 'fight'
    ];

    return criticalTypes.includes(type) ? 'critical' : 'non-critical';
  }

  /**
   * Get category for icon type
   */
  private getCategoryForType(type: IconType | NewIconType): 'marker' | 'legend' | 'staking' | 'wallet' | 'border' | 'background' {
    if (type.toString().startsWith('legend_')) {
      return 'legend';
    }

    if (['location', 'character', 'burn', 'death', 'fight'].includes(type as string)) {
      return 'marker';
    }

    return 'marker'; // Default category
  }

  /**
   * Create icon with progressive loading support
   */
  private createIconWithProgressiveLoading(
    iconUrl: string,
    fallbackUrl: string,
    size: [number, number],
    type: IconType | NewIconType
  ): L.Icon {
    // Use fallback URL immediately to avoid async loading issues
    const safeIconUrl = iconUrl || fallbackUrl;

    // Start asset loading in background if not already loading
    const loadingState = this.loadingService.getAssetState(type);
    if (!loadingState || loadingState.status === 'failed') {
      // Don't await - let it load in background
      this.loadingService.loadAsset(type).catch(error => {
        if (DEBUG_ASSET_LOADING) console.error(`[IconFactory] Failed to load icon ${type}:`, error);
        // Icon will continue to work with fallback URL
      });
    }

    // Create Leaflet icon with error handling
    try {
      const icon = L.icon({
        iconUrl: safeIconUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [0, -size[1]],
        className: `custom-icon-${type} leaflet-marker-icon`
      });

      return icon;
    } catch (error) {
      if (DEBUG_ASSET_LOADING) console.error(`[IconFactory] Error creating icon ${type}:`, error);
      // Return fallback icon if creation fails
      return L.icon({
        iconUrl: fallbackUrl,
        iconSize: size,
        iconAnchor: [size[0] / 2, size[1]],
        popupAnchor: [0, -size[1]],
        className: 'error-fallback-icon leaflet-marker-icon'
      });
    }
  }

  /**
   * Calculate icon size based on viewport and responsive configuration
   */
  private calculateIconSize(config: EnhancedIconConfig, isMobile: boolean): [number, number] {
    // Get current viewport information
    const viewport = getViewportInfo();

    // Determine device type for responsive scaling
    let deviceType: 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
    if (viewport.isMobile) {
      deviceType = 'mobile';
    } else if (viewport.isTablet) {
      deviceType = 'tablet';
    } else if (viewport.deviceType === 'large-desktop') {
      deviceType = 'large-desktop';
    } else {
      deviceType = 'desktop';
    }

    // Use enhanced responsive sizing
    const responsiveSize = getConfiguredSize(
      config.baseSize,
      'icon', // Asset type for icons
      deviceType,
      config.minTouchSize || TOUCH_TARGETS.minimum
    );

    // Apply additional density scaling for high-DPI displays
    const densityScale = viewport.isHighDensity ? Math.min(viewport.pixelRatio, 2) : 1;
    let finalWidth = Math.round(responsiveSize[0] * densityScale);
    let finalHeight = Math.round(responsiveSize[1] * densityScale);

    // Apply orientation-specific adjustments
    if (viewport.isPortrait && viewport.isMobile) {
      // Slightly reduce icons in portrait mode on mobile to save space
      finalWidth = Math.round(finalWidth * 0.9);
      finalHeight = Math.round(finalHeight * 0.9);
    }

    return [finalWidth, finalHeight];
  }
}

/**
 * Singleton instance of Enhanced IconFactory
 */
let enhancedIconFactoryInstance: EnhancedIconFactoryImpl | null = null;

/**
 * Default icon configuration for all marker types
 */
const defaultIconConfigs: Map<IconType, IconConfig> = new Map([
  [
    'location',
    {
      baseSize: [32, 32],
      iconUrl: '/images/mapicons/icon_location.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'character',
    {
      baseSize: [24, 24],
      iconUrl: '/images/mapicons/icon_youarehere.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'burn',
    {
      baseSize: [28, 28],
      iconUrl: '/images/mapicons/icon_burn.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'death',
    {
      baseSize: [28, 28],
      iconUrl: '/images/mapicons/icon_death.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
  [
    'fight',
    {
      baseSize: [28, 28],
      iconUrl: '/images/mapicons/icon_fight.png',
      mobileScale: 1.5,
      minTouchSize: 44,
    },
  ],
]);

/**
 * Get or create the Enhanced IconFactory singleton
 */
export function getIconFactory(): EnhancedIconFactoryImpl {
  if (!enhancedIconFactoryInstance) {
    enhancedIconFactoryInstance = new EnhancedIconFactoryImpl(
      defaultIconConfigs,
      {
        enablePreloading: true,
        cacheSize: 100,
      }
    );

    // Preload icons if enabled
    if (enhancedIconFactoryInstance) {
      enhancedIconFactoryInstance.preloadCriticalIcons().catch(error => {
        if (DEBUG_ASSET_LOADING) console.warn('[IconFactory] Preload failed:', error);
      });
    }
  }

  return enhancedIconFactoryInstance;
}

/**
 * Get the legacy IconFactory for backward compatibility
 */
export function getLegacyIconFactory() {
  // This maintains compatibility with existing code that expects the original API
  return getIconFactory();
}

/**
 * Backward compatibility exports
 */
export type { IconType } from '@/specs/008-map-refactor/contracts/icon-factory';
export type { IconConfig, IconFactoryOptions } from '@/specs/008-map-refactor/contracts/icon-factory';

export default EnhancedIconFactoryImpl;