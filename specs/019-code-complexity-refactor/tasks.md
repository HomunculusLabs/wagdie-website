# Tasks: Code Complexity Refactoring

**Input**: Design documents from `/specs/019-code-complexity-refactor/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested - test tasks NOT included. Existing tests must pass.

**Organization**: Tasks are grouped by user story (4 refactoring areas) to enable independent implementation and deployment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Verification & Preparation)

**Purpose**: Establish baseline and verify existing functionality before any changes

- [ ] T001 Run existing test suite to establish baseline (`npm test`)
- [ ] T002 [P] Verify character detail page loads correctly at `/characters/[tokenId]`
- [ ] T003 [P] Verify infection/spread transactions work in development environment
- [ ] T004 [P] Verify map markers render correctly (all 5 types visible)
- [ ] T005 [P] Verify AI persona editor saves and loads correctly
- [ ] T006 Document current line counts: character detail page, useSpread, MapScene, useAIPersonaEditor

---

## Phase 2: Foundational (Shared Type Definitions)

**Purpose**: Create shared types used by multiple user stories

**⚠️ CRITICAL**: These types are used across all refactored areas

- [ ] T007 Create CharacterEditorState types in `hooks/useCharacterEditor.ts` (type-only, no implementation yet)
- [ ] T008 [P] Create TransactionState types in `hooks/useBlockchainTransaction.ts` (type-only, no implementation yet)
- [ ] T009 [P] Create MarkerConfig types in `game/config/markerConfig.ts` (type-only, no implementation yet)

**Checkpoint**: Foundation types ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Developer Modifies Character Detail Page (Priority: P1) 🎯 MVP

**Goal**: Reduce character detail page from 737 lines to <300 lines by extracting tab components and consolidating editing state

**Independent Test**: All existing character detail functionality works identically; code is organized into focused modules

### Implementation for User Story 1

- [ ] T010 [US1] Implement `useCharacterEditor` hook reducer in `hooks/useCharacterEditor.ts`
- [ ] T011 [US1] Implement `useCharacterEditor` hook initialization and setters in `hooks/useCharacterEditor.ts`
- [ ] T012 [US1] Create `app/characters/[tokenId]/components/` directory structure
- [ ] T013 [P] [US1] Extract CharacterStoryTab component to `app/characters/[tokenId]/components/CharacterStoryTab.tsx`
- [ ] T014 [P] [US1] Extract CharacterEquipmentTab component to `app/characters/[tokenId]/components/CharacterEquipmentTab.tsx`
- [ ] T015 [P] [US1] Extract CharacterWalletTab component to `app/characters/[tokenId]/components/CharacterWalletTab.tsx`
- [ ] T016 [US1] Refactor `app/characters/[tokenId]/page.tsx` to use `useCharacterEditor` hook
- [ ] T017 [US1] Refactor `app/characters/[tokenId]/page.tsx` to use extracted tab components
- [ ] T018 [US1] Verify page.tsx reduced to <300 lines and all functionality preserved
- [ ] T019 [US1] Run tests to verify User Story 1 complete (`npm test -- app/characters`)

**Checkpoint**: Character detail page refactored - <300 lines, tests passing, functionality preserved

---

## Phase 4: User Story 2 - Developer Adds New Blockchain Transaction (Priority: P2)

**Goal**: Create shared transaction utility so adding new transaction types requires <30 lines instead of 100+

**Independent Test**: Existing infection/spread transactions work identically; new transaction type demo requires minimal code

### Implementation for User Story 2

- [ ] T020 [US2] Implement `useBlockchainTransaction` hook state management in `hooks/useBlockchainTransaction.ts`
- [ ] T021 [US2] Implement `useBlockchainTransaction` execute function with lifecycle callbacks in `hooks/useBlockchainTransaction.ts`
- [ ] T022 [US2] Implement `useBlockchainTransaction` transaction store integration in `hooks/useBlockchainTransaction.ts`
- [ ] T023 [US2] Refactor `hooks/useSpread.ts` to use `useBlockchainTransaction` for infection transaction
- [ ] T024 [US2] Refactor `hooks/useSpread.ts` to use `useBlockchainTransaction` for spread transaction
- [ ] T025 [US2] Verify infection transaction works identically (pending, confirming, success/error states)
- [ ] T026 [US2] Verify spread transaction works identically
- [ ] T027 [US2] Document: verify new transaction type would require <30 lines

**Checkpoint**: Blockchain transaction utility complete - infection/spread work, shared utility reduces duplication

---

## Phase 5: User Story 3 - Developer Adds New Marker Type to Map (Priority: P3)

**Goal**: Replace 4 switch statements with single marker configuration object

**Independent Test**: All 5 marker types render correctly; adding new marker type requires modifying only 1 location

### Implementation for User Story 3

- [ ] T028 [US3] Implement `MARKER_CONFIG` configuration object in `game/config/markerConfig.ts`
- [ ] T029 [US3] Implement helper functions (getMarkerIcon, getMarkerScale, getMarkerDepth, isMarkerVisible) in `game/config/markerConfig.ts`
- [ ] T030 [US3] Export configuration and helpers from `game/config/markerConfig.ts`
- [ ] T031 [US3] Refactor `game/scenes/MapScene.ts` to import marker configuration
- [ ] T032 [US3] Replace icon switch statement in `game/scenes/MapScene.ts` with config lookup
- [ ] T033 [US3] Replace scale switch statement in `game/scenes/MapScene.ts` with config lookup
- [ ] T034 [US3] Replace depth switch statement in `game/scenes/MapScene.ts` with config lookup
- [ ] T035 [US3] Replace visibility switch statement in `game/scenes/MapScene.ts` with config lookup
- [ ] T036 [US3] Verify all 5 marker types render correctly (locations, characters, burns, deaths, fights)
- [ ] T037 [US3] Verify layer visibility toggles work correctly

**Checkpoint**: Map marker configuration complete - all markers render, switch statements eliminated

---

## Phase 6: User Story 4 - Developer Adds New AI Persona Field (Priority: P4)

**Goal**: Replace 9 identical setters with useReducer pattern to eliminate boilerplate

**Independent Test**: All AI persona fields save correctly; adding new field requires minimal boilerplate

### Implementation for User Story 4

- [ ] T038 [US4] Implement `aiPersonaEditorReducer` function in `hooks/useAIPersonaEditor.ts`
- [ ] T039 [US4] Implement `initializeState` helper function in `hooks/useAIPersonaEditor.ts`
- [ ] T040 [US4] Refactor `useAIPersonaEditor` to use useReducer instead of 9 useState calls
- [ ] T041 [US4] Update setter exports to use dispatch (maintain backward-compatible API)
- [ ] T042 [US4] Verify all persona fields (bio, lore, topics, adjectives, style, examples, system prompt) save correctly
- [ ] T043 [US4] Verify draft persistence still works correctly
- [ ] T044 [US4] Verify change tracking (unsaved changes detection) still works

**Checkpoint**: AI persona editor refactored - boilerplate eliminated, all functionality preserved

---

## Phase 7: Polish & Final Verification

**Purpose**: Cross-cutting validation and documentation

- [ ] T045 [P] Run full test suite to verify all refactoring complete (`npm test`)
- [ ] T046 [P] Run build to verify no TypeScript errors (`npm run build`)
- [ ] T047 Verify no new dependencies added (check package.json unchanged)
- [ ] T048 Document final line counts and confirm reductions:
  - Character detail page: 737 → <300 lines
  - useSpread: ~100+ duplicated lines → shared utility
  - MapScene: 4 switch statements → 1 config object
  - useAIPersonaEditor: 9 setters → 1 dispatch
- [ ] T049 Run quickstart.md verification checklist
- [ ] T050 Update CLAUDE.md with refactoring summary (if significant)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - creates shared types
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3 → P4)
  - Or in parallel if multiple developers available
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T007-T009) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational - No dependencies on other stories
- **User Story 4 (P4)**: Can start after Foundational - No dependencies on other stories

### Within Each User Story

- Type definitions before implementation
- Hook implementation before usage in components
- Core implementation before integration
- Verification after each story completes

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005 can run in parallel
- **Phase 2**: T008, T009 can run in parallel (after T007)
- **Phase 3**: T013, T014, T015 can run in parallel (tab extraction)
- **Phase 7**: T045, T046 can run in parallel

---

## Parallel Example: User Story 1 (Tab Extraction)

```bash
# After T012 completes (directory created), launch all tab extractions together:
Task: "Extract CharacterStoryTab component to app/characters/[tokenId]/components/CharacterStoryTab.tsx"
Task: "Extract CharacterEquipmentTab component to app/characters/[tokenId]/components/CharacterEquipmentTab.tsx"
Task: "Extract CharacterWalletTab component to app/characters/[tokenId]/components/CharacterWalletTab.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (verification baseline)
2. Complete Phase 2: Foundational (shared types)
3. Complete Phase 3: User Story 1 (character detail page)
4. **STOP and VALIDATE**: Verify 737 → <300 lines, all tests pass
5. Deploy if ready - character detail page is the highest-impact improvement

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 (P1) → Character detail page refactored → Highest impact delivered
3. Add User Story 2 (P2) → Transaction utility complete → Next highest impact
4. Add User Story 3 (P3) → Map configuration complete → Medium impact
5. Add User Story 4 (P4) → AI persona editor optimized → Final optimization
6. Each story adds value without breaking previous work

### Success Criteria from spec.md

- [ ] SC-001: Character detail page <300 lines ✓ (verified at T018)
- [ ] SC-003: New transaction type <30 lines ✓ (verified at T027)
- [ ] SC-005: New marker type requires 1 location ✓ (verified at T036)
- [ ] SC-009: 100% existing tests pass ✓ (verified at T045)
- [ ] SC-010: No new external dependencies ✓ (verified at T047)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and deployable (FR-018)
- All existing tests must pass after each story (FR-016)
- No new dependencies allowed (FR-017)
- Commit after each task or logical group
- Stop at any checkpoint to validate independently
