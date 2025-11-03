---

description: "Task list for Interactive Map Integration implementation"
---

# Tasks: Interactive Map Integration

**Input**: Design documents from `/specs/006-map-integration/`
**Branch**: `006-map-integration`
**Created**: 2025-11-03

**Tests**: Integration tests and e2e tests included per constitution requirements

**Organization**: Tasks are grouped by user story to enable independent implementation and testing

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [X] T001 Create directory structure per plan.md (components/map/, lib/services/map/, hooks/map/)
- [X] T002 Add environment variables for WAGDIE_WORLD_CONTRACT_ADDRESS in .env.local
- [X] T003 Create map feature README.md files in each new directory

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create TypeScript type definitions in lib/types/map.ts
- [X] T005 Create TypeScript type definitions for WagdieWorld contract in lib/types/wagdie-world.ts
- [X] T006 [P] Create database migration for locations table in supabase/migrations/
- [X] T007 [P] Create database migration for character_locations table in supabase/migrations/
- [X] T008 [P] Create database migration for location_transactions table in supabase/migrations/
- [X] T009 Create Supabase service client wrapper in lib/services/map/locationService.ts
- [X] T010 Create WagdieWorld contract integration in lib/services/map/wagdieWorldContract.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Access Interactive Map (Priority: P1) 🎯 MVP

**Goal**: Users can access the interactive world map from navigation, see map displayed in iframe, and navigate between pages

**Independent Test**: Navigate to `/map` URL and verify interactive map loads with iframe from wagdie.world

### Tests for User Story 1

> **NOTE**: Integration test written before implementation

- [X] T011 [P] [US1] Integration test for map page in tests/map/integration/map-page.test.tsx
- [X] T012 [P] [US1] E2E test for navigation flow in tests/map/e2e/map-user-flow.spec.ts

### Implementation for User Story 1

- [X] T013 [P] [US1] Create MapEmbed component in components/map/MapEmbed.tsx
- [X] T014 [P] [US1] Create map loading component in app/map/loading.tsx
- [X] T015 [US1] Create map page in app/map/page.tsx (depends on T013, T014)
- [X] T016 [US1] Add "World Map" link to navigation in components/layout/Navigation.tsx
- [X] T017 [US1] Add "World Map" link to menu drawer in components/layout/Header.tsx
- [X] T018 [US1] Add map feature documentation in app/map/README.md

**Checkpoint**: User Story 1 fully functional - map accessible via navigation, iframe displays correctly

---

## Phase 4: User Story 2 - View Character Locations (Priority: P2)

**Goal**: Authenticated users can view their character locations on the map interface with location information displayed

**Independent Test**: Connect wallet with WAGDIE characters, view map, see character list with current locations

### Tests for User Story 2

- [X] T019 [P] [US2] Integration test for character location fetching in tests/map/integration/character-location.test.tsx
- [X] T020 [P] [US2] E2E test for character location display in tests/map/e2e/character-location-flow.spec.ts

### Implementation for User Story 2

- [X] T021 [P] [US2] Implement locationService.getLocations() in lib/services/map/locationService.ts
- [X] T022 [P] [US2] Implement locationService.getCharacterLocations() in lib/services/map/locationService.ts
- [X] T023 [P] [US2] Create useLocations hook in hooks/map/useLocations.ts
- [X] T024 [P] [US2] Create useCharacterLocation hook in hooks/map/useCharacterLocation.ts
- [X] T025 [US2] Create CharacterLocationList component in components/map/CharacterLocationList.tsx (depends on T021-T024)
- [X] T026 [US2] Add character list section to map page in app/map/page.tsx
- [X] T027 [US2] Create empty state component for users with no characters in components/map/NoCharactersState.tsx

**Checkpoint**: User Story 2 fully functional - authenticated users see their character locations on map page

---

## Phase 5: User Story 3 - Stake Characters to Locations (Priority: P3)

**Goal**: Character owners can select new locations and stake/move characters via blockchain transactions with clear status feedback

**Independent Test**: Own a character, open location selector, confirm transaction, verify character moved to new location

### Tests for User Story 3

- [X] T028 [P] [US3] Integration test for location staking in tests/map/integration/location-staking.test.tsx
- [X] T029 [P] [US3] E2E test for stake character flow in tests/map/e2e/stake-character-flow.spec.ts

### Implementation for User Story 3

- [X] T030 [P] [US3] Implement wagdieWorldContract.stakeWagdies() in lib/services/map/wagdieWorldContract.ts
- [X] T031 [P] [US3] Implement wagdieWorldContract.changeWagdieLocations() in lib/services/map/wagdieWorldContract.ts
- [X] T032 [P] [US3] Implement wagdieWorldContract.unstakeWagdies() in lib/services/map/wagdieWorldContract.ts
- [X] T033 [P] [US3] Create useLocationStaking hook in hooks/map/useLocationStaking.ts
- [X] T034 [P] [US3] Create TransactionStatus component in components/map/TransactionStatus.tsx
- [X] T035 [US3] Create LocationSelector component in components/map/LocationSelector.tsx (depends on T030-034)
- [X] T036 [US3] Add location selector to character list in components/map/CharacterLocationList.tsx
- [X] T037 [US3] Implement transaction confirmation and Supabase cache update in locationService.ts

**Checkpoint**: User Story 3 fully functional - users can stake, move, and unstake characters with blockchain transactions

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T038 [P] Add error handling throughout map feature components
- [ ] T039 [P] Add loading states for all async operations
- [ ] T040 [P] Performance optimization for character location queries
- [ ] T041 Create ADR (Architecture Decision Record) for map integration in docs/adr-006-map-integration.md
- [ ] T042 Update main README.md with map feature documentation
- [ ] T043 Add inline documentation for complex blockchain interactions
- [ ] T044 Run full integration test suite across all user stories
- [ ] T045 Validate against success criteria from spec.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - T004-T005 can run in parallel
  - T006-T008 can run in parallel (database migrations)
  - T009-T010 must wait for types (T004-T005) and migrations (T006-T008)
- **User Stories (Phase 3+)**: All depend on Foundational (Phase 2) completion
  - User stories can proceed in parallel (if team capacity allows)
  - Or sequentially in priority order (US1 → US2 → US3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1-US2 but independently testable

### Within Each User Story

- Tests (T011-T012, T019-T020, T028-T029) MUST be written and FAIL before implementation
- Services/hooks before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- **Setup (Phase 1)**: T001-T003 can run in parallel
- **Foundational (Phase 2)**:
  - T004-T005 (types) can run in parallel
  - T006-T008 (migrations) can run in parallel
  - T009-T010 (services) wait for T004-T005 and T006-T008
- **User Story 1 (US1)**:
  - T011-T012 (tests) can run in parallel
  - T013-T014 (components) can run in parallel
  - T015 depends on T013-T014
  - T016-T018 depend on T015
- **User Story 2 (US2)**:
  - T019-T020 (tests) can run in parallel
  - T021-T024 (services/hooks) can run in parallel
  - T025-T027 depend on T021-T024
- **User Story 3 (US3)**:
  - T028-T029 (tests) can run in parallel
  - T030-T034 (services/hooks/components) can run in parallel
  - T035 depends on T030-T034
  - T036-T037 depend on T035

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Integration test for map page in tests/map/integration/map-page.test.tsx"
Task: "E2E test for navigation flow in tests/map/e2e/map-user-flow.spec.ts"

# Launch all components for User Story 1 together:
Task: "Create MapEmbed component in components/map/MapEmbed.tsx"
Task: "Create map loading component in app/map/loading.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T010) - CRITICAL
3. Complete Phase 3: User Story 1 (T011-T018)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Navigate to `/map` and verify iframe loads
   - Click "World Map" in navigation and verify page opens
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. **Sprint 1**: Team completes Setup + Foundational together (T001-T010)
2. **Sprint 2**: Once Foundational is done:
   - Developer A: User Story 1 (T011-T018)
   - Developer B: User Story 2 (T019-T027)
   - Developer C: User Story 3 (T028-T037)
3. Sprint 3: Polish phase (T038-T045)

---

## Key Files to Create

### Core Components
- `components/map/MapEmbed.tsx` - iframe wrapper for wagdie.world
- `components/map/CharacterLocationList.tsx` - displays user's characters with locations
- `components/map/LocationSelector.tsx` - modal for selecting new location
- `components/map/TransactionStatus.tsx` - shows transaction progress

### Services
- `lib/services/map/locationService.ts` - Supabase data operations
- `lib/services/map/wagdieWorldContract.ts` - blockchain contract integration

### Hooks
- `hooks/map/useLocations.ts` - fetches available locations
- `hooks/map/useCharacterLocation.ts` - manages character location state
- `hooks/map/useLocationStaking.ts` - handles staking transactions

### Pages
- `app/map/page.tsx` - main map page
- `app/map/loading.tsx` - loading state component

### Database
- 3 Supabase migrations for locations, character_locations, location_transactions tables

---

## Success Criteria Validation

After implementation, verify:

- [ ] **SC-001**: Users can access map from any page within 2 clicks (T016-T017)
- [ ] **SC-002**: Map loads within 3 seconds (T013-T015)
- [ ] **SC-003**: 95% accuracy for character location display (T021-T027)
- [ ] **SC-004**: Transactions complete within 60 seconds or show errors (T030-T037)
- [ ] **SC-005**: Map handles 100+ characters without degradation (T040)
- [ ] **SC-006**: 90% success rate for location changes (T028-T037 tests)
- [ ] **SC-007**: User-friendly error messages (T038-T039)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

**Total Tasks**: 45 tasks
**Estimated Time**: 4-6 hours for full implementation
**Complexity**: Medium
**Risk Level**: Low (validated architecture)
