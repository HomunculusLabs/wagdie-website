# Tasks: Data Migration from Legacy WAGDIE

**Input**: Design documents from `/specs/001-migration-plan/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/field-mappings.md

**Tests**: Tests are REQUIRED for critical paths as specified in the constitution (transformation logic, validation, rollback).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Migration tooling is isolated in `scripts/migration/` directory:
- **Root**: `scripts/migration/`
- **Source**: `scripts/migration/src/`
- **Tests**: `scripts/migration/tests/`
- **Data**: `scripts/migration/data/` (git-ignored)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create migration directory structure at scripts/migration/ with src/, tests/, and data/ subdirectories
- [x] T002 Initialize package.json in scripts/migration/ with TypeScript, Firebase Admin SDK, Supabase JS, ethers.js, pino, and Jest dependencies
- [x] T003 Create tsconfig.json in scripts/migration/ with strict mode enabled and proper module resolution
- [x] T004 [P] Create .env.example in scripts/migration/ with required environment variable templates
- [x] T005 [P] Create .gitignore in scripts/migration/ to exclude data/ directory, .env, and node_modules
- [x] T006 [P] Add npm scripts to package.json for migrate, test, verify, and rollback commands

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create Firestore document types in scripts/migration/src/types/firestore-schema.ts with interfaces for User, Character, Tweet, Location
- [x] T008 Create PostgreSQL row types in scripts/migration/src/types/postgres-schema.ts with interfaces matching Supabase schema
- [x] T009 Create migration report types in scripts/migration/src/types/migration-report.ts with Report, ValidationResult, and ErrorLog interfaces
- [x] T010 [P] Create Firestore client wrapper in scripts/migration/src/data/firestore-client.ts with connection and streaming pagination logic
- [x] T011 [P] Create Supabase client wrapper in scripts/migration/src/data/supabase-client.ts with connection and transaction support
- [x] T012 Create address normalizer utility in scripts/migration/src/utils/address-normalizer.ts with getAddress() and isAddress() wrappers
- [x] T013 [P] Create checksum utility in scripts/migration/src/utils/checksum.ts with SHA-256 hashing for record and collection checksums
- [x] T014 [P] Create logger utility in scripts/migration/src/utils/logger.ts with pino structured logging and child logger support

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Safe Data Export and Validation (Priority: P1) 🎯 MVP

**Goal**: Export all Firestore data and verify completeness before attempting migration

**Independent Test**: Can be fully tested by exporting data from Firestore, generating checksums/counts, and validating that all expected collections are present with correct field structures

### Tests for User Story 1 (REQUIRED - critical path) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US1] Create unit test for Firestore streaming pagination in scripts/migration/tests/unit/export-service.test.ts
- [ ] T016 [P] [US1] Create integration test for full export flow in scripts/migration/tests/integration/export-flow.test.ts with test Firestore instance

### Implementation for User Story 1

- [ ] T017 [US1] Implement ExportService in scripts/migration/src/services/export-service.ts with streaming export for all 4 collections (users, characters, tweets, locations)
- [ ] T018 [US1] Add export progress tracking to ExportService with batch logging every 100 records
- [ ] T019 [US1] Add error handling to ExportService with document ID logging for failed exports
- [ ] T020 [US1] Implement ValidationService schema validation in scripts/migration/src/services/validation-service.ts to check Firestore document structure
- [ ] T021 [US1] Add record count validation to ValidationService comparing exported JSON to Firestore collection counts
- [ ] T022 [US1] Add checksum generation to ValidationService for exported collections using checksum utility
- [ ] T023 [US1] Implement export CLI command in scripts/migration/src/cli/export.ts with argument parsing and progress display
- [ ] T024 [US1] Add validation report generation to export CLI showing counts, checksums, and any missing/corrupted records

**Checkpoint**: At this point, User Story 1 should be fully functional - administrators can export and validate Firestore data independently

---

## Phase 4: User Story 2 - Schema Mapping and Transformation (Priority: P2)

**Goal**: Transform Firestore documents to PostgreSQL schema format with correct data types and relationships

**Independent Test**: Can be tested by running transformation scripts on exported JSON files and validating output matches PostgreSQL table structures

### Tests for User Story 2 (REQUIRED - critical path) ⚠️

- [ ] T025 [P] [US2] Create unit test for address normalization in scripts/migration/tests/unit/address-normalizer.test.ts verifying EIP-55 checksumming
- [ ] T026 [P] [US2] Create unit test for timestamp conversion in scripts/migration/tests/unit/transform-service.test.ts verifying Firestore Timestamp → ISO 8601
- [ ] T027 [P] [US2] Create unit test for User transformation in scripts/migration/tests/unit/transform-service.test.ts comparing input/output from field-mappings.md
- [ ] T028 [P] [US2] Create unit test for Character transformation in scripts/migration/tests/unit/transform-service.test.ts verifying metadata consolidation
- [ ] T029 [P] [US2] Create unit test for Tweet transformation in scripts/migration/tests/unit/transform-service.test.ts
- [ ] T030 [P] [US2] Create unit test for Location transformation in scripts/migration/tests/unit/transform-service.test.ts

### Implementation for User Story 2

- [ ] T031 [P] [US2] Implement transformUser function in scripts/migration/src/services/transform-service.ts per field-mappings.md specification
- [ ] T032 [P] [US2] Implement transformCharacter function in scripts/migration/src/services/transform-service.ts with metadata consolidation logic
- [ ] T033 [P] [US2] Implement transformTweet function in scripts/migration/src/services/transform-service.ts
- [ ] T034 [P] [US2] Implement transformLocation function in scripts/migration/src/services/transform-service.ts with capacity → metadata migration
- [ ] T035 [US2] Add edge case handling to TransformService for orphaned characters (create user records)
- [ ] T036 [US2] Add edge case handling to TransformService for duplicate addresses (normalize and merge)
- [ ] T037 [US2] Add edge case handling to TransformService for burned characters (set owner_address to NULL)
- [ ] T038 [US2] Add edge case handling to TransformService for missing location references (set location_id to NULL)
- [ ] T039 [US2] Implement transform CLI command in scripts/migration/src/cli/transform.ts processing exported JSON files
- [ ] T040 [US2] Add transformation error logging to transform CLI with document IDs and specific field issues
- [ ] T041 [US2] Add post-transformation validation to transform CLI verifying all foreign key relationships are valid

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - administrators can export and transform data

---

## Phase 5: User Story 3 - Safe Data Import with Rollback (Priority: P3)

**Goal**: Import transformed data into Supabase with transaction support and rollback capability

**Independent Test**: Can be tested by importing transformed data into test Supabase instance, verifying records, and testing rollback on errors

### Tests for User Story 3 (REQUIRED - critical path) ⚠️

- [ ] T042 [P] [US3] Create unit test for batch import logic in scripts/migration/tests/unit/import-service.test.ts
- [ ] T043 [P] [US3] Create integration test for rollback functionality in scripts/migration/tests/integration/import-rollback.test.ts with test Supabase instance

### Implementation for User Story 3

- [ ] T044 [US3] Create PostgreSQL stored procedure import_migration_data in supabase/migrations/20250102000000_migration_import_procedure.sql with transaction support
- [ ] T045 [US3] Implement ImportService in scripts/migration/src/services/import-service.ts using Supabase RPC to call stored procedure
- [ ] T046 [US3] Add batch processing to ImportService inserting 100 records at a time for optimal performance
- [ ] T047 [US3] Add transaction management to ImportService with automatic rollback on errors
- [ ] T048 [US3] Add import progress tracking to ImportService with logging every 100 records
- [ ] T049 [US3] Implement import CLI command in scripts/migration/src/cli/import.ts with dry-run and production modes
- [ ] T050 [US3] Add post-import validation to import CLI comparing record counts with transformed data
- [ ] T051 [US3] Add rollback command to import CLI calling PostgreSQL rollback via Supabase client

**Checkpoint**: All user stories 1-3 should now be independently functional - administrators can export, transform, and import data with rollback capability

---

## Phase 6: User Story 4 - Migration Verification and Cutover (Priority: P4)

**Goal**: Comprehensive verification of migrated data and production cutover coordination

**Independent Test**: Can be tested by running validation queries, comparing data between systems, and verifying application features work

### Tests for User Story 4 (REQUIRED - critical path) ⚠️

- [ ] T052 [P] [US4] Create unit test for checksum validation in scripts/migration/tests/unit/validation-service.test.ts
- [ ] T053 [P] [US4] Create unit test for spot-check sampling in scripts/migration/tests/unit/validation-service.test.ts

### Implementation for User Story 4

- [ ] T054 [P] [US4] Implement comprehensive validation queries in ValidationService checking record counts for all 4 entities
- [ ] T055 [P] [US4] Implement checksum comparison in ValidationService between Firestore exports and PostgreSQL tables
- [ ] T056 [P] [US4] Implement spot-check sampling in ValidationService selecting 1% random records for field-by-field comparison
- [ ] T057 [P] [US4] Implement foreign key validation in ValidationService verifying character.owner_address exists in users and character.location_id exists in locations
- [ ] T058 [US4] Implement verify CLI command in scripts/migration/src/cli/verify.ts with full, quick, and sample modes
- [ ] T059 [US4] Add detailed validation report generation to verify CLI showing pass/fail for each check
- [ ] T060 [US4] Create migration runbook in scripts/migration/README.md with step-by-step instructions from quickstart.md
- [ ] T061 [US4] Add troubleshooting section to README.md with common errors and resolutions

**Checkpoint**: All user stories should now be independently functional - complete migration pipeline with verification

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T062 [P] Add comprehensive inline comments to all transformation functions explaining field mappings per contracts/field-mappings.md
- [ ] T063 [P] Create data mapping documentation in scripts/migration/FIELD_MAPPINGS.md duplicating contracts/field-mappings.md for runtime reference
- [ ] T064 [P] Add migration report template in scripts/migration/data/reports/.template with required checks and acceptance criteria
- [ ] T065 [P] Create validation report template in scripts/migration/data/reports/.validation-template
- [ ] T066 Add end-to-end migration script in scripts/migration/src/cli/migrate.ts orchestrating export → transform → import → verify phases
- [ ] T067 Add performance logging to migrate CLI tracking time per phase and total duration
- [ ] T068 Add error recovery to migrate CLI allowing resume from last successful phase
- [ ] T069 Create package scripts for common workflows (npm run migrate, npm run test:all, npm run verify)
- [ ] T070 Add CI/CD integration guide to README.md for running migration in automated pipelines

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories
  - User Story 2 (P2): Can start after Foundational - Requires US1 exported data for testing but independently testable with fixtures
  - User Story 3 (P3): Can start after Foundational - Requires US2 transformed data for testing but independently testable with fixtures
  - User Story 4 (P4): Can start after Foundational - Requires US1-3 for full testing but can validate logic with test data
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - Fully independent
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses US1 exported data but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses US2 transformed data but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Can validate against test data independently

### Within Each User Story

- Tests (REQUIRED for critical paths) MUST be written and FAIL before implementation
- Services before CLI commands
- Error handling integrated during implementation, not as separate tasks
- Validation added to each command as part of implementation

### Parallel Opportunities

- **Setup (Phase 1)**: T004, T005, T006 can run in parallel
- **Foundational (Phase 2)**: T010-T011 (clients), T012-T014 (utilities) can run in parallel
- **User Story 1 Tests**: T015-T016 can run in parallel
- **User Story 2 Tests**: T025-T030 can run in parallel (all transformation unit tests)
- **User Story 2 Implementation**: T031-T034 (transformation functions) can run in parallel
- **User Story 3 Tests**: T042-T043 can run in parallel
- **User Story 4 Tests**: T052-T053 can run in parallel
- **User Story 4 Implementation**: T054-T057 (validation functions) can run in parallel
- **Polish (Phase 7)**: T062-T065 (documentation) can run in parallel
- **User Stories can be developed in parallel** by different team members after Foundational phase

---

## Parallel Example: User Story 2

```bash
# Launch all transformation unit tests together:
Task: "Create unit test for User transformation in scripts/migration/tests/unit/transform-service.test.ts"
Task: "Create unit test for Character transformation in scripts/migration/tests/unit/transform-service.test.ts"
Task: "Create unit test for Tweet transformation in scripts/migration/tests/unit/transform-service.test.ts"
Task: "Create unit test for Location transformation in scripts/migration/tests/unit/transform-service.test.ts"

