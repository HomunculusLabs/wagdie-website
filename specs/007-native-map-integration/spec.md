# Feature Specification: Native Map Integration (Replace Iframe)

**Feature Branch**: `007-native-map-integration`
**Created**: 2025-11-03
**Status**: Ready for Implementation
**Input**: User description: "lets implement the map without the iframe please"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Native Map Display (Priority: P1)

Users can access the native interactive map that displays the WAGDIE world with custom Leaflet-based rendering, replacing the previous iframe integration.

**Why this priority**: A native map provides better performance, customization, and integration with the application's UI and data sources. It eliminates dependency on external iframe services and enables full control over map behavior.

**Independent Test**: Can be tested by navigating to `/map` URL and verifying the native Leaflet map renders with the WAGDIE world image overlay.

**Acceptance Scenarios**:

1. **Given** a user is on the home page, **When** they click "World Map" in the navigation, **Then** they are taken to the `/map` page and a native interactive map displays
2. **Given** a user visits `/map` directly, **When** the page loads, **Then** the native Leaflet map renders with the WAGDIE world image tile
3. **Given** a user views the map, **When** they zoom or pan, **Then** the map responds smoothly without iframe limitations
4. **Given** a user first loads the map, **When** the page renders, **Then** they see a loading state before the map appears

---

### User Story 2 - Interactive Markers (Priority: P2)

Users can interact with map markers that represent locations, characters, burns, battles, and deaths with hover effects and click actions.

**Why this priority**: Interactive markers transform the map from a static display to an engaging exploration tool, allowing users to discover content and understand the WAGDIE world narrative.

**Independent Test**: Can be tested by hovering over markers to see tooltips and clicking to view location or character details.

**Acceptance Scenarios**:

1. **Given** a user views the map, **When** they hover over a marker, **Then** a tooltip appears showing relevant information
2. **Given** a user clicks on a location marker, **When** they click, **Then** a popup displays with location details and options
3. **Given** a user clicks on a character marker, **When** they click, **Then** a popup shows character information and ownership status
4. **Given** a user hovers over burn/death/fight markers, **When** the mouse enters the marker, **Then** descriptive tooltips explain the event

---

### User Story 3 - Layer Controls (Priority: P3)

Users can toggle map layers on/off to focus on specific types of content (locations, characters, burns, battles, deaths).

**Why this priority**: Layer controls allow users to customize their view based on their interests and reduce visual clutter when exploring specific aspects of the world.

**Independent Test**: Can be tested by clicking layer toggle buttons and verifying markers appear/disappear based on selected layers.

**Acceptance Scenarios**:

1. **Given** a user views the map, **When** they click a layer toggle button, **Then** the corresponding markers appear or hide on the map
2. **Given** a user has toggled off all markers, **When** they view the map, **Then** only the base world image is visible
3. **Given** a user toggles multiple layers on, **When** they view the map, **Then** all selected layer markers are visible simultaneously
4. **Given** a user returns to the map page, **When** the page loads, **Then** their previous layer selections are remembered (optional)

---

### User Story 4 - Asset Integration (Priority: P4)

Users see WAGDIE-themed visual assets including custom fonts, icons, and animations integrated throughout the map interface.

**Why this priority**: Consistent branding and visual assets create an immersive experience that matches the WAGDIE aesthetic and strengthens brand identity.

**Independent Test**: Can be tested by examining map UI elements for WAGDIE fonts, icons, and visual styling.

**Acceptance Scenarios**:

1. **Given** a user views the map interface, **When** they read any text, **Then** WAGDIE custom fonts are used throughout
2. **Given** a user views map markers, **When** they examine the icons, **Then** WAGDIE-themed icons are displayed
3. **Given** a user interacts with UI elements, **When** they hover over buttons or controls, **Then** smooth animations enhance the experience
4. **Given** a user opens popups or modals, **When** they view the content, **Then** consistent WAGDIE styling is applied

---

### User Story 5 - Character Location Display (Priority: P5)

Authenticated users can view their owned characters' positions on the native map with accurate location data from Supabase.

**Why this priority**: Character location tracking is essential for owners to understand their character's current state and plan movements or interactions in the WAGDIE world.

**Independent Test**: Can be tested by connecting a wallet that owns WAGDIE characters and verifying location markers appear on the map.

**Acceptance Scenarios**:

1. **Given** a user has connected their wallet with WAGDIE characters, **When** they view the map, **Then** their characters appear as markers at their current locations
2. **Given** a user views a character marker they own, **When** they click it, **Then** a popup shows character details and staking options
3. **Given** a user has characters at different locations, **When** they view the map, **Then** all their characters are visible simultaneously
4. **Given** a user has no characters, **When** they view the map, **Then** they see a prompt encouraging them to acquire characters (optional)

---

### User Story 6 - Responsive Design (Priority: P6)

The native map works seamlessly across different screen sizes, from mobile phones to desktop displays.

**Why this priority**: Users access the application from various devices, and the map must provide a consistent, functional experience regardless of screen size.

**Independent Test**: Can be tested by resizing the browser window or viewing on different devices to verify map remains usable.

**Acceptance Scenarios**:

1. **Given** a user views the map on mobile, **When** they interact with markers, **Then** touch interactions work smoothly
2. **Given** a user views the map on tablet, **When** they pan and zoom, **Then** gestures work as expected
3. **Given** a user resizes the browser window, **When** the window changes size, **Then** the map container adjusts and reflows
4. **Given** a user switches between portrait and landscape, **When** on mobile, **Then** the map remains functional and properly sized

