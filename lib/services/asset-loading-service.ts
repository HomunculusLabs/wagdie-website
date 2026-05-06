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
import { getAssetCache } from '@/lib/services/asset-cache';
import { getAssetOptimizer } from '@/lib/utils/asset-optimization';
import { isAllowedAssetId } from '@/lib/services/assets/asset-ids';
import {
  getAssetUrl as getAssetUrlFromPolicy,
  getFallbackUrl,
  getRecoveryStrategy,
} from '@/lib/services/assets/asset-policy';
import { classifyAssetError, buildAssetError } from '@/lib/services/assets/asset-errors';
import { loadImageWithTimeout } from '@/lib/services/assets/image-loader';

// Debug configuration - set to false to reduce console spam
const DEBUG_ASSET_LOADING = false;

export class AssetLoadingService implements IAssetLoadingService {
  private loadingStates: Map<string, AssetLoadingState> = new Map();
  private loadingQueue: string[] = [];
  private retryTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private delayTimers: Map<ReturnType<typeof setTimeout>, () => void> = new Map();
  private performanceMetrics: Map<string, AssetPerformanceMetrics> = new Map();
  private lifecycleVersion = 0;
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
    if (
      existingState &&
      (
        existingState.status === 'loaded' ||
        existingState.status === 'loading' ||
        existingState.status === 'retrying' ||
        this.retryTimers.has(assetId)
      )
    ) {
      return existingState;
    }

    // Stage 2: Check cache first for instant retrieval
    // Cache hits provide immediate response with 0ms load time
    const cachedAsset = this.assetCache.get<{ url: string; size?: number }>(assetId);
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

    if (typeof Image === 'undefined') {
      const unavailableState = this.buildCancelledState(
        assetId,
        loadingState.loadStartTime,
        'Image API is unavailable in this runtime'
      );
      this.loadingStates.set(assetId, unavailableState);
      this.errorCount++;
      this.updatePerformanceMetrics(assetId, unavailableState.loadTime ?? 0, false);
      return unavailableState;
    }

    const lifecycleVersion = this.lifecycleVersion;
    this.loadingStates.set(assetId, loadingState);

