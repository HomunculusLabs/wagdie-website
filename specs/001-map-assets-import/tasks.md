---

description: "Task list for Map Assets Import and Integration feature implementation"
---

# Tasks: Map Assets Import and Integration

**Input**: Design documents from `/specs/001-map-assets-import/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are CRITICAL PATH for this feature (per Constitution requirements) - asset loading and fallback mechanisms must be tested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `components/`, `lib/`, `types/`, `tests/` at repository root
- **Public assets**: `public/images/` (flat structure)
- **Contracts**: `specs/001-map-assets-import/contracts/`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Asset preparation and basic structure

- [X] T001 Copy all assets from ~/projects/wagdie-map/public/images/ to public/images/ (flat structure)
- [X] T002 Organize copied assets with proper naming convention per plan.md (icon_*, legend_*, staking_*, wallet_*, border_*)
- [X] T003 Verify all assets are accessible and correctly named in public/images/
- [X] T004 [P] Create asset types definitions in types/assets.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Enhanced IconFactory infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Backup existing IconFactory.ts in components/map/IconFactory.ts.backup
- [X] T006 Create asset loading state management in lib/services/AssetLoadingService.ts
- [X] T007 [P] Create asset registry system in lib/services/AssetRegistry.ts
- [X] T008 [P] Create error handling service in lib/services/AssetErrorHandler.ts
- [X] T009 [P] Create performance monitoring utilities in lib/utils/AssetPerformance.ts
- [X] T010 [P] Create custom React hooks in hooks/useAssetLoading.ts and hooks/useIconFactory.ts
- [X] T011 [P] Create mock asset service for testing in tests/__mocks__/MockAssetService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Map Asset Integration (Priority: P1) 🎯 MVP

**Goal**: Users see rich, visually consistent map experience with all proper WAGDIE-themed icons, legends, and UI assets

**Independent Test**: Load map page and verify all icons, legends, and UI elements display correctly with proper WAGDIE theming and styling

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T012 [P] [US1] Create IconFactory unit tests in tests/map/IconFactory.test.ts
- [X] T013 [P] [US1] Create asset loading service tests in tests/services/AssetLoadingService.test.ts
- [X] T014 [P] [US1] Create integration test for map asset loading in tests/integration/map-asset-loading.test.ts
- [X] T015 [P] [US1] Create E2E test for complete map with assets in tests/e2e/map-with-assets.spec.ts

### Implementation for User Story 1

- [X] T016 [P] [US1] Update asset type interfaces in types/assets.ts (MapMarkerAsset, LegendIconAsset, etc.)
- [X] T017 [P] [US1] Create enhanced IconFactory class in components/map/IconFactory.ts (extends existing)
- [X] T018 [US1] Implement progressive loading logic in lib/services/AssetLoadingService.ts (uses T017)
- [X] T019 [US1] Update IconFactory configuration for flat asset paths in components/map/IconFactory.ts
- [X] T020 [US1] Implement asset fallback mechanisms in lib/services/AssetErrorHandler.ts (uses T018)
- [X] T021 [US1] Add performance monitoring to asset loading in lib/utils/AssetPerformance.ts
- [X] T022 [US1] Create useAssetLoading hook in hooks/useAssetLoading.ts (uses T018, T020)
- [X] T023 [US1] Create useIconFactory hook in hooks/useIconFactory.ts (uses T017, T022)
- [X] T024 [US1] Update SimpleMap component to use enhanced IconFactory in components/map/SimpleMap.tsx
- [X] T025 [US1] Update LayerControls component to use new asset loading in components/map/LayerControls.tsx
- [X] T026 [US1] Update marker components to use enhanced icons in components/map/markers/
- [X] T027 [US1] Add asset loading error boundaries in components/map/AssetErrorBoundary.tsx
- [X] T028 [US1] Add loading states and placeholders for map assets in components/map/AssetLoadingStates.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Responsive Asset Display (Priority: P2)

**Goal**: All map assets scale appropriately and remain clear and usable across mobile, tablet, and desktop viewports

**Independent Test**: View map on different screen sizes and verify all assets remain properly scaled and functional

### Tests for User Story 2 ⚠️

- [X] T029 [P] [US2] Create responsive scaling tests in tests/map/responsive-scaling.test.ts
- [X] T030 [P] [US2] Create visual regression tests for different viewports in tests/e2e/responsive-map.spec.ts

### Implementation for User Story 2

- [X] T031 [P] [US2] Enhance responsive scaling logic in components/map/IconFactory.ts (mobile/tablet/desktop)
- [X] T032 [US2] Update touch target sizing for mobile devices in components/map/IconFactory.ts
- [X] T033 [US2] Add viewport detection utilities in lib/utils/ViewportDetection.ts
- [X] T034 [US2] Update CSS scaling for assets in components/map/AssetLoadingStates.tsx
- [X] T035 [US2] Add responsive breakpoints configuration in lib/config/responsive.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Performance Optimized Assets (Priority: P3)

**Goal**: Map assets load quickly without significant delays, maintaining fast and responsive map experience

**Independent Test**: Monitor asset load times and ensure they meet <2s target for critical assets

### Tests for User Story 3 ⚠️

- [X] T036 [P] [US3] Create performance tests for asset loading in tests/performance/asset-loading.test.ts
- [X] T037 [P] [US3] Create load time monitoring tests in tests/performance/load-times.test.ts

### Implementation for User Story 3

- [X] T038 [P] [US3] Implement asset preloading for critical icons in lib/services/AssetLoadingService.ts
- [X] T039 [P] [US3] Add lazy loading for non-critical assets in lib/services/AssetLoadingService.ts
- [X] T040 [US3] Implement smart caching strategies in lib/services/AssetCache.ts
- [X] T041 [US3] Add asset optimization and compression utilities in lib/utils/AssetOptimization.ts
- [X] T042 [US3] Implement performance metrics collection in lib/utils/AssetPerformance.ts
- [X] T043 [P] [US3] Add asset loading progress indicators in components/map/AssetLoadingProgress.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T044 [P] Update components/map/README.md with enhanced IconFactory documentation
- [X] T045 [P] Add comprehensive inline comments to all new asset loading code
- [X] T046 [P] Update main project README.md with asset integration section
- [X] T047 [P] Create Architecture Decision Record (ADR) for asset loading strategy
- [X] T048 Performance optimization across all asset loading flows
- [X] T049 [P] Additional unit tests for edge cases in tests/map/
- [X] T050 Security review of asset loading paths (prevent path traversal)
- [X] T051 Validate quickstart.md examples work with implementation
- [X] T052 [P] End-to-end validation of all user stories combined
- [X] T053 Bundle size analysis and optimization for asset loading code
- [X] T054 Accessibility audit of asset loading states and fallbacks

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Depends on US1 IconFactory enhancements
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Depends on US1/US2 asset loading infrastructure

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Types before services
- Services before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Types within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create IconFactory unit tests in tests/map/IconFactory.test.ts"
Task: "Create asset loading service tests in tests/services/AssetLoadingService.test.ts"
Task: "Create integration test for map asset loading in tests/integration/map-asset-loading.test.ts"
Task: "Create E2E test for complete map with assets in tests/e2e/map-with-assets.spec.ts"

# Launch all type definitions for User Story 1 together:
Task: "Update asset type interfaces in types/assets.ts"

# Launch service implementations for User Story 1 together:
Task: "Implement progressive loading logic in lib/services/AssetLoadingService.ts"
Task: "Implement asset fallback mechanisms in lib/services/AssetErrorHandler.ts"
Task: "Add performance monitoring to asset loading in lib/utils/AssetPerformance.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (asset copying and organization)
2. Complete Phase 2: Foundational (enhanced IconFactory infrastructure)
3. Complete Phase 3: User Story 1 (basic asset integration)
4. **STOP and VALIDATE**: Test User Story 1 independently - map loads with WAGDIE assets
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP - map shows themed assets)
3. Add User Story 2 → Test independently → Deploy/Demo (responsive scaling)
4. Add User Story 3 → Test independently → Deploy/Demo (optimized loading)
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (asset integration)
   - Developer B: User Story 2 (responsive scaling)
   - Developer C: User Story 3 (performance optimization)
3. Stories complete and integrate independently

---

## Critical Path Considerations

### Must Complete Before Any User Story
- **T005-T011**: Enhanced IconFactory infrastructure (Phase 2) is critical path
- **T012-T015**: User Story 1 tests must fail before implementation (TDD approach)

### Performance Targets
- Critical assets must load in <2s (T038-T043)
- Maintain 60fps with 60+ markers (performance validation in T053)

### Constitution Requirements
- All critical paths MUST have tests (T012-T015, T029-T030, T036-T037)
- TypeScript interfaces must be explicit (T016)
- Community documentation required (T044-T047)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (TDD approach for critical paths)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Asset copying (T001-T003) should be done first to verify source assets are available
- IconFactory backup (T005) ensures we can rollback if issues arise
- Performance monitoring (T021, T042) is essential for meeting <2s load time targets