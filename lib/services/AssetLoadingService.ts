/**
 * Asset Loading Service
 *
 * Manages progressive loading of map assets with fallback mechanisms,
 * retry logic, and performance monitoring.
 */

import type {
  AssetLoadingState,
  AssetLoadingContext,
  AssetError,
  ErrorRecoveryStrategy,
  PerformanceReport,
  AssetPerformanceMetrics,
  AssetLoadingService as IAssetLoadingService
} from '@/types/assets';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAssetCache, type CacheEntry } from '@/lib/services/asset-cache';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getAssetOptimizer, type AssetOptimizationOptions } from '@/lib/utils/asset-optimization';

// Debug configuration - set to false to reduce console spam
const DEBUG_ASSET_LOADING = false;

export class AssetLoadingService implements IAssetLoadingService {
  private loadingStates: Map<string, AssetLoadingState> = new Map();
  private loadingQueue: string[] = [];
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private performanceMetrics: Map<string, AssetPerformanceMetrics> = new Map();
  private completedCritical: boolean = false;
  private errorCount: number = 0;
  private assetCache = getAssetCache();
  private assetOptimizer = getAssetOptimizer();
  private criticalAssets = new Set<string>();

  // Configuration
  private readonly config = {
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutDuration: 5000,
    enablePreloading: true,
    criticalAssets: ['location', 'character', 'burn', 'death', 'fight']
  };

  // Default fallback assets
  private readonly fallbackAssets: Map<string, string> = new Map([
    ['location', '/images/map-icons/icon_location.png'],
    ['burn', '/images/map-icons/icon_burn.png'],
    ['death', '/images/map-icons/icon_death.png'],
    ['fight', '/images/map-icons/icon_fight.png'],
    ['character', '/images/map-icons/icon_youarehere.png']
  ]);

  /**
   * Load a single asset with progressive fallbacks, caching, and optimization
   *
   * This method implements a 4-stage loading strategy:
   * 1. Check if asset is already loaded/in-progress
   * 2. Attempt cache retrieval (instant load)
   * 3. Perform network load with optimization
   * 4. Handle errors with fallback mechanisms
   *
   * @param assetId - Unique identifier for the asset (e.g., 'location', 'character')
   * @returns Promise<AssetLoadingState> - Complete loading state with timing and error information
   */
  async loadAsset(assetId: string): Promise<AssetLoadingState> {
    // Stage 1: Check if asset is already being loaded or completed
    // This prevents duplicate network requests for the same asset
    const existingState = this.loadingStates.get(assetId);
    if (existingState && (existingState.status === 'loaded' || existingState.status === 'loading')) {
      return existingState;
    }

    // Stage 2: Check cache first for instant retrieval
    // Cache hits provide immediate response with 0ms load time
    const cachedAsset = this.assetCache.get<{ url: string }>(assetId);
    if (cachedAsset) {
      const cachedState: AssetLoadingState = {
        assetId,
        status: 'loaded',
        loadStartTime: Date.now(),
        loadEndTime: Date.now(),
        loadTime: 0, // Instant from cache - key performance metric
        retryCount: 0,
        usedFallback: false,
        cached: true, // Flag to indicate cache usage
        url: cachedAsset.url
      };

      this.loadingStates.set(assetId, cachedState);
      return cachedState;
    }

    // Stage 3: Initialize loading state for network request
    // This tracks the loading progress for UI feedback and error handling
    const loadingState: AssetLoadingState = {
      assetId,
      status: 'loading',
      loadStartTime: Date.now(), // Start timing for performance metrics
      retryCount: 0,
      usedFallback: false
    };

    this.loadingStates.set(assetId, loadingState);

    try {
      // Stage 4: Attempt network load with optimization
      await this.attemptAssetLoad(assetId);

      // Cache the successfully loaded asset with priority-based TTL
      // Critical assets get longer cache time (2 hours vs 30 minutes)
      const priority = this.config.criticalAssets.includes(assetId) ? 'critical' : 'normal';
      const assetUrl = this.getAssetUrl(assetId);
      const loadedState = this.loadingStates.get(assetId)!;
      this.assetCache.set(assetId, { url: assetUrl }, {
        priority,
        ttl: priority === 'critical' ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000,
        size: this.estimateAssetSize({ url: assetUrl })
      });

      // Update loaded state with URL
      loadedState.url = assetUrl;

      return loadedState;
    } catch (error) {
      // Error handling with progressive fallbacks
      return this.handleLoadError(assetId, error as Error);
    }
  }

