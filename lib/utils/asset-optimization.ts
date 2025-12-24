/**
 * Asset Optimization Utilities
 *
 * Provides utilities for optimizing map assets including:
 * - Image optimization and compression
 * - Format selection (WebP, AVIF)
 * - Quality adjustment based on device capabilities
 * - Progressive loading strategies
 * - Bandwidth-aware optimization
 */

export interface AssetOptimizationOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
  maxWidth?: number;
  maxHeight?: number;
  enableProgressive?: boolean;
  enableLazy?: boolean;
  priority?: 'high' | 'normal' | 'low';
  fallbackFormat?: string;
}

export interface OptimizationResult {
  optimizedUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  loadingStrategy: 'eager' | 'lazy' | 'progressive';
}

// Debug configuration - set to false to reduce console spam
const DEBUG_ASSET_OPTIMIZATION = false;

export interface DeviceCapabilities {
  supportsWebP: boolean;
  supportsAVIF: boolean;
  pixelRatio: number;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';
  saveData: boolean;
  hardwareConcurrency: number;
  memory: number;
}

export interface BandwidthMetrics {
  downlink: number;
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
  rtt: number;
  saveData: boolean;
}

/**
 * Asset Optimizer Class
 */
export class AssetOptimizer {
  private deviceCapabilities: DeviceCapabilities;
  private optimizationCache: Map<string, OptimizationResult> = new Map();

  constructor() {
    this.deviceCapabilities = this.detectDeviceCapabilities();
  }

  /**
   * Optimize an image URL based on device capabilities and options
   */
  async optimizeImageUrl(
    url: string,
    options: AssetOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(url, options);
    const cached = this.optimizationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const optimization = await this.performOptimization(url, options);
    this.optimizationCache.set(cacheKey, optimization);

    return optimization;
  }

  /**
   * Perform actual optimization
   */
  private async performOptimization(
    url: string,
    options: AssetOptimizationOptions
  ): Promise<OptimizationResult> {
    // Determine optimal format
    const format = this.selectOptimalFormat(options.format);

    // Determine quality based on connection and device
    const quality = this.determineOptimalQuality(options.quality);

    // Determine loading strategy
    const loadingStrategy = this.selectLoadingStrategy(options);

    // Build optimized URL (this would typically be done via image service)
    const optimizedUrl = this.buildOptimizedUrl(url, {
      format,
      quality,
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
    });

    // Get original image size for comparison
    const originalSize = await this.getImageSize(url);

    // Calculate optimization metrics
    const optimizedSize = await this.getImageSize(optimizedUrl);
    const compressionRatio = 1 - (optimizedSize / originalSize);

    return {
      optimizedUrl,
      originalSize,
      optimizedSize,
      compressionRatio,
      format,
      loadingStrategy,
    };
  }

  /**
   * Select optimal image format
   */
  private selectOptimalFormat(preferredFormat?: string): string {
    if (preferredFormat && preferredFormat !== 'auto') {
      return preferredFormat;
    }

    // Auto-select best format based on device support
    if (this.deviceCapabilities.supportsAVIF) {
      return 'avif';
    }
    if (this.deviceCapabilities.supportsWebP) {
      return 'webp';
    }

    // Fallback to original format detection
    return 'png'; // Default for map icons
  }

  /**
   * Determine optimal quality based on connection and device
   */
  private determineOptimalQuality(requestedQuality?: number): number {
    if (requestedQuality !== undefined) {
      return Math.min(requestedQuality, 100);
    }

    // Base quality on connection type
    const connection = this.deviceCapabilities.connectionType;
    const saveData = this.deviceCapabilities.saveData;

    if (saveData) {
      return 50; // Low quality for data saving mode
    }

    switch (connection) {
      case 'slow-2g':
      case '2g':
        return 60;
      case '3g':
        return 75;
      case '4g':
      case '5g':
        return 85;
      default:
        return 80;
    }
  }