---

## Edge Cases

- What happens when the WAGDIE world image tile fails to load?
- How does the system handle characters with invalid or missing location coordinates?
- What occurs when Supabase is unavailable and character location data cannot be fetched?
- How are markers with duplicate or overlapping coordinates handled?
- What happens when users click markers very rapidly (click spam)?
- How does the system perform with 100+ markers displayed simultaneously?
- What occurs during re-renders (e.g., authentication state changes)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace iframe-based map with native Leaflet implementation
- **FR-002**: System MUST render WAGDIE world image tile (`wagdiemap.png`) as map background using Leaflet
- **FR-003**: System MUST install and configure Leaflet (`leaflet`, `react-leaflet`, `@types/leaflet`) dependencies
- **FR-004**: System MUST copy WAGDIE map assets from wagdie-map project (`wagdiemap.png`, icons, fonts)
- **FR-005**: System MUST display interactive markers for:
  - Staking locations from Supabase `locations` table
  - Character positions from Supabase `character_locations` table
  - Burns, battles, deaths from wagdie.wiki data (optional for Phase 1)
- **FR-006**: System MUST implement layer toggle controls for marker visibility
- **FR-007**: System MUST show tooltips on marker hover with relevant information
- **FR-008**: System MUST display popups on marker click with detailed information
- **FR-009**: System MUST integrate WAGDIE custom fonts into Tailwind CSS configuration
- **FR-010**: System MUST display map markers using WAGDIE icon set
- **FR-011**: System MUST handle loading states while map initializes
- **FR-012**: System MUST handle error states gracefully (missing assets, API failures, etc.)
- **FR-013**: System MUST implement responsive design for mobile, tablet, and desktop
- **FR-014**: System MUST connect to Supabase for real-time location data
- **FR-015**: System MUST maintain existing `/map` route and navigation integration
- **FR-016**: System MUST work with existing authentication and wallet connection
- **FR-017**: System MUST optimize performance for large marker sets
- **FR-018**: System MUST implement marker clustering if needed for performance

### Technical Requirements

- **TR-001**: Technology Stack - Use Leaflet 1.9+ with React-Leaflet 7+
- **TR-002**: Language - All code must be TypeScript 5+
- **TR-003**: Architecture - Follow Clean Architecture patterns (hooks, services, repositories)
- **TR-004**: Styling - Integrate with existing Tailwind CSS 3.4
- **TR-005**: Data Source - Use Supabase PostgreSQL for location and character data
- **TR-006**: Image Assets - Optimize `wagdiemap.png` (9.3MB) for web if needed
- **TR-007**: Type Safety - Define TypeScript interfaces for Map, Location, CharacterLocation entities
- **TR-008**: Error Handling - Implement Error Boundaries for map component
- **TR-009**: Performance - Use React.memo and useMemo for expensive map operations
- **TR-010**: Accessibility - Ensure keyboard navigation and screen reader support

### Key Entities

- **Map**: Native Leaflet map instance with WAGDIE world image overlay
- **Location**: Named area in the WAGDIE world from Supabase `locations` table
- **CharacterLocation**: Current position of a character from Supabase `character_locations` table
- **Marker**: Interactive element on map representing locations, characters, or events
- **Layer**: Category of markers that can be toggled on/off independently
- **MapAsset**: Visual resource (image, icon, font) used in map rendering

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Map page loads native Leaflet map within 3 seconds on standard connections
- **SC-002**: All markers display correctly with hover tooltips and click popups working
- **SC-003**: Layer toggles successfully show/hide corresponding marker categories
- **SC-004**: WAGDIE fonts render correctly throughout map interface
- **SC-005**: Map is fully functional on mobile (touch interactions, responsive layout)
- **SC-006**: Character location data loads from Supabase within 2 seconds
- **SC-007**: Zero dependency on wagdie.world iframe
- **SC-008**: Map remains responsive with 50+ markers displayed
- **SC-009**: All interactive elements have proper hover states and animations
- **SC-010**: Error boundaries catch and display user-friendly errors for map issues

### Completion Checklist

- [ ] Leaflet dependencies installed and configured
- [ ] WAGDIE map assets copied from wagdie-map project
- [ ] WAGDIE fonts integrated into Tailwind config
- [ ] Native Leaflet map component implemented
- [ ] WAGDIE world image tile renders as map background
- [ ] Location markers from Supabase display correctly
- [ ] Character location markers display for authenticated users
- [ ] Layer toggle controls implemented and functional
- [ ] Marker hover tooltips working
- [ ] Marker click popups displaying information
- [ ] Icon set integrated and displaying on markers
- [ ] Responsive design implemented for all screen sizes
- [ ] Error boundaries implemented
- [ ] Loading states added for map initialization
- [ ] Performance optimized for large marker sets
- [ ] All existing navigation to `/map` still works
- [ ] Optional: Burn/battle/death markers from wagdie.wiki
- [ ] Optional: Marker clustering for performance
- [ ] Testing completed on mobile, tablet, desktop

## Assumptions

- Users can access the WAGDIE world image tile (`wagdiemap.png`) from wagdie-map project
- Supabase `locations` and `character_locations` tables contain accurate data
- Existing authentication and wallet connection systems continue to work
- Leaflet 1.9+ is compatible with React 18 and Next.js 15
- Performance requirements can be met without marker clustering for initial release
- WAGDIE visual assets (fonts, icons) can be integrated without licensing issues
