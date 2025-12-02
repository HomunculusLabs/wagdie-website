# Tasks: Character Stats & Equipment Display

**Input**: Design documents from `/specs/015-character-stats-equipment/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Tests are included as this is a display-focused feature that benefits from unit test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `app/`, `components/`, `lib/`
- **Tests**: `tests/components/characters/`
- **Types**: `types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create foundational utilities and types needed by all user stories

- [X] T001 [P] Create NFTTrait type interface in lib/utils/nft-traits.ts
- [X] T002 [P] Implement extractNFTTraits utility function with trait categorization in lib/utils/nft-traits.ts
- [X] T003 [P] Add categorize helper function for identity/cosmetic/equipment traits in lib/utils/nft-traits.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create core display components that user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create NFTTraitsDisplay component shell in components/characters/NFTTraitsDisplay.tsx
- [X] T005 [P] Add NFTTraitsDisplay props interface with metadata and showIdentityOnly options in components/characters/NFTTraitsDisplay.tsx
- [X] T006 Implement NFTTraitsDisplay rendering with Badge components for traits in components/characters/NFTTraitsDisplay.tsx
- [X] T007 [P] Create NFTTraitsDisplay unit tests in tests/components/characters/NFTTraitsDisplay.test.tsx

**Checkpoint**: Foundation ready - NFTTraitsDisplay component and nft-traits utility complete

---

## Phase 3: User Story 1 - View Complete Character Stats (Priority: P1) 🎯 MVP

**Goal**: Display all available character statistics (core stats, derived stats, level/XP) when data exists

**Independent Test**: Navigate to any character page (e.g., /characters/1) and verify all non-null stats display with proper formatting

### Tests for User Story 1

- [X] T008 [P] [US1] Write unit test for CoreStatsEditor display-when-data-exists logic in tests/components/characters/CoreStatsEditor.test.tsx
- [X] T009 [P] [US1] Write unit test for stats visibility on character page in tests/components/characters/CharacterPage.test.tsx

### Implementation for User Story 1

- [X] T010 [US1] Update CoreStatsEditor to always show when any stat value > 0 in components/characters/CoreStatsEditor.tsx
- [X] T011 [US1] Update character page to render CoreStatsEditor based on hasAnyCoreStat condition in app/characters/[tokenId]/page.tsx
- [X] T012 [US1] Ensure DerivedStatsEditor displays when any of hp, max_hp, ac, speed exists in app/characters/[tokenId]/page.tsx
- [X] T013 [US1] Ensure LevelExperienceEditor displays when level value exists in app/characters/[tokenId]/page.tsx
- [X] T014 [US1] Add helper function hasAnyCoreStats to check for non-null stats in app/characters/[tokenId]/page.tsx

**Checkpoint**: User Story 1 complete - all non-null stats display correctly on character page

---

## Phase 4: User Story 2 - View Character Equipment (Priority: P2)

**Goal**: Display all character equipment from both NFT metadata format and game format

**Independent Test**: Navigate to Equipment tab on any character and verify weapons, armor, items, and gold display correctly

### Tests for User Story 2

- [X] T015 [P] [US2] Write unit test for SheetEquipment handling of NFT format equipment in tests/components/characters/SheetEquipment.test.tsx
- [X] T016 [P] [US2] Write unit test for filtering "None" values from equipment display in tests/components/characters/SheetEquipment.test.tsx

### Implementation for User Story 2

- [X] T017 [US2] Update SheetEquipment to merge equipment from database and metadata.equipment in components/characters/SheetEquipment.tsx
- [X] T018 [US2] Add filter to remove "None" values from equipment arrays in components/characters/SheetEquipment.tsx
- [X] T019 [US2] Improve empty state message when no equipment exists in components/characters/SheetEquipment.tsx
- [X] T020 [US2] Ensure gold/currency displays when present in components/characters/SheetEquipment.tsx

**Checkpoint**: User Story 2 complete - equipment displays from both formats with proper empty states

---

## Phase 5: User Story 3 - View NFT Trait Attributes (Priority: P3)

**Goal**: Display all NFT trait attributes (Body, Alignment, etc.) as badges on the character page

**Independent Test**: Navigate to any character and verify NFT traits from metadata.attributes are visible as badges

