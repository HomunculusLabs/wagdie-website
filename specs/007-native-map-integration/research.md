# Research Output: Native Map Integration

**Phase**: 0 - Research & Unknowns Resolution
**Date**: 2025-11-03
**Feature**: 007-native-map-integration

## Research Overview

This document captures the findings from Phase 0 research to resolve all unknowns before implementation of the native map feature.

## Research Findings

### 1. WAGDIE Assets Investigation

**Source Location**: `/Users/t3rpz/projects/wagdie-map/public/`

#### Fonts
- **Wagdie_Fraktur_21.otf** - 28 KB (OpenType)
- **Wagdie_Fraktur_21.ttf** - 28 KB (TrueType, duplicate)
- **EskapadeFraktur-Black.ttf** - 120 KB (Additional decorative font)

**Integration Plan**: Copy OTF and TTF versions to wagdie-simplified/public/fonts/, add to Tailwind config

#### Images
- **wagdiemap.png** - 9.3 MB (Main map tile)
  - Currently too large for web (~9.3MB)
  - **Action**: Optimize to ~2-3MB using image compression
  - Format: PNG with transparency support

- **Icon Sets**
  - `mapicons/` directory:
    - `icon_burn.png` - Burn marker icon
    - `icon_death.png` - Death marker icon
    - `icon_fight.png` - Battle marker icon
    - `icon_location.png` - Location marker icon
    - `icon_youarehere.png` - User position indicator

  - `legendicons/` directory:
    - Layer toggle icons with `_on`/`_off` variants
    - `battle_legend.png`, `burn_legend.png`, `death_legend.png`, `location_legend.png`

**Integration Plan**: Copy all icons to wagdie-simplified/public/images/map-icons/

#### Animations
- **fire.gif** - 41 KB (Fire animation for UI)
- **Border graphics** - Various PNG files for UI frames

**Integration Plan**: Use for spread/infection mechanics later (Phase 2+)

### 2. Leaflet Integration Analysis

#### Compatibility Matrix

| Library | Version | Next.js 15 | React 18 | Status |
|---------|---------|------------|----------|--------|
| leaflet | 1.9.4 | ✅ Compatible | ✅ Compatible | Recommended |
| react-leaflet | 7.0.9 | ✅ Compatible | ✅ Compatible | Recommended |
| @types/leaflet | 1.9.4 | ✅ Compatible | ✅ Compatible | Available |

#### SSR Considerations

**Issue**: Leaflet requires browser APIs (window, document)
**Solution**: Dynamic import with SSR disabled

```typescript
import dynamic from 'next/dynamic';

const NativeMap = dynamic(
  () => import('./NativeMap'),
  { ssr: false }
);
```

**CSS Import**: Import Leaflet CSS in globals.css or component-level

```css
@import 'leaflet/dist/leaflet.css';
```

#### Image Overlay Best Practice

**Requirement**: Display wagdiemap.png as map background
**Approach**: Use Leaflet's `ImageOverlay` component

```typescript
import { MapContainer, ImageOverlay } from 'react-leaflet';

<MapContainer>
  <ImageOverlay
    url="/images/wagdiemap.png"
    bounds={[[0, 0], [height, width]]}
  />
</MapContainer>
```

**Coordinate System**: Leaflet uses [lat, lng] format
- **Action**: Convert Supabase coordinates if needed
- **Default bounds**: Assume [0, 0] to [1000, 1000] for custom image

### 3. Supabase Data Structure Review

#### locations Table

```sql
- id: uuid (primary key)
- name: text
- description: text
- metadata: jsonb
- created_at: timestamp
- updated_at: timestamp
```

**Usage**: Display as location markers on map

#### character_locations Table

```sql
- id: uuid (primary key)
- character_token_id: integer
- location_id: uuid (foreign key)
- wallet_address: text
- transaction_hash: text
- status: text (pending, confirmed, failed)
- created_at: timestamp
- updated_at: timestamp
```

**Usage**: Display character markers at their current locations

#### Coordinate Transformation

**Current**: Supabase stores locations by ID reference
**Leaflet Requirement**: Need lat/lng coordinates or bounds

**Solution Options**:
1. **Option A**: Store coordinates in locations.metadata
2. **Option B**: Create coordinate lookup service
3. **Option C**: Use fixed map boundaries with location positions

**Decision**: Use Option A - store coordinates in metadata JSON

```json
{
  "name": "The Cathedral",
  "metadata": {
    "bounds": [[x1, y1], [x2, y2]],
    "center": [centerX, centerY]
  }
}
```

### 4. Performance Strategy

#### Challenge: 9.3MB Image

