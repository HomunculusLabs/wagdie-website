# Data Model: Map Code Refactoring

**Created**: 2025-11-05
**Related**: [Feature Specification](./spec.md)

## Type Definitions

### Core Map Entities

```typescript
// Location entity from Supabase
interface Location {
  id: string;
  name: string;
  description?: string;
  metadata: LocationMetadata;
}

interface LocationMetadata {
  area?: string;
  bounds: [[number, number], [number, number]]; // [[minX, minY], [maxX, maxY]]
  center?: [number, number];
  properties?: {
    terrain?: string;
    difficulty?: string;
  };
}

// Character location entity
interface CharacterLocation {
  character_token_id: number;
  wallet_address: string;
  location?: Location;
  status: 'active' | 'staked' | 'moved';
}

// Event marker entity (burns, deaths, fights)
interface EventMarker {
  id: string;
  type: 'burn' | 'death' | 'fight';
  title: string;
  description?: string;
  position: [number, number];
  timestamp?: string;
}
```

### Refactored Component Interfaces

```typescript
// Base marker props shared across all marker types
interface BaseMarkerProps {
  id: string;
  position: [number, number];
  onClick?: (marker: MapMarkerData) => void;
}

// Location marker specific props
interface LocationMarkerProps extends BaseMarkerProps {
  type: 'location';
  data: Location;
}

// Character marker specific props
interface CharacterMarkerProps extends BaseMarkerProps {
  type: 'character';
  data: CharacterLocation;
}

// Event marker specific props
interface EventMarkerProps extends BaseMarkerProps {
  type: 'burn' | 'death' | 'fight';
  data: EventMarker;
}

// Unified marker type
type MarkerProps = LocationMarkerProps | CharacterMarkerProps | EventMarkerProps;

// Layer visibility state
interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

// Map marker data for click handlers
interface MapMarkerData {
  id: string;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  position: [number, number];
  data: Location | CharacterLocation | EventMarker;
}
```

### Component State Management

```typescript
// Icon configuration for responsive design
interface IconConfig {
  baseSize: [number, number];
  iconUrl: string;
  mobileScale?: number;
  minTouchSize?: number;
}

// Layer controller state
interface LayerState {
  visible: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  getVisibleMarkers: () => MarkerProps[];
}
```

## Validation Rules

### Component Props
- All markers MUST have unique IDs
- Position coordinates MUST be valid numbers within map bounds [0, 2222]
- Type MUST match data structure (location → Location, etc.)

### State Transitions
- Layer visibility toggles MUST trigger re-render of affected markers only
- Icon creation MUST be memoized to prevent recreation on re-renders
- Popup/tooltip state MUST be isolated per marker (no global state)

### Performance Constraints
- Component re-renders MUST be limited to affected marker type
- Icon factory MUST cache created icons by size/type combination
- Map container MUST NOT re-render when only marker props change

## Data Flow

### Before Refactoring
```
SimpleMap.tsx (735 lines)
├── Icon creation (5 duplicate functions)
├── Marker rendering (5 duplicate patterns)
├── Popup rendering (5 duplicate components)
└── Layer control (mixed with rendering logic)
```

### After Refactoring
```
SimpleMap.tsx (~150 lines)
├── Orchestrates child components
└── Passes data via props

MarkerComponent (generic)
├── IconFactory (shared)
├── PopupRenderer (shared)
└── TooltipRenderer (shared)

LayerController
├── Manages visibility state
└── Filters markers by type
```

## Relationships

```
SimpleMap
├── uses → LayerController
├── uses → MarkerComponent (multiple instances)
├── uses → LayerControls (UI)
└── renders → MapContainer (from react-leaflet)

MarkerComponent
├── creates → L.Icon (via IconFactory)
├── renders → Popup (via PopupRenderer)
├── renders → Tooltip (via TooltipRenderer)
└── handles → onClick events
```

## State Diagrams

### Layer Visibility State
```
Initial: All layers visible
  ↓ (user toggles layer)
State Update: Specific layer visibility flips
  ↓
Re-render: Only affected markers update
  ↓
Stable: Other layers unchanged
```

### Icon Creation State
```
First call: Create icon, cache by key
  ↓
Subsequent calls: Return cached icon
  ↓
Resize event: Clear cache, recreate icons
  ↓
Stable: Cached icons reused
```
