# Tasks: Map Location Pin Editor

**Input**: Design documents from `/specs/018-map-editor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)

## Path Conventions

Based on plan.md structure (Next.js App Router):
- Pages: `app/`
- Components: `components/map-editor/`
- API Routes: `app/api/locations/`
- Hooks: `hooks/map/`
- Services: `lib/services/`
- Utilities: `lib/utils/`
- Repositories: `lib/repositories/`

---

## Phase 1: Setup

**Purpose**: Project structure for map editor feature

- [X] T001 Create map-editor component directory at `components/map-editor/`
- [X] T002 [P] Create slug utility module at `lib/utils/slug.ts` with `generateSlug(name: string): string` function
- [X] T003 [P] Add TypeScript interfaces for `CreateLocationInput`, `UpdateLocationInput`, `LocationResponse` to `lib/types/map.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure needed by ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create useAdminAuth hook at `hooks/map/useAdminAuth.ts` integrating wagmi useAccount with isAdmin check
- [X] T005 [P] Create useLocationApi hook at `hooks/map/useLocationApi.ts` with getAll, create, update, remove methods
- [X] T006 [P] Create usePhaserEvents hook at `hooks/map/usePhaserEvents.ts` for EventBus communication
- [X] T007 Extend LocationRepository with create, update, delete methods in `lib/repositories/locationRepository.ts`
- [X] T008 Create LocationService at `lib/services/location-service.ts` with business logic and logging
- [X] T009 [P] Create GET /api/locations route at `app/api/locations/route.ts` for fetching all locations
- [X] T010 Create POST /api/locations route at `app/api/locations/route.ts` with admin auth and validation
- [X] T011 [P] Create GET /api/locations/[id] route at `app/api/locations/[id]/route.ts`
- [X] T012 Create PATCH /api/locations/[id] route at `app/api/locations/[id]/route.ts` with admin auth
- [X] T013 Create DELETE /api/locations/[id] route at `app/api/locations/[id]/route.ts` with staked character check
- [X] T014 Create useMapEditor hook at `hooks/map/useMapEditor.ts` combining useLocationApi and usePhaserEvents

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 5 - Non-Admin Access Restriction (Priority: P1)

**Goal**: Block non-admin users from accessing editor functionality

**Independent Test**: Connect a non-admin wallet and verify editor controls are not visible

### Implementation for User Story 5

- [X] T015 [P] [US5] Create AdminGate component at `components/map-editor/AdminGate.tsx` with connect prompt, denied message, and children pass-through
- [X] T016 [US5] Create map-editor page at `app/map-editor/page.tsx` wrapping content in AdminGate

**Checkpoint**: Access control is enforced - only admin wallets see editor

---

## Phase 4: User Story 1 - Admin Places a New Location Pin (Priority: P1) 🎯 MVP

**Goal**: Admin can click on map to place a new location with name and description

**Independent Test**: Connect admin wallet, click map, enter "Test Location", save, verify pin persists after refresh

### Implementation for User Story 1

- [X] T017 [P] [US1] Create EditorControls component at `components/map-editor/EditorControls.tsx` with View/Add Location mode buttons
- [X] T018 [P] [US1] Create LocationForm component at `components/map-editor/LocationForm.tsx` with name (required), description (optional), coordinates display
- [X] T019 [US1] Create MapEditorContainer component at `components/map-editor/MapEditorContainer.tsx` orchestrating map, form, and controls
- [X] T020 [US1] Add MAP_CLICKED event handling in usePhaserEvents for click-to-place functionality
- [X] T021 [US1] Implement create mode in MapEditorContainer showing LocationForm when map clicked
- [X] T022 [US1] Wire LocationForm save to useMapEditor.createLocation with optimistic UI update
- [X] T023 [US1] Add LOCATION_CREATED event emission to update Phaser markers after save
- [X] T024 [US1] Integrate MapEditorContainer into map-editor page within AdminGate

**Checkpoint**: Admin can create new locations - MVP is functional

---

## Phase 5: User Story 2 - Admin Edits an Existing Location (Priority: P2)

**Goal**: Admin can click existing pin to view and modify its details

**Independent Test**: Click existing pin, change name, save, verify updated name appears

### Implementation for User Story 2

- [X] T025 [US2] Add MARKER_CLICKED event handling in usePhaserEvents to select existing location
- [X] T026 [US2] Extend MapEditorContainer to handle edit mode when existing marker clicked
- [X] T027 [US2] Extend LocationForm to support edit mode with pre-filled data
- [X] T028 [US2] Wire LocationForm save (edit mode) to useMapEditor.updateLocation
- [X] T029 [US2] Add LOCATION_UPDATED event emission to update Phaser marker after save

**Checkpoint**: Admin can edit existing locations