**Problem**: wagdiemap.png is too large for web
**Solutions**:
1. **Compress PNG** → Lossless compression, reduce to ~5-6MB
2. **Convert to WebP** → Modern format, 50-70% smaller
3. **Convert to JPEG** → Smaller but lossy, test quality
4. **Tile splitting** → Split into smaller tiles (advanced)

**Recommendation**: WebP conversion (test if acceptable)

```bash
# Compress image
cwebp -q 85 wagdiemap.png -o wagdiemap.webp
# Expected size: 2-3MB
```

#### Marker Performance

**Challenge**: 50-100+ markers may impact performance

**Optimization Strategies**:
1. **React.memo** - Prevent unnecessary re-renders
2. **Layer-based rendering** - Only render visible layers
3. **Marker clustering** - Group nearby markers (react-leaflet-markercluster)
4. **Virtualization** - Only render markers in viewport

**Phase 1 Approach**:
- Use React.memo for all marker components
- Layer-based rendering
- Test performance with real data

**Phase 2+** (if needed):
- Add marker clustering library

#### Lazy Loading

**Strategy**: Load markers only when layer is activated

```typescript
const LayerControls = () => {
  const [activeLayers, setActiveLayers] = useState(['locations']);

  return (
    <>
      {activeLayers.includes('characters') && <CharacterMarkers />}
      {activeLayers.includes('locations') && <LocationMarkers />}
    </>
  );
};
```

### 5. TypeScript Type Definitions

#### Required Types

```typescript
// map.ts
interface Location {
  id: string;
  name: string;
  description?: string;
  metadata: {
    bounds: [[number, number], [number, number]];
    center?: [number, number];
  };
}

interface CharacterLocation {
  id: string;
  character_token_id: number;
  location_id: string;
  wallet_address: string;
  transaction_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
  location?: Location;
}

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

type LayerType = 'locations' | 'characters' | 'burns' | 'deaths' | 'fights';
```

#### Event Handlers

```typescript
interface MapEventHandlers {
  onMarkerClick: (marker: MapMarker) => void;
  onMarkerHover: (marker: MapMarker) => void;
  onMapMove: (bounds: MapBounds) => void;
  onLayerToggle: (layer: LayerType, visible: boolean) => void;
}
```

### 6. Asset Optimization Recommendations

#### Images
1. **Compress wagdiemap.png**
   - Tool: ImageOptim, TinyPNG, or cwebp
   - Target: <3MB
   - Format: PNG (transparency) or WebP

2. **Optimize icons**
   - Already small (<10KB each)
   - Convert to WebP for consistency (optional)

#### Fonts
1. **Wagdie_Fraktur_21.otf** (28KB) - Good size
2. **EskapadeFraktur-Black.ttf** (120KB) - Acceptable

**Total asset size**: ~150KB (fonts) + ~3MB (map) = ~3.15MB
**Acceptable** for modern web applications

### 7. Integration Risks & Mitigations

#### Risk 1: SSR Issues
**Issue**: Leaflet requires browser APIs
**Mitigation**: Dynamic import with ssr: false

#### Risk 2: Large Image Size
**Issue**: 9.3MB map image impacts load time
**Mitigation**: Compress to <3MB before deployment

#### Risk 3: Marker Performance
**Issue**: 50+ markers may cause lag
**Mitigation**: React.memo + layer-based rendering, test with real data

#### Risk 4: Coordinate System Mismatch
**Issue**: Supabase coordinates don't match Leaflet format
**Mitigation**: Store coordinates in metadata JSON, transform in service layer

#### Risk 5: Asset Loading Race Conditions
**Issue**: Map renders before assets load
**Mitigation**: Loading state + asset preloading

## Unknowns Resolved

✅ **Asset Location**: Found in wagdie-map/public/
✅ **Leaflet Compatibility**: React-Leaflet 7.x compatible with Next.js 15
✅ **Data Structure**: Supabase tables identified, coordinate strategy defined
✅ **Performance**: Optimization strategies documented
✅ **TypeScript**: Required types and interfaces defined
✅ **Integration Approach**: Native Leaflet with ImageOverlay background

## Next Steps

1. **Create data-model.md** - Document entity relationships
2. **Create quickstart.md** - Setup and development guide
3. **Proceed to Phase 2** - `/speckit.tasks` for implementation planning

## References

- [Leaflet Documentation](https://leafletjs.com/reference-1.9.4.html)
- [React-Leaflet API](https://react-leaflet.js.org/)
- [wagdie-map project](../002-basic-ui-wireframe/reference)
- [Supabase TypeScript Types](../005-mock-data-integration/reference)
