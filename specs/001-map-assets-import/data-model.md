# Data Model: Map Assets Import and Integration

**Date**: 2025-11-08
**Feature**: Map Assets Import and Integration
**Phase**: 1 - Design & Contracts

## Asset Types and Entities

### Map Assets

#### Asset Type: MapMarker
```typescript
interface MapMarkerAsset {
  id: string;           // Unique identifier (e.g., "location", "burn", "death", "fight")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to icon file (e.g., "/images/icon_location.png")
  fallbackUrl: string;  // Default fallback icon path
  category: 'marker';   // Asset category
  priority: 'critical'; // Loading priority
}
```

#### Asset Type: LegendIcon
```typescript
interface LegendIconAsset {
  id: string;           // Unique identifier (e.g., "location_on", "location_off")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to icon file (e.g., "/images/legend_location_on.png")
  fallbackUrl: string;  // Default fallback icon path
  category: 'legend';   // Asset category
  priority: 'non-critical'; // Loading priority
  state: 'on' | 'off';  // Toggle state
}
```

#### Asset Type: StakingAsset
```typescript
interface StakingAsset {
  id: string;           // Unique identifier (e.g., "stake_button", "pfp_frame")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to asset file
  fallbackUrl: string;  // Default fallback asset path
  category: 'staking';  // Asset category
  priority: 'non-critical'; // Loading priority
  type: 'button' | 'frame' | 'search' | 'other'; // Asset type
}
```

#### Asset Type: WalletAsset
```typescript
interface WalletAsset {
  id: string;           // Unique identifier (e.g., "wallet_connect", "wallet_disconnect")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to asset file
  fallbackUrl: string;  // Default fallback asset path
  category: 'wallet';   // Asset category
  priority: 'non-critical'; // Loading priority
  state: 'connected' | 'disconnected'; // Connection state
}
```

#### Asset Type: BorderAsset
```typescript
interface BorderAsset {
  id: string;           // Unique identifier (e.g., "border_bottom_l", "border_r")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to asset file
  fallbackUrl: string;  // Default fallback asset path
  category: 'border';   // Asset category
  priority: 'non-critical'; // Loading priority
  position: 'top' | 'bottom' | 'left' | 'right' | 'corner'; // Border position
}
```

#### Asset Type: BackgroundAsset
```typescript
interface BackgroundAsset {
  id: string;           // Unique identifier (e.g., "wagdiemap", "pilgrims")
  name: string;         // Human-readable name
  iconUrl: string;      // Path to asset file
  fallbackUrl: string;  // Default fallback asset path
  category: 'background'; // Asset category
  priority: 'non-critical'; // Loading priority
  size: 'large';        // Asset size classification
}
```

## Asset Loading State

### Loading State Model
```typescript
interface AssetLoadingState {
  assetId: string;          // Asset identifier
  status: 'loading' | 'loaded' | 'failed' | 'retrying' | 'fallback';
  loadStartTime: number;    // Timestamp when loading started
  loadEndTime?: number;     // Timestamp when loading completed/failed
  retryCount: number;       // Number of retry attempts
  lastError?: string;       // Last error message
  usedFallback: boolean;    // Whether fallback asset is being used
}
```

### Asset Loading Context
```typescript
interface AssetLoadingContext {
  assets: Map<string, AssetLoadingState>;  // All asset loading states
  loadingQueue: string[];                  // Assets queued for loading
  completedCritical: boolean;              // All critical assets loaded
  errorCount: number;                      // Total failed assets
}
```

## IconFactory Enhanced Model

### Enhanced Icon Configuration
```typescript
interface EnhancedIconConfig {
  baseSize: [number, number];           // Original width, height
  iconUrl: string;                      // Path to asset file
  fallbackUrl: string;                  // Fallback asset path
  mobileScale?: number;                 // Mobile scaling factor
  minTouchSize?: number;                // Minimum touch target size
  priority: 'critical' | 'non-critical'; // Loading priority
  category: AssetCategory;              // Asset category
}
```