# Launch all transformation functions together:
Task: "Implement transformUser function in scripts/migration/src/services/transform-service.ts"
Task: "Implement transformCharacter function in scripts/migration/src/services/transform-service.ts"
Task: "Implement transformTweet function in scripts/migration/src/services/transform-service.ts"
Task: "Implement transformLocation function in scripts/migration/src/services/transform-service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (6 tasks)
2. Complete Phase 2: Foundational (8 tasks) - CRITICAL
3. Complete Phase 3: User Story 1 (10 tasks including tests)
4. **STOP and VALIDATE**: Test User Story 1 independently - can export and validate Firestore data
5. Demo export capability to stakeholders

**MVP Deliverable**: Working Firestore export with validation - demonstrates data can be safely extracted

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready (14 tasks)
2. Add User Story 1 → Test independently → Demo (10 tasks, ~24 total)
3. Add User Story 2 → Test independently → Demo (17 tasks, ~41 total)
4. Add User Story 3 → Test independently → Demo (10 tasks, ~51 total)
5. Add User Story 4 → Test independently → Demo (10 tasks, ~61 total)
6. Polish and finalize (9 tasks, ~70 total)

Each story adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers after Foundational phase completes:

1. **Team completes Setup + Foundational together** (14 tasks)
2. **Once Foundational is done**:
   - Developer A: User Story 1 (Export + Validation)
   - Developer B: User Story 2 (Transformation) - can work with fixture data
   - Developer C: User Story 3 (Import + Rollback) - can work with test data
   - Developer D: User Story 4 (Verification) - can build validation logic