---

## Phase 6: User Story 3 - Admin Deletes a Location (Priority: P2)

**Goal**: Admin can delete a location with confirmation and staked character protection

**Independent Test**: Click existing pin, click Delete, confirm, verify pin removed

### Implementation for User Story 3

- [X] T030 [P] [US3] Create DeleteConfirmation modal at `components/map-editor/DeleteConfirmation.tsx` with staked count check
- [X] T031 [US3] Add checkStakedCharacters method to useLocationApi querying character_locations
- [X] T032 [US3] Add delete button to LocationForm (edit mode) opening DeleteConfirmation
- [X] T033 [US3] Wire DeleteConfirmation confirm to useMapEditor.deleteLocation
- [X] T034 [US3] Add LOCATION_DELETED event emission to remove Phaser marker after delete

**Checkpoint**: Admin can delete locations with protection for staked characters

---

## Phase 7: User Story 4 - Admin Repositions a Location Pin (Priority: P3)

**Goal**: Admin can drag existing pin to new position and save coordinates

**Independent Test**: Drag existing pin to new position, verify coordinates saved

### Implementation for User Story 4

- [X] T035 [US4] Add MARKER_DRAGGED event handling in usePhaserEvents for drag-to-reposition
- [X] T036 [US4] Extend MapEditorContainer to handle drag end with coordinate update
- [X] T037 [US4] Wire drag completion to useMapEditor.updateLocation with new coordinates
- [X] T038 [US4] Update Phaser game scene to enable draggable markers in edit mode (EventBus integration)

**Checkpoint**: Admin can reposition locations by dragging

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T039 [P] Add WAGDIE theming to all map-editor components (gold accent, abyss background, Fraktur font)
- [X] T040 [P] Add toast notifications for save success/error states using react-hot-toast
- [X] T041 [P] Add validation error display in LocationForm (name required, coordinate bounds)
- [X] T042 [P] Add loading states (spinner) during API operations
- [X] T043 [P] Add keyboard accessibility (focus management, ARIA labels)
- [X] T044 Run quickstart.md manual testing checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 5 (Access Restriction)**: No dependencies on other stories - implement first for security
- **User Story 1 (Create)**: Depends on US5 (AdminGate) - Core MVP functionality
- **User Story 2 (Edit)**: Depends on US1 (needs locations to exist) - Can run in parallel with US3
- **User Story 3 (Delete)**: Depends on US1 (needs locations to exist) - Can run in parallel with US2
- **User Story 4 (Reposition)**: Depends on US1 (needs locations to exist) - Can run in parallel with US2/US3

### Within Each User Story

- Hooks/utilities before components
- Components before page integration
- Event handling before state management
- Core implementation before polish

### Parallel Opportunities per Story

**Setup (Phase 1)**:
```bash
Task: T002 slug utility
Task: T003 TypeScript interfaces
```

**Foundational (Phase 2)**:
```bash
Task: T004 useAdminAuth hook
Task: T005 useLocationApi hook
Task: T006 usePhaserEvents hook
Task: T009 GET /api/locations route
Task: T011 GET /api/locations/[id] route
```

**User Story 1**:
```bash
Task: T017 EditorControls component
Task: T018 LocationForm component
```

**Polish (Phase 8)**:
```bash
Task: T039 WAGDIE theming
Task: T040 Toast notifications
Task: T041 Validation errors
Task: T042 Loading states
Task: T043 Accessibility
```

---

## Implementation Strategy

### MVP First (User Story 5 + User Story 1)

1. Complete Phase 1: Setup (3 tasks)
2. Complete Phase 2: Foundational (11 tasks)
3. Complete Phase 3: User Story 5 - Access Restriction (2 tasks)
4. Complete Phase 4: User Story 1 - Create Location (8 tasks)
5. **STOP and VALIDATE**: Test MVP independently
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US5 + US1 → Test → Deploy/Demo (MVP!)
3. Add US2 (Edit) → Test → Deploy/Demo
4. Add US3 (Delete) → Test → Deploy/Demo
5. Add US4 (Reposition) → Test → Deploy/Demo
6. Polish → Final release

---

## Summary

| Phase | Tasks | Purpose |
|-------|-------|---------|
| Setup | 3 | Project structure |
| Foundational | 11 | API routes, hooks, services |
| US5 (P1) | 2 | Access restriction |
| US1 (P1) | 8 | Create locations (MVP) |
| US2 (P2) | 5 | Edit locations |
| US3 (P2) | 5 | Delete locations |
| US4 (P3) | 4 | Reposition locations |
| Polish | 6 | Theming, UX, accessibility |
| **Total** | **44** | |

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story
- Each user story should be independently testable after completion
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- MVP = US5 + US1 (24 tasks to working create functionality)
