# Quickstart Guide: Native Map Integration

**Phase**: 1 - Design & Contracts
**Date**: 2025-11-03
**Feature**: 007-native-map-integration

## Prerequisites

### Required Knowledge

- **React 18**: Component patterns, hooks, context
- **TypeScript 5+**: Types, interfaces, generics
- **Next.js 15**: App Router, dynamic imports, SSR
- **Leaflet Basics**: Map concepts (layers, markers, popups)
- **Supabase**: PostgreSQL queries, JSONB fields

### Development Environment

```bash
# Required software
- Node.js 18+
- npm or yarn
- Git
- Code editor (VS Code recommended)
```

## Project Setup

### 1. Install Dependencies

```bash
# Install Leaflet and React-Leaflet
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Verify installation
npm list leaflet react-leaflet
```

### 2. Configure Tailwind CSS (Fonts)

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'wagdie': ['Wagdie_Fraktur_21', 'serif'],
        'eskapade': ['EskapadeFraktur-Black', 'serif'],
      },
    },
  },
  plugins: [],
};
```

### 3. Import Leaflet CSS

Add to `app/layout.tsx` or `styles/globals.css`:

```css
/* Import in globals.css */
@import 'leaflet/dist/leaflet.css';

body {
  /* Apply WAGDIE font globally if desired */
  font-family: 'Wagdie_Fraktur_21', serif;
}
```

### 4. Setup Asset Directory

```bash
# Create directories
mkdir -p public/fonts
mkdir -p public/images/map-icons

# Copy assets from wagdie-map (manual step)
# cp /Users/t3rpz/projects/wagdie-map/public/fonts/* public/fonts/
# cp /Users/t3rpz/projects/wagdie-map/public/images/wagdiemap.png public/images/
# cp /Users/t3rpz/projects/wagdie-map/public/images/mapicons/* public/images/map-icons/
```

## Development Workflow

### 1. Understanding the Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Presentation Layer (app/, components/)                  │
│ - app/map/page.tsx                                      │
│ - components/map/NativeMap.tsx                          │
│ - components/map/MapMarker.tsx                          │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Application Layer (hooks/)                              │
│ - hooks/map/useNativeMap.ts                             │
│ - hooks/map/useLocations.ts                             │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Domain Layer (lib/services/)                            │
│ - lib/services/map/locationService.ts                   │
│ - lib/services/map/characterLocationService.ts          │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Infrastructure Layer (lib/repositories/)                │
│ - lib/repositories/locationRepository.ts                │
│ - lib/repositories/characterLocationRepository.ts       │
└─────────────────────────────────────────────────────────┘
                           │
┌─────────────────────────────────────────────────────────┐
│ Database (Supabase PostgreSQL)                          │
│ - locations table                                       │
│ - character_locations table                             │
└─────────────────────────────────────────────────────────┘
```

### 2. Development Order

**Phase 1: Setup (Complete these first)**
1. Copy assets from wagdie-map
2. Install Leaflet dependencies
3. Configure Tailwind fonts
4. Import Leaflet CSS

**Phase 2: Core Components**
1. Create `types/map.ts` - TypeScript definitions
2. Create `lib/repositories/` - Data access layer
3. Create `lib/services/map/` - Business logic
4. Create `hooks/map/` - Custom hooks
5. Create `components/map/` - UI components

**Phase 3: Integration**
1. Update `app/map/page.tsx` - Replace iframe
2. Test component rendering
3. Test marker display
4. Test layer toggles

**Phase 4: Polish**
1. Add loading states
2. Add error boundaries
3. Optimize performance
4. Add responsive design

### 3. Key Files to Create

```
lib/
├── types/
│   └── map.ts                    # TypeScript interfaces
├── repositories/
│   ├── locationRepository.ts     # Supabase queries
│   └── characterLocationRepository.ts
└── services/
    └── map/
        ├── locationService.ts    # Business logic
        ├── characterLocationService.ts
        └── assetLoader.ts

hooks/
└── map/
    ├── useNativeMap.ts          # Map lifecycle
    ├── useLocations.ts          # Location data
    ├── useCharacterLocations.ts # Character positions
    └── useLayerVisibility.ts    # Layer state

components/
└── map/
    ├── NativeMap.tsx            # Main map component
    ├── MapMarker.tsx            # Individual markers
    ├── MapPopup.tsx             # Popup content
    ├── MapTooltip.tsx           # Tooltip content
    ├── LayerControls.tsx        # Layer toggles
    └── CharacterList.tsx        # Sidebar (optional)
```

## Component Development Guide

### 1. Creating the NativeMap Component

**Pattern**: Dynamic import with SSR disabled

```typescript
// components/map/NativeMap.tsx
'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamic import for Leaflet (no SSR)
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);

const ImageOverlay = dynamic(
  () => import('react-leaflet').then(mod => mod.ImageOverlay),
  { ssr: false }
);

export default function NativeMap() {
  return (
    <div className="w-full h-screen">
      <MapContainer>
        <ImageOverlay
          url="/images/wagdiemap.png"
          bounds={[[0, 0], [1000, 1000]]}
        />
        {/* Markers and controls will go here */}
      </MapContainer>
    </div>
  );
}
```

### 2. Creating Markers

**Pattern**: React.memo for performance

