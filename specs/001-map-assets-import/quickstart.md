# Quick Start Guide: Map Assets Import and Integration

**Feature**: Map Assets Import and Integration
**Date**: 2025-11-08
**Prerequisites**: Familiarity with React, TypeScript, and the existing map implementation

## Overview

This guide helps you get started with the enhanced map assets system that includes progressive loading, fallback mechanisms, and responsive scaling. The implementation maintains backward compatibility with the existing IconFactory while adding new functionality.

## Prerequisites

- Existing map implementation with IconFactory
- Assets copied to `/public/images/` (flat structure)
- TypeScript 5.0+
- React 18+
- Leaflet 1.9+
- React-Leaflet 7+

## Quick Setup

### 1. Asset Organization

Ensure your assets are organized in the flat structure:

```
public/images/
├── icon_location.png          # Map markers
├── icon_burn.png
├── icon_death.png
├── icon_fight.png
├── icon_youarehere.png
├── legend_location_on.png     # Legend icons
├── legend_location_off.png
├── legend_burn_on.png
├── legend_burn_off.png
├── staking_button.png         # Staking assets
├── wallet_connect.png         # Wallet assets
├── border_bottom_l.png        # Border assets
├── wagdiemap.png             # Background assets
└── [other assets...]
```

### 2. Enhanced IconFactory Usage

```typescript
// Import the enhanced IconFactory
import { getIconFactory } from '@/components/map/IconFactory';

// Use in your map components
const iconFactory = getIconFactory();

// Get icon with progressive loading and fallbacks
const locationIcon = iconFactory.createIcon('location', isMobile);

// Check loading state
const loadingState = iconFactory.getIconLoadingState('location');
if (loadingState?.status === 'loading') {
  // Show loading placeholder
}
```

### 3. React Hook Integration

```typescript
// Use the convenience hook for asset loading
import { useAssetLoading } from '@/hooks/useAssetLoading';

function MapComponent() {
  const {
    loading,
    error,
    assets,
    criticalLoaded,
    retryAsset
  } = useAssetLoading(['location', 'burn', 'death', 'fight']);

  if (!criticalLoaded) {
    return <MapLoadingSkeleton />;
  }

  if (error) {
    return <MapErrorFallback onRetry={() => retryAsset('location')} />;
  }

  return <YourMapComponent />;
}
```

## Key Features

### Progressive Asset Loading

```typescript
// Critical assets are preloaded automatically
// Non-critical assets load on demand

const iconFactory = getIconFactory();

// Preload critical assets (called automatically on init)
await iconFactory.preloadCriticalIcons();

// Check if critical assets are loaded
const criticalLoaded = iconFactory.areCriticalAssetsLoaded();
```

### Fallback Mechanisms

```typescript
// Assets automatically fall back through this chain:
// 1. Original asset
// 2. Retry with exponential backoff
// 3. Default fallback icon
// 4. Error state with logging

// The system handles this automatically, but you can customize:

const customFallbacks = {
  'location': '/images/default_marker.png',
  'burn': '/images/default_event.png'
};

iconFactory.setCustomFallbacks(customFallbacks);
```

### Performance Monitoring

```typescript
// Get performance metrics
const metrics = iconFactory.getIconMetrics();

console.log('Average load time:', metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length);
console.log('Cache hit rate:', iconFactory.getCacheHitRate());
console.log('Error rate:', iconFactory.getErrorRate());
```

## Component Integration

### Map Markers

```typescript
import { Marker } from 'react-leaflet';
import { useIconFactory } from '@/hooks/useIconFactory';

function LocationMarker({ position }: { position: [number, number] }) {
  const { getIcon, loading } = useIconFactory();

  if (loading) {
    return <Marker position={position} icon={loadingIcon} />;
  }

  return (
    <Marker
      position={position}
      icon={getIcon('location')}
    />
  );
}
```

### Layer Controls

```typescript
import { LayerControls } from '@/components/map/LayerControls';
import { useAssetLoading } from '@/hooks/useAssetLoading';

function MapWithControls() {
  const { assets } = useAssetLoading([
    'legend_location_on', 'legend_location_off',
    'legend_burn_on', 'legend_burn_off'
  ]);

  return (
    <div>
      <LayerControls
        layerStates={{
          location: assets.get('legend_location_on')?.status === 'loaded',
          burn: assets.get('legend_burn_on')?.status === 'loaded'
        }}
      />
      <YourMapComponent />
    </div>
  );
}
```

