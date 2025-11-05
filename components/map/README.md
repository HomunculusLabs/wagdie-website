# Map Components

This directory contains UI components for the **Native Map Integration** feature, which replaces the iframe-based map with a native Leaflet implementation. The native map provides better performance, accessibility, and control over the WAGDIE world visualization.

## Overview

The native map is a fully-featured, production-ready implementation built with Leaflet, React, and TypeScript. It provides an interactive visualization of the WAGDIE world with custom markers, layer controls, character management, and responsive design.

## Components

### SimpleMap
Main native Leaflet map component that displays the WAGDIE world as an interactive map with custom image overlay.

**Features**:
- Native Leaflet map with WAGDIE world image (`wagdiemap.png`) at 2222x2222 resolution
- Interactive markers for locations and characters with WAGDIE-themed icons
- Layer controls for toggling marker visibility (Locations, Characters, Burns, Deaths, Fights)
- Smooth zoom and pan controls with CRS.Simple coordinate system
- Responsive design with window resize handling
- Accessibility features (keyboard navigation, ARIA labels, screen reader support)
- Performance optimizations (React.memo, custom prop comparison)
- Keyboard shortcuts (L = locations, C = characters, Escape = close panels)

**Usage**:
```tsx
import { SimpleMap } from '@/components/map/SimpleMap'

export default function MapPage() {
  return (
    <SimpleMap
      locations={locations}
      characterLocations={characterLocations}
      layers={layers}
      toggleLayer={toggleLayer}
      onMarkerClick={(marker) => {
        console.log('Marker clicked:', marker);
      }}
      ref={mapRef}
    />
  )
}
```

### CharacterListPanel
Displays user's characters with their current locations, with click-to-focus map functionality.

**Features**:
- Shows owned characters filtered by connected wallet
- Character selection with visual feedback
- Click to focus map on character location
- Responsive design with mobile support
- "No Characters" empty state
- Character ownership badges
- Status indicators (pending, confirmed, etc.)
- Full accessibility with ARIA labels and screen reader support

### MapPopup
Popup component for detailed marker information on click.

**Features**:
- Location popups with area, type, difficulty, and character count
- Character popups with token ID, location, status, and wallet
- Ownership badges for user-owned characters
- Staking/unstaking action buttons
- WAGDIE-themed styling with Wagdie_Fraktur_21 font
- Responsive sizing for mobile and tablet
- Transaction status display

### MapTooltip
Tooltip component for marker hover states with WAGDIE theming.

**Features**:
- Hover tooltips with location/character info
- Mobile-friendly touch interactions
- WAGDIE font and color scheme
- Smooth animations

### ErrorBoundary
Production-ready error boundary with WAGDIE theming.

**Features**:
- WAGDIE-themed error UI (gold, abyss colors)
- Retry and reload functionality
- Collapsible error details
- Production error reporting
- Wraps map components for graceful error handling

**Usage**:
```tsx
import { withErrorBoundary } from '@/components/shared/ErrorBoundary'

const SafeMap = withErrorBoundary(SimpleMap, {
  fallback: <div>Error loading map</div>
})
```

## Custom Hooks

### useMapData
Fetches locations and character locations from Supabase with fallback to mock data.

**Features**:
- Supabase integration for real data
- Mock data fallback when Supabase unavailable
- Loading states and error handling
- Timeout handling for slow connections

### useMapLayers
Manages layer visibility state with localStorage persistence.

**Features**:
- Toggle visibility for 5 layers (Locations, Characters, Burns, Deaths, Fights)
- Persists user preferences to localStorage
- Smooth transitions for marker appearance/disappearance
- Default layer states on first load

### useWallet
Manages wallet connection state for character ownership checks.

**Features**:
- Wallet connection via RainbowKit/wagmi
- Character filtering by wallet ownership
- Connection status indicators
- Disconnect functionality

## Architecture

These components follow the **Clean Architecture** pattern with clear separation of concerns:

### UI Layer
Pure React components with no business logic, optimized for performance.

**Components**:
- `SimpleMap.tsx` - Main map component using Leaflet (memoized)
- `CharacterListPanel.tsx` - Character list sidebar (memoized)
- `MapPopup.tsx` - Marker popup display (memoized)
- `ErrorBoundary.tsx` - Error handling wrapper

### Application Layer
Custom hooks for state management and side effects.

**Hooks**:
- `useMapData` - Data fetching from Supabase
- `useMapLayers` - Layer visibility state
- `useWallet` - Wallet connection management

### Domain Layer
Business logic services with TypeScript types.

**Services**:
- `locationService.ts` - Location-related business logic
- `characterLocationService.ts` - Character location business logic

### Infrastructure Layer
Data access layer with Supabase integration.

**Repositories**:
- `locationRepository.ts` - Supabase queries for locations
- `characterLocationRepository.ts` - Supabase queries for character locations

## Technology Stack

