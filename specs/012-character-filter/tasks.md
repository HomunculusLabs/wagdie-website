# Tasks: Character Filter Enhancement

**Input**: Design documents from `/specs/012-character-filter/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js web application with the following structure:
- **Backend**: `app/api/`, `lib/repositories/`, `lib/services/`
- **Frontend**: `app/characters/`, `components/characters/`, `hooks/`
- **Types**: `types/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend existing types and infrastructure for new filter functionality

- [X] T001 Extend CharacterFilters interface with hasSheet and origin fields in types/character.ts
- [X] T002 [P] Add OriginCount and OriginsResponse types in types/character.ts

---

## Phase 2: Foundational (Backend - Blocking Prerequisites)

**Purpose**: Backend filter logic that MUST be complete before any frontend work

**CRITICAL**: No frontend implementation can begin until this phase is complete

- [X] T003 Add hasSheet filter condition to findMany method in lib/repositories/character-repository.ts
- [X] T004 Add origin filter condition (JSONB query) to findMany method in lib/repositories/character-repository.ts
- [X] T005 [P] Create origins API endpoint in app/api/characters/origins/route.ts
- [X] T006 Add hasSheet and origin parameter parsing in app/api/characters/route.ts
- [X] T007 [P] Update API client to include hasSheet and origin params in lib/api/endpoints.ts

**Checkpoint**: Backend ready - all filter APIs functional. Test with curl:
```bash
curl "http://localhost:3000/api/characters?hasSheet=true"
curl "http://localhost:3000/api/characters?origin=Pilgrim"
curl "http://localhost:3000/api/characters/origins"
```

---

## Phase 3: User Story 1 - Filter by Character Sheet Status (Priority: P1)

**Goal**: Users can toggle a filter to show only characters with custom character sheet data (name, stats, or background story)

**Independent Test**: Click "Has Sheet" toggle on /characters page and verify only characters with custom data appear

### Implementation for User Story 1

- [X] T008 [P] [US1] Create SheetToggle component in components/characters/SheetToggle.tsx
- [X] T009 [P] [US1] Add hasSheet filter prop handling to TokenFilterBar in components/characters/TokenFilterBar.tsx
- [X] T010 [US1] Add hasSheet URL parameter parsing in app/characters/page.tsx
- [X] T011 [US1] Pass hasSheet filter to useCharacters hook call in app/characters/page.tsx
- [X] T012 [US1] Update useCharacters hook to include hasSheet in query params in hooks/useCharacters.ts
- [X] T013 [US1] Add handleHasSheetChange callback in app/characters/page.tsx
- [X] T014 [US1] Update updateURL function to include hasSheet param in app/characters/page.tsx

**Checkpoint**: User Story 1 complete. Can toggle sheet filter and see only characters with sheets.

---

## Phase 4: User Story 2 - Filter by Origin/Alignment (Priority: P2)

**Goal**: Users can select a character origin from a dropdown to filter by archetype (Pilgrim, Stranger, Wormkin, etc.)

**Independent Test**: Select "Pilgrim" from dropdown and verify only Pilgrim characters appear

### Implementation for User Story 2

- [X] T015 [P] [US2] Create useOrigins hook to fetch available origins in hooks/useOrigins.ts
- [X] T016 [P] [US2] Create OriginDropdown component in components/characters/OriginDropdown.tsx
- [X] T017 [US2] Add origin filter props to TokenFilterBar in components/characters/TokenFilterBar.tsx
- [X] T018 [US2] Add origin URL parameter parsing in app/characters/page.tsx
- [X] T019 [US2] Add useOrigins hook call in app/characters/page.tsx
- [X] T020 [US2] Pass origin filter to useCharacters hook call in app/characters/page.tsx
- [X] T021 [US2] Update useCharacters hook to include origin in query params in hooks/useCharacters.ts
- [X] T022 [US2] Add handleOriginChange callback in app/characters/page.tsx
- [X] T023 [US2] Update updateURL function to include origin param in app/characters/page.tsx

**Checkpoint**: User Story 2 complete. Can select origin from dropdown and filter results.

---

## Phase 5: User Story 3 - Combine Multiple Filters (Priority: P2)

**Goal**: Users can apply hasSheet + origin + existing tab filters simultaneously with accurate results

**Independent Test**: Apply "Has Sheet" + "Pilgrim" + "Owned" tab and verify results match all criteria

### Implementation for User Story 3

- [X] T024 [P] [US3] Create ActiveFilters display component in components/characters/ActiveFilters.tsx
- [X] T025 [US3] Add Clear All Filters button to TokenFilterBar in components/characters/TokenFilterBar.tsx
- [X] T026 [US3] Add handleClearAllFilters function in app/characters/page.tsx
- [X] T027 [US3] Add hasActiveFilters computed property in app/characters/page.tsx
- [X] T028 [US3] Display ActiveFilters component showing current filter state in app/characters/page.tsx
- [X] T029 [US3] Add individual filter removal handlers in app/characters/page.tsx