## Error Handling

### Custom Error Handling

```typescript
import { AssetErrorHandler } from '@/lib/services/AssetErrorHandler';

const errorHandler = new AssetErrorHandler({
  onError: (error) => {
    console.error('Asset loading failed:', error);
    // Send to error reporting service
  },
  onFallback: (assetId, fallbackUrl) => {
    console.log(`Using fallback for ${assetId}: ${fallbackUrl}`);
  }
});
```

### Error Boundaries

```typescript
import { AssetErrorBoundary } from '@/components/map/AssetErrorBoundary';

function MapWithErrorBoundary() {
  return (
    <AssetErrorBoundary
      fallback={<MapErrorFallback />}
      onError={(error) => console.error('Map asset error:', error)}
    >
      <YourMapComponent />
    </AssetErrorBoundary>
  );
}
```

## Testing

### Mocking Asset Loading

```typescript
import { MockAssetService } from '@/test-utils/MockAssetService';

// Setup mocks
const mockService = new MockAssetService();
mockService.mockSuccessfulLoad('location', 100);
mockService.mockFailedLoad('burn', { errorType: 'network' });

// Test component
test('handles asset loading states', async () => {
  render(<YourMapComponent />);

  await waitFor(() => {
    expect(screen.getByTestId('location-marker')).toBeInTheDocument();
  });
});
```

### Performance Testing

```typescript
import { performanceTest } from '@/test-utils/performance';

test('assets load within performance targets', async () => {
  const startTime = performance.now();

  await loadCriticalAssets();

  const loadTime = performance.now() - startTime;
  expect(loadTime).toBeLessThan(2000); // 2 second target
});
```

## Configuration

### Asset Configuration

```typescript
// Create custom asset configuration
const assetConfig: AssetConfiguration = {
  assets: [
    {
      id: 'location',
      name: 'Location Marker',
      iconUrl: '/images/icon_location.png',
      fallbackUrl: '/images/default_marker.png',
      category: 'marker',
      priority: 'critical'
    }
    // ... more assets
  ],
  loading: {
    retryAttempts: 3,
    retryDelay: 1000,
    timeoutDuration: 5000,
    enablePreloading: true
  },
  performance: {
    cacheSize: 100,
    enableMetrics: true,
    logPerformance: true
  },
  fallback: {
    enableDefaultFallbacks: true,
    customFallbacks: {}
  }
};

// Initialize with custom config
const iconFactory = new IconFactory(assetConfig);
```

## Migration Guide

### From Existing IconFactory

```typescript
// Old approach
const icon = iconFactory.createIcon('location', isMobile);

// New approach (same API, enhanced functionality)
const icon = iconFactory.createIcon('location', isMobile);

// Add new capabilities
const loadingState = iconFactory.getIconLoadingState('location');
const metrics = iconFactory.getIconMetrics();
```

### Asset Path Updates

```typescript
// Old paths (from wagdie-map project)
'/images/mapicons/icon_location.png'
'/images/legendicons/legend_location_on.png'

// New paths (flat structure)
'/images/icon_location.png'
'/images/legend_location_on.png'
```

## Troubleshooting

### Common Issues

1. **Assets not loading**
   - Check file paths in `/public/images/`
   - Verify asset names match configuration
   - Check network tab for failed requests

2. **Performance issues**
   - Monitor asset load times in performance metrics
   - Check if too many assets are loading simultaneously
   - Verify caching is working correctly

3. **Fallbacks not working**
   - Ensure fallback URLs are correct
   - Check error handling configuration
   - Verify custom fallbacks are properly set

### Debug Mode

```typescript
// Enable debug logging
iconFactory.setDebugMode(true);

// Get detailed loading information
const debugInfo = iconFactory.getDebugInfo();
console.log('Asset loading debug info:', debugInfo);
```

## Next Steps

1. Review the [data model](./data-model.md) for detailed entity definitions
2. Check the [API contracts](./contracts/asset-api.md) for integration interfaces
3. Run the implementation with `/speckit.tasks`
4. Test your implementation with the provided testing utilities

## Support

For questions or issues:
1. Check this quickstart guide
2. Review the data model and API contracts
3. Test with the provided mock utilities
4. Check browser console for detailed error messages