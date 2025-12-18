# Tasks: Map Staking Code Quality Fixes

**Input**: Design documents from `/specs/020-map-staking-fixes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No automated tests requested in this feature specification. Manual verification via `npm run build` and grep searches.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure:
- Domain logic: `lib/domain/location/`
- Repositories: `lib/repositories/`
- Hooks: `hooks/map/`
- Pages: `app/map/`

---

## Phase 1: Setup (Verification)

**Purpose**: Verify current state and establish baseline

- [X] T001 Verify current build passes with `npm run build`
- [X] T002 [P] Document current duplicate code locations with `grep -r "normalizeLocationMetadata" lib/`
- [X] T003 [P] Document current unsafe casts with `grep -r "as unknown" app/map/`

---

## Phase 2: Foundational (Type Definitions)

**Purpose**: Define types that all user stories depend on

**⚠️ CRITICAL**: US1 and US2 both need these types before implementation

- [X] T004 Add `JoinedLocation` interface to `lib/repositories/character-repository.ts` per contracts/character-with-location.ts
- [X] T005 Add `CharacterWithLocation` interface extending `Character` in `lib/repositories/character-repository.ts`
- [X] T006 Export `JoinedLocation` and `CharacterWithLocation` types from `lib/repositories/character-repository.ts`

**Checkpoint**: Type definitions ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Code Maintainability for Location Metadata (Priority: P1) 🎯 MVP

**Goal**: Single source of truth for `normalizeLocationMetadata` - all usages import from canonical `lib/domain/location/metadata.ts`

**Independent Test**: `grep -r "function normalizeLocationMetadata" lib/` returns only `lib/domain/location/metadata.ts`

### Implementation for User Story 1

- [X] T007 [US1] Remove `isRecord()` helper function from `lib/repositories/character-repository.ts` (lines 11-13)
- [X] T008 [US1] Remove `getCenterFromBounds()` helper function from `lib/repositories/character-repository.ts` (lines 15-53)
- [X] T009 [US1] Remove local `normalizeLocationMetadata()` function from `lib/repositories/character-repository.ts` (lines 55-63)
- [X] T010 [US1] Add import for `normalizeLocationMetadata` from `@/lib/domain/location/metadata` in `lib/repositories/character-repository.ts`
- [X] T011 [US1] Update `getStakedCharacters()` to use imported `normalizeLocationMetadata` in `lib/repositories/character-repository.ts`
- [X] T012 [US1] Verify build passes after US1 changes with `npm run build`

**Checkpoint**: User Story 1 complete - single source of truth for normalization

---

## Phase 4: User Story 2 - Type Safety for Staked Character Data (Priority: P1)

**Goal**: Eliminate `as unknown as { location?: any }` casts by using proper `CharacterWithLocation` type

**Independent Test**: `grep -r "as unknown" app/map/page.tsx` returns empty; TypeScript compilation succeeds

### Implementation for User Story 2

- [X] T013 [US2] Update `getStakedCharacters()` return type to `Promise<CharacterWithLocation[]>` in `lib/repositories/character-repository.ts`
- [X] T014 [US2] Update type assertion in `getStakedCharacters()` to use `CharacterWithLocation` instead of inline type in `lib/repositories/character-repository.ts`
- [X] T015 [US2] Update `stakedCharacters` state type in `hooks/map/useMapData.ts` to `CharacterWithLocation[]`
- [X] T016 [US2] Add import for `CharacterWithLocation` from `@/lib/repositories/character-repository` in `hooks/map/useMapData.ts`
- [X] T017 [US2] Update `useMapData` return type to include typed `stakedCharacters: CharacterWithLocation[]` in `hooks/map/useMapData.ts`
- [X] T018 [US2] Remove `as unknown as { location?: any }` cast from `mapCharacterMarkers` memo in `app/map/page.tsx` (line 176)
- [X] T019 [US2] Add import for `CharacterWithLocation` from `@/lib/repositories/character-repository` in `app/map/page.tsx`
- [X] T020 [US2] Update `stakedCharacters` iteration to use typed `location` property directly in `app/map/page.tsx`
- [X] T021 [US2] Verify build passes after US2 changes with `npm run build`
- [X] T022 [US2] Verify no `as unknown` casts remain with `grep -r "as unknown" app/map/page.tsx`

**Checkpoint**: User Story 2 complete - full type safety for staked character data

---

## Phase 5: User Story 3 - Clean Repository Architecture (Priority: P2)

**Goal**: Clarity on which repository handles staked character data; no dead code

**Independent Test**: `grep -r "characterLocationRepository" hooks/` returns empty OR usage is documented

### Implementation for User Story 3

- [X] T023 [US3] Search for `characterLocationRepository` imports with `grep -r "characterLocationRepository" --include="*.ts" --include="*.tsx"`
- [X] T024 [US3] Remove unused `dedupeByTokenId()` function from `lib/repositories/characterLocationRepository.ts` if not used (lines 24-34) - NOTE: Functions ARE used internally in getConfirmed(), kept with documentation
- [X] T025 [US3] Remove unused `normalizeCharacterLocation()` function from `lib/repositories/characterLocationRepository.ts` if not used (lines 39-49) - NOTE: Functions ARE used internally in getConfirmed(), kept with documentation
- [X] T026 [US3] Verify no unused imports in `hooks/map/useMapData.ts` related to characterLocationRepository
- [X] T027 [US3] Add comment documenting purpose of `characterLocationRepository.ts` (staking transactions, not current location display)
- [X] T028 [US3] Verify build passes after US3 changes with `npm run build`

**Checkpoint**: User Story 3 complete - clean repository architecture

---

## Phase 6: Polish & Validation

**Purpose**: Final verification of all success criteria

- [X] T029 [P] Verify SC-001: `grep -r "as unknown\|as any" app/map/` returns empty for location data
- [X] T030 [P] Verify SC-002: `grep -r "normalizeLocationMetadata" lib/` shows only canonical imports
- [X] T031 [P] Verify SC-005: `grep -r "getCenterFromBounds" lib/` returns empty
- [X] T032 Run full build validation with `npm run build`
- [ ] T033 Manual test: Load `/map` page and verify staked character markers appear correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - DEFINES types for US1/US2
- **User Story 1 (Phase 3)**: Depends on Foundational (needs types defined)
- **User Story 2 (Phase 4)**: Depends on Foundational (needs types defined); can run parallel to US1
- **User Story 3 (Phase 5)**: Depends on Foundational; can run parallel to US1/US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Independent of US1 (different code paths)
- **User Story 3 (P2)**: Can start after Foundational - Independent of US1/US2

### Within Each User Story

- Models/types before usage
- Repository changes before hook changes
- Hook changes before page changes
- Verify build after each story

### Parallel Opportunities

- T002 and T003 can run in parallel (different grep targets)
- US1 and US2 can run in parallel after Foundational (different files primarily)
- US3 can run in parallel with US1/US2 (characterLocationRepository.ts is separate)
- All Phase 6 verification tasks marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# After T004 (JoinedLocation), these can run in parallel:
# - T005 (CharacterWithLocation - same file, but sequential with T004)
# - T006 (exports - depends on T004, T005)

# Actually, T004-T006 must be sequential (same file)
```

