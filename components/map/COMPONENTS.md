# Component Documentation

Detailed documentation for each map component in the refactored architecture.

## Table of Contents

1. [SimpleMap](#simplemap)
2. [MarkerComponent](#markercomponent)
3. [IconFactory](#iconfactory)
4. [PopupRenderer](#popuprenderer)
5. [TooltipRenderer](#tooltiprenderer)
6. [LayerController](#layercontroller)
7. [LayerControls](#layercontrols)
8. [Type-Specific Markers](#type-specific-markers)

---

## SimpleMap

**File**: `SimpleMap.tsx`
**Lines**: ~150
**Purpose**: Root orchestrator for the map component
**Features**:
- React.memo with custom comparison
- Delegates to specialized components
- Manages marker array creation
- Handles responsive behavior

### API

```typescript
interface SimpleMapProps {
  locations: Location[];
  characterLocations: CharacterLocation[];
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  onMarkerClick?: (marker: MapMarkerData) => void;
}

interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `locations` | `Location[]` | Yes | Array of location objects with bounds and metadata |
| `characterLocations` | `CharacterLocation[]` | Yes | Array of character location objects |
| `layers` | `LayerVisibility` | Yes | Layer visibility state |
| `toggleLayer` | `(layer: keyof LayerVisibility) => void` | Yes | Callback to toggle layer visibility |
| `onMarkerClick` | `(marker: MapMarkerData) => void` | No | Callback fired when any marker is clicked |

### Usage Example

```tsx
import { SimpleMap } from '@/components/map/SimpleMap';

function MapPage() {
  const [layers, setLayers] = useState<LayerVisibility>({
    locations: true,
    characters: true,
    burns: true,
    deaths: true,
    fights: true,
  });

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleMarkerClick = (marker: MapMarkerData) => {
    console.log('Marker clicked:', marker);
  };

  return (
    <SimpleMap
      locations={locations}
      characterLocations={characters}
      layers={layers}
      toggleLayer={toggleLayer}
      onMarkerClick={handleMarkerClick}
    />
  );
}
```

### Performance Considerations

- Uses React.memo to prevent unnecessary re-renders
- Marker arrays are created with useMemo
- Custom comparison checks only relevant props

---

## MarkerComponent

**File**: `MarkerComponent.tsx`
**Lines**: ~250
**Purpose**: Generic, type-agnostic marker renderer
**Features**:
- React.memo with custom comparison
- useCallback for click handler
- useMemo for icon, position, and content
- Performance monitoring integrated
- Supports all marker types

### API

```typescript
interface MarkerProps {
  id: string;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  data: Location | CharacterLocation | EventMarker;
  position: [number, number];
  onClick?: (marker: MapMarkerData) => void;
  isMobile?: boolean;
}

interface MapMarkerData {
  id: string;
  type: string;
  position: [number, number];
  data: Location | CharacterLocation | EventMarker;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | `string` | Yes | Unique identifier for the marker |
| `type` | `'location' \| 'character' \| 'burn' \| 'death' \| 'fight'` | Yes | Marker type determines icon and content |
| `data` | `Location \| CharacterLocation \| EventMarker` | Yes | Data object with type-specific properties |
| `position` | `[number, number]` | Yes | Marker position as [lat, lng] or [x, y] |
| `onClick` | `(marker: MapMarkerData) => void` | No | Callback fired when marker is clicked |
| `isMobile` | `boolean` | No | Override for mobile detection |

### Custom Comparison Function

```typescript
const areEqual = (prevProps: MarkerProps, nextProps: MarkerProps): boolean => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.position === nextProps.position &&
    prevProps.isMobile === nextProps.isMobile &&
    prevProps.type === nextProps.type &&
    (prevProps.data === nextProps.data ||
      (prevProps.data && nextProps.data &&
        'id' in prevProps.data && 'id' in nextProps.data &&
        prevProps.data.id === nextProps.data.id))
  );
};
```

### Usage Example

```tsx
import MarkerComponent from '@/components/map/MarkerComponent';

function MyMap() {
  const handleMarkerClick = (marker: MapMarkerData) => {
    alert(`Clicked ${marker.type} marker: ${marker.id}`);
  };

  return (
    <MarkerComponent
      id="location-1"
      type="location"
      data={locationData}
      position={[50, 50]}
      onClick={handleMarkerClick}
      isMobile={false}
    />
  );
}
```

### Performance Features

- **React.memo**: Prevents re-renders when props haven't changed
- **useCallback**: Click handler is memoized
- **useMemo**: Icon, position, and content are memoized
- **Performance Monitor**: Tracks render time for optimization

---

## IconFactory

**File**: `IconFactory.ts`
**Lines**: ~190
**Purpose**: Icon creation and caching with performance optimization
**Features**:
- Singleton pattern
- Cache with size management (100 items max)
- FIFO eviction when limit exceeded
- Type-mobile key generation
- Preloading support
- 100% test coverage

### API

```typescript
interface IconConfig {
  iconUrl: string;
  baseSize: [number, number];
  shadowUrl?: string;
}

type IconType = 'location' | 'character' | 'burn' | 'death' | 'fight';

interface IconFactoryOptions {
  defaultIconPath?: string;
  cacheSize?: number;
  enablePreloading?: boolean;
}
```

### Methods

#### `createIcon(type: IconType, isMobile: boolean): L.Icon`

Creates or retrieves a cached icon.

**Parameters**:
- `type`: Icon type (location, character, burn, death, fight)
- `isMobile`: Whether to create mobile-sized icon

**Returns**: Leaflet icon instance

**Cache Key**: `${type}-${isMobile ? 'mobile' : 'desktop'}`

**Example**:
```typescript
const icon = iconFactory.createIcon('location', false);
// Returns cached icon or creates new one
```

#### `getCacheSize(): number`

Returns the number of cached icons.

**Example**:
```typescript
const cacheSize = iconFactory.getCacheSize();
console.log(`Cached ${cacheSize} icons`);
```

#### `clearCache(): void`

Clears all cached icons.

**Example**:
```typescript
iconFactory.clearCache();
```

#### `preloadIcons(): void`

Pre-generates icons for all configured types.

**Example**:
```typescript
iconFactory.preloadIcons(); // Creates all icons upfront
```

### Configuration

```typescript
const iconConfigs = new Map<IconType, IconConfig>([
  ['location', {
    iconUrl: '/images/map-icons/icon_location.png',
    baseSize: [32, 32],
  }],
  ['character', {
    iconUrl: '/images/map-icons/icon_character.png',
    baseSize: [24, 24],
  }],
  ['burn', {
    iconUrl: '/images/map-icons/icon_burn.png',
    baseSize: [28, 28],
  }],
  ['death', {
    iconUrl: '/images/map-icons/icon_death.png',
    baseSize: [28, 28],
  }],
  ['fight', {
    iconUrl: '/images/map-icons/icon_fight.png',
    baseSize: [28, 28],
  }],
]);
```

### Singleton Pattern

```typescript
const getIconFactory = (): IconFactory => {
  if (!iconFactoryInstance) {
    iconFactoryInstance = new IconFactoryImpl(defaultIconConfigs, {
      enablePreloading: true,
      cacheSize: 100,
    });
    iconFactoryInstance.preloadIcons();
  }
  return iconFactoryInstance;
};
```

### Performance Characteristics

- **Cache Hit Rate**: ~99% for repeated icons
- **Memory Efficiency**: 100 identical icons = 1 instance
- **Cache Limit**: 100 items with FIFO eviction
- **Preloading**: Optional on singleton creation

---

## PopupRenderer

**File**: `PopupRenderer.tsx`
**Lines**: ~180
**Purpose**: Popup UI rendering with WAGDIE theming
**Features**:
- React.memo optimization
- WAGDIE theming (gold, abyss, Wagdie_Fraktur_21 font)
- Type-specific content building
- Accessible markup with ARIA attributes
- Responsive design

### API

```typescript
interface PopupContent {
  title: string;
  description?: string;
  details?: Record<string, string>;
  actions?: PopupAction[];
  accentColor?: string;
}

interface PopupAction {
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary';
  disabled?: boolean;
}

interface PopupRendererProps {
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  data: Location | CharacterLocation | EventMarker;
  content: PopupContent;
  maxWidth?: number;
  className?: string;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `MarkerType` | Yes | Type of popup (determines styling) |
| `data` | `Location \| CharacterLocation \| EventMarker` | Yes | Data object with type-specific properties |
| `content` | `PopupContent` | Yes | Popup content (title, description, details, actions) |
| `maxWidth` | `number` | No | Maximum width in pixels (default: 300) |
| `className` | `string` | No | Additional CSS classes |

### Content Structure

```typescript
const popupContent: PopupContent = {
  title: 'Location Name',
  description: 'A description of the location',
  details: {
    Area: 'Forest',
    Type: 'Location',
    Difficulty: 'Easy',
  },
  actions: [
    {
      label: 'Stake Character',
      onClick: () => handleStake(),
      variant: 'primary',
    },
    {
      label: 'View Details',
      onClick: () => handleView(),
      variant: 'secondary',
    },
  ],
};
```

### WAGDIE Theming

```typescript
const wagdieTheme = {
  titleColor: '#d4af37',  // Gold
  descriptionColor: '#e8e8e8',  // Bone
  backgroundColor: '#1a1a1a',  // Abyss
  borderColor: '#252525',  // Shadow
  fontFamily: "'Wagdie_Fraktur_21', serif",
};
```

### Usage Example

```tsx
import PopupRenderer from '@/components/map/PopupRenderer';

function MarkerWithPopup() {
  const location = locations[0];

  const content = {
    title: location.name,
    description: location.description,
    details: {
      Area: location.metadata?.area || 'Unknown',
      Type: location.metadata?.properties?.terrain || 'Unknown',
    },
    actions: [
      {
        label: 'Stake Character',
        onClick: () => alert('Stake feature coming soon!'),
        variant: 'primary',
      },
    ],
  };

  return (
    <PopupRenderer
      type="location"
      data={location}
      content={content}
    />
  );
}
```

---

## TooltipRenderer

**File**: `TooltipRenderer.tsx`
**Lines**: ~120
**Purpose**: Tooltip UI rendering with WAGDIE theming
**Features**:
- React.memo optimization
- WAGDIE theming (gold, abyss, Wagdie_Fraktur_21 font)
- Type-specific content building
- Accessible markup

### API

```typescript
interface TooltipContent {
  title: string;
  subtitle?: string;
}

interface TooltipRendererProps {
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  content: TooltipContent;
  direction?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  permanent?: boolean;
  opacity?: number;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `type` | `MarkerType` | Yes | Type of tooltip (determines accent color) |
| `content` | `TooltipContent` | Yes | Tooltip content (title, subtitle) |
| `direction` | `'top' \| 'bottom' \| 'left' \| 'right'` | No | Arrow direction (default: 'top') |
| `className` | `string` | No | Additional CSS classes |
| `permanent` | `boolean` | No | Whether tooltip is always visible (default: false) |
| `opacity` | `number` | No | Tooltip opacity 0-1 (default: 0.9) |

### Content Structure

```typescript
const tooltipContent: TooltipContent = {
  title: 'Location Name',
  subtitle: 'A subtitle or description',
};
```

### Accent Colors by Type

```typescript
const accentColors = {
  location: '#d4af37',  // Gold
  character: '#4a7c59',  // Green
  burn: '#ff6b35',  // Orange-red
  death: '#c92a2a',  // Red
  fight: '#ff6b35',  // Orange-red
};
```

### Usage Example

```tsx
import TooltipRenderer from '@/components/map/TooltipRenderer';

function MarkerWithTooltip() {
  const tooltipContent = {
    title: 'Test Location',
    subtitle: 'A test location for WAGDIE world',
  };

  return (
    <TooltipRenderer
      type="location"
      content={tooltipContent}
      direction="top"
      opacity={0.9}
    />
  );
}
```

---

## LayerController

**File**: `LayerController.tsx`
**Lines**: ~140
**Purpose**: Layer state management with context
**Features**:
- Context-based state management
- All methods use useCallback (prevent re-renders)
- Layer visibility toggle
- Marker filtering logic
- Optimized for performance

### API

```typescript
interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

interface LayerState {
  visible: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setLayerVisibility: (layer: keyof LayerVisibility, visible: boolean) => void;
  isLayerVisible: (layer: keyof LayerVisibility) => boolean;
  getVisibleMarkers: <T extends MarkerProps>(markers: T[]) => T[];
  getVisibleLayerCount: () => number;
}

interface LayerControllerProps {
  locations: React.ReactNode[];
  characterLocations: React.ReactNode[];
  burnMarkers: React.ReactNode[];
  deathMarkers: React.ReactNode[];
  fightMarkers: React.ReactNode[];
  children?: React.ReactNode;
}
```

### Default Layer State

```typescript
const defaultLayerVisibility: LayerVisibility = {
  locations: true,
  characters: true,
  burns: true,
  deaths: true,
  fights: true,
};
```

### Hook: useLayerController

```typescript
const { visible, toggleLayer, isLayerVisible } = useLayerController();
```

**Returns**:
- `visible`: Current layer visibility state
- `toggleLayer`: Toggle a specific layer
- `setLayerVisibility`: Set a layer to specific visibility
- `isLayerVisible`: Check if a layer is visible
- `getVisibleMarkers`: Filter markers based on visibility
- `getVisibleLayerCount`: Get count of visible layers

### Usage Example

```tsx
import { LayerController, useLayerController } from '@/components/map/LayerController';

function MapWithLayers() {
  return (
    <LayerController
      locations={locationMarkers}
      characterLocations={characterMarkers}
      burnMarkers={burnMarkers}
      deathMarkers={deathMarkers}
      fightMarkers={fightMarkers}
    >
      <MapComponents />
    </LayerController>
  );
}

function MapComponents() {
  const { visible, toggleLayer, isLayerVisible } = useLayerController();

  return (
    <>
      {visible.locations && <LocationMarkers />}
      {visible.characters && <CharacterMarkers />}
      {/* ... */}
    </>
  );
}
```

### Performance Features

- **useCallback**: All methods are memoized
- **Context optimization**: Only components using context re-render
- **Stable references**: Callbacks don't change unless state changes

---

## LayerControls

**File**: `LayerControls.tsx`
**Lines**: ~220
**Purpose**: Layer toggle UI controls
**Features**:
- Toggle buttons for each layer
- ARIA attributes for accessibility
- Keyboard navigation support
- Responsive design
- WAGDIE theming

### API

```typescript
interface LayerControlsProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
  onVisibilityChange?: (layers: LayerVisibility) => void;
  className?: string;
  showCounts?: boolean;
}
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `layers` | `LayerVisibility` | Yes | Current layer visibility state |
| `onToggle` | `(layer: keyof LayerVisibility) => void` | Yes | Callback when layer is toggled |
| `onVisibilityChange` | `(layers: LayerVisibility) => void` | No | Callback when any layer changes |
| `className` | `string` | No | Additional CSS classes |
| `showCounts` | `boolean` | No | Whether to show marker counts (default: true) |

### Layer Configuration

```typescript
const layerConfig = {
  locations: {
    key: 'locations' as const,
    label: 'Locations',
    iconPath: '/images/map-icons/icon_location.png',
    defaultVisible: true,
  },
  characters: {
    key: 'characters' as const,
    label: 'Characters',
    iconPath: '/images/map-icons/icon_character.png',
    defaultVisible: true,
  },
  burns: {
    key: 'burns' as const,
    label: 'Burns',
    iconPath: '/images/map-icons/icon_burn.png',
    defaultVisible: true,
  },
  deaths: {
    key: 'deaths' as const,
    label: 'Deaths',
    iconPath: '/images/map-icons/icon_death.png',
    defaultVisible: true,
  },
  fights: {
    key: 'fights' as const,
    label: 'Fights',
    iconPath: '/images/map-icons/icon_fight.png',
    defaultVisible: true,
  },
};
```

### Usage Example

```tsx
import LayerControls from '@/components/map/LayerControls';

function MapWithControls() {
  const [layers, setLayers] = useState<LayerVisibility>({
    locations: true,
    characters: true,
    burns: true,
    deaths: true,
    fights: true,
  });

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="map-container">
      <SimpleMap {...mapProps} />
      <LayerControls
        layers={layers}
        onToggle={toggleLayer}
        showCounts={true}
      />
    </div>
  );
}
```

### Accessibility Features

- `aria-label` on each toggle button
- `aria-pressed` indicates state
- Keyboard navigation support
- Focus management
- Screen reader announcements

---

## Type-Specific Markers

All type-specific markers wrap `MarkerComponent` for consistency and performance.

### LocationMarker

**File**: `components/map/markers/LocationMarker.tsx`
**Lines**: 29

```tsx
export default function LocationMarker(props: MarkerProps) {
  return (
    <MarkerComponent
      {...props}
      type="location"
      data={props.data as Location}
    />
  );
}
```

### CharacterMarker

**File**: `components/map/markers/CharacterMarker.tsx`
**Lines**: 29

```tsx
export default function CharacterMarker(props: MarkerProps) {
  return (
    <MarkerComponent
      {...props}
      type="character"
      data={props.data as CharacterLocation}
    />
  );
}
```

### BurnMarker

**File**: `components/map/markers/BurnMarker.tsx`
**Lines**: 29

```tsx
export default function BurnMarker(props: MarkerProps) {
  return (
    <MarkerComponent
      {...props}
      type="burn"
      data={props.data as EventMarker}
    />
  );
}
```

### DeathMarker

**File**: `components/map/markers/DeathMarker.tsx`
**Lines**: 29

```tsx
export default function DeathMarker(props: MarkerProps) {
  return (
    <MarkerComponent
      {...props}
      type="death"
      data={props.data as EventMarker}
    />
  );
}
```

### FightMarker

**File**: `components/map/markers/FightMarker.tsx`
**Lines**: 29

```tsx
export default function FightMarker(props: MarkerProps) {
  return (
    <MarkerComponent
      {...props}
      type="fight"
      data={props.data as EventMarker}
    />
  );
}
```

### Usage Example

```tsx
import LocationMarker from '@/components/map/markers/LocationMarker';
import CharacterMarker from '@/components/map/markers/CharacterMarker';

function MyMap() {
  return (
    <>
      <LocationMarker
        id="location-1"
        data={locationData}
        position={[50, 50]}
        onClick={handleClick}
      />
      <CharacterMarker
        id="character-1"
        data={characterData}
        position={[60, 60]}
        onClick={handleClick}
      />
    </>
  );
}
```

---

## Performance Tips

### 1. Use MarkerComponent for New Marker Types
Instead of creating a completely new component, wrap `MarkerComponent`:

```tsx
// ✅ Good
export default function MyMarker(props: MarkerProps) {
  return <MarkerComponent {...props} type="myType" data={props.data as MyData} />;
}

// ❌ Bad - Don't create a full implementation
export default function MyMarker(props: MarkerProps) {
  // ... full implementation duplicating MarkerComponent logic
}
```

### 2. Memoize Props
Ensure props passed to components are stable:

```tsx
// ✅ Good
const markerData = useMemo(() => ({
  id: '1',
  name: 'Location',
}), []);

// ❌ Bad - New object on every render
const markerData = { id: '1', name: 'Location' };
```

### 3. Use React.memo for Custom Components
If creating a custom component, wrap it with React.memo:

```tsx
// ✅ Good
const MyComponent = React.memo(function MyComponent(props: Props) {
  return <div>{props.data}</div>;
});

// ❌ Bad - Will re-render unnecessarily
function MyComponent(props: Props) {
  return <div>{props.data}</div>;
}
```

### 4. Optimize Layer Filtering
Filter markers efficiently:

```tsx
// ✅ Good - Only render visible markers
{layers.locations && locationMarkers}

// ❌ Bad - Render all markers, let LayerController handle it
{locationMarkers}
```

### 5. Monitor Performance
Use the performance monitor utility:

```typescript
import { getPerformanceMonitor } from '@/lib/utils/performance-monitor';

const monitor = getPerformanceMonitor();
const report = monitor.getReport();

if (!report.isHealthy) {
  console.warn('Performance issues:', report.violations);
}
```

---

## Testing

Each component has comprehensive unit tests:

### Running Tests

```bash
# All component tests
npm test -- components/

# Specific component test
npm test -- MarkerComponent.test.tsx

# Performance tests
npm test -- performance-tests.test.tsx

# With coverage
npm test -- --coverage
```

### Test Coverage

- **IconFactory**: 100%
- **TooltipRenderer**: 90.9%
- **LayerController**: 89.18%
- **MarkerComponent**: 81.81%
- **PopupRenderer**: 77.77%

### Mock Utilities

Use `tests/map/utils/leaflet-mocks.tsx` for testing:

```tsx
// Mocks are automatically loaded via jest.setup.js
// No need to import or configure
import { render, screen } from '@testing-library/react';
import MarkerComponent from '@/components/map/MarkerComponent';

test('renders marker', () => {
  render(<MarkerComponent {...props} />);
  expect(screen.getByTestId('leaflet-marker')).toBeInTheDocument();
});
```

---

**Last Updated**: 2025-11-05
**Version**: 2.0.0 (Refactored)