  /**
   * Load multiple assets in parallel
   */
  async loadAssets(assetIds: string[]): Promise<AssetLoadingState[]> {
    const loadPromises = assetIds.map(id => this.loadAsset(id));
    return Promise.all(loadPromises);
  }

  /**
   * Preload critical assets with optimization and caching
   */
  async preloadCriticalAssets(): Promise<void> {
    if (!this.config.enablePreloading) return;

    const criticalAssets = this.config.criticalAssets;

    // Mark critical assets for priority handling
    criticalAssets.forEach(asset => this.criticalAssets.add(asset));

    try {
      // Use asset optimizer for preloading
      const criticalUrls = criticalAssets.map(assetId =>
        this.getAssetUrl(assetId)
      );

      // Preload with optimization
      await this.assetOptimizer.preloadCriticalAssets(criticalUrls);

      // Load with high priority
      await this.loadAssets(criticalAssets);

      this.completedCritical = true;
      if (DEBUG_ASSET_LOADING) console.log(`[AssetLoadingService] Preloaded ${criticalAssets.length} critical assets`);
    } catch (error) {
      if (DEBUG_ASSET_LOADING) console.warn('[AssetLoadingService] Failed to preload critical assets:', error);
    }
  }

  /**
   * Load non-critical assets with lazy loading strategy
   */
  async loadNonCriticalAssets(assetIds: string[]): Promise<void> {
    const nonCriticalAssets = assetIds.filter(id => !this.criticalAssets.has(id));

    // Add to loading queue with lower priority
    const loadPromises = nonCriticalAssets.map(async (assetId) => {
      // Add delay to prioritize critical assets
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.loadAsset(assetId);
    });

    await Promise.allSettled(loadPromises);
  }

  /**
   * Get current loading state for an asset
   */
  getAssetState(assetId: string): AssetLoadingState | undefined {
    return this.loadingStates.get(assetId);
  }

  /**
   * Estimate asset size for caching
   */
  private estimateAssetSize(asset: any): number {
    if (asset.size) {
      return asset.size;
    }
    if (asset.src) {
      // Rough estimate based on typical icon sizes
      return 1024; // 1KB default estimate
    }
    return 512; // Minimal estimate
  }

  /**
   * Retry loading a failed asset
   */
  async retryAsset(assetId: string): Promise<AssetLoadingState> {
    const currentState = this.loadingStates.get(assetId);
    if (!currentState) {
      return this.loadAsset(assetId);
    }

    if (currentState.status === 'loaded') {
      return currentState;
    }

    // Clear any existing retry timer
    const existingTimer = this.retryTimers.get(assetId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.retryTimers.delete(assetId);
    }

    currentState.status = 'retrying';
    currentState.retryCount++;

    try {
      await this.attemptAssetLoad(assetId);
      return this.loadingStates.get(assetId)!;
    } catch (error) {
      return this.handleLoadError(assetId, error as Error);
    }
  }