  /**
   * Select loading strategy
   */
  private selectLoadingStrategy(options: AssetOptimizationOptions): 'eager' | 'lazy' | 'progressive' {
    // Force specified strategy
    if (options.enableLazy) return 'lazy';
    if (options.enableProgressive) return 'progressive';
    if (options.priority === 'high') return 'eager';

    // Auto-select based on priority and connection
    if (options.priority === 'low') return 'lazy';
    if (this.deviceCapabilities.connectionType === 'slow-2g' ||
        this.deviceCapabilities.connectionType === '2g') {
      return 'lazy';
    }

    return 'eager';
  }

  /**
   * Build optimized URL with parameters
   */
  private buildOptimizedUrl(
    originalUrl: string,
    params: {
      format?: string;
      quality?: number;
      maxWidth?: number;
      maxHeight?: number;
    }
  ): string {
    const url = new URL(originalUrl, window.location.origin);

    // Add optimization parameters
    if (params.format && !originalUrl.includes('.webp') && !originalUrl.includes('.avif')) {
      // Replace extension
      const pathWithoutExt = url.pathname.replace(/\.[^/.]+$/, '');
      url.pathname = `${pathWithoutExt}.${params.format}`;
    }

    // Add query parameters for CDN optimization
    if (params.quality !== undefined) {
      url.searchParams.set('q', params.quality.toString());
    }

    if (params.maxWidth) {
      url.searchParams.set('w', params.maxWidth.toString());
    }

    if (params.maxHeight) {
      url.searchParams.set('h', params.maxHeight.toString());
    }

    // Add device pixel ratio for high-DPI displays
    if (this.deviceCapabilities.pixelRatio > 1) {
      url.searchParams.set('dpr', Math.min(this.deviceCapabilities.pixelRatio, 2).toString());
    }

    return url.toString();
  }