3. **Stories integrate and test together** once all complete

---

## Notes

- **[P] tasks** = different files, no dependencies - safe to parallelize
- **[Story] label** maps task to specific user story for traceability (US1, US2, US3, US4)
- Each user story is independently completable and testable with appropriate test data/fixtures
- **Tests are REQUIRED** for critical paths per constitution: transformation, validation, rollback
- Verify tests fail before implementing (TDD for critical paths)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **File paths are absolute** in task descriptions for clarity
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary

- **Total Tasks**: 70
- **Setup**: 6 tasks
- **Foundational**: 8 tasks (BLOCKING)
- **User Story 1**: 10 tasks (2 tests + 8 implementation)
- **User Story 2**: 17 tasks (6 tests + 11 implementation)
- **User Story 3**: 10 tasks (2 tests + 8 implementation)
- **User Story 4**: 10 tasks (2 tests + 8 implementation)
- **Polish**: 9 tasks

**Parallel Opportunities**:
- 3 tasks in Setup phase
- 4 tasks in Foundational phase
- 2 tasks in US1 tests
- 6 tasks in US2 tests, 4 tasks in US2 implementation
- 2 tasks in US3 tests
- 2 tasks in US4 tests, 4 tasks in US4 implementation
- 4 tasks in Polish phase

**Total Parallelizable Tasks**: ~27 tasks (38% of total)

**Estimated Timeline**:
- Sequential: ~15-20 days (1 task = 2-3 hours average)
- With parallelization: ~10-14 days
- MVP only (US1): ~3-5 days

---

**Ready for Implementation**: All tasks are specific, have file paths, and can be executed by LLM or human developers independently.
