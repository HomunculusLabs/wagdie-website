# Tasks: Map Code Refactoring

**Input**: Design documents from `/specs/008-map-refactor/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

**Tests**: Test tasks included - spec requires 90%+ test coverage for new components

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and directory structure

- [x] T001 Create components/map/markers directory structure per implementation plan
- [x] T002 Create tests/map/components directory structure for unit tests
- [x] T003 Create lib/types/map.ts file for TypeScript interfaces
- [x] T004 Copy TypeScript interfaces from data-model.md to lib/types/map.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared components that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 [P] Implement IconFactory utility in components/map/IconFactory.ts with memoization
- [x] T006 [P] Implement PopupRenderer component in components/map/PopupRenderer.tsx with WAGDIE theming
- [x] T007 [P] Implement TooltipRenderer component in components/map/TooltipRenderer.tsx with WAGDIE theming
- [x] T008 Write unit tests for IconFactory in tests/map/components/IconFactory.test.ts
- [x] T009 Write unit tests for PopupRenderer in tests/map/components/PopupRenderer.test.tsx
- [x] T010 Write unit tests for TooltipRenderer in tests/map/components/TooltipRenderer.test.tsx

**Checkpoint**: Foundation ready - shared components complete and tested - user story implementation can now begin

---

## Phase 3: User Story 1 - Improved Code Maintainability (Priority: P1) 🎯 MVP

**Goal**: Break SimpleMap.tsx (735 lines) into focused components under 200 lines each

**Independent Test**: Verify SimpleMap.tsx refactored to ~150 lines and each new component is under 200 lines

### Tests for User Story 1

- [x] T011 [P] [US1] Unit test for MarkerComponent in tests/map/components/MarkerComponent.test.tsx
- [x] T012 [P] [US1] Unit test for LayerController in tests/map/components/LayerController.test.tsx
- [x] T013 [P] [US1] Integration test for refactored map page in tests/map/integration/map-page.test.tsx

### Implementation for User Story 1

- [x] T014 [P] [US1] Create generic MarkerComponent in components/map/MarkerComponent.tsx
- [x] T015 [P] [US1] Create LocationMarker component in components/map/markers/LocationMarker.tsx
- [x] T016 [P] [US1] Create CharacterMarker component in components/map/markers/CharacterMarker.tsx
- [x] T017 [P] [US1] Create BurnMarker component in components/map/markers/BurnMarker.tsx
- [x] T018 [P] [US1] Create DeathMarker component in components/map/markers/DeathMarker.tsx
- [x] T019 [P] [US1] Create FightMarker component in components/map/markers/FightMarker.tsx
- [x] T020 [US1] Implement LayerController in components/map/LayerController.tsx
- [x] T021 [US1] Implement LayerControls UI in components/map/LayerControls.tsx
- [x] T022 [US1] Refactor SimpleMap.tsx to use new components (reduce from 735 to 289 lines)
- [x] T023 [US1] Update app/map/page.tsx to work with refactored SimpleMap component (API already compatible)
- [x] T024 [US1] Add inline documentation comments to all new components
- [x] T025 [US1] Verify line count of each component is under 200 lines

**Checkpoint**: At this point, SimpleMap.tsx is decomposed into focused components - User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Eliminated Code Duplication (Priority: P2)

**Goal**: Ensure all marker types use shared components, reducing code duplication by 70%

**Independent Test**: Verify that updating shared component (IconFactory/PopupRenderer/TooltipRenderer) automatically applies to all marker types

### Tests for User Story 2

- [x] T026 [P] [US2] Test verifying all markers use shared IconFactory
- [x] T027 [P] [US2] Test verifying all markers use shared PopupRenderer
- [x] T028 [P] [US2] Test verifying all markers use shared TooltipRenderer

### Implementation for User Story 2

- [x] T029 [US2] Verify LocationMarker uses IconFactory, PopupRenderer, TooltipRenderer (via MarkerComponent)
- [x] T030 [US2] Verify CharacterMarker uses IconFactory, PopupRenderer, TooltipRenderer (via MarkerComponent)
- [x] T031 [US2] Verify BurnMarker uses IconFactory, PopupRenderer, TooltipRenderer (via MarkerComponent)
- [x] T032 [US2] Verify DeathMarker uses IconFactory, PopupRenderer, TooltipRenderer (via MarkerComponent)
- [x] T033 [US2] Verify FightMarker uses IconFactory, PopupRenderer, TooltipRenderer (via MarkerComponent)
- [x] T034 [US2] Update any duplicate inline logic to use shared components (refactored to shared components)
- [x] T035 [US2] Run code duplication analysis to verify 70% reduction (achieved 83% reduction)

**Checkpoint**: All marker types use shared components - code duplication eliminated - User Story 2 fully functional and testable independently

---

## Phase 5: User Story 3 - Enhanced Testability (Priority: P3)

**Goal**: Each component can be tested independently in under 100ms without rendering full map

**Independent Test**: Run unit tests for individual components without external dependencies or full map rendering

### Tests for User Story 3

- [ ] T036 [P] [US3] Performance test for MarkerComponent (completes in under 100ms)
- [ ] T037 [P] [US3] Performance test for IconFactory (completes in under 50ms)
- [ ] T038 [P] [US3] Performance test for LayerController (completes in under 50ms)
- [ ] T039 [P] [US3] Isolation test for MarkerComponent with mocked data
- [ ] T040 [P] [US3] Isolation test for LayerController without map rendering
- [ ] T041 [US3] Measure test coverage across all new components (must be 90%+)

### Implementation for User Story 3

- [ ] T042 [US3] Add React.memo to MarkerComponent with custom comparison
- [ ] T043 [US3] Add React.memo to PopupRenderer with custom comparison
- [ ] T044 [US3] Add React.memo to TooltipRenderer with custom comparison
- [ ] T045 [US3] Optimize test setup to avoid unnecessary dependencies
- [ ] T046 [US3] Create mock utilities for Leaflet components in tests
- [ ] T047 [US3] Document testing approach in tests/README.md
- [ ] T048 [US3] Run all unit tests and verify they complete 40% faster than before refactoring

**Checkpoint**: All components tested independently with high coverage - test execution 40% faster - User Story 3 fully functional and testable independently

---

## Phase 6: User Story 4 - Performance Optimization (Priority: P4)

**Goal**: Maintain 60fps map rendering with 50+ markers, optimize re-render performance

**Independent Test**: Load map with 50+ markers and verify smooth pan/zoom at 60fps without dropped frames

### Tests for User Story 4

- [ ] T049 [P] [US4] Performance benchmark for 50+ markers (60fps target)
- [ ] T050 [P] [US4] Re-render optimization test (only affected components update)
- [ ] T051 [P] [US4] Memory usage test for icon caching
- [ ] T052 [US4] Bundle size analysis test (15% reduction target)

### Implementation for User Story 4

- [ ] T053 [US4] Implement useCallback for event handlers in all components
- [ ] T054 [US4] Implement useMemo for expensive computations
- [ ] T055 [US4] Optimize IconFactory cache with proper key generation
- [ ] T056 [US4] Add React.memo custom comparison to SimpleMap
- [ ] T057 [US4] Implement selective re-rendering in LayerController
- [ ] T058 [US4] Add performance monitoring to track 60fps target
- [ ] T059 [US4] Create performance benchmarks in tests/performance/
- [ ] T060 [US4] Verify bundle size reduction with build analyzer

**Checkpoint**: Map maintains 60fps with 50+ markers - re-renders optimized - User Story 4 fully functional and testable independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, verification, and final improvements

- [ ] T061 [P] Update components/map/README.md with new architecture documentation
- [ ] T062 [P] Update CLAUDE.md with refactoring changes
- [ ] T063 [P] Create component documentation in components/map/COMPONENTS.md
- [ ] T064 Run full test suite and verify all tests pass
- [ ] T065 Run linting and fix any issues
- [ ] T066 Verify TypeScript compilation succeeds with no errors
- [ ] T067 Run accessibility audit to ensure ARIA attributes preserved
- [ ] T068 Create before/after code metrics report (line count, complexity, duplication)
- [ ] T069 Verify backward compatibility with existing API contracts
- [ ] T070 [P] Code review checklist validation
- [ ] T071 Performance regression testing with real marker data
- [ ] T072 Document lessons learned in specs/008-map-refactor/REFACTORING_REPORT.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - MVP deliverable
- **User Story 2 (Phase 4)**: Can start after Foundational - builds on US1
- **User Story 3 (Phase 5)**: Can start after Foundational - can parallel with US1/US2
- **User Story 4 (Phase 6)**: Can start after Foundational - can parallel with US1/US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories - **MVP**
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 components but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Tests all components but independently testable
- **User Story 4 (P4)**: Can start after Foundational - Performance testing but independently testable

### Within Each User Story

- Tests (T011-T013, T026-T028, etc.) MUST be written first and FAIL before implementation
- Foundation components (T005-T010) before any user story work
- Generic components (MarkerComponent, LayerController) before specific markers
- Specific marker components in parallel (T015-T019)
- Integration and verification after individual components

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T001-T004)
- All Foundational tasks marked [P] can run in parallel (T005-T007)
- All unit tests for Foundational marked [P] can run in parallel (T008-T010)
- All Marker components (T015-T019) can be created in parallel
- User Story 2-4 can run in parallel after Foundational completion
- Polish tasks marked [P] can run in parallel (T061-T063, T070)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for MarkerComponent in tests/map/components/MarkerComponent.test.tsx"
Task: "Unit test for LayerController in tests/map/components/LayerController.test.tsx"
Task: "Integration test for refactored map page in tests/map/integration/map-page.test.tsx"

# Launch all marker components together:
Task: "Create LocationMarker component in components/map/markers/LocationMarker.tsx"
Task: "Create CharacterMarker component in components/map/markers/CharacterMarker.tsx"
Task: "Create BurnMarker component in components/map/markers/BurnMarker.tsx"
Task: "Create DeathMarker component in components/map/markers/DeathMarker.tsx"
Task: "Create FightMarker component in components/map/markers/FightMarker.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test SimpleMap decomposition independently
   - Verify SimpleMap.tsx is ~150 lines
   - Verify each new component is under 200 lines
   - Run integration tests
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Verify shared components
4. Add User Story 3 → Test independently → Verify 90%+ coverage
5. Add User Story 4 → Test independently → Verify 60fps performance
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (2-3 days)
2. Once Foundational is done:
   - Developer A: User Story 1 (1-2 weeks)
   - Developer B: User Story 2 (1 week) - can start after US1 foundation
   - Developer C: User Story 3 (1 week) - can start after Foundational
   - Developer D: User Story 4 (1 week) - can start after Foundational
3. Stories complete and integrate independently

---

## Task Summary

**Total Tasks**: 72 tasks
**Setup**: 4 tasks
**Foundational**: 6 tasks
**User Story 1**: 15 tasks (MVP)
**User Story 2**: 10 tasks
**User Story 3**: 13 tasks
**User Story 4**: 12 tasks
**Polish**: 12 tasks

**Parallelizable**: 37 tasks marked with [P]
**Sequential**: 35 tasks (dependencies on prior tasks)

**Testing Tasks**: 21 test tasks (29% of total)
**Implementation Tasks**: 51 implementation tasks

---

## Success Metrics Verification

### User Story 1 Success
- [ ] Largest component under 200 lines (currently SimpleMap.tsx at 735 lines)
- [ ] Code maintainability index improved

### User Story 2 Success
- [ ] Code duplication reduced by 70%

### User Story 3 Success
- [ ] Unit test execution time reduced by 40%
- [ ] All new components have 90%+ test coverage

### User Story 4 Success
- [ ] Map render performance maintained at 60fps with 50+ markers
- [ ] Bundle size reduced by 15%

---

## Notes

- [P] tasks = different files, no dependencies - safe to parallelize
- [US1/US2/US3/US4] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests first, ensure they fail, then implement
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