```typescript
// components/map/MapMarker.tsx
'use client';

import { Marker, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { memo } from 'react';

interface MapMarkerProps {
  id: string;
  position: LatLngExpression;
  type: 'location' | 'character';
  data: any;
}

function MapMarkerComponent({ id, position, type, data }: MapMarkerProps) {
  return (
    <Marker position={position} icon={/* custom icon */}>
      <Tooltip>{data.name}</Tooltip>
    </Marker>
  );
}

// Memoize to prevent unnecessary re-renders
export const MapMarker = memo(MapMarkerComponent);
```

### 3. Creating Repositories

**Pattern**: Type-safe Supabase queries

```typescript
// lib/repositories/locationRepository.ts
import { createClient } from '@supabase/supabase-js';
import type { Location } from '../types/map';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!);

export class LocationRepository {
  async getAll(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch locations: ${error.message}`);
    return data || [];
  }

  async getById(id: string): Promise<Location | null> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch location: ${error.message}`);
    }
    return data;
  }
}
```

### 4. Creating Services

**Pattern**: Business logic with validation

```typescript
// lib/services/map/locationService.ts
import { LocationRepository } from '../../repositories/locationRepository';
import type { Location, LocationOccupancy } from '../../types/map';

export class LocationService {
  private repository: LocationRepository;

  constructor() {
    this.repository = new LocationRepository();
  }

  async getAvailableLocations(): Promise<Location[]> {
    const locations = await this.repository.getAll();

    // Business logic: filter available locations
    return locations.filter(location => {
      // Add filtering logic if needed
      return true;
    });
  }

  async getLocationWithOccupancy(id: string): Promise<LocationOccupancy | null> {
    const location = await this.repository.getById(id);
    if (!location) return null;

    // Calculate occupancy (business logic)
    const characterCount = 0; // Query character_locations

    return {
      location,
      characterCount,
      characters: [],
    };
  }
}
```

## Testing

### Unit Tests

```typescript
// tests/lib/services/map/locationService.test.ts
import { LocationService } from '../../../lib/services/map/locationService';

describe('LocationService', () => {
  it('should fetch available locations', async () => {
    const service = new LocationService();
    const locations = await service.getAvailableLocations();

    expect(locations).toBeDefined();
    expect(Array.isArray(locations)).toBe(true);
  });
});
```

### Component Tests

```typescript
// tests/components/map/NativeMap.test.tsx
import { render, screen } from '@testing-library/react';
import NativeMap from '../../../components/map/NativeMap';

describe('NativeMap', () => {
  it('renders without crashing', () => {
    render(<NativeMap />);
    // Test passes if component renders
  });
});
```

### Integration Tests

```typescript
// tests/map/integration/map-page.test.tsx
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MapPage from '../../../app/map/page';

const queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('Map Page Integration', () => {
  it('displays the map', async () => {
    render(<MapPage />, { wrapper });
    // Verify map renders
  });
});
```

## Common Issues & Solutions

### Issue 1: SSR Errors

**Problem**: `window is not defined`

**Solution**: Use dynamic import with `ssr: false`

```typescript
const NativeMap = dynamic(
  () => import('./NativeMap'),
  { ssr: false }
);
```

### Issue 2: Leaflet Icons Not Loading

**Problem**: Default markers show broken image icons

**Solution**: Configure custom icons

```typescript
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;
```

### Issue 3: Large Image Size

**Problem**: 9.3MB wagdiemap.png is too large

**Solution**: Optimize image

```bash
# Using ImageOptim (GUI) or command line
cwebp -q 85 wagdiemap.png -o wagdiemap.webp

# Or use TinyPNG API
```

### Issue 4: Markers Not Displaying

**Problem**: Markers render but not visible

**Solution**: Check layer visibility and z-index

```css
.leaflet-marker-icon {
  z-index: 1000; /* Ensure markers appear above background */
}
```

## Performance Optimization

### 1. Marker Clustering (Optional)

```bash
npm install react-leaflet-markercluster
```

```typescript
import MarkerClusterGroup from 'react-leaflet-markercluster';

<MapContainer>
  <MarkerClusterGroup>
    {markers.map(marker => (
      <MapMarker key={marker.id} {...marker} />
    ))}
  </MarkerClusterGroup>
</MapContainer>
```

### 2. Lazy Loading Layers

```typescript
const LayerControls = () => {
  const [activeLayers, setActiveLayers] = useState<LayerType[]>(['locations']);

  return (
    <>
      {activeLayers.includes('characters') && <CharacterMarkers />}
      {activeLayers.includes('locations') && <LocationMarkers />}
    </>
  );
};
```

### 3. Memoization

```typescript
import { memo, useMemo } from 'react';

const MapMarkers = memo(function MapMarkers({ markers }) {
  const memoizedMarkers = useMemo(
    () => markers.map(marker => (
      <MapMarker key={marker.id} {...marker} />
    )),
    [markers]
  );

  return <>{memoizedMarkers}</>;
});
```

## Deployment Checklist

- [ ] Leaflet dependencies installed
- [ ] Assets copied and optimized
- [ ] Tailwind fonts configured
- [ ] Leaflet CSS imported
- [ ] TypeScript types defined
- [ ] Repository layer implemented
- [ ] Service layer implemented
- [ ] Hooks created
- [ ] UI components built
- [ ] Map page updated
- [ ] Tests written
- [ ] Performance tested with 50+ markers
- [ ] Responsive design verified
- [ ] Error boundaries added

## Next Steps

✅ Quickstart guide completed
✅ Development workflow documented
✅ Common issues and solutions captured

**Proceed to**: Implementation with `/speckit.tasks` to generate task breakdown