### IconFactory State
```typescript
interface IconFactoryState {
  cache: Map<string, L.Icon>;           // Icon cache
  loadingStates: Map<string, AssetLoadingState>; // Asset loading states
  retryQueue: Map<string, NodeJS.Timeout>; // Retry timers
  defaultIcons: Map<string, string>;   // Default fallback icons by category
}
```

## Asset Registry

### Asset Registry Model
```typescript
interface AssetRegistry {
  getAllAssets(): BaseAsset[];                        // Get all registered assets
  getAssetById(id: string): BaseAsset | undefined;    // Get asset by ID
  getAssetsByCategory(category: AssetCategory): BaseAsset[]; // Get assets by category
  getCriticalAssets(): BaseAsset[];                   // Get critical priority assets
  registerAsset(asset: BaseAsset): void;              // Register new asset
}
```

### Base Asset Interface
```typescript
interface BaseAsset {
  id: string;              // Unique identifier
  name: string;            // Human-readable name
  iconUrl: string;         // Path to asset file
  fallbackUrl: string;     // Default fallback asset path
  category: AssetCategory; // Asset category
  priority: AssetPriority; // Loading priority
}

type AssetCategory = 'marker' | 'legend' | 'staking' | 'wallet' | 'border' | 'background';
type AssetPriority = 'critical' | 'non-critical';
```

## Validation Rules

### Asset Validation
```typescript
interface AssetValidationRules {
  isValidUrl(url: string): boolean;           // Validate asset URL format
  isValidCategory(category: string): boolean; // Validate asset category
  isValidPriority(priority: string): boolean; // Validate loading priority
  validateAsset(asset: BaseAsset): boolean;   // Complete asset validation
}
```

### File Format Validation
- Supported formats: PNG, JPG, JPEG, GIF, WebP
- Maximum file size: 5MB for individual assets
- Recommended dimensions: icons 32x32px to 128x128px, backgrounds as needed

## State Transitions

### Asset Loading State Machine
```
[Initial] → [Loading] → [Loaded]
              ↓           ↓
           [Retrying] ← [Failed]
              ↓
           [Fallback]
```

**State Transition Rules**:
1. Initial → Loading: When asset request initiated
2. Loading → Loaded: When asset loads successfully
3. Loading → Failed: When asset fails to load
4. Failed → Retrying: When retry mechanism triggered (max 3 attempts)
5. Failed → Fallback: When retries exhausted or fallback preferred
6. Retrying → Failed: When retry attempt fails
7. Retrying → Loaded: When retry succeeds

## Error Handling Data Model

### Error Information
```typescript
interface AssetError {
  assetId: string;           // Asset identifier
  errorType: 'network' | 'file_not_found' | 'corruption' | 'timeout' | 'unknown';
  errorMessage: string;      // Human-readable error message
  timestamp: number;         // Error occurrence timestamp
  retryCount: number;        // Current retry attempt
  canRetry: boolean;         // Whether retry is possible
}
```

### Error Recovery Strategy
```typescript
interface ErrorRecoveryStrategy {
  errorType: AssetError['errorType'];
  maxRetries: number;        // Maximum retry attempts
  retryDelay: number;        // Delay between retries (ms)
  useFallback: boolean;      // Whether to use fallback asset
  logError: boolean;         // Whether to log the error
}
```

## Performance Metrics Model

### Asset Performance Metrics
```typescript
interface AssetPerformanceMetrics {
  assetId: string;           // Asset identifier
  loadTime: number;          // Time to load asset (ms)
  cacheHitRate: number;      // Percentage of cache hits
  failureRate: number;       // Percentage of failed loads
  averageRetryCount: number; // Average retry attempts
  memoryUsage: number;       // Memory usage (bytes)
}
```

### Aggregated Performance Data
```typescript
interface PerformanceReport {
  totalAssets: number;                           // Total number of assets
  loadedAssets: number;                          // Successfully loaded assets
  failedAssets: number;                          // Failed assets
  averageLoadTime: number;                       // Average load time (ms)
  criticalAssetsLoadTime: number;                // Critical assets load time (ms)
  cacheHitRate: number;                          // Overall cache hit rate
  errorRate: number;                             // Overall error rate
  timestamp: number;                             // Report timestamp
}
```