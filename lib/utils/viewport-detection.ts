/**
 * Viewport Detection Utilities
 *
 * Provides utilities for detecting device type, screen size,
 * and viewport characteristics for responsive asset scaling.
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'large-desktop';
export type Orientation = 'portrait' | 'landscape';
export type ViewportSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ViewportInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: Orientation;
  size: ViewportSize;
  isTouchDevice: boolean;
  pixelRatio: number;
  isHighDensity: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ResponsiveBreakpoints {
  xs: number;    // 0-575px   (mobile phones)
  sm: number;    // 576-767px  (large phones)
  md: number;    // 768-1023px (tablets)
  lg: number;    // 1024-1279px (small desktops)
  xl: number;    // 1280-1535px (desktops)
  '2xl': number; // 1536px+    (large desktops)
}

/**
 * Default responsive breakpoints following Tailwind CSS conventions
 */
export const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Get current viewport information
 */
export function getViewportInfo(breakpoints: ResponsiveBreakpoints = DEFAULT_BREAKPOINTS): ViewportInfo {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return {
      width: 1024,
      height: 768,
      deviceType: 'desktop',
      orientation: 'landscape',
      size: 'lg',
      isTouchDevice: false,
      pixelRatio: 1,
      isHighDensity: false,
      isLandscape: true,
      isPortrait: false,
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = window.devicePixelRatio || 1;
  const isHighDensity = pixelRatio > 1;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  // Determine device type based on width and touch capability
  let deviceType: DeviceType;
  let size: ViewportSize;

  if (width < breakpoints.sm) {
    deviceType = 'mobile';
    size = 'xs';
  } else if (width < breakpoints.md) {
    deviceType = 'mobile';
    size = 'sm';
  } else if (width < breakpoints.lg) {
    deviceType = isTouchDevice ? 'tablet' : 'desktop';
    size = 'md';
  } else if (width < breakpoints.xl) {
    deviceType = 'desktop';
    size = 'lg';
  } else if (width < breakpoints['2xl']) {
    deviceType = 'desktop';
    size = 'xl';
  } else {
    deviceType = 'large-desktop';
    size = '2xl';
  }

  // Adjust device type for touch devices
  if (isTouchDevice && size === 'lg') {
    deviceType = 'tablet';
  }

  const orientation = isLandscape ? 'landscape' : 'portrait';

  return {
    width,
    height,
    deviceType,
    orientation,
    size,
    isTouchDevice,
    pixelRatio,
    isHighDensity,
    isLandscape,
    isPortrait,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop' || deviceType === 'large-desktop',
  };
}

/**
 * Check if viewport matches specific size
 */
export function isViewportSize(
  size: ViewportSize,
  customBreakpoints?: ResponsiveBreakpoints
): boolean {
  const viewport = getViewportInfo(customBreakpoints);
  return viewport.size === size;
}

/**
 * Check if viewport is within range
 */
export function isViewportInRange(
  minSize: ViewportSize,
  maxSize: ViewportSize,
  customBreakpoints?: ResponsiveBreakpoints
): boolean {
  const viewport = getViewportInfo(customBreakpoints);
  const breakpoints = customBreakpoints || DEFAULT_BREAKPOINTS;

  const minValue = breakpoints[minSize];
  const maxValue = breakpoints[maxSize];

  return viewport.width >= minValue && viewport.width < maxValue;
}

/**
 * Get responsive value based on viewport
 */
export function getResponsiveValue<T>(
  values: Partial<Record<ViewportSize, T>>,
  defaultValue: T,
  customBreakpoints?: ResponsiveBreakpoints
): T {
  const viewport = getViewportInfo(customBreakpoints);

  // Return exact match if available
  if (values[viewport.size] !== undefined) {
    return values[viewport.size]!;
  }

  // Find nearest smaller breakpoint
  const sizeOrder: ViewportSize[] = ['2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
  const currentIndex = sizeOrder.indexOf(viewport.size);

  for (let i = currentIndex; i < sizeOrder.length; i++) {
    const size = sizeOrder[i];
    if (values[size] !== undefined) {
      return values[size]!;
    }
  }

  return defaultValue;
}

/**
 * Calculate responsive scaling factor
 */
export function getResponsiveScale(
  baseScale: number = 1,
  customBreakpoints?: ResponsiveBreakpoints
): number {
  const viewport = getViewportInfo(customBreakpoints);

  // Scaling factors for different device types
  const scaleFactors = {
    mobile: 1.5,
    tablet: 1.2,
    desktop: 1.0,
    'large-desktop': 0.9,
  };

  return baseScale * scaleFactors[viewport.deviceType];
}

/**
 * Get touch-friendly size based on device type
 */
export function getTouchSize(
  baseSize: number,
  minTouchSize: number = 44,
  customBreakpoints?: ResponsiveBreakpoints
): number {
  const viewport = getViewportInfo(customBreakpoints);
  const scale = getResponsiveScale(1, customBreakpoints);

  if (viewport.isTouchDevice) {
    return Math.max(baseSize * scale, minTouchSize);
  }

  return baseSize * scale;
}

/**
 * Monitor viewport changes
 */
export function createViewportMonitor(
  callback: (viewport: ViewportInfo) => void,
  customBreakpoints?: ResponsiveBreakpoints
): {
  start: () => void;
  stop: () => void;
  getCurrent: () => ViewportInfo;
} {
  let isMonitoring = false;
  let currentViewport: ViewportInfo;

  const handleResize = () => {
    const newViewport = getViewportInfo(customBreakpoints);

    // Only call callback if viewport actually changed
    if (
      newViewport.width !== currentViewport?.width ||
      newViewport.height !== currentViewport?.height ||
      newViewport.orientation !== currentViewport?.orientation ||
      newViewport.deviceType !== currentViewport?.deviceType
    ) {
      currentViewport = newViewport;
      callback(newViewport);
    }
  };

  return {
    start: () => {
      if (!isMonitoring && typeof window !== 'undefined') {
        currentViewport = getViewportInfo(customBreakpoints);
        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('orientationchange', handleResize, { passive: true });
        isMonitoring = true;
      }
    },

    stop: () => {
      if (isMonitoring && typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        isMonitoring = false;
      }
    },

    getCurrent: () => currentViewport || getViewportInfo(customBreakpoints),
  };
}

/**
 * React hook for viewport information
 */
export function useViewportInfo(customBreakpoints?: ResponsiveBreakpoints): ViewportInfo {
  // This would typically be implemented as a React hook
  // For now, return static viewport info
  return getViewportInfo(customBreakpoints);
}

/**
 * Utility functions for common responsive checks
 */
export const ViewportUtils = {
  isMobile: (customBreakpoints?: ResponsiveBreakpoints) =>
    getViewportInfo(customBreakpoints).isMobile,

  isTablet: (customBreakpoints?: ResponsiveBreakpoints) =>
    getViewportInfo(customBreakpoints).isTablet,

  isDesktop: (customBreakpoints?: ResponsiveBreakpoints) =>
    getViewportInfo(customBreakpoints).isDesktop,

  isTouch: () => getViewportInfo().isTouchDevice,

  isHighDensity: () => getViewportInfo().isHighDensity,

  isLandscape: () => getViewportInfo().isLandscape,

  isPortrait: () => getViewportInfo().isPortrait,
};

export default {
  getViewportInfo,
  isViewportSize,
  isViewportInRange,
  getResponsiveValue,
  getResponsiveScale,
  getTouchSize,
  createViewportMonitor,
  useViewportInfo,
  ViewportUtils,
  DEFAULT_BREAKPOINTS,
};