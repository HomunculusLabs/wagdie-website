/**
 * Asset Types for Map Assets Import and Integration
 *
 * This file defines TypeScript interfaces for all asset entities
 * used in the enhanced map asset loading system.
 */

// Base asset interface
export interface BaseAsset {
  id: string;              // Unique identifier
  name: string;            // Human-readable name
  iconUrl: string;         // Path to asset file
  fallbackUrl: string;     // Default fallback asset path
  category: AssetCategory; // Asset category
  priority: AssetPriority; // Loading priority
}

// Asset category types
export type AssetCategory = 'marker' | 'legend' | 'staking' | 'wallet' | 'border' | 'background';
export type AssetPriority = 'critical' | 'non-critical';

// Map marker assets
export interface MapMarkerAsset extends BaseAsset {
  category: 'marker';
  priority: 'critical';
}

// Legend icon assets
export interface LegendIconAsset extends BaseAsset {
  category: 'legend';
  priority: 'non-critical';
  state: 'on' | 'off';  // Toggle state
}

// Staking assets
export interface StakingAsset extends BaseAsset {
  category: 'staking';
  priority: 'non-critical';
  type: 'button' | 'frame' | 'search' | 'other'; // Asset type
}

// Wallet assets
export interface WalletAsset extends BaseAsset {
  category: 'wallet';
  priority: 'non-critical';
  state: 'connected' | 'disconnected'; // Connection state
}

// Border assets
export interface BorderAsset extends BaseAsset {
  category: 'border';
  priority: 'non-critical';
  position: 'top' | 'bottom' | 'left' | 'right' | 'corner'; // Border position
}

// Background assets
export interface BackgroundAsset extends BaseAsset {
  category: 'background';
  priority: 'non-critical';
  size: 'large';        // Asset size classification
}

// Asset loading state
export interface AssetLoadingState {
  assetId: string;          // Asset identifier
  status: 'loading' | 'loaded' | 'failed' | 'retrying' | 'fallback';
  loadStartTime: number;    // Timestamp when loading started
  loadEndTime?: number;     // Timestamp when loading completed/failed
  retryCount: number;       // Number of retry attempts
  lastError?: string;       // Last error message
  usedFallback: boolean;    // Whether fallback asset is being used
}

// Asset loading context
export interface AssetLoadingContext {
  assets: Map<string, AssetLoadingState>;  // All asset loading states
  loadingQueue: string[];                  // Assets queued for loading
  completedCritical: boolean;              // All critical assets loaded
  errorCount: number;                      // Total failed assets
}

// Enhanced Icon configuration
export interface EnhancedIconConfig {
  baseSize: [number, number];           // Original width, height
  iconUrl: string;                      // Path to asset file
  fallbackUrl: string;                  // Fallback asset path
  mobileScale?: number;                 // Mobile scaling factor
  minTouchSize?: number;                // Minimum touch target size
  priority: 'critical' | 'non-critical'; // Loading priority
  category: AssetCategory;              // Asset category
}

// Icon type identifiers (matching existing IconFactory)
export type IconType = 'location' | 'character' | 'burn' | 'death' | 'fight';

// Error information
export interface AssetError {
  assetId: string;           // Asset identifier
  errorType: 'network' | 'file_not_found' | 'corruption' | 'timeout' | 'unknown';
  errorMessage: string;      // Human-readable error message
  timestamp: number;         // Error occurrence timestamp
  retryCount: number;        // Current retry attempt
  canRetry: boolean;         // Whether retry is possible
}

// Error recovery strategy
export interface ErrorRecoveryStrategy {
  errorType: AssetError['errorType'];
  maxRetries: number;        // Maximum retry attempts
  retryDelay: number;        // Delay between retries (ms)
  useFallback: boolean;      // Whether to use fallback asset
  logError: boolean;         // Whether to log the error
}

// Performance metrics for individual assets
export interface AssetPerformanceMetrics {
  assetId: string;           // Asset identifier
  loadTime: number;          // Time to load asset (ms)
  cacheHitRate: number;      // Percentage of cache hits
  failureRate: number;       // Percentage of failed loads
  averageRetryCount: number; // Average retry attempts
  memoryUsage: number;       // Memory usage (bytes)
}

// Aggregated performance data
export interface PerformanceReport {
  totalAssets: number;                           // Total number of assets
  loadedAssets: number;                          // Successfully loaded assets
  failedAssets: number;                          // Failed assets
  averageLoadTime: number;                       // Average load time (ms)
  criticalAssetsLoadTime: number;                // Critical assets load time (ms)
  cacheHitRate: number;                          // Overall cache hit rate
  errorRate: number;                             // Overall error rate
  timestamp: number;                             // Report timestamp
}

// Asset registry interface
export interface AssetRegistry {
  getAllAssets(): BaseAsset[];                        // Get all registered assets
  getAssetById(id: string): BaseAsset | undefined;    // Get asset by ID
  getAssetsByCategory(category: AssetCategory): BaseAsset[]; // Get assets by category
  getCriticalAssets(): BaseAsset[];                   // Get critical priority assets
  registerAsset(asset: BaseAsset): void;              // Register new asset
}

// Asset loading service interface
export interface AssetLoadingService {
  loadAsset(assetId: string): Promise<AssetLoadingState>;
  loadAssets(assetIds: string[]): Promise<AssetLoadingState[]>;
  preloadCriticalAssets(): Promise<void>;
  getAssetState(assetId: string): AssetLoadingState | undefined;
  retryAsset(assetId: string): Promise<AssetLoadingState>;
  getPerformanceMetrics(): PerformanceReport;
}

// Enhanced IconFactory interface
export interface EnhancedIconFactory {
  createIcon(type: IconType, isMobile: boolean): any; // L.Icon - using any to avoid Leaflet import
  createIconFromUrl(iconUrl: string, fallbackUrl: string, size: [number, number]): any;
  preloadCriticalIcons(): Promise<void>;
  getIconLoadingState(type: IconType): AssetLoadingState | undefined;
  retryIconLoad(type: IconType): Promise<void>;
  getIconMetrics(): AssetPerformanceMetrics[];
  clearCache(): void;
}

// Asset configuration schema
export interface AssetConfiguration {
  assets: BaseAsset[];
  loading: {
    retryAttempts: number;
    retryDelay: number;
    timeoutDuration: number;
    enablePreloading: boolean;
  };
  performance: {
    cacheSize: number;
    enableMetrics: boolean;
    logPerformance: boolean;
  };
  fallback: {
    enableDefaultFallbacks: boolean;
    customFallbacks: Record<string, string>;
  };
}

// React hook return types
export interface UseAssetLoadingReturn {
  loading: boolean;
  error: string | null;
  assets: Map<string, AssetLoadingState>;
  criticalLoaded: boolean;
  retryAsset: (assetId: string) => void;
  preloadAssets: (assetIds: string[]) => void;
  metrics: PerformanceReport | null;
}

export interface UseIconFactoryReturn {
  getIcon: (type: IconType, isMobile?: boolean) => any | null; // L.Icon - using any to avoid Leaflet import
  loading: boolean;
  error: string | null;
  metrics: AssetPerformanceMetrics[];
  retryIcon: (type: IconType) => void;
  preloadIcons: (types: IconType[]) => void;
  createIconFromUrl: (iconUrl: string, fallbackUrl: string, size: [number, number]) => any; // L.Icon
  getIconLoadingState: (type: IconType) => AssetLoadingState | undefined;
}