  /**
   * Get performance metrics for all assets
   */
  getPerformanceMetrics(): PerformanceReport {
    const totalAssets = this.loadingStates.size;
    const loadedAssets = Array.from(this.loadingStates.values()).filter(
      state => state.status === 'loaded'
    ).length;
    const failedAssets = Array.from(this.loadingStates.values()).filter(
      state => state.status === 'failed'
    ).length;

    const allMetrics = Array.from(this.performanceMetrics.values());
    const averageLoadTime = allMetrics.length > 0
      ? allMetrics.reduce((sum, metric) => sum + metric.loadTime, 0) / allMetrics.length
      : 0;

    const criticalMetrics = allMetrics.filter(metric =>
      this.config.criticalAssets.includes(metric.assetId)
    );
    const criticalAssetsLoadTime = criticalMetrics.length > 0
      ? criticalMetrics.reduce((sum, metric) => sum + metric.loadTime, 0) / criticalMetrics.length
      : 0;

    const cacheHitRate = allMetrics.length > 0
      ? allMetrics.reduce((sum, metric) => sum + metric.cacheHitRate, 0) / allMetrics.length
      : 0;

    const errorRate = totalAssets > 0 ? (failedAssets / totalAssets) * 100 : 0;

    return {
      totalAssets,
      loadedAssets,
      failedAssets,
      averageLoadTime,
      criticalAssetsLoadTime,
      cacheHitRate,
      errorRate,
      timestamp: Date.now()
    };
  }

  /**
   * Get loading context for React components
   */
  getLoadingContext(): AssetLoadingContext {
    return {
      assets: new Map(this.loadingStates),
      loadingQueue: [...this.loadingQueue],
      completedCritical: this.completedCritical,
      errorCount: this.errorCount
    };
  }

