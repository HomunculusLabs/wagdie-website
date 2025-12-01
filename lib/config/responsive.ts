/**
 * Responsive Configuration
 *
 * Central configuration for responsive breakpoints, scaling factors,
 * and device-specific optimizations for WAGDIE map assets.
 */

import type { ResponsiveBreakpoints, DeviceType } from '@/lib/utils/viewport-detection';

/**
 * WAGDIE-specific responsive breakpoints
 * Optimized for map interaction and asset display
 */
export const WAGDIE_BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 0,      // Small mobile phones (320px+)
  sm: 576,    // Large mobile phones (576px+)
  md: 768,    // Tablets (768px+)
  lg: 1024,   // Small desktops/tablets (1024px+)
  xl: 1280,   // Desktops (1280px+)
  '2xl': 1536, // Large desktops (1536px+)
};

/**
 * Asset scaling factors by device type
 */
export const ASSET_SCALING = {
  mobile: {
    icon: 1.8,      // Icons 80% larger for touch
    marker: 1.6,    // Markers 60% larger
    ui: 1.4,        // UI elements 40% larger
    text: 1.2,      // Text 20% larger
  },
  tablet: {
    icon: 1.4,      // Icons 40% larger
    marker: 1.3,    // Markers 30% larger
    ui: 1.2,        // UI elements 20% larger
    text: 1.1,      // Text 10% larger
  },
  desktop: {
    icon: 1.0,      // Default size
    marker: 1.0,    // Default size
    ui: 1.0,        // Default size
    text: 1.0,      // Default size
  },
  'large-desktop': {
    icon: 0.9,      // Slightly smaller for large screens
    marker: 0.9,    // Slightly smaller for large screens
    ui: 1.0,        // Keep UI readable
    text: 1.0,      // Keep text readable
  },
} as const;

/**
 * Minimum touch target sizes (in pixels)
 * Following Apple HIG and Material Design guidelines
 */
export const TOUCH_TARGETS = {
  minimum: 44,     // Absolute minimum for touch targets
  comfortable: 48, // Comfortable touch target size
  large: 56,       // Large touch targets for important actions
  mapControls: 52, // Map-specific control targets
} as const;

/**
 * Base asset sizes (in pixels)
 */
export const BASE_ASSET_SIZES = {
  icons: {
    location: [32, 32],
    character: [24, 24],
    burn: [28, 28],
    death: [28, 28],
    fight: [28, 28],
  },
  markers: {
    location: [40, 40],    // Includes padding
    character: [32, 32],    // Includes padding
    event: [36, 36],        // Burn/death/fight
  },
  ui: {
    button: [40, 40],
    control: [48, 48],
    toggle: [44, 44],
  },
} as const;

/**
 * Responsive configuration for different viewport sizes
 */
export const RESPONSIVE_CONFIG = {
  xs: {
    maxMarkers: 20,     // Limit markers for performance
    clustering: true,   // Enable clustering
    labelSize: 0.8,     // Smaller labels
    detailLevel: 'minimal' as const,
  },
  sm: {
    maxMarkers: 30,
    clustering: true,
    labelSize: 0.9,
    detailLevel: 'basic' as const,
  },
  md: {
    maxMarkers: 50,
    clustering: false,
    labelSize: 1.0,
    detailLevel: 'standard' as const,
  },
  lg: {
    maxMarkers: 100,
    clustering: false,
    labelSize: 1.0,
    detailLevel: 'detailed' as const,
  },
  xl: {
    maxMarkers: 200,
    clustering: false,
    labelSize: 1.1,
    detailLevel: 'full' as const,
  },
  '2xl': {
    maxMarkers: 500,
    clustering: false,
    labelSize: 1.2,
    detailLevel: 'maximum' as const,
  },
} as const;

/**
 * Performance thresholds by device type
 */