  /**
   * Get image size (fetches headers to get content length)
   */
  private async getImageSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      if (DEBUG_ASSET_OPTIMIZATION) console.warn(`[AssetOptimizer] Failed to get image size for: ${url}`, error);
      return 0;
    }
  }

  /**
   * Generate cache key for optimization results
   */
  private generateCacheKey(url: string, options: AssetOptimizationOptions): string {
    const keyData = {
      url,
      options,
      capabilities: this.deviceCapabilities,
    };
    return btoa(JSON.stringify(keyData));
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceCapabilities(): DeviceCapabilities {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Test WebP support
    const supportsWebP = ctx?.canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

    // Test AVIF support
    const supportsAVIF = ctx?.canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

    // Get pixel ratio
    const pixelRatio = window.devicePixelRatio || 1;

    // Get connection information (Network Information API)
    interface NetworkInformation {
      effectiveType?: string;
      saveData?: boolean;
    }
    const navigatorWithConnection = navigator as Navigator & {
      connection?: NetworkInformation;
      mozConnection?: NetworkInformation;
      webkitConnection?: NetworkInformation;
      deviceMemory?: number;
    };
    const connection = navigatorWithConnection.connection || navigatorWithConnection.mozConnection || navigatorWithConnection.webkitConnection;
    const connectionType = (connection?.effectiveType || 'unknown') as DeviceCapabilities['connectionType'];
    const saveData = connection?.saveData || false;

    // Get hardware info
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const memory = navigatorWithConnection.deviceMemory || 4;

    return {
      supportsWebP,
      supportsAVIF,
      pixelRatio,
      connectionType,
      saveData,
      hardwareConcurrency,
      memory,
    };
  }

  /**
   * Preload critical assets with optimization
   */
  async preloadCriticalAssets(urls: string[]): Promise<void> {
    const criticalUrls = urls.slice(0, 5); // Limit to 5 critical assets

    const preloadPromises = criticalUrls.map(async (url) => {
      try {
        const optimized = await this.optimizeImageUrl(url, {
          priority: 'high',
          enableProgressive: true,
          quality: 90, // High quality for critical assets
        });

        // Create link element for preloading
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = optimized.optimizedUrl;
        document.head.appendChild(link);

        if (DEBUG_ASSET_OPTIMIZATION) console.log(`[AssetOptimizer] Preloaded critical asset: ${url}`);
      } catch (error) {
        if (DEBUG_ASSET_OPTIMIZATION) console.warn(`[AssetOptimizer] Failed to preload critical asset: ${url}`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Create responsive image srcset
   */
  createSrcSet(baseUrl: string, sizes: number[]): string {
    const srcSetEntries = sizes.map(size => {
      const optimized = this.buildOptimizedUrl(baseUrl, {
        maxWidth: size,
        maxHeight: size,
      });
      return `${optimized} ${size}w`;
    });

    return srcSetEntries.join(', ');
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): {
    recommendedQuality: number;
    recommendedFormat: string;
    maxConcurrentLoads: number;
    enableLazyLoading: boolean;
    enableProgressiveLoading: boolean;
  } {
    const connection = this.deviceCapabilities.connectionType;
    const saveData = this.deviceCapabilities.saveData;
    const memory = this.deviceCapabilities.memory;

    let recommendedQuality = 80;
    let recommendedFormat = 'png';
    let maxConcurrentLoads = 4;
    let enableLazyLoading = false;
    let enableProgressiveLoading = false;

    // Adjust based on connection
    if (saveData) {
      recommendedQuality = 50;
      enableLazyLoading = true;
      maxConcurrentLoads = 2;
    } else if (connection === 'slow-2g' || connection === '2g') {
      recommendedQuality = 60;
      enableLazyLoading = true;
      enableProgressiveLoading = true;
      maxConcurrentLoads = 2;
    } else if (connection === '3g') {
      recommendedQuality = 75;
      enableLazyLoading = true;
      maxConcurrentLoads = 3;
    }

    // Adjust based on device capabilities
    if (this.deviceCapabilities.supportsAVIF) {
      recommendedFormat = 'avif';
    } else if (this.deviceCapabilities.supportsWebP) {
      recommendedFormat = 'webp';
    }

    // Adjust based on memory constraints
    if (memory < 4) {
      maxConcurrentLoads = Math.min(maxConcurrentLoads, 2);
      enableLazyLoading = true;
    }

    return {
      recommendedQuality,
      recommendedFormat,
      maxConcurrentLoads,
      enableLazyLoading,
      enableProgressiveLoading,
    };
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizationCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    entries: number;
    hitRate: number;
  } {
    return {
      size: this.optimizationCache.size,
      entries: this.optimizationCache.size,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

/**
 * Lazy Image Loader
 */
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages: Set<string> = new Set();

  constructor() {
    this.initializeIntersectionObserver();
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeIntersectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      return; // Fallback for older browsers
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );
  }

  /**
   * Observe an image for lazy loading
   */
  observe(img: HTMLImageElement): void {
    if (this.loadedImages.has(img.src)) {
      return; // Already loaded
    }

    if (this.observer) {
      this.observer.observe(img);
    } else {
      // Fallback: load immediately
      this.loadImage(img);
    }
  }

  /**
   * Load an image
   */
  private loadImage(img: HTMLImageElement): void {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.classList.add('loaded');
      this.loadedImages.add(img.src);
    }
  }

  /**
   * Stop observing all images
   */
  disconnect(): void {
    this.observer?.disconnect();
  }
}

/**
 * Global optimizer instance
 */
let globalAssetOptimizer: AssetOptimizer | null = null;

/**
 * Get or create global asset optimizer
 */
export function getAssetOptimizer(): AssetOptimizer {
  if (!globalAssetOptimizer) {
    globalAssetOptimizer = new AssetOptimizer();
  }
  return globalAssetOptimizer;
}

/**
 * Get global lazy image loader
 */
export function getLazyImageLoader(): LazyImageLoader {
  return new LazyImageLoader();
}

/**
 * Utility function to optimize and load an image
 */
export async function loadOptimizedImage(
  url: string,
  options: AssetOptimizationOptions = {}
): Promise<HTMLImageElement> {
  const optimizer = getAssetOptimizer();
  const optimization = await optimizer.optimizeImageUrl(url, options);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = optimization.optimizedUrl;
  });
}

export const assetOptimizationUtils = {
  AssetOptimizer,
  LazyImageLoader,
  getAssetOptimizer,
  getLazyImageLoader,
  loadOptimizedImage,
};

export default assetOptimizationUtils;