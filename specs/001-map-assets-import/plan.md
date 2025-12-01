# Implementation Plan: Map Assets Import and Integration

**Branch**: `001-map-assets-import` | **Date**: 2025-11-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-map-assets-import/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Import and integrate all visual assets from the wagdie-map project into the current simplified map implementation. This involves copying map icons, legend elements, staking dialog assets, wallet connection assets, and border decorations from the source project's public/images directory into the current project's flat /images/ structure. The implementation must maintain existing IconFactory functionality while updating asset paths, implement progressive fallbacks for failed loads, and ensure responsive scaling across devices.

## Technical Context

**Language/Version**: TypeScript 5.0+ (Constitution Requirement)
**Primary Dependencies**: Next.js 15+, React 18+, Leaflet 1.9+, React-Leaflet 7+ (from existing map refactor)
**Storage**: Static files in public/images/ (flat structure), browser localStorage for asset caching
**Testing**: Jest + React Testing Library for unit tests, Playwright for integration tests (Constitution Requirements)
**Target Platform**: Web application (browser-based map interface)
**Project Type**: Web application (single codebase with frontend + API routes)
**Performance Goals**: <2s critical asset load time, maintain 60fps with 60+ markers (from existing metrics)
**Constraints**: Progressive fallbacks required, lazy loading for non-critical assets, responsive design (mobile-first)
**Scale/Scope**: 20+ asset files, support for 1000+ concurrent users (Constitution target)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Constitution Compliance Analysis

**✅ Simplicity First**: Asset integration is straightforward file copying + path updates. No complex infrastructure required.

**✅ Community Accessibility**: Clear asset organization (flat structure) and explicit IconFactory configuration. Approachable for moderate-skill developers.

**✅ Clean Architecture**:
- UI Layer: Map components use assets via IconFactory
- Service Layer: IconFactory handles asset loading/caching
- Data Layer: Static files in public/images/
- Proper dependency flow: UI → IconFactory → Static Assets

**✅ Type Safety & Contract Clarity**: TypeScript interfaces for IconFactory, explicit asset path types.

**✅ Test-Driven for Critical Paths**: Asset loading and fallback mechanisms require testing (critical path).

**✅ Documentation as Code**: Implementation requires README updates and inline comments for asset handling.

**✅ Web3 Pragmatism**: Asset loading doesn't interfere with wallet flows; supports read-only map browsing.

**✅ Technology Constraints**: Uses required stack (Next.js, TypeScript, Tailwind CSS). No forbidden dependencies.

**✅ Performance & Scale**: <2s load time targets align with <3s page load requirement.

### Gates Status: PASSED ✅ (Post-Design Re-evaluation)

**Re-evaluation After Phase 1 Design**: All design decisions continue to align with constitutional principles. No violations detected.

**Additional Design-Time Compliance**:
- Clean Architecture maintained: IconFactory (Service) → Static Assets (Data) → Map Components (UI)
- Type Safety Enhanced: Comprehensive TypeScript interfaces for all asset entities
- Community Accessibility: Simple asset organization (flat structure) with clear documentation
- Simplicity Preserved: No complex dependencies, minimal code footprint
- Test Coverage Planned: Comprehensive contracts for unit/integration/E2E testing

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (Next.js App Router)
app/                          # Next.js App Router pages
├── map/                     # Map page route
│   └── page.tsx            # Map page component
└── layout.tsx               # Root layout

components/                   # React components
├── map/                     # Map-specific components
│   ├── IconFactory.ts      # Asset loading/caching service
│   ├── SimpleMap.tsx       # Main map component
│   ├── LayerControls.tsx   # Layer toggle controls
│   └── markers/            # Marker components
├── ui/                      # Reusable UI components
└── shared/                  # Shared components

lib/                         # Core business logic
├── services/               # Business logic services
├── auth/                   # Authentication layer
├── supabase.ts            # Database client
└── database.types.ts      # Generated DB types

public/                      # Static assets
├── images/                 # All map assets (flat structure)
│   ├── icon_location.png
│   ├── icon_burn.png
│   ├── icon_death.png
│   ├── icon_fight.png
│   ├── icon_youarehere.png
│   ├── wagdie.png
│   ├── wagdiemap.png
│   └── [other assets...]
└── fonts/                  # Font files

types/                       # Shared TypeScript types
├── map.ts                  # Map-related types
└── assets.ts               # Asset-related types

tests/                       # Test files
├── map/                    # Map component tests
├── integration/            # Integration tests
└── __mocks__/              # Test mocks
```

**Structure Decision**: Using Next.js App Router web application structure with flat asset organization in public/images/ as clarified during spec phase. Map components in components/map/, IconFactory service handles asset loading/caching.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| No violations | N/A | N/A - All constitutional principles followed |

## Planning Status: COMPLETED ✅

**Phase 0**: ✅ Research complete - Best practices identified for progressive loading, fallback mechanisms, responsive scaling
**Phase 1**: ✅ Design complete - Comprehensive data models, API contracts, and integration patterns defined
**Constitution Check**: ✅ PASSED (pre and post-design) - All principles maintained
**Agent Context**: ✅ Updated - Claude context enhanced with new technology stack

**Ready for Implementation**: This plan provides complete technical guidance for implementing the Map Assets Import and Integration feature while maintaining all constitutional requirements and community standards.
