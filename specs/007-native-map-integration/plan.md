# Implementation Plan: Native Map Integration (Replace Iframe)

**Branch**: `007-native-map-integration` | **Date**: 2025-11-03 | **Spec**: [link to spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-native-map-integration/spec.md`

## Summary

Replace iframe-based map with native Leaflet implementation to provide better performance, customization, and full control over map behavior. Enable users to:

1. View native interactive Leaflet map with WAGDIE world image overlay
2. Interact with location and character markers with tooltips and popups
3. Toggle map layers (locations, characters, burns, battles, deaths)
4. Experience WAGDIE-themed visual assets throughout the map

Technical approach: Integrate Leaflet 1.9+ with React-Leaflet 7+, copy WAGDIE assets from wagdie-map project, implement native map component, connect to Supabase for location data, maintain clean architecture separation.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React 18, Leaflet 1.9+, React-Leaflet 7+, wagmi v2, viem v2, Tailwind CSS 3.4, Supabase PostgreSQL
**New Dependencies**: `leaflet`, `react-leaflet`, `@types/leaflet`
**Storage**: Supabase PostgreSQL (locations, character_locations), Browser localStorage (wallet persistence)
**Source Assets**: wagdie-map project (`wagdiemap.png`, icons, fonts)
**Target Platform**: Web browser (desktop + mobile responsive)
**Performance Goals**: Map loads <3s, handles 50+ markers smoothly, responsive design
**Constraints**: Clean Architecture (UI/Service/Data layers), Type Safety, Custom WAGDIE branding
**Scale/Scope**: Community Web3 platform supporting ~1,000 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

**I. Simplicity First** ✅ PASS
- Native Leaflet with React-Leaflet (standard, well-documented)
- Copy assets from wagdie-map (reuse existing work)
- Direct Supabase queries (no ORM)
- No Docker, GraphQL, or complex infrastructure

**II. Community Accessibility** ✅ PASS
- Standard React/Leaflet patterns
- Clear component separation (UI/Service/Data)
- Well-commented code with README files
- No specialized expertise needed beyond React/TypeScript/Leaflet basics

**III. Clean Architecture** ⚠️ REQUIRES VIGILANCE
- Must maintain UI/Service/Data layer separation
- UI components (`components/map/`) cannot directly access Supabase
- Services (`lib/services/map/`) handle business logic and data fetching
- Data layer (`lib/repositories/`) for database access
- **Gate**: Architecture review in PR to ensure no layer violations

**IV. Type Safety & Contract Clarity** ✅ PASS
- All interfaces explicitly typed
- TypeScript types for Map, Location, CharacterLocation entities
- No `any` types without justification
- Component props with TypeScript interfaces
- Leaflet event handlers properly typed

**V. Test-Driven for Critical Paths** ✅ PASS
- Tests required for:
  - Map component rendering
  - Marker display and interactions
  - Layer toggle functionality
  - Character location fetching
- Integration tests for user journeys
- Optional for simple UI components

**VI. Documentation as Code** ✅ PASS
- README in `components/map/` explaining feature
- Inline comments for map interactions
- Architecture Decision Record (ADR) for native map integration
- Function-level comments for non-obvious logic
- Asset usage documentation

**VII. Web3 Pragmatism** ✅ PASS
- Read-only mode (view map without wallet)
- Loading states for all data fetching
- Error handling for missing assets or API failures
- Smooth wallet integration for character display

**OVERALL**: ✅ PASS - Feature aligns with constitution with proper architecture vigilance

## Project Structure

### Documentation (this feature)

```text
specs/007-native-map-integration/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
wagdie-simplified/
├── public/
│   ├── fonts/                  # WAGDIE fonts (copied from wagdie-map)
│   │   ├── Wagdie_Fraktur_21.otf
│   │   └── EskapadeFraktur-Black.ttf
│   └── images/
│       ├── wagdiemap.png       # WAGDIE world image tile (9.3MB)
│       └── map-icons/          # Marker icons
│           ├── icon_location.png
│           ├── icon_burn.png
│           ├── icon_death.png
│           └── icon_fight.png
│
├── app/
│   ├── map/
│   │   ├── page.tsx           # Native map page (replaces iframe)
│   │   └── README.md          # Map feature documentation
│   └── layout.tsx             # Root layout (updated with WAGDIE fonts)
│
├── components/
│   ├── map/                    # Map-specific UI components
│   │   ├── NativeMap.tsx      # Main Leaflet map component
│   │   ├── MapMarker.tsx      # Individual marker component
│   │   ├── MapPopup.tsx       # Popup display component
│   │   ├── MapTooltip.tsx     # Tooltip component
│   │   ├── LayerControls.tsx  # Layer toggle controls
│   │   └── CharacterList.tsx  # Character location display
│   ├── layout/
│   │   └── Header.tsx         # Navigation (ensure WAGDIE fonts)
│   └── shared/
│       └── ErrorBoundary.tsx  # Error boundary for map
│
├── lib/
│   ├── services/
│   │   └── map/               # Map business logic services
│   │       ├── locationService.ts
│   │       ├── characterLocationService.ts
│   │       └── assetLoader.ts
│   ├── repositories/          # Data access layer
│   │   ├── locationRepository.ts
│   │   └── characterLocationRepository.ts
│   └── types/
│       ├── map.ts             # Map-specific TypeScript types
│       └── assets.ts          # Asset type definitions
│
├── hooks/
│   └── map/                   # Map feature hooks
│       ├── useNativeMap.ts
│       ├── useLocations.ts
│       ├── useCharacterLocations.ts
│       └── useLayerVisibility.ts
│
└── styles/
    └── globals.css           # Import Leaflet CSS
```

**Structure Decision**: Next.js App Router with clean architecture separation. UI components isolated in `components/map/`, business logic in `lib/services/map/`, custom hooks in `hooks/map/`, assets in `public/`. All components follow TypeScript strict mode with explicit interfaces.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations identified. Clean architecture maintained throughout with native Leaflet integration following React patterns.

---

## Phase 0: Research & Unknowns Resolution

**Status**: ✅ COMPLETE

### Unknowns Identified

1. **WAGDIE Map Assets Location**
   - Source of `wagdiemap.png` (9.3MB image tile)
   - WAGDIE icon set for markers
   - WAGDIE font files for branding

2. **Leaflet Integration Approach**
   - React-Leaflet version compatibility with Next.js 15
   - Best practices for image overlay as map background
   - Dynamic import strategy for Leaflet (SSR considerations)

3. **Map Locations Data Structure**
   - Available locations in Supabase
   - Location metadata (coordinates, properties)
   - How to transform coordinates for Leaflet

4. **Performance Considerations**
   - Marker clustering for large datasets
   - Image optimization for wagdiemap.png
   - Efficient marker rendering strategies

### Research Tasks

**Task 1**: Extract WAGDIE assets from wagdie-map project
- Copy `wagdiemap.png` from wagdie-map/public/images/
- Copy icon sets from wagdie-map/public/images/mapicons/
- Copy fonts from wagdie-map/public/fonts/
- Verify asset compatibility

**Task 2**: Analyze Leaflet integration requirements
- Test React-Leaflet with Next.js 15 App Router
- Research image overlay best practices
- Investigate SSR compatibility and dynamic imports
- Document integration approach

**Task 3**: Review Supabase location data
- Query locations table structure
- Verify character_locations data
- Understand coordinate system used
- Plan data transformation for Leaflet

**Task 4**: Design marker and layer system
- Define marker types (locations, characters, burns, battles, deaths)
- Plan layer toggle architecture
- Design tooltip and popup content structure
- Optimize for performance

### Research Findings

**Finding 1: WAGDIE Assets Available**
- Assets located in `/Users/t3rpz/projects/wagdie-map/public/`
- `wagdiemap.png` is 9.3MB and needs optimization
- Complete icon sets available in `mapicons/` and `legendicons/`
- Fonts: `Wagdie_Fraktur_21.otf/.ttf` and `EskapadeFraktur-Black.ttf`

**Finding 2: Leaflet Integration Approach**
- Use `react-leaflet` 7.x with Next.js 15
- Dynamic import required: `dynamic(() => import('leaflet'), { ssr: false })`
- Use `ImageOverlay` component for wagdiemap.png background
- Import Leaflet CSS in globals.css

**Finding 3: Location Data Structure**
- Supabase `locations` table contains staking locations
- `character_locations` table links characters to locations
- Coordinates need conversion for Leaflet (lat/lng format)
- Timestamp tracking available for location changes

**Finding 4: Performance Strategy**
- Use React.memo for marker components
- Implement layer-based rendering (only render visible layers)
- Consider react-leaflet-markercluster for large marker sets
- Optimize wagdiemap.png for web (compressed to ~2-3MB)

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

### Deliverables Generated

- [x] `data-model.md` - Entity relationships and data structure
- [x] `quickstart.md` - Setup and development guide
- [x] Map component architecture design
- [x] Asset integration strategy
- [x] Performance optimization plan

### Design Decisions

**Decision 1: Native Leaflet Implementation**
- **Choice**: Full native Leaflet with React-Leaflet
- **Rationale**: Better performance, customization, no iframe dependency
- **Alternative**: Keep iframe - rejected (limited control, external dependency)
- **Status**: ✅ Finalized

**Decision 2: Image Overlay as Background**
- **Choice**: Use Leaflet ImageOverlay for wagdiemap.png
- **Rationale**: Native Leaflet approach, proper zoom/pan behavior
- **Alternative**: CSS background - rejected (poor zoom/pan integration)
- **Status**: ✅ Finalized

**Decision 3: Layer-Based Marker System**
- **Choice**: Separate layer for each marker type with toggle controls
- **Rationale**: Clean separation, performance optimization, user control
- **Alternative**: Single layer with filtering - rejected (less flexible)
- **Status**: ✅ Finalized

**Decision 4: Asset Integration**
- **Choice**: Copy assets from wagdie-map to public/ directory
- **Rationale**: Full control, no external dependency
- **Alternative**: Reference wagdie-map directly - rejected (coupling)
- **Status**: ✅ Finalized

**Decision 5: Map Component Architecture**
- **Choice**: Single NativeMap component with child marker/popup components
- **Rationale**: Clean separation, testable, maintainable
- **Alternative**: Monolithic component - rejected (hard to maintain)
- **Status**: ✅ Finalized

### Constitution Check (Re-evaluation)

**Post-Design Gate Check**:

✅ All design decisions align with Simplicity First (native Leaflet, direct Supabase, asset reuse)
✅ Architecture supports Community Accessibility (standard React/Leaflet patterns)
✅ Clean Architecture maintained (UI/Service/Data layers clearly defined)
✅ Type Safety enforced (TypeScript throughout with explicit interfaces)
✅ Test coverage planned (component tests, integration tests)
✅ Documentation requirements defined (README, inline comments, ADR)
✅ Web3 Pragmatism achieved (read-only mode, loading states, error handling)

**OVERALL**: ✅ PASS - Design validated, ready for implementation

---

## Summary

**Phase 0**: ✅ Research completed - All unknowns resolved
**Phase 1**: ✅ Design completed - Architecture and approach defined

**Next**: Phase 2 - `/speckit.tasks` for implementation planning