export const PERFORMANCE_THRESHOLDS = {
  mobile: {
    maxMarkers: 30,
    renderTime: 16,     // 60fps target
    animationFPS: 30,   // Lower FPS for battery
    enableAnimations: false,
    enableEffects: false,
  },
  tablet: {
    maxMarkers: 75,
    renderTime: 16,
    animationFPS: 45,
    enableAnimations: true,
    enableEffects: false,
  },
  desktop: {
    maxMarkers: 200,
    renderTime: 8,      // 120fps target
    animationFPS: 60,
    enableAnimations: true,
    enableEffects: true,
  },
  'large-desktop': {
    maxMarkers: 500,
    renderTime: 8,
    animationFPS: 60,
    enableAnimations: true,
    enableEffects: true,
  },
} as const;

/**
 * Map zoom levels by device type
 */
export const ZOOM_LEVELS = {
  mobile: {
    min: -2,
    max: 1,
    default: 0,
  },
  tablet: {
    min: -2,
    max: 2,
    default: 0,
  },
  desktop: {
    min: -2,
    max: 2,
    default: 0,
  },
  'large-desktop': {
    min: -3,
    max: 3,
    default: 0,
  },
} as const;

/**
 * Get scaling factor for asset type and device
 */
export function getAssetScaling(
  assetType: keyof typeof ASSET_SCALING.desktop,
  deviceType: DeviceType
): number {
  return ASSET_SCALING[deviceType]?.[assetType] || ASSET_SCALING.desktop[assetType];
}

/**
 * Get responsive size for an asset
 */
export function getResponsiveAssetSize(
  baseSize: [number, number],
  assetType: keyof typeof ASSET_SCALING.desktop,
  deviceType: DeviceType,
  minSize?: number
): [number, number] {
  const scale = getAssetScaling(assetType, deviceType);
  const [width, height] = baseSize;

  let scaledWidth = width * scale;
  let scaledHeight = height * scale;

  // Apply minimum size constraints
  if (minSize) {
    scaledWidth = Math.max(scaledWidth, minSize);
    scaledHeight = Math.max(scaledHeight, minSize);
  }

  // Apply touch target constraints for touch devices
  if (deviceType === 'mobile' || deviceType === 'tablet') {
    const minTouchSize = TOUCH_TARGETS.minimum;
    scaledWidth = Math.max(scaledWidth, minTouchSize);
    scaledHeight = Math.max(scaledHeight, minTouchSize);
  }

  return [Math.round(scaledWidth), Math.round(scaledHeight)];
}

/**
 * Get configuration for viewport size
 */
export function getResponsiveConfig(viewportSize: keyof typeof RESPONSIVE_CONFIG) {
  return RESPONSIVE_CONFIG[viewportSize];
}

/**
 * Get performance thresholds for device type
 */
export function getPerformanceThresholds(deviceType: DeviceType) {
  return PERFORMANCE_THRESHOLDS[deviceType];
}

/**
 * Get zoom levels for device type
 */
export function getZoomLevels(deviceType: DeviceType) {
  return ZOOM_LEVELS[deviceType];
}

/**
 * Check if performance optimizations should be enabled
 */
export function shouldEnablePerformanceOptimizations(deviceType: DeviceType): boolean {
  return deviceType === 'mobile' || deviceType === 'tablet';
}

/**
 * Get optimal marker count for device type
 */
export function getOptimalMarkerCount(deviceType: DeviceType): number {
  return PERFORMANCE_THRESHOLDS[deviceType].maxMarkers;
}

/**
 * Default export containing all responsive configurations
 */
export default {
  BREAKPOINTS: WAGDIE_BREAKPOINTS,
  SCALING: ASSET_SCALING,
  TOUCH_TARGETS,
  BASE_SIZES: BASE_ASSET_SIZES,
  RESPONSIVE: RESPONSIVE_CONFIG,
  PERFORMANCE: PERFORMANCE_THRESHOLDS,
  ZOOM: ZOOM_LEVELS,
  getAssetScaling,
  getResponsiveAssetSize,
  getResponsiveConfig,
  getPerformanceThresholds,
  getZoomLevels,
  shouldEnablePerformanceOptimizations,
  getOptimalMarkerCount,
};