**Checkpoint**: User Story 3 complete. Multiple filters work together and can be cleared.

---

## Phase 6: User Story 4 - Persistent Filter State via URL (Priority: P3)

**Goal**: Filter state is fully preserved in URL for sharing and bookmarking

**Independent Test**: Apply filters, copy URL, paste in new tab, verify same filters are active

### Implementation for User Story 4

- [X] T030 [US4] Ensure all filter params sync to URL on every change in app/characters/page.tsx
- [X] T031 [US4] Ensure all filter params are read from URL on page load in app/characters/page.tsx
- [X] T032 [US4] Add origin param to initial state from searchParams in app/characters/page.tsx
- [X] T033 [US4] Add hasSheet param to initial state from searchParams in app/characters/page.tsx

**Checkpoint**: User Story 4 complete. URLs preserve complete filter state.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T034 [P] Update empty state message when no characters match filters in app/characters/page.tsx
- [X] T035 [P] Add loading state to OriginDropdown while origins are fetching in components/characters/OriginDropdown.tsx
- [X] T036 Ensure pagination resets to page 1 when any filter changes in app/characters/page.tsx
- [X] T037 [P] Add WAGDIE styling to SheetToggle component in components/characters/SheetToggle.tsx
- [X] T038 [P] Add WAGDIE styling to OriginDropdown component in components/characters/OriginDropdown.tsx
- [X] T039 [P] Add WAGDIE styling to ActiveFilters component in components/characters/ActiveFilters.tsx
- [ ] T040 Verify filter response time <1s with all filter combinations (manual test)
- [ ] T041 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all frontend work
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion (can run parallel to US1)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 completion
- **User Story 4 (Phase 6)**: Depends on US1, US2, US3 completion
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - Independent
- **User Story 2 (P2)**: Can start after Foundational - Independent of US1
- **User Story 3 (P2)**: Requires US1 and US2 components to exist
- **User Story 4 (P3)**: Requires all filter implementations to be in place

### Within Each User Story

- Components before integration
- Props/types before callbacks
- URL parsing before URL updating
- Hook updates before page integration

### Parallel Opportunities

Setup Phase:
```
T001 and T002 can run in parallel (different sections of same file)
```

Foundational Phase:
```
T003, T004 must be sequential (same method)
T005 and T007 can run in parallel (different files)
```

User Story 1 + User Story 2 (after Foundational):
```
# Can run entirely in parallel since they touch different areas:
US1: T008-T014 (SheetToggle + hasSheet integration)
US2: T015-T023 (OriginDropdown + origin integration)
```

---

## Parallel Example: User Stories 1 & 2

```bash
# After Foundational phase completes, launch both stories in parallel:

# US1 - Sheet Filter (Developer A)
Task: T008 Create SheetToggle component in components/characters/SheetToggle.tsx
Task: T009 Add hasSheet filter prop handling to TokenFilterBar
# ... continue T010-T014

# US2 - Origin Filter (Developer B)
Task: T015 Create useOrigins hook in hooks/useOrigins.ts
Task: T016 Create OriginDropdown component in components/characters/OriginDropdown.tsx
# ... continue T017-T023
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (types)
2. Complete Phase 2: Foundational (backend APIs)
3. Complete Phase 3: User Story 1 (sheet filter)
4. **STOP and VALIDATE**: Test sheet filter independently
5. Deploy/demo if ready - users can filter by sheet status

### Incremental Delivery

1. Setup + Foundational → Backend APIs ready
2. Add User Story 1 → Sheet filter works → Deploy (MVP!)
3. Add User Story 2 → Origin filter works → Deploy
4. Add User Story 3 → Combined filters work → Deploy
5. Add User Story 4 → URL persistence works → Deploy
6. Polish → Styling and edge cases → Final deploy

### Parallel Team Strategy

With 2 developers after Foundational:
- Developer A: User Story 1 (T008-T014)
- Developer B: User Story 2 (T015-T023)
- Both: Integrate in User Story 3 (T024-T029)
- Either: User Story 4 (T030-T033)
- Both: Polish (T034-T041)

---

## Summary

| Phase | Tasks | Parallel | Story |
|-------|-------|----------|-------|
| Setup | T001-T002 | Yes | - |
| Foundational | T003-T007 | Partial | - |
| User Story 1 | T008-T014 | Partial | US1 |
| User Story 2 | T015-T023 | Partial | US2 |
| User Story 3 | T024-T029 | Partial | US3 |
| User Story 4 | T030-T033 | No | US4 |
| Polish | T034-T041 | Yes | - |

**Total Tasks**: 41
**MVP Scope**: T001-T014 (14 tasks for sheet filter only)
**Full Feature**: All 41 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Backend changes (Phase 2) must be complete before frontend work
