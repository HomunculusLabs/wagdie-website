/**
 * Asset Performance Utilities
 *
 * Provides performance monitoring and optimization utilities
 * for asset loading operations.
 */

import type {
  AssetPerformanceMetrics,
  PerformanceReport,
  AssetLoadingState
} from '@/types/assets';

export interface PerformanceOptions {
  enableDetailedMetrics?: boolean;
  enableMemoryMonitoring?: boolean;
  metricsHistorySize?: number;
  alertThresholds?: {
    loadTime: number; // ms
    errorRate: number; // percentage
    memoryUsage: number; // bytes
  };
}

// Debug configuration - set to false to reduce console spam
const DEBUG_PERFORMANCE_MONITORING = false;

export class AssetPerformanceMonitor {
  private options: Required<PerformanceOptions>;
  private metricsHistory: PerformanceReport[] = [];
  private assetMetrics: Map<string, AssetPerformanceMetrics> = new Map();
  private startTime: number = Date.now();

  constructor(options: PerformanceOptions = {}) {
    this.options = {
      enableDetailedMetrics: options.enableDetailedMetrics ?? true,
      enableMemoryMonitoring: options.enableMemoryMonitoring ?? false,
      metricsHistorySize: options.metricsHistorySize ?? 50,
      alertThresholds: options.alertThresholds || {
        loadTime: 2000, // 2 seconds
        errorRate: 10,   // 10%
        memoryUsage: 50 * 1024 * 1024 // 50MB
      }
    };
  }