  /**
   * Attempt to load an asset with timeout
   */
  private async attemptAssetLoad(assetId: string): Promise<void> {
    const startTime = Date.now();

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Asset load timeout'));
      }, this.config.timeoutDuration);

      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Asset load failed'));
      };

      // Use flat structure paths
      const iconUrl = this.getAssetUrl(assetId);
      img.src = iconUrl;
    });

    await loadPromise;

    // Update loading state on success
    const loadTime = Date.now() - startTime;
    const loadingState = this.loadingStates.get(assetId)!;
    loadingState.status = 'loaded';
    loadingState.loadEndTime = Date.now();

    // Update performance metrics
    this.updatePerformanceMetrics(assetId, loadTime, true);
  }

  /**
   * Handle asset loading errors with progressive fallbacks
   *
   * This method implements intelligent error recovery with multiple strategies:
   * 1. Classify error type (network, timeout, 404, unknown)
   * 2. Determine recovery strategy based on error classification
   * 3. Apply fallback mechanisms when retries are exhausted
   * 4. Schedule retry attempts with exponential backoff
   * 5. Update performance metrics for monitoring
   *
   * @param assetId - The asset ID that failed to load
   * @param error - The error object from the failed load attempt
   * @returns AssetLoadingState - Updated loading state with error information
   */
  private handleLoadError(assetId: string, error: Error): AssetLoadingState {
    const loadingState = this.loadingStates.get(assetId)!;
    loadingState.lastError = error.message;
    loadingState.loadEndTime = Date.now();

    // Create structured error object for intelligent handling
    const assetError: AssetError = {
      assetId,
      errorType: this.classifyError(error), // Categorize error for appropriate response
      errorMessage: error.message,
      timestamp: Date.now(),
      retryCount: loadingState.retryCount,
      canRetry: loadingState.retryCount < this.config.retryAttempts
    };

    // Determine recovery strategy based on error type
    // Different errors require different handling approaches
    const strategy = this.getErrorRecoveryStrategy(assetError.errorType);

    // Use fallback asset if retries are exhausted or fallback is forced
    if (strategy.useFallback && loadingState.retryCount >= strategy.maxRetries) {
      return this.useFallbackAsset(assetId);
    }

    // Immediate fallback if retry is not possible (e.g., 404 errors)
    if (strategy.useFallback && !assetError.canRetry) {
      return this.useFallbackAsset(assetId);
    }

    // Schedule retry attempt with exponential backoff if recovery is possible
    // This prevents overwhelming the server with rapid retries
    if (assetError.canRetry && strategy.retryDelay > 0) {
      const timer = setTimeout(() => {
        this.retryAsset(assetId);
      }, strategy.retryDelay);
      this.retryTimers.set(assetId, timer);
    }

    // Mark as permanently failed if no more retries are available
    // This is the final failure state for the asset
    if (!assetError.canRetry) {
      loadingState.status = 'failed';
      this.errorCount++; // Track total errors for monitoring
      this.updatePerformanceMetrics(assetId, Date.now() - loadingState.loadStartTime, false);
    }

    return loadingState;
  }

  /**
   * Use fallback asset
   */
  private useFallbackAsset(assetId: string): AssetLoadingState {
    const loadingState = this.loadingStates.get(assetId)!;
    const fallbackUrl = this.fallbackAssets.get(assetId);

    if (fallbackUrl) {
      // Try to load fallback asset
      const img = new Image();
      img.onload = () => {
        loadingState.status = 'fallback';
        loadingState.usedFallback = true;
        loadingState.loadEndTime = Date.now();
      };
      img.onerror = () => {
        loadingState.status = 'failed';
        loadingState.usedFallback = true;
        this.errorCount++;
      };
      img.src = fallbackUrl;
    } else {
      loadingState.status = 'failed';
      this.errorCount++;
    }

    return loadingState;
  }

  /**
   * Get asset URL based on flat structure
   *
   * SECURITY: This method validates asset IDs to prevent path traversal attacks.
   * Only predefined asset IDs are allowed. Any unknown assetId returns the default icon.
   */
  private getAssetUrl(assetId: string): string {
    // Validate assetId to prevent path traversal attacks
    if (!this.isValidAssetId(assetId)) {
      if (DEBUG_ASSET_LOADING) console.warn(`[AssetLoadingService] Invalid asset ID detected: ${assetId}. Using fallback.`);
      return this.fallbackAssets.get('location') || '/images/mapicons/icon_location.png';
    }

    // Map asset IDs to flat structure paths - only allow known assets
    const assetPaths: Record<string, string> = {
      'location': '/images/mapicons/icon_location.png',
      'character': '/images/mapicons/icon_youarehere.png',
      'burn': '/images/mapicons/icon_burn.png',
      'death': '/images/mapicons/icon_death.png',
      'fight': '/images/mapicons/icon_fight.png',
      'legend_location_on': '/images/legendicons/legend_icon_location_on.png',
      'legend_location_off': '/images/legendicons/legend_icon_location_off.png',
      'legend_burn_on': '/images/legendicons/legend_icon_burn_on.png',
      'legend_burn_off': '/images/legendicons/legend_icon_burn_off.png',
      'legend_death_on': '/images/legendicons/legend_icon_death_on.png',
      'legend_death_off': '/images/legendicons/legend_icon_death_off.png',
      'legend_fight_on': '/images/legendicons/legend_icon_fight_on.png',
      'legend_fight_off': '/images/legendicons/legend_icon_fight_off.png'
    };

    return assetPaths[assetId] || this.fallbackAssets.get('location') || '/images/mapicons/icon_location.png';
  }

  /**
   * Validate asset ID to prevent path traversal and injection attacks
   *
   * This method ensures that only valid, predefined asset IDs are allowed.
   * It blocks:
   * - Path traversal attempts (../../../etc/passwd)
   * - Script injection (<script>alert('xss')</script>)
   * - Invalid characters and patterns
   *
   * @param assetId - The asset ID to validate
   * @returns boolean - True if the asset ID is valid and safe
   */
  private isValidAssetId(assetId: string): boolean {
    // Asset ID must be a non-empty string
    if (!assetId || typeof assetId !== 'string') {
      return false;
    }

    // Define allowed pattern: alphanumeric, underscore, and hyphen only
    const validPattern = /^[a-zA-Z0-9_-]+$/;

    // Check if the assetId matches the allowed pattern
    if (!validPattern.test(assetId)) {
      return false;
    }

    // Check for path traversal attempts
    if (assetId.includes('..') || assetId.includes('/') || assetId.includes('\\')) {
      return false;
    }

    // Check for script injection attempts
    if (assetId.toLowerCase().includes('<script') ||
        assetId.toLowerCase().includes('javascript:') ||
        assetId.toLowerCase().includes('data:')) {
      return false;
    }

    // Define maximum length to prevent buffer overflow attempts
    if (assetId.length > 50) {
      return false;
    }

    // Ensure the asset ID is in our allowed list (whitelist approach)
    const allowedAssetIds = new Set([
      'location', 'character', 'burn', 'death', 'fight',
      'legend_location_on', 'legend_location_off',
      'legend_burn_on', 'legend_burn_off',
      'legend_death_on', 'legend_death_off',
      'legend_fight_on', 'legend_fight_off'
    ]);

    return allowedAssetIds.has(assetId);
  }

  /**
   * Classify error type
   */
  private classifyError(error: Error): AssetError['errorType'] {
    if (error.message.includes('timeout')) return 'timeout';
    if (error.message.includes('404') || error.message.includes('not found')) return 'file_not_found';
    if (error.message.includes('network') || error.message.includes('fetch')) return 'network';
    return 'unknown';
  }

  /**
   * Get error recovery strategy
   */
  private getErrorRecoveryStrategy(errorType: AssetError['errorType']): ErrorRecoveryStrategy {
    const strategies: Record<AssetError['errorType'], ErrorRecoveryStrategy> = {
      network: {
        errorType: 'network',
        maxRetries: 3,
        retryDelay: 1000,
        useFallback: true,
        logError: true
      },
      file_not_found: {
        errorType: 'file_not_found',
        maxRetries: 1,
        retryDelay: 0,
        useFallback: true,
        logError: true
      },
      corruption: {
        errorType: 'corruption',
        maxRetries: 1,
        retryDelay: 500,
        useFallback: true,
        logError: true
      },
      timeout: {
        errorType: 'timeout',
        maxRetries: 2,
        retryDelay: 2000,
        useFallback: true,
        logError: true
      },
      unknown: {
        errorType: 'unknown',
        maxRetries: 2,
        retryDelay: 1500,
        useFallback: true,
        logError: true
      }
    };

    return strategies[errorType];
  }

  /**
   * Update performance metrics for an asset
   */
  private updatePerformanceMetrics(assetId: string, loadTime: number, success: boolean): void {
    const existing = this.performanceMetrics.get(assetId) || {
      assetId,
      loadTime: 0,
      cacheHitRate: 0,
      failureRate: 0,
      averageRetryCount: 0,
      memoryUsage: 0
    };

    // Update metrics with exponential moving average
    const alpha = 0.3; // Smoothing factor
    existing.loadTime = existing.loadTime * (1 - alpha) + loadTime * alpha;
    existing.failureRate = existing.failureRate * (1 - alpha) + (success ? 0 : 100) * alpha;

    const loadingState = this.loadingStates.get(assetId);
    if (loadingState) {
      existing.averageRetryCount = existing.averageRetryCount * (1 - alpha) + loadingState.retryCount * alpha;
    }

    this.performanceMetrics.set(assetId, existing);
  }

  /**
   * Clear all loading states and caches
   */
  clearCache(): void {
    this.loadingStates.clear();
    this.loadingQueue = [];
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();
    this.performanceMetrics.clear();
    this.completedCritical = false;
    this.errorCount = 0;
  }
}

// Singleton instance
let assetLoadingServiceInstance: AssetLoadingService | null = null;

export function getAssetLoadingService(): AssetLoadingService {
  if (!assetLoadingServiceInstance) {
    assetLoadingServiceInstance = new AssetLoadingService();
  }
  return assetLoadingServiceInstance;
}