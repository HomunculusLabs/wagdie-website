# Implementation Plan: Map Code Refactoring

**Branch**: `008-map-refactor` | **Date**: 2025-11-05 | **Spec**: [link to spec.md]
**Input**: Feature specification from `/specs/008-map-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the monolithic SimpleMap.tsx component (735 lines) into a modular, maintainable architecture with reusable components. The refactoring will eliminate code duplication across 5 marker types, improve testability by 40%, and maintain all existing functionality while breaking the component into focused pieces under 200 lines each.

**Technical Approach**:
- Extract marker creation logic into reusable MarkerComponent
- Create shared IconFactory for consistent icon generation
- Extract PopupRenderer and TooltipRenderer for consistent UI
- Build MapLayer component for layer-specific rendering
- Maintain React.memo optimization and TypeScript strict typing
- No breaking changes to existing API contracts

## Technical Context

**Language/Version**: TypeScript 5+
**Primary Dependencies**: React 18, React-Leaflet 7+, Leaflet 1.9+, Next.js 15 (App Router), Tailwind CSS 3.4
**Storage**: N/A (refactoring existing code, no database changes)
**Testing**: Jest, React Testing Library, Playwright (already configured in project)
**Target Platform**: Web (Next.js application)
**Project Type**: Single web application
**Performance Goals**: 60fps map rendering with 50+ markers, 1s initial load, 40% faster test execution
**Constraints**: No breaking changes to API contracts, must maintain accessibility features (ARIA, keyboard nav), backward compatible with existing props
**Scale/Scope**: Decompose 1 component (735 lines) into 8-10 smaller components, 70% code duplication reduction

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Principle I: Simplicity First
- **PASS**: Refactoring reduces complexity by breaking 735-line component into smaller pieces
- **PASS**: No Docker, containers, or complex infrastructure added
- **PASS**: Direct component architecture over unnecessary abstractions

### ✅ Principle II: Community Accessibility
- **PASS**: Smaller components (<200 lines) easier for moderate-skill developers to understand
- **PASS**: Clear separation of concerns enables contributors to modify specific parts without full context
- **PASS**: Will include README files and inline comments for new components

### ✅ Principle III: Clean Architecture
- **PASS**: Explicitly improves architecture by separating UI, business logic, and rendering concerns
- **PASS**: Maintains unidirectional dependencies (UI → Services → Data)
- **PASS**: Components have clear inputs/outputs with TypeScript interfaces

### ✅ Principle IV: Type Safety & Contract Clarity
- **PASS**: Maintains TypeScript 5+ strict typing
- **PASS**: All new components have explicit TypeScript interfaces
- **PASS**: No `any` types introduced

### ✅ Principle V: Test-Driven for Critical Paths
- **PASS**: Requires 90%+ test coverage for new components
- **PASS**: Integration tests verify end-to-end map functionality
- **PASS**: Unit tests for individual marker components without full map rendering

### ✅ Principle VI: Documentation as Code
- **PASS**: Will add README in components/map/ directory
- **PASS**: Inline comments for non-obvious refactoring logic
- **PASS**: Architecture decisions documented

### ✅ Principle VII: Web3 Pragmatism
- **N/A**: Refactoring doesn't modify web3 integration logic
- **PASS**: Maintains existing wallet connection and authentication flows

**RESULT**: ✅ ALL GATES PASS - Proceed to Phase 0

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
wagdie-simplified/
├── app/
│   └── map/
│       └── page.tsx                 # Map page (existing, refactored to use new components)
├── components/
│   └── map/
│       ├── SimpleMap.tsx            # Main map component (REFACTOR: 735 → ~150 lines)
│       ├── MarkerComponent.tsx      # NEW: Generic marker renderer
│       ├── IconFactory.ts           # NEW: Shared icon creation utility
│       ├── PopupRenderer.tsx        # NEW: Reusable popup component
│       ├── TooltipRenderer.tsx      # NEW: Reusable tooltip component
│       ├── LayerController.tsx      # NEW: Layer management component
│       ├── LayerControls.tsx        # NEW: Layer toggle UI
│       └── markers/                 # NEW: Individual marker type components
│           ├── LocationMarker.tsx
│           ├── CharacterMarker.tsx
│           ├── BurnMarker.tsx
│           ├── DeathMarker.tsx
│           └── FightMarker.tsx
├── lib/
│   └── types/
│       └── map.ts                   # UPDATED: TypeScript interfaces for map entities
├── hooks/
│   └── map/
│       ├── useMapData.ts            # Existing (unchanged)
│       ├── useMapLayers.ts          # Existing (unchanged)
│       └── useEventMarkers.ts       # Existing (unchanged)
└── tests/
    ├── map/
    │   ├── components/              # NEW: Unit tests for new components
    │   │   ├── MarkerComponent.test.tsx
    │   │   ├── IconFactory.test.ts
    │   │   ├── PopupRenderer.test.tsx
    │   │   ├── TooltipRenderer.test.tsx
    │   │   └── LayerController.test.tsx
    │   └── integration/             # Existing (enhanced)
    │       └── map-page.test.tsx
```

**Structure Decision**: Using Next.js App Router structure with feature-organized components. Refactoring extracts reusable pieces from monolithic SimpleMap.tsx into focused, testable components while maintaining existing hook architecture.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations identified** - refactoring aligns with all constitution principles without exceptions.

---

## Phase 0: Outline & Research

**Status**: ✅ No critical unknowns identified

All technical decisions are clear from specification and existing codebase:
- Target architecture: Modular React components with TypeScript
- Performance goals: Quantified in success criteria (60fps, 40% faster tests)
- No external dependencies or integrations needed
- All technology choices established (React 18, TypeScript 5+, Leaflet)

### Research Findings

**Research Area**: React Component Refactoring Best Practices
**Decision**: Use compound component pattern with context for shared state
**Rationale**:
- Compound components provide clean separation while sharing logic
- React context eliminates prop drilling for layer visibility
- TypeScript interfaces ensure type safety across component boundaries
- Aligns with Clean Architecture principle (III)

**Research Area**: Icon Management in React-Leaflet
**Decision**: Extract icon creation to factory pattern with memoization
**Rationale**:
- Icons created once and reused prevents recreation on re-renders
- Factory pattern centralizes icon logic for all marker types
- Responsive sizing logic can be shared across all icon types
- Reduces code duplication from current implementation

**Research Area**: Popup/Tooltip Standardization
**Decision**: Create reusable renderer components with WAGDIE theming
**Rationale**:
- Current inline styles scattered across marker types
- Single component ensures consistent WAGDIE branding
- Props-based theming allows per-type customization
- Easier to test and maintain than inline styles

---

## Phase 1: Design & Contracts

**Status**: ✅ Complete - All artifacts generated below

### Deliverables

1. **data-model.md**: ✅ Created
   - TypeScript interfaces for all map entities
   - Component prop definitions
   - State management contracts
   - Validation rules and constraints
   - Data flow diagrams (before/after)

2. **contracts/**: ✅ Created
   - `marker-component.ts`: Generic marker component interface
   - `icon-factory.ts`: Icon creation and caching contract
   - `popup-renderer.ts`: Popup rendering interface
   - `tooltip-renderer.ts`: Tooltip rendering interface
   - `layer-controller.ts`: Layer visibility management contract

3. **quickstart.md**: ✅ Created
   - Architecture overview
   - Common development workflows
   - Testing guidelines
   - Migration guide from old code
   - Best practices and troubleshooting

### Re-evaluated Constitution Check

**Post-Design Verification**:

✅ **Simplicity First**: Design reduces complexity from 735 lines to modular components
✅ **Community Accessibility**: Clear documentation, TypeScript interfaces, migration guide
✅ **Clean Architecture**: Explicit separation of concerns, unidirectional dependencies
✅ **Type Safety**: Strict TypeScript contracts, no `any` types
✅ **Test-Driven**: 90%+ test coverage requirement, unit and integration tests specified
✅ **Documentation**: Comprehensive quickstart, inline comments required
✅ **Web3 Pragmatism**: No changes to web3 logic, maintains existing flows

**Result**: ✅ ALL GATES PASS - Design maintains constitutional compliance

---

## Next Steps

**Ready for Implementation**: Phase 2 planning complete

Generated artifacts are ready for `/speckit.tasks` to create the implementation task breakdown.

**Implementation Plan Summary**:
- 735-line SimpleMap.tsx → 8-10 focused components (<200 lines each)
- 70% code duplication reduction through shared components
- 40% test speed improvement via isolated component testing
- Zero breaking changes to existing API contracts
- Maintain 60fps performance with 50+ markers