- **Leaflet 1.9.4** - Core mapping library
- **React-Leaflet 4.2.1** - React integration for Leaflet
- **TypeScript 5+** - Full type safety throughout
- **Tailwind CSS 3.4** - Styling with WAGDIE theme
- **Supabase** - Data source for locations and character positions
- **RainbowKit + wagmi** - Wallet connection
- **React 18** - UI framework with concurrent features

## WAGDIE Theme

### Fonts
Located in `/public/fonts/`:
- `Wagdie_Fraktur_21.otf` - Primary font for all UI elements
- `EskapadeFraktur-Black.ttf` - Decorative accents

### Colors
- **Gold** (`#d4af37`) - Primary accent, buttons, highlights
- **Abyss** (`#0a0a0a`) - Dark background
- **Shadow** (`#1a1a1a`) - Panel backgrounds
- **Midnight** (`#252525`) - Card backgrounds
- **Bone** (`#e8e8e8`) - Primary text
- **Mist** (`#b0b0b0`) - Secondary text
- **Ember** (`#ff6b35`) - Hover states
- **Poison** (`#4a7c59`) - Success states

### Icons
Located in `/public/images/map-icons/`:
- `icon_location.png` - Location markers
- `icon_character.png` - Character markers
- `icon_burn.png` - Burn event markers
- `icon_death.png` - Death event markers
- `icon_fight.png` - Fight/battle event markers

## Map Configuration

### Coordinate System
- **CRS.Simple** - Custom coordinate system for WAGDIE world
- **Bounds**: `[[0, 0], [2222, 2222]]` - Full world extent
- **Center**: `[1111, 1111]` - Map center point
- **Zoom Range**: `-2` to `2` - Prevent extreme zoom levels

### Marker Sizing
- **Base Sizes**: 32x32px (locations), 24x24px (characters)
- **Mobile Scaling**: 1.5x for touch-friendly targets
- **Minimum Touch Target**: 44px (Apple/Google guidelines)

## Key Features

### ✅ User Story 1 - Native Map Display
- Native Leaflet map replaces iframe
- WAGDIE world image renders as background
- Map loads at `/map` route
- Smooth zoom/pan with CRS.Simple
- Map attribution control with WAGDIE branding
- Loading states and error handling
- Responsive resize handling

### ✅ User Story 2 - Interactive Markers
- Location markers display with WAGDIE icons
- Character markers display with WAGDIE icons
- Hover tooltips with location/character info
- Detailed popups on marker click
- Smooth hover animations (scale + glow)

### ✅ User Story 3 - Layer Controls
- Layer toggle controls UI with WAGDIE icons
- Locations and Characters layers fully functional
- WAGDIE-themed controls (gold, abyss, fonts)
- Layer persistence to localStorage
- Smooth transitions for marker appearance/disappearance
- All 5 layers displayed (3 marked "Coming Soon")

### ✅ User Story 4 - Asset Integration
- WAGDIE fonts applied to all map UI elements
- Smooth CSS animations for markers
- WAGDIE color scheme (gold, ember, abyss)
- WAGDIE-styled popup templates
- Enhanced loading animation with progress bar
- Icon animations for layer toggle buttons

### ✅ User Story 5 - Character Location Display
- Character popups with ownership badges and staking options
- Wallet connection status and character ownership check
- "No Characters" empty state component
- Character ownership status in popups with highlighting
- Staking integration to character popups
- Character list panel with click-to-focus map functionality

### ✅ User Story 6 - Responsive Design
- Mobile touch interactions with 44px+ touch targets
- Responsive layer controls optimized for all screen sizes
- Character list panel with full mobile support
- Responsive wallet buttons and status indicators
- Mobile-friendly tooltips and popups
- Touch-optimized marker sizing and interactions

### ✅ Phase 9 - Production Features
- Error Boundary with WAGDIE theming and retry functionality
- React.memo optimization for all components
- Keyboard navigation (L, C, Escape shortcuts)
- Comprehensive ARIA labels and screen reader support
- Focus management with gold focus rings
- Live regions for status announcements

## Performance Optimizations

### React.memo
All major components are memoized to prevent unnecessary re-renders:

- **SimpleMap**: Custom prop comparison for locations, characterLocations, layers
- **CharacterListPanel**: Prevents re-renders on parent updates
- **MapPopup**: Optimized for frequent popup updates

### Efficient Re-rendering
- Only re-renders when data actually changes
- Deep prop comparison in SimpleMap
- Callback memoization in parent components

### Responsive Images
- Touch-friendly marker sizing
- Optimized icon loading with proper caching
- Efficient layer management

## Accessibility Features

### Keyboard Navigation
- **Tab** - Navigate through interactive elements
- **L** - Toggle locations layer
- **C** - Toggle characters layer
- **Escape** - Close character panel or popups

### ARIA Support
- Comprehensive labels for all interactive elements
- `aria-label` on buttons and controls
- `aria-expanded` for collapsible panels
- `aria-controls` for panel associations
- `aria-describedby` for additional context
- `role` attributes throughout

