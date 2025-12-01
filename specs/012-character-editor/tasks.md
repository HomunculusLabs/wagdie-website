# Tasks: Character Editor

**Input**: Design documents from `/specs/012-character-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in specification. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js App Router project:
- API routes: `app/api/`
- Pages: `app/`
- Components: `components/`
- Utilities: `lib/`
- Types: `types/`

---

## Phase 1: Setup

**Purpose**: Add shared utilities and types needed by all user stories

- [x] T001 Add EditableCharacterFields type and CharacterUpdate type in types/character.ts
- [x] T002 Create stat validation utility with STAT_CONSTRAINTS in lib/utils/stat-validation.ts
- [x] T003 [P] Add validateName function in lib/utils/stat-validation.ts
- [x] T004 [P] Add validateCoreStat function (1-30 range) in lib/utils/stat-validation.ts
- [x] T005 [P] Add validateDerivedStat functions (hp, max_hp, ac, speed, level, experience) in lib/utils/stat-validation.ts

---

## Phase 2: Foundational (API + Data Layer)

**Purpose**: Extend backend to support all stat updates - MUST complete before UI work

**⚠️ CRITICAL**: All user story UI work depends on this phase

- [x] T006 Extend ICharacterRepository.update() signature to include stat fields in lib/repositories/character-repository.ts
- [x] T007 Update CharacterRepository.update() implementation to accept stat fields in lib/repositories/character-repository.ts
- [x] T008 Extend CharacterService.updateCharacter() signature to include stat fields in lib/services/character-service.ts
- [x] T009 Update exported updateCharacter function signature in lib/services/character-service.ts
- [x] T010 Add server-side validation for stat fields in app/api/characters/[tokenId]/route.ts
- [x] T011 Extend allowedUpdates whitelist to include name and all stat fields in app/api/characters/[tokenId]/route.ts
- [x] T012 Add validation error responses (400) for invalid stat values in app/api/characters/[tokenId]/route.ts

**Checkpoint**: API now accepts name and stat updates. Test with curl before proceeding.

---

## Phase 3: User Story 1 - Edit Character Name (Priority: P1) 🎯 MVP

**Goal**: Enable character owners to edit their character's name with inline editing

**Independent Test**: Connect wallet, navigate to owned character, edit name, save, refresh page to verify persistence

### Implementation for User Story 1

- [x] T013 [US1] Create NameEditor component with input, save, cancel in components/characters/NameEditor.tsx
- [x] T014 [US1] Add name validation (max 100 chars) to NameEditor in components/characters/NameEditor.tsx
- [x] T015 [US1] Add isOwner and isEditMode props to control visibility in components/characters/NameEditor.tsx
- [x] T016 [US1] Integrate NameEditor into character detail page header in app/characters/[tokenId]/page.tsx
- [x] T017 [US1] Add editedName state and name update handler in app/characters/[tokenId]/page.tsx
- [x] T018 [US1] Update handleSave to include name in PATCH request in app/characters/[tokenId]/page.tsx
- [x] T019 [US1] Update character state immediately after successful save (optimistic update) in app/characters/[tokenId]/page.tsx

**Checkpoint**: Name editing is fully functional. Can demo as MVP.

---

## Phase 4: User Story 2 - Edit Core Stats (Priority: P1)

**Goal**: Enable character owners to edit STR, DEX, CON, INT, WIS, CHA values

**Independent Test**: Navigate to owned character, enter edit mode, modify any core stat, save, verify persistence

### Implementation for User Story 2

- [x] T020 [P] [US2] Create StatEditor component for single stat input in components/characters/StatEditor.tsx
- [x] T021 [US2] Add min/max validation with error display to StatEditor in components/characters/StatEditor.tsx
- [x] T022 [US2] Create CoreStatsEditor component grouping all 6 core stats in components/characters/CoreStatsEditor.tsx
- [x] T023 [US2] Add editedStats state object for all core stats in app/characters/[tokenId]/page.tsx
- [x] T024 [US2] Replace static attribute display with CoreStatsEditor when isEditMode in app/characters/[tokenId]/page.tsx
- [x] T025 [US2] Update handleSave to include core stats in PATCH request in app/characters/[tokenId]/page.tsx
- [x] T026 [US2] Add validation check before save (all stats valid or show error) in app/characters/[tokenId]/page.tsx

**Checkpoint**: Core stat editing works. Both US1 and US2 independently functional.

---

## Phase 5: User Story 3 - Edit Derived Stats (Priority: P2)

**Goal**: Enable editing of HP, Max HP, AC, Speed, Level, Experience

**Independent Test**: Navigate to owned character, edit HP and Level values, verify persistence and display

### Implementation for User Story 3

- [x] T027 [US3] Create DerivedStatsEditor component for HP, Max HP, AC, Speed in components/characters/DerivedStatsEditor.tsx
- [x] T028 [US3] Create LevelExperienceEditor component for Level and Experience in components/characters/LevelExperienceEditor.tsx
- [x] T029 [US3] Add HP > Max HP validation warning (non-blocking) to DerivedStatsEditor in components/characters/DerivedStatsEditor.tsx
- [x] T030 [US3] Add editedDerivedStats state for derived stat values in app/characters/[tokenId]/page.tsx
- [x] T031 [US3] Integrate DerivedStatsEditor into Quick Stats section when isEditMode in app/characters/[tokenId]/page.tsx
- [x] T032 [US3] Integrate LevelExperienceEditor into header section when isEditMode in app/characters/[tokenId]/page.tsx
- [x] T033 [US3] Update handleSave to include derived stats in PATCH request in app/characters/[tokenId]/page.tsx

**Checkpoint**: All stats editable. US1, US2, US3 all independently functional.

---

## Phase 6: User Story 4 - Bulk Stats Assignment (Priority: P3)

**Goal**: Support initializing stats for characters with no existing values

**Independent Test**: Find character with null/zero stats, assign all values, verify they persist

### Implementation for User Story 4

- [x] T034 [US4] Add hasStats detection logic (check if any stat is non-null/non-zero) in app/characters/[tokenId]/page.tsx
- [x] T035 [US4] Create EmptyStatsPrompt component with "Assign Stats" CTA in components/characters/EmptyStatsPrompt.tsx
- [x] T036 [US4] Show EmptyStatsPrompt when hasStats is false and isOwner in app/characters/[tokenId]/page.tsx
- [x] T037 [US4] Auto-enter edit mode when EmptyStatsPrompt CTA clicked in app/characters/[tokenId]/page.tsx
- [x] T038 [US4] Pre-populate with sensible defaults (level 1, 10 for all core stats) in app/characters/[tokenId]/page.tsx

**Checkpoint**: Complete feature - all 4 user stories functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements and edge case handling

- [x] T039 [P] Add loading state to Save button during PATCH request in app/characters/[tokenId]/page.tsx
- [x] T040 [P] Add Escape key handler to cancel edit mode in app/characters/[tokenId]/page.tsx
- [x] T041 Add unsaved changes warning when navigating away during edit in app/characters/[tokenId]/page.tsx
- [x] T042 Add error toast for network failures during save in app/characters/[tokenId]/page.tsx
- [x] T043 [P] Style validation errors consistently across all editor components in components/characters/*.tsx
- [x] T044 Verify all edit controls hidden for non-owners (FR-006) in app/characters/[tokenId]/page.tsx

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS all UI work
- **Phase 3-6 (User Stories)**: All depend on Phase 2 completion
  - US1-US4 can proceed in priority order OR in parallel
- **Phase 7 (Polish)**: Depends on at least US1 being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Phase 2 - No dependencies on US1 (parallel possible)
- **User Story 3 (P2)**: Can start after Phase 2 - No dependencies on US1/US2
- **User Story 4 (P3)**: Can start after Phase 2 - Uses components from US2/US3 but independently testable

### Within Each User Story

- Components before page integration
- State management before save handler updates
- Core functionality before validation polish

### Parallel Opportunities

Within Phase 1:
- T003, T004, T005 can run in parallel (different validation functions)

Within Phase 3 (US1):
- All tasks sequential (single component + integration)

Within Phase 4 (US2):
- T020 (StatEditor) can start while T013-T019 complete

Within Phase 7:
- T039, T040, T043 can run in parallel (different files/concerns)

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all validation function tasks together:
Task: "T003 Add validateName function in lib/utils/stat-validation.ts"
Task: "T004 Add validateCoreStat function in lib/utils/stat-validation.ts"
Task: "T005 Add validateDerivedStat functions in lib/utils/stat-validation.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 2: Foundational API (T006-T012)
3. Complete Phase 3: User Story 1 - Name Editing (T013-T019)
4. **STOP and VALIDATE**: Test name editing end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → API ready for all stats
2. Add US1 (Name) → Test → Deploy (MVP!)
3. Add US2 (Core Stats) → Test → Deploy
4. Add US3 (Derived Stats) → Test → Deploy
5. Add US4 (Bulk Assignment) → Test → Deploy
6. Polish phase → Final deployment

### Task Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Setup | 5 | 3 tasks parallelizable |
| Foundational | 7 | Sequential (same files) |
| US1 - Name | 7 | Sequential |
| US2 - Core Stats | 7 | 1 task parallelizable |
| US3 - Derived Stats | 7 | Sequential |
| US4 - Bulk Assignment | 5 | Sequential |
| Polish | 6 | 3 tasks parallelizable |

**Total: 44 tasks**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- API layer (Phase 2) handles ALL stat types upfront to avoid revisiting