    try {
      // Stage 4: Attempt network load with optimization
      const result = await this.attemptAssetLoad(assetId, lifecycleVersion);

      if (result.cancelled) {
        return this.buildCancelledState(assetId, loadingState.loadStartTime);
      }

      // Cache the successfully loaded asset with priority-based TTL
      // Critical assets get longer cache time (2 hours vs 30 minutes)
      const priority = this.config.criticalAssets.includes(assetId) ? 'critical' : 'normal';
      this.assetCache.set(
        assetId,
        { url: result.url, size: result.size },
        {
          priority,
          ttl: priority === 'critical' ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000,
          size: result.size ?? this.estimateAssetSize({ src: result.url, size: result.size })
        }
      );

      // Ensure consumers always have a URL on success (even if they never consult the cache)
      const loadedState = this.loadingStates.get(assetId);
      if (!loadedState) {
        return this.buildCancelledState(assetId, loadingState.loadStartTime);
      }
      loadedState.url = result.url;

      return loadedState;
    } catch (error) {
      if (lifecycleVersion !== this.lifecycleVersion || !this.loadingStates.has(assetId)) {
        return this.buildCancelledState(assetId, loadingState.loadStartTime);
      }

      // Error handling with progressive fallbacks
      return this.handleLoadError(assetId, error as Error, lifecycleVersion);
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
    const lifecycleVersion = this.lifecycleVersion;
    const loadPromises = nonCriticalAssets.map(async (assetId) => {
      // Add delay to prioritize critical assets
      await this.delay(100);
      if (lifecycleVersion !== this.lifecycleVersion) return undefined;
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
   * Get asset URL for a given asset ID
   */


  /**
   * Estimate asset size for caching
   */
  private estimateAssetSize(asset: { size?: number; src?: string }): number {
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

    if (typeof Image === 'undefined') {
      return this.buildCancelledState(
        assetId,
        currentState.loadStartTime,
        'Image API is unavailable in this runtime'
      );
    }

    currentState.status = 'retrying';
    currentState.retryCount++;

    const lifecycleVersion = this.lifecycleVersion;

    try {
      const result = await this.attemptAssetLoad(assetId, lifecycleVersion);
      const latestState = this.loadingStates.get(assetId);
      if (result.cancelled || !latestState) {
        return this.buildCancelledState(assetId, currentState.loadStartTime);
      }

      return latestState;
    } catch (error) {
      if (lifecycleVersion !== this.lifecycleVersion || !this.loadingStates.has(assetId)) {
        return this.buildCancelledState(assetId, currentState.loadStartTime);
      }

      return this.handleLoadError(assetId, error as Error, lifecycleVersion);
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
  private async attemptAssetLoad(
    assetId: string,
    lifecycleVersion: number
  ): Promise<{ url: string; size?: number; cancelled?: boolean }> {
    const startTime = Date.now();
    const iconUrl = this.getAssetUrl(assetId);

    await loadImageWithTimeout(iconUrl, this.config.timeoutDuration);

    const result = { url: iconUrl, size: 0 };

    if (lifecycleVersion !== this.lifecycleVersion) {
      return { ...result, cancelled: true };
    }

    // Update loading state on success
    const loadTime = Date.now() - startTime;
    const loadingState = this.loadingStates.get(assetId);
    if (!loadingState) {
      return { ...result, cancelled: true };
    }
    loadingState.status = 'loaded';
    loadingState.loadEndTime = Date.now();
    loadingState.loadTime = loadTime;
    loadingState.url = result.url;

    // Update performance metrics
    this.updatePerformanceMetrics(assetId, loadTime, true);

    return result;
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
  private handleLoadError(assetId: string, error: Error, lifecycleVersion: number): AssetLoadingState {
    const loadingState = this.loadingStates.get(assetId);
    if (!loadingState || lifecycleVersion !== this.lifecycleVersion) {
      return this.buildCancelledState(assetId);
    }
    loadingState.lastError = error.message;
    loadingState.loadEndTime = Date.now();

    // Create structured error object for intelligent handling
    const assetError: AssetError = buildAssetError({
      assetId,
      error,
      retryCount: loadingState.retryCount,
      retryAttempts: this.config.retryAttempts,
    });

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
        this.retryTimers.delete(assetId);
        void this.retryAsset(assetId);
      }, strategy.retryDelay);
      this.retryTimers.set(assetId, timer);
      loadingState.status = 'retrying';
      return loadingState;
    }

    // Mark as permanently failed if no more retries are available
    // This is the final failure state for the asset
    loadingState.status = 'failed';

    if (!assetError.canRetry) {
      this.errorCount++; // Track total errors for monitoring
      this.updatePerformanceMetrics(assetId, Date.now() - loadingState.loadStartTime, false);
    }

    return loadingState;
  }

  private buildCancelledState(
    assetId: string,
    loadStartTime: number = Date.now(),
    lastError: string = 'Asset load cancelled'
  ): AssetLoadingState {
    const loadEndTime = Date.now();

    return {
      assetId,
      status: 'failed',
      loadStartTime,
      loadEndTime,
      loadTime: loadEndTime - loadStartTime,
      retryCount: 0,
      lastError,
      usedFallback: false,
    };
  }

  /**
   * Use fallback asset
   */
  private useFallbackAsset(assetId: string): AssetLoadingState {
    const loadingState = this.loadingStates.get(assetId)!;

    const fallbackUrl = isAllowedAssetId(assetId)
      ? getFallbackUrl(assetId)
      : getFallbackUrl('location');

    loadingState.usedFallback = true;
    loadingState.url = fallbackUrl;

    if (typeof Image === 'undefined') {
      loadingState.status = 'fallback';
      loadingState.loadEndTime = Date.now();
      loadingState.loadTime = loadingState.loadEndTime - loadingState.loadStartTime;
      return loadingState;
    }

    // Try to load fallback asset
    const img = new Image();
    img.onload = () => {
      loadingState.status = 'fallback';
      loadingState.loadEndTime = Date.now();
      loadingState.loadTime = loadingState.loadEndTime - loadingState.loadStartTime;
    };
    img.onerror = () => {
      loadingState.status = 'failed';
      this.errorCount++;
    };
    img.src = fallbackUrl;

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
      return getFallbackUrl('location');
    }

    return getAssetUrlFromPolicy(assetId);
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
  private isValidAssetId(assetId: string): assetId is import('@/types/assets').IconType {
    // Asset ID must be a non-empty string
    return isAllowedAssetId(assetId);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        this.delayTimers.delete(timer);
        resolve();
      }, ms);

      this.delayTimers.set(timer, resolve);
    });
  }

  /**
   * Classify error type
   */
  private classifyError(error: Error): AssetError['errorType'] {
    return classifyAssetError(error);
  }

  /**
   * Get error recovery strategy
   */
  private getErrorRecoveryStrategy(errorType: AssetError['errorType']): ErrorRecoveryStrategy {
    return getRecoveryStrategy(errorType);
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
    this.lifecycleVersion++;
    this.loadingStates.clear();
    this.loadingQueue = [];
    this.retryTimers.forEach(timer => clearTimeout(timer));
    this.retryTimers.clear();
    this.delayTimers.forEach((resolve, timer) => {
      clearTimeout(timer);
      resolve();
    });
    this.delayTimers.clear();
    this.performanceMetrics.clear();
    this.criticalAssets.clear();
    this.assetCache.clear();
    this.assetOptimizer.clearCache();
    this.completedCritical = false;
    this.errorCount = 0;
  }

  /**
   * Destroy service-owned lifecycle resources.
   */
  destroy(): void {
    this.clearCache();
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