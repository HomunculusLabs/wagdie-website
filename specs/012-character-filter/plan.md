# Implementation Plan: Character Filter Enhancement

**Branch**: `012-character-filter` | **Date**: 2025-11-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-character-filter/spec.md`

## Summary

Add two new filtering capabilities to the `/characters` page:
1. **Character Sheet Filter** - Toggle to show only characters with custom sheet data (name, stats, or background story)
2. **Origin Filter** - Dropdown to filter by character archetype (~50 Body trait values like Pilgrim, Stranger, Wormkin Elite)

Extends existing filter system (tabs, search, sort, pagination) with URL persistence for shareability.

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React Query (@tanstack/react-query), Tailwind CSS 3.4, Supabase JS
**Storage**: Supabase PostgreSQL (existing `characters` table with `metadata` JSONB)
**Testing**: Jest, React Testing Library
**Target Platform**: Web (responsive)
**Project Type**: Web application (frontend + backend in Next.js)
**Performance Goals**: <1 second filter response time for any filter combination
**Constraints**: No database schema changes required; uses existing columns
**Scale/Scope**: 6,666 characters, ~50 origin types, 5 existing filter tabs

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file is a template placeholder - no specific gates to enforce.

**Applicable principles applied:**
- Follows existing patterns in codebase (clean architecture: pages → hooks → services → repositories)
- Extends existing filter system rather than replacing
- No new dependencies required
- No database schema migrations needed

## Project Structure

### Documentation (this feature)

```text
specs/012-character-filter/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 entity definitions
├── quickstart.md        # Implementation guide
├── contracts/           # API contracts
│   ├── api.yaml         # OpenAPI specification
│   └── types.ts         # TypeScript type contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
# Existing structure - files to modify

app/
├── characters/
│   └── page.tsx                    # MODIFY: Add filter state, URL params
└── api/
    └── characters/
        ├── route.ts                # MODIFY: Add hasSheet, origin params
        └── origins/
            └── route.ts            # NEW: Origins list endpoint

components/
└── characters/
    ├── TokenFilterBar.tsx          # MODIFY: Add new filter controls
    ├── OriginDropdown.tsx          # NEW: Origin selector component
    ├── SheetToggle.tsx             # NEW: Sheet filter toggle
    └── ActiveFilters.tsx           # NEW: Active filter display

hooks/
├── useCharacters.ts                # MODIFY: Pass new filter params
└── useOrigins.ts                   # NEW: Fetch available origins

lib/
├── repositories/
│   └── character-repository.ts     # MODIFY: Add filter conditions
└── api/
    └── endpoints.ts                # MODIFY: Update character API calls

types/
└── character.ts                    # MODIFY: Extend CharacterFilters
```

**Structure Decision**: Follows existing Next.js App Router structure. New components added to `components/characters/`. New hook for origins data. API endpoint added for origins list.

## Complexity Tracking

> No constitution violations to justify. Feature follows existing patterns.

## Phase 1 Artifacts Generated

| Artifact | Path | Description |
|----------|------|-------------|
| Research | `research.md` | Alignment system decision, sheet detection logic |
| Data Model | `data-model.md` | Extended filter types, origin entity |
| API Contract | `contracts/api.yaml` | OpenAPI spec for filter endpoints |
| Type Contract | `contracts/types.ts` | Component props, hook return types |
| Quickstart | `quickstart.md` | Implementation steps, testing checklist |

## Next Steps

Run `/speckit.tasks` to generate actionable tasks from this plan.

Key implementation areas:
1. Backend: Extend repository filter logic, add origins endpoint
2. Frontend: Add filter UI components, integrate with URL state
3. Testing: API tests for filter combinations, UI component tests
