# Asset API Contracts

## Asset Loading Service Interface

### AssetLoadingService

```typescript
interface AssetLoadingService {
  /**
   * Load a single asset with progressive fallbacks
   */
  loadAsset(assetId: string): Promise<AssetLoadingState>;

  /**
   * Load multiple assets in parallel
   */
  loadAssets(assetIds: string[]): Promise<AssetLoadingState[]>;

  /**
   * Preload critical assets
   */
  preloadCriticalAssets(): Promise<void>;

  /**
   * Get current loading state for an asset
   */
  getAssetState(assetId: string): AssetLoadingState | undefined;

  /**
   * Retry loading a failed asset
   */
  retryAsset(assetId: string): Promise<AssetLoadingState>;

  /**
   * Get performance metrics for all assets
   */
  getPerformanceMetrics(): PerformanceReport;
}
```

### Asset Registry Interface

```typescript
interface AssetRegistry {
  /**
   * Register a new asset
   */
  registerAsset(asset: BaseAsset): void;

  /**
   * Get asset by ID
   */
  getAssetById(id: string): BaseAsset | undefined;

  /**
   * Get all assets by category
   */
  getAssetsByCategory(category: AssetCategory): BaseAsset[];

  /**
   * Get all critical assets
   */
  getCriticalAssets(): BaseAsset[];

  /**
   * Get all registered assets
   */
  getAllAssets(): BaseAsset[];

  /**
   * Update asset configuration
   */
  updateAsset(id: string, updates: Partial<BaseAsset>): boolean;

  /**
   * Remove asset from registry
   */
  removeAsset(id: string): boolean;
}
```

## IconFactory Enhanced Interface

### Enhanced IconFactory

```typescript
interface EnhancedIconFactory {
  /**
   * Create or retrieve cached icon with progressive loading
   */
  createIcon(type: IconType, isMobile: boolean): L.Icon;

  /**
   * Create icon with custom asset URL
   */
  createIconFromUrl(iconUrl: string, fallbackUrl: string, size: [number, number]): L.Icon;

  /**
   * Preload critical icons
   */
  preloadCriticalIcons(): Promise<void>;

  /**
   * Get loading state for icon type
   */
  getIconLoadingState(type: IconType): AssetLoadingState | undefined;

  /**
   * Retry failed icon loading
   */
  retryIconLoad(type: IconType): Promise<void>;

  /**
   * Get performance metrics
   */
  getIconMetrics(): AssetPerformanceMetrics[];

  /**
   * Clear icon cache and loading states
   */
  clearCache(): void;
}
```

## Asset Configuration Schema

### Asset Configuration

```typescript
interface AssetConfiguration {
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
```

## Event System Contracts

### Asset Loading Events

```typescript
interface AssetLoadingEvents {
  'asset:loading': (assetId: string) => void;
  'asset:loaded': (assetId: string, loadTime: number) => void;
  'asset:failed': (assetId: string, error: AssetError) => void;
  'asset:retrying': (assetId: string, attempt: number) => void;
  'asset:fallback': (assetId: string, fallbackUsed: string) => void;
  'critical:loaded': () => void;  // All critical assets loaded
  'all:loaded': () => void;       // All assets loaded
}
```

### Performance Monitoring Events

```typescript
interface PerformanceEvents {
  'performance:metrics': (metrics: PerformanceReport) => void;
  'performance:warning': (message: string, metrics: Partial<PerformanceReport>) => void;
  'performance:error': (error: string, context: any) => void;
}
```

## React Hook Contracts

### UseAssetLoading Hook

```typescript
interface UseAssetLoadingReturn {
  loading: boolean;
  error: string | null;
  assets: Map<string, AssetLoadingState>;
  criticalLoaded: boolean;
  retryAsset: (assetId: string) => void;
  preloadAssets: (assetIds: string[]) => void;
  metrics: PerformanceReport | null;
}

interface UseAssetLoadingHook {
  (assetIds?: string[]): UseAssetLoadingReturn;
}
```

### UseIconFactory Hook

```typescript
interface UseIconFactoryReturn {
  getIcon: (type: IconType, isMobile?: boolean) => L.Icon | null;
  loading: boolean;
  error: string | null;
  metrics: AssetPerformanceMetrics[];
  retryIcon: (type: IconType) => void;
  preloadIcons: (types: IconType[]) => void;
}

interface UseIconFactoryHook {
  (): UseIconFactoryReturn;
}
```

## Error Handling Contracts

### Error Handler Interface

```typescript
interface AssetErrorHandler {
  /**
   * Handle asset loading error
   */
  handleError(error: AssetError): void;

  /**
   * Determine if error is retryable
   */
  isRetryableError(error: AssetError): boolean;

  /**
   * Get retry delay for error type
   */
  getRetryDelay(error: AssetError, attempt: number): number;

  /**
   * Log error for monitoring
   */
  logError(error: AssetError): void;

  /**
   * Get fallback asset for failed asset
   */
  getFallbackAsset(assetId: string): string | null;
}
```

## Cache Management Contracts

### Asset Cache Interface

```typescript
interface AssetCache {
  /**
   * Store asset in cache
   */
  set(key: string, asset: any): void;

  /**
   * Retrieve asset from cache
   */
  get(key: string): any | undefined;

  /**
   * Check if asset exists in cache
   */
  has(key: string): boolean;

  /**
   * Remove asset from cache
   */
  delete(key: string): boolean;

  /**
   * Clear all cache
   */
  clear(): void;

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
  };
}
```

## Testing Contracts

### Mock Asset Service

```typescript
interface MockAssetService {
  /**
   * Mock successful asset load
   */
  mockSuccessfulLoad(assetId: string, delay?: number): void;

  /**
   * Mock failed asset load
   */
  mockFailedLoad(assetId: string, error: AssetError): void;

  /**
   * Mock slow asset load
   */
  mockSlowLoad(assetId: string, delay: number): void;

  /**
   * Reset all mocks
   */
  resetMocks(): void;

  /**
   * Get mock call history
   */
  getCallHistory(): MockCall[];
}
```

### Test Data Contracts

```typescript
interface TestDataAsset {
  id: string;
  name: string;
  url: string;
  fallbackUrl: string;
  category: AssetCategory;
  priority: AssetPriority;
  mockResponse?: {
    status: 'success' | 'failure' | 'timeout';
    delay?: number;
    error?: AssetError;
  };
}
```

## Integration Points

### Map Component Integration

```typescript
interface MapAssetIntegration {
  /**
   * Initialize asset loading for map
   */
  initializeMapAssets(): Promise<void>;

  /**
   * Get marker icon with loading state
   */
  getMarkerIcon(type: IconType): L.Icon | null;

  /**
   * Get legend icons with loading states
   */
  getLegendIcons(): Map<string, L.Icon>;

  /**
   * Handle asset loading errors in map context
   */
  handleMapAssetError(error: AssetError): void;

  /**
   * Update map when assets finish loading
   */
  onAssetsLoaded(): void;
}
```

### Component Library Integration

```typescript
interface ComponentAssetIntegration {
  /**
   * Provide assets to UI components
   */
  getAssetForComponent(componentId: string, assetId: string): string | null;

  /**
   * Handle component-specific asset loading
   */
  loadComponentAssets(componentId: string, assetIds: string[]): Promise<void>;

  /**
   * Subscribe to asset loading events
   */
  subscribeToAssetEvents(callback: (event: AssetLoadingEvents) => void): () => void;
}
```