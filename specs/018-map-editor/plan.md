# Implementation Plan: Map Location Pin Editor

**Branch**: `018-map-editor` | **Date**: 2025-12-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-map-editor/spec.md`

## Summary

Build a map editor that allows administrators to create, edit, delete, and reposition location pins on the WAGDIE world map. Access is restricted to admin wallets defined in `lib/auth/admin.ts`. The editor will be a dedicated page that reuses the existing Phaser-based map with additional editing controls.

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Node.js 18+
**Primary Dependencies**: Next.js 15, Phaser 3.90, wagmi v2, viem v2, Tailwind CSS 3.4, @supabase/supabase-js v2
**Storage**: Supabase PostgreSQL (existing `locations` table with `metadata.coordinates`)
**Testing**: Jest 29, React Testing Library, MSW for API mocking
**Target Platform**: Web (modern browsers)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 60fps map rendering, <100ms save latency, support 50+ locations
**Constraints**: Admin-only access, WAGDIE theming compliance, no page refresh on save
**Scale/Scope**: Single admin user at a time, ~50-100 locations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution template has placeholder values. Applying reasonable defaults based on existing codebase patterns:

| Principle | Status | Notes |
|-----------|--------|-------|
| Existing Patterns | ✅ Pass | Reuses existing admin auth, repository pattern, API route structure |
| Testing | ✅ Pass | Will follow Jest testing patterns established in codebase |
| Simplicity | ✅ Pass | Minimal new abstractions, extends existing map components |
| Observability | ✅ Pass | Server-side logging as per clarification |

**Result**: All gates pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/018-map-editor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
app/
├── map-editor/
│   └── page.tsx                    # Admin map editor page (new)
└── api/
    └── locations/
        ├── route.ts                # GET all, POST new location (new)
        └── [id]/
            └── route.ts            # GET/PATCH/DELETE single location (new)

components/
├── map-editor/
│   ├── MapEditorContainer.tsx      # Main editor orchestrator (new)
│   ├── LocationForm.tsx            # Create/Edit form (new)
│   ├── DeleteConfirmation.tsx      # Delete confirmation modal (new)
│   ├── AdminGate.tsx               # Access control wrapper (new)
│   └── EditorControls.tsx          # Toolbar for editor modes (new)
└── map/
    └── (existing components)       # Reuse existing map components

lib/
├── repositories/
│   └── locationRepository.ts       # Extend with CRUD operations
├── services/
│   └── location-service.ts         # Business logic for locations (new)
└── utils/
    └── slug.ts                     # Slug generation utility (new)

hooks/
└── map/
    └── useMapEditor.ts             # Editor state management (new)

tests/
├── components/
│   └── map-editor/                 # Component tests (new)
├── api/
│   └── locations/                  # API route tests (new)
└── hooks/
    └── useMapEditor.test.ts        # Hook tests (new)
```

**Structure Decision**: Extends existing Next.js App Router structure with new `/map-editor` route and `/api/locations` endpoints. Follows established repository pattern for data access.

## Complexity Tracking

No constitution violations requiring justification. Design follows existing patterns.