### Screen Reader Support
- Hidden descriptive text via `sr-only` classes
- Live regions for dynamic announcements (`aria-live="polite"`)
- Status announcements for layer toggles
- Character ownership indicators

### Focus Management
- Visible focus rings (gold color)
- Proper focus order for navigation
- Skip to content link
- Focus trapping in panels (planned)

## Asset Management

### Map Assets
Located in `/public/images/`:
- `wagdiemap.png` - Main world map image (2222x2222, 9.3MB)
  - ⚠️ **Performance Note**: Consider compressing to <3MB for production
- `map-icons/` - Marker icons directory
  - 5 icon types for different marker categories
  - PNG format with transparency

### Font Assets
Located in `/public/fonts/`:
- `Wagdie_Fraktur_21.otf` - Primary WAGDIE font (applied globally)
- `EskapadeFraktur-Black.ttf` - Decorative accents

## Development

### Prerequisites
- Node.js 18+
- Dependencies: `leaflet`, `react-leaflet`, `@types/leaflet`
- Assets in `/public/images/` and `/public/fonts/`

### Local Development
1. Install dependencies:
   ```bash
   npm install leaflet react-leaflet @types/leaflet
   ```

2. Verify assets:
   ```bash
   ls public/images/map-icons/
   ls public/fonts/
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Navigate to `/map` to view the native map

### Testing Checklist

#### Functional Testing
- [ ] Map loads without errors
- [ ] WAGDIE world image displays correctly
- [ ] Location markers appear and are interactive
- [ ] Character markers appear and are interactive
- [ ] Layer toggles work correctly
- [ ] Character panel opens/closes
- [ ] Wallet connection works
- [ ] Popups display on marker click
- [ ] Tooltips appear on hover

#### Responsive Testing
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet portrait (768x1024)
- [ ] Tablet landscape (1024x768)
- [ ] Mobile portrait (375x667)
- [ ] Mobile landscape (667x375)

#### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces elements
- [ ] Focus indicators are visible
- [ ] All ARIA attributes present
- [ ] Skip link functions

#### Performance Testing
- [ ] Map loads in <3 seconds
- [ ] Smooth 60fps animations
- [ ] No memory leaks during navigation
- [ ] Responsive marker clustering (when implemented)

## API Reference

### SimpleMap Props

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

### CharacterListPanel Props

```typescript
interface CharacterListPanelProps {
  characters: CharacterLocation[];
  connectedWallet: string | null;
  onCharacterSelect?: (character: CharacterLocation) => void;
  onClose?: () => void;
}
```

### MapPopup Props

```typescript
interface MapPopupProps {
  data: Location | CharacterLocation | null;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  onClose?: () => void;
  connectedWallet?: string | null;
}
```

## Data Flow

```
User Action
    ↓
Component (SimpleMap, CharacterListPanel, etc.)
    ↓
Custom Hook (useMapData, useMapLayers, useWallet)
    ↓
Service (locationService, characterLocationService)
    ↓
Repository (locationRepository, characterLocationRepository)
    ↓
Supabase Database
```

## Future Enhancements

### Planned Features
- **Marker Clustering** - Performance optimization for 50+ markers
- **Real-time Updates** - Live character location updates
- **Burn/Death/Fight Layers** - Full implementation of event markers
- **Advanced Animations** - Enhanced WAGDIE-themed transitions
- **Mobile Gesture Support** - Pinch-to-zoom optimizations

### Performance Improvements
- **Image Compression** - Reduce wagdiemap.png from 9.3MB to <3MB
- **Lazy Loading** - Load markers on demand
- **Virtualization** - Virtual scroll for character list
- **Web Workers** - Offload heavy computations

### Accessibility Enhancements
- **Focus Trapping** - Trap focus in modals and panels
- **High Contrast Mode** - Support for high contrast themes
- **Voice Navigation** - Voice commands for common actions

## Troubleshooting

### Map Not Loading
1. Check browser console for errors
2. Verify `wagdiemap.png` exists in `/public/images/`
3. Ensure Leaflet CSS is imported
4. Check Supabase connection

### Markers Not Displaying
1. Verify marker icon files exist in `/public/images/map-icons/`
2. Check that locations/characters have required metadata
3. Ensure layer toggles are enabled
4. Verify coordinate bounds are valid

### Performance Issues
1. Enable React DevTools Profiler
2. Check for unnecessary re-renders
3. Verify memoization is working
4. Consider marker clustering for large datasets

### Mobile Issues
1. Test touch target sizes (minimum 44px)
2. Verify responsive breakpoints
3. Check viewport meta tag
4. Test on actual devices, not just browser dev tools

## Contributing

When adding new features:

1. Follow the Clean Architecture pattern
2. Add TypeScript types for all new props/data
3. Include WAGDIE theming (fonts, colors)
4. Add accessibility features (ARIA, keyboard nav)
5. Test on multiple screen sizes
6. Add performance optimizations (memoization)
7. Update this README with new features

## License

WAGDIE Project - Native Map Integration