### Tests for User Story 3

- [X] T021 [P] [US3] Write unit test for identity traits (Body, Alignment) being prominently displayed in tests/components/characters/NFTTraitsDisplay.test.tsx
- [X] T022 [P] [US3] Write unit test for cosmetic traits display in tests/components/characters/NFTTraitsDisplay.test.tsx

### Implementation for User Story 3

- [X] T023 [US3] Add NFTTraitsDisplay import to character page in app/characters/[tokenId]/page.tsx
- [X] T024 [US3] Render NFTTraitsDisplay with showIdentityOnly for prominent identity traits below character name in app/characters/[tokenId]/page.tsx
- [X] T025 [US3] Add full NFT traits section (cosmetic traits) to character page layout in app/characters/[tokenId]/page.tsx
- [X] T026 [US3] Ensure empty NFT traits section is hidden when no attributes exist in app/characters/[tokenId]/page.tsx

**Checkpoint**: User Story 3 complete - NFT traits display as badges with identity traits prominent

---

## Phase 6: User Story 4 - Consistent Stats Display for Non-Owners (Priority: P3)

**Goal**: All stats and equipment visible to non-owners in read-only mode without edit controls

**Independent Test**: Disconnect wallet, navigate to any character page, verify all data visible but no edit buttons shown

### Tests for User Story 4

- [X] T027 [P] [US4] Write unit test for read-only mode rendering when isOwner is false in tests/components/characters/CoreStatsEditor.test.tsx
- [X] T028 [P] [US4] Write unit test for edit button visibility based on ownership in tests/components/characters/CharacterPage.test.tsx

### Implementation for User Story 4

- [X] T029 [US4] Verify CoreStatsEditor hides edit controls when isOwner=false in components/characters/CoreStatsEditor.tsx
- [X] T030 [US4] Verify DerivedStatsEditor hides edit controls when isOwner=false in components/characters/DerivedStatsEditor.tsx
- [X] T031 [US4] Verify SheetEquipment displays read-only for non-owners in components/characters/SheetEquipment.tsx
- [X] T032 [US4] Add visual indicator for read-only mode on character page in app/characters/[tokenId]/page.tsx

**Checkpoint**: User Story 4 complete - non-owners see all data without edit capabilities

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T033 [P] Add JSDoc comments to extractNFTTraits and categorize functions in lib/utils/nft-traits.ts
- [X] T034 [P] Export NFTTrait type from lib/utils/nft-traits.ts for external use
- [X] T035 [P] Update component exports in components/characters/index.ts (if exists)
- [X] T036 Run full test suite and fix any failing tests
- [X] T037 Manual validation against quickstart.md test scenarios
- [X] T038 Verify page load performance < 2 seconds with all stats displayed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US3 and US4 are both P3 and can run in parallel
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses NFTTraitsDisplay from Phase 2
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Verifies existing read-only behavior

### Within Each User Story

- Tests SHOULD be written and FAIL before implementing
- Component updates in dependency order
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T001-T003) can run in parallel
- Foundational test task (T007) can run in parallel with T004-T006
- User Story tests (T008-T009, T015-T016, T021-T022, T027-T028) can run in parallel within their story
- US3 and US4 can run in parallel (both P3)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: Setup Phase

```bash
# Launch all setup tasks together:
Task: "Create NFTTrait type interface in lib/utils/nft-traits.ts"
Task: "Implement extractNFTTraits utility function in lib/utils/nft-traits.ts"
Task: "Add categorize helper function in lib/utils/nft-traits.ts"
```

## Parallel Example: User Story 1 Tests

```bash
# Launch all US1 tests together:
Task: "Write unit test for CoreStatsEditor display logic"
Task: "Write unit test for stats visibility on character page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T014)
4. **STOP and VALIDATE**: Test stats display independently
5. Deploy/demo if ready - users can see character stats!

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP - stats visible!)
3. Add User Story 2 → Test independently → Deploy (equipment visible!)
4. Add User Story 3 → Test independently → Deploy (NFT traits visible!)
5. Add User Story 4 → Test independently → Deploy (read-only mode verified!)
6. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files or independent sections, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This feature has NO database changes - all display-only enhancements
- Existing API returns all needed data - no backend work required