  /**
   * Record asset load completion
   */
  recordAssetLoad(assetId: string, loadTime: number, success: boolean, retryCount: number = 0): void {
    const existing = this.assetMetrics.get(assetId) || {
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
    existing.averageRetryCount = existing.averageRetryCount * (1 - alpha) + retryCount * alpha;

    // Monitor memory usage if enabled
    if (this.options.enableMemoryMonitoring && this.options.enableDetailedMetrics) {
      existing.memoryUsage = this.estimateMemoryUsage(assetId);
    }

    this.assetMetrics.set(assetId, existing);

    // Check for performance alerts
    this.checkPerformanceAlerts(existing);
  }

  /**
   * Record cache hit
   */
  recordCacheHit(assetId: string): void {
    const existing = this.assetMetrics.get(assetId);
    if (existing) {
      const alpha = 0.1; // Slower smoothing for cache hit rate
      existing.cacheHitRate = Math.min(100, existing.cacheHitRate * (1 - alpha) + 100 * alpha);
      this.assetMetrics.set(assetId, existing);
    }
  }

  /**
   * Record cache miss
   */
  recordCacheMiss(assetId: string): void {
    const existing = this.assetMetrics.get(assetId);
    if (existing) {
      const alpha = 0.1; // Slower smoothing for cache hit rate
      existing.cacheHitRate = existing.cacheHitRate * (1 - alpha) + 0 * alpha;
      this.assetMetrics.set(assetId, existing);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(assetStates?: Map<string, AssetLoadingState>): PerformanceReport {
    const allMetrics = Array.from(this.assetMetrics.values());
    const totalAssets = allMetrics.length;

    if (totalAssets === 0) {
      return {
        totalAssets: 0,
        loadedAssets: 0,
        failedAssets: 0,
        averageLoadTime: 0,
        criticalAssetsLoadTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        timestamp: Date.now()
      };
    }

    // Calculate loaded/failed counts if states provided
    let loadedAssets = 0;
    let failedAssets = 0;

    if (assetStates) {
      assetStates.forEach(state => {
        if (state.status === 'loaded') loadedAssets++;
        if (state.status === 'failed') failedAssets++;
      });
    } else {
      // Estimate from metrics
      loadedAssets = allMetrics.filter(m => m.failureRate < 50).length;
      failedAssets = totalAssets - loadedAssets;
    }

    // Calculate averages
    const averageLoadTime = allMetrics.reduce((sum, m) => sum + m.loadTime, 0) / totalAssets;
    const cacheHitRate = allMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / totalAssets;
    const errorRate = (failedAssets / totalAssets) * 100;

    // Critical assets performance (location, character, burn, death, fight)
    const criticalAssetIds = ['location', 'character', 'burn', 'death', 'fight'];
    const criticalMetrics = allMetrics.filter(m => criticalAssetIds.includes(m.assetId));
    const criticalAssetsLoadTime = criticalMetrics.length > 0
      ? criticalMetrics.reduce((sum, m) => sum + m.loadTime, 0) / criticalMetrics.length
      : 0;

    const report: PerformanceReport = {
      totalAssets,
      loadedAssets,
      failedAssets,
      averageLoadTime,
      criticalAssetsLoadTime,
      cacheHitRate,
      errorRate,
      timestamp: Date.now()
    };

    // Store in history
    this.addToHistory(report);

    return report;
  }

  /**
   * Get metrics for specific asset
   */
  getAssetMetrics(assetId: string): AssetPerformanceMetrics | undefined {
    return this.assetMetrics.get(assetId);
  }

  /**
   * Get all asset metrics
   */
  getAllAssetMetrics(): AssetPerformanceMetrics[] {
    return Array.from(this.assetMetrics.values());
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceReport[] {
    return [...this.metricsHistory];
  }

  /**
   * Get slow loading assets
   */
  getSlowAssets(threshold?: number): AssetPerformanceMetrics[] {
    const loadTimeThreshold = threshold || this.options.alertThresholds.loadTime;
    return Array.from(this.assetMetrics.values()).filter(
      metric => metric.loadTime > loadTimeThreshold
    );
  }

  /**
   * Get high error rate assets
   */
  getHighErrorRateAssets(threshold?: number): AssetPerformanceMetrics[] {
    const errorRateThreshold = threshold || this.options.alertThresholds.errorRate;
    return Array.from(this.assetMetrics.values()).filter(
      metric => metric.failureRate > errorRateThreshold
    );
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.assetMetrics.clear();
    this.metricsHistory = [];
    this.startTime = Date.now();
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    uptime: number;
    totalAssets: number;
    averageLoadTime: number;
    cacheHitRate: number;
    errorRate: number;
    slowAssets: number;
    highErrorAssets: number;
  } {
    const latestReport = this.metricsHistory[this.metricsHistory.length - 1];
    const slowAssets = this.getSlowAssets().length;
    const highErrorAssets = this.getHighErrorRateAssets().length;

    return {
      uptime: Date.now() - this.startTime,
      totalAssets: this.assetMetrics.size,
      averageLoadTime: latestReport?.averageLoadTime || 0,
      cacheHitRate: latestReport?.cacheHitRate || 0,
      errorRate: latestReport?.errorRate || 0,
      slowAssets,
      highErrorAssets
    };
  }

  /**
   * Add report to history
   */
  private addToHistory(report: PerformanceReport): void {
    this.metricsHistory.push(report);

    // Maintain history size limit
    if (this.metricsHistory.length > this.options.metricsHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.options.metricsHistorySize);
    }
  }

  /**
   * Check for performance alerts
   */
  private checkPerformanceAlerts(metrics: AssetPerformanceMetrics): void {
    const { alertThresholds } = this.options;

    // Load time alert
    if (metrics.loadTime > alertThresholds.loadTime) {
      if (DEBUG_PERFORMANCE_MONITORING) console.warn(`[Performance Alert] Asset ${metrics.assetId} load time (${metrics.loadTime}ms) exceeds threshold (${alertThresholds.loadTime}ms)`);
    }

    // Error rate alert
    if (metrics.failureRate > alertThresholds.errorRate) {
      if (DEBUG_PERFORMANCE_MONITORING) console.warn(`[Performance Alert] Asset ${metrics.assetId} error rate (${metrics.failureRate.toFixed(1)}%) exceeds threshold (${alertThresholds.errorRate}%)`);
    }

    // Memory usage alert
    if (this.options.enableMemoryMonitoring && metrics.memoryUsage > alertThresholds.memoryUsage) {
      if (DEBUG_PERFORMANCE_MONITORING) console.warn(`[Performance Alert] Asset ${metrics.assetId} memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${(alertThresholds.memoryUsage / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  /**
   * Estimate memory usage for an asset
   */
  private estimateMemoryUsage(assetId: string): number {
    // Rough estimation based on asset type
    // In a real implementation, you might use performance.memory API if available

    const imageSizes: Record<string, number> = {
      'wagdiemap': 9.3 * 1024 * 1024, // 9.3MB
      'pilgrims': 487 * 1024,          // 487KB
      'location': 1 * 1024,           // ~1KB for small icons
      'character': 2.4 * 1024,        // ~2.4KB
      'default': 5 * 1024             // 5KB default estimate
    };

    for (const [key, size] of Object.entries(imageSizes)) {
      if (assetId.includes(key)) {
        return size;
      }
    }

    return imageSizes.default;
  }
}

// Singleton instance
let performanceMonitorInstance: AssetPerformanceMonitor | null = null;

export function getAssetPerformanceMonitor(options?: PerformanceOptions): AssetPerformanceMonitor {
  if (!performanceMonitorInstance) {
    performanceMonitorInstance = new AssetPerformanceMonitor(options);
  }
  return performanceMonitorInstance;
}

/**
 * Utility function to format load time
 */
export function formatLoadTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds.toFixed(0)}ms`;
  }
  return `${(milliseconds / 1000).toFixed(2)}s`;
}

/**
 * Utility function to format memory usage
 */
export function formatMemoryUsage(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)}KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * Utility function to get performance grade
 */
export function getPerformanceGrade(loadTime: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (loadTime < 500) return 'A';
  if (loadTime < 1000) return 'B';
  if (loadTime < 2000) return 'C';
  if (loadTime < 5000) return 'D';
  return 'F';
}