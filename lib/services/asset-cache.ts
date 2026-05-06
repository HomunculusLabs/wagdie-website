/**
 * Smart Asset Caching Service
 *
 * Implements intelligent caching strategies for map assets including:
 * - LRU (Least Recently Used) eviction
 * - Memory-aware cache sizing
 * - Priority-based caching
 * - Preemptive cache warming
 * - Cache performance monitoring
 */

// Debug flag - set to true for development logging
const DEBUG_ASSET_CACHE = process.env.NODE_ENV === 'development' && process.env.DEBUG_ASSET_CACHE === 'true';

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function getLocalStorage(): Storage | null {
  if (!hasWindow()) {
    return null;
  }

  try {
    return typeof window.localStorage === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
  priority: 'critical' | 'high' | 'normal' | 'low';
  ttl?: number; // Time to live in milliseconds
  url?: string; // Original asset URL
  etag?: string; // For cache validation
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes
  maxEntries: number; // Maximum number of entries
  enableCompression: boolean;
  enablePersistence: boolean;
  defaultTTL: number; // Default time to live in milliseconds
  criticalAssetTTL: number; // TTL for critical assets
  cleanupInterval: number; // Cleanup interval in milliseconds
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  compressionSavings: number;
  averageLoadTime: number;
  memoryUsage: number;
}

export interface CachePerformanceMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  totalLoadTime: number;
  compressionRatio: number;
  memoryEfficiency: number;
}

/**
 * Smart Asset Cache Implementation
 */
export class AssetCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CachePerformanceMetrics;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private memoryMonitor: MemoryMonitor | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      enableCompression: false, // Compression handled by browser
      enablePersistence: true,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      criticalAssetTTL: 2 * 60 * 60 * 1000, // 2 hours for critical assets
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      totalLoadTime: 0,
      compressionRatio: 0,
      memoryEfficiency: 0,
    };

    this.initializeCache();
  }

  /**
   * Initialize cache and start background processes
   */
  private initializeCache(): void {
    // Start cleanup timer only where timers are expected to live beyond a request.
    if (hasWindow()) {
      this.startCleanupTimer();
    }

    // Initialize memory monitoring
    if (hasWindow()) {
      this.memoryMonitor = new MemoryMonitor();
      this.memoryMonitor.onPressure = () => this.handleMemoryPressure();
    }

    // Load persisted cache if enabled
    if (this.config.enablePersistence) {
      this.loadPersistedCache();
    }
  }

  /**
   * Store an asset in cache
   */
  set<T>(
    key: string,
    data: T,
    options: {
      priority?: 'critical' | 'high' | 'normal' | 'low';
      ttl?: number;
      url?: string;
      etag?: string;
      size?: number;
    } = {}
  ): void {
    const now = Date.now();
    const size = options.size || this.estimateSize(data);

    // Check if we need to make space
    this.ensureCapacity(size);

    const ttl = options.ttl ||
      (options.priority === 'critical' ? this.config.criticalAssetTTL : this.config.defaultTTL);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      lastAccessed: now,
      accessCount: 1,
      size,
      priority: options.priority || 'normal',
      ttl,
      url: options.url,
      etag: options.etag,
    };

    this.cache.set(key, entry);

    // Persist if enabled
    if (this.config.enablePersistence && options.priority === 'critical') {
      this.persistEntry(key, entry);
    }
  }

  /**
   * Retrieve an asset from cache
   */
  get<T>(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Check if asset exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Remove an asset from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);

    if (deleted && this.config.enablePersistence) {
      this.removePersistedEntry(key);
    }

    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();

    if (this.config.enablePersistence) {
      this.clearPersistedCache();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalEntries = this.cache.size;
    const totalSize = this.calculateTotalSize();
    const totalRequests = this.stats.totalRequests || 1;

    return {
      totalEntries,
      totalSize,
      hitRate: this.stats.hits / totalRequests,
      missRate: this.stats.misses / totalRequests,
      evictionCount: this.stats.evictions,
      compressionSavings: this.stats.compressionRatio * totalSize,
      averageLoadTime: this.stats.hits > 0 ? this.stats.totalLoadTime / this.stats.hits : 0,
      memoryUsage: this.memoryMonitor?.getCurrentUsage() || 0,
    };
  }

  /**
   * Preload critical assets
   */
  async preloadCriticalAssets(
    assetUrls: string[],
    loadFn: (url: string) => Promise<unknown>
  ): Promise<void> {
    const criticalPromises = assetUrls.map(async (url) => {
      try {
        const asset = await loadFn(url);
        const key = this.generateKey(url);

        this.set(key, asset, {
          priority: 'critical',
          url,
          ttl: this.config.criticalAssetTTL,
        });

        if (DEBUG_ASSET_CACHE) console.log(`[AssetCache] Preloaded critical asset: ${url}`);
      } catch (error) {
        console.warn(`[AssetCache] Failed to preload critical asset: ${url}`, error);
      }
    });

    await Promise.allSettled(criticalPromises);
  }

  /**
   * Warm cache with predicted assets
   */
  async warmCache(predictions: Array<{
    key: string;
    url: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    probability: number;
  }>, loadFn: (url: string) => Promise<unknown>): Promise<void> {
    // Sort by probability and priority
    const sorted = predictions
      .filter(p => p.probability > 0.5) // Only load likely assets
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0 ? priorityDiff : b.probability - a.probability;
      });

    // Load top predictions based on available capacity
    const availableCapacity = this.config.maxSize - this.calculateTotalSize();
    let currentCapacity = 0;

    for (const prediction of sorted) {
      if (currentCapacity >= availableCapacity * 0.8) break; // Leave 20% buffer

      try {
        const asset = await loadFn(prediction.url);
        const size = this.estimateSize(asset);

        if (currentCapacity + size <= availableCapacity) {
          this.set(prediction.key, asset, {
            priority: prediction.priority,
            url: prediction.url,
            size,
          });

          currentCapacity += size;
        }
      } catch (error) {
        console.warn(`[AssetCache] Failed to warm cache for: ${prediction.url}`, error);
      }
    }
  }

  /**
   * Ensure cache has capacity for new entry
   */
  private ensureCapacity(requiredSize: number): void {
    const currentSize = this.calculateTotalSize();

    if (currentSize + requiredSize <= this.config.maxSize &&
        this.cache.size < this.config.maxEntries) {
      return; // Has capacity
    }

    // Sort entries by eviction priority
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => this.compareEvictionPriority(a.entry, b.entry));

    // Evict entries until we have enough space
    let freedSize = 0;
    const targetSize = this.config.maxSize * 0.8; // Target 80% utilization

    for (const { key, entry } of entries) {
      if (currentSize - freedSize + requiredSize <= targetSize &&
          this.cache.size <= this.config.maxEntries) {
        break;
      }

      this.cache.delete(key);
      freedSize += entry.size;
      this.stats.evictions++;

      if (this.config.enablePersistence) {
        this.removePersistedEntry(key);
      }
    }
  }

  /**
   * Compare entries for eviction priority
   */
  private compareEvictionPriority(a: CacheEntry, b: CacheEntry): number {
    // Priority order: low < normal < high < critical
    const priorityOrder = { low: 1, normal: 2, high: 3, critical: 4 };

    // First by priority (lower priority = higher eviction chance)
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Then by last accessed (older = higher eviction chance)
    const timeDiff = a.lastAccessed - b.lastAccessed;
    if (timeDiff !== 0) return timeDiff;

    // Finally by access count (less accessed = higher eviction chance)
    return a.accessCount - b.accessCount;
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Calculate total cache size
   */
  private calculateTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Estimate size of data
   */
  private estimateSize(data: unknown): number {
    if (typeof data === 'string') {
      return data.length * 2; // Unicode characters
    }
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return data.size;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data).length * 2;
    }
    return 100; // Default estimate
  }

  /**
   * Generate cache key from URL
   */
  private generateKey(url: string): string {
    // Create a consistent key from URL
    return url.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      if (this.config.enablePersistence) {
        this.removePersistedEntry(key);
      }
    }

    if (keysToDelete.length > 0 && DEBUG_ASSET_CACHE) {
      console.log(`[AssetCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Handle memory pressure
   */
  private handleMemoryPressure(): void {
    // Aggressively evict low priority entries
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .filter(({ entry }) => entry.priority === 'low' || entry.priority === 'normal')
      .sort((a, b) => a.entry.lastAccessed - b.entry.lastAccessed);

    const evictCount = Math.floor(entries.length * 0.5); // Evict 50% of low/normal priority

    for (let i = 0; i < evictCount; i++) {
      const { key } = entries[i];
      this.cache.delete(key);
      this.stats.evictions++;
    }

    if (DEBUG_ASSET_CACHE) console.log(`[AssetCache] Memory pressure: evicted ${evictCount} entries`);
  }

  /**
   * Persist cache entry to localStorage
   */
  private persistEntry(key: string, entry: CacheEntry): void {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      const serialized = JSON.stringify({
        data: entry.data,
        timestamp: entry.timestamp,
        priority: entry.priority,
        ttl: entry.ttl,
        url: entry.url,
        etag: entry.etag,
      });

      storage.setItem(`asset_cache_${key}`, serialized);
    } catch (error) {
      console.warn(`[AssetCache] Failed to persist entry: ${key}`, error);
    }
  }

  /**
   * Load persisted cache entries
   */
  private loadPersistedCache(): void {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const cacheKeys = keys.filter(key => key.startsWith('asset_cache_'));

      for (const storageKey of cacheKeys) {
        const key = storageKey.replace('asset_cache_', '');
        const serialized = storage.getItem(storageKey);

        if (serialized) {
          const entry = JSON.parse(serialized);

          // Check if still valid
          if (!this.isExpired(entry)) {
            this.cache.set(key, {
              ...entry,
              lastAccessed: Date.now(),
              accessCount: 1,
              size: this.estimateSize(entry.data),
            });
          } else {
            storage.removeItem(storageKey);
          }
        }
      }

      if (DEBUG_ASSET_CACHE) console.log(`[AssetCache] Loaded ${cacheKeys.length} entries from persistent cache`);
    } catch (error) {
      console.warn('[AssetCache] Failed to load persisted cache:', error);
    }
  }

  /**
   * Remove persisted entry
   */
  private removePersistedEntry(key: string): void {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      storage.removeItem(`asset_cache_${key}`);
    } catch (error) {
      console.warn(`[AssetCache] Failed to remove persisted entry: ${key}`, error);
    }
  }

  /**
   * Clear persistent cache
   */
  private clearPersistedCache(): void {
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      const keys = Object.keys(storage);
      const cacheKeys = keys.filter(key => key.startsWith('asset_cache_'));

      for (const key of cacheKeys) {
        storage.removeItem(key);
      }
    } catch (error) {
      console.warn('[AssetCache] Failed to clear persistent cache:', error);
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.memoryMonitor?.destroy();
    this.memoryMonitor = null;

    this.clear();
  }
}

/**
 * Memory Monitor for cache pressure detection
 */
class MemoryMonitor {
  public onPressure?: () => void;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private pressureThreshold = 0.8; // 80% memory usage

  constructor() {
    if (hasWindow() && typeof performance !== 'undefined' && 'memory' in performance) {
      this.startMonitoring();
    }
  }

  private startMonitoring(): void {
    this.checkInterval = setInterval(() => {
      const usage = this.getCurrentUsage();
      if (usage > this.pressureThreshold) {
        this.onPressure?.();
      }
    }, 30000); // Check every 30 seconds
  }

  getCurrentUsage(): number {
    if (hasWindow() && typeof performance !== 'undefined' && 'memory' in performance) {
      interface PerformanceWithMemory {
        memory?: {
          usedJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
      const performanceWithMemory = performance as unknown as PerformanceWithMemory;
      const memory = performanceWithMemory.memory;
      if (memory) {
        return memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }
    }
    return 0;
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

/**
 * Global cache instance
 */
let globalAssetCache: AssetCache | null = null;

/**
 * Get or create global asset cache instance
 */
export function getAssetCache(config?: Partial<CacheConfig>): AssetCache {
  if (!globalAssetCache) {
    globalAssetCache = new AssetCache(config);
  }
  return globalAssetCache;
}

/**
 * Destroy global cache instance
 */
export function destroyAssetCache(): void {
  if (globalAssetCache) {
    globalAssetCache.destroy();
    globalAssetCache = null;
  }
}

export default AssetCache;