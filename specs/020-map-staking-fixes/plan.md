# Implementation Plan: Map Staking Code Quality Fixes

**Branch**: `020-map-staking-fixes` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-map-staking-fixes/spec.md`

## Summary

This feature addresses code quality issues identified during code review of the map staking implementation. The primary changes are:
1. Remove duplicate `normalizeLocationMetadata` implementation from `character-repository.ts` and use the canonical version from `lib/domain/location/metadata.ts`
2. Define a proper `CharacterWithLocation` TypeScript type for joined character-location data
3. Clean up dead code in `characterLocationRepository.ts` or remove unused changes
4. Eliminate unsafe `as unknown as { location?: any }` type casts

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React 18, Supabase JS (@supabase/supabase-js v2), wagmi v2, viem v2
**Storage**: Supabase PostgreSQL (`wagdie_characters` table with `location_id` FK to `locations` table)
**Testing**: Jest, React Testing Library
**Target Platform**: Web (browser), SSR via Next.js
**Project Type**: Web application (Next.js)
**Performance Goals**: Map renders with 60+ markers at 60fps (existing baseline)
**Constraints**: No breaking changes to existing map functionality
**Scale/Scope**: Refactoring only - ~4 files affected, ~100 lines changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is a template without specific principles defined. Using implicit constitution based on project patterns:

| Principle | Status | Notes |
|-----------|--------|-------|
| Single Source of Truth | ⚠️ VIOLATION | Duplicate `normalizeLocationMetadata` in `character-repository.ts` |
| Type Safety | ⚠️ VIOLATION | `as unknown as { location?: any }` casts bypass TypeScript |
| No Dead Code | ⚠️ VIOLATION | `characterLocationRepository.ts` changes unused |
| Clean Architecture | ✅ PASS | Repository pattern correctly applied |

**Resolution**: This feature exists specifically to fix these violations.

## Project Structure

### Documentation (this feature)

```text
specs/020-map-staking-fixes/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
lib/
├── domain/
│   └── location/
│       ├── metadata.ts         # CANONICAL normalizeLocationMetadata (keep)
│       └── metadata-types.ts   # Existing types (extend)
├── repositories/
│   ├── character-repository.ts     # MODIFY: Remove duplicates, add CharacterWithLocation
│   └── characterLocationRepository.ts  # EVALUATE: Remove dead code or document usage
└── types/
    └── map.ts                  # May need CharacterLocation type updates

app/
└── map/
    └── page.tsx               # MODIFY: Remove unsafe casts

hooks/
└── map/
    └── useMapData.ts          # VERIFY: Correct imports only
```

**Structure Decision**: Existing Next.js App Router structure. No new directories needed. Changes are purely refactoring within existing files.

## Complexity Tracking

N/A - This feature reduces complexity by removing duplication and dead code.

## Post-Design Constitution Check

*Re-evaluated after Phase 1 design completion.*

| Principle | Pre-Design | Post-Design | Resolution |
|-----------|------------|-------------|------------|
| Single Source of Truth | ⚠️ VIOLATION | ✅ WILL PASS | Remove duplicate, use canonical `metadata.ts` |
| Type Safety | ⚠️ VIOLATION | ✅ WILL PASS | `CharacterWithLocation` type eliminates casts |
| No Dead Code | ⚠️ VIOLATION | ✅ WILL PASS | Remove unused helpers from `character-repository.ts` |
| Clean Architecture | ✅ PASS | ✅ PASS | Domain types stay in `lib/domain/`, repos in `lib/repositories/` |

**Design Validation**:
- ✅ `CharacterWithLocation` type defined in contracts
- ✅ Research confirms canonical implementation is robust
- ✅ Data model documents type relationships
- ✅ No new complexity introduced (refactoring only)