## Parallel Example: User Stories

```bash
# After Foundational phase completes, launch in parallel:

# Developer A: User Story 1
Task: "Remove duplicate helpers from character-repository.ts"

# Developer B: User Story 2
Task: "Update types and remove casts in app/map/page.tsx"

# Developer C: User Story 3
Task: "Clean up characterLocationRepository.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 2)

Both US1 and US2 are P1 priority and together deliver:
1. Complete Phase 1: Setup verification
2. Complete Phase 2: Foundational type definitions
3. Complete Phase 3: User Story 1 (single source of truth)
4. Complete Phase 4: User Story 2 (type safety)
5. **STOP and VALIDATE**: Build passes, no unsafe casts
6. Can deploy without US3 if needed

### Full Delivery

1. Complete MVP (US1 + US2)
2. Add User Story 3 → Clean architecture
3. Complete Phase 6 → All success criteria verified

### Task Count Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Phase 1: Setup | 3 | 2 tasks can run in parallel |
| Phase 2: Foundational | 3 | Sequential (same file) |
| Phase 3: US1 | 6 | Sequential (same file) |
| Phase 4: US2 | 10 | Some parallel (different files) |
| Phase 5: US3 | 6 | Some parallel |
| Phase 6: Polish | 5 | 3 tasks can run in parallel |
| **Total** | **33** | ~8 parallel opportunities |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each phase or logical group
- Stop at any checkpoint to validate story independently
- This is a refactoring feature - no new functionality, only code quality improvements
