# Tasks: Blockchain Indexer Reliability Fixes

**Input**: Design documents from `/specs/021-indexer-fixes/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Project initialization and database schema changes

- [ ] T001 Create database migration file at supabase/migrations/20260106000000_add_batch_index.sql adding batch_index column to concord_transfers
- [ ] T002 Apply migration and verify batch_index column exists with default 0
- [ ] T003 [P] Verify existing concord_transfers data preserved with batch_index = 0

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities that MUST be complete before user story implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create batchUpsert utility function in scripts/indexer/utils/batch-upsert.ts with configurable chunk size (default 100)
- [ ] T005 [P] Create fetchLogsWithSubdivision utility function in scripts/indexer/utils/pagination.ts implementing binary block range subdivision
- [ ] T006 Verify lib/contracts/addresses.ts exports getContractAddresses(chainId) with all required addresses (wagdie, tokensOfConcord, wagdieWorld, searing, spread, mushroom)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Complete Event Indexing Without Data Loss (Priority: P1) 🎯 MVP

**Goal**: Ensure all blockchain indexers capture every on-chain event without skipping any, even when Etherscan returns max results (1000)

**Independent Test**: Run backfill against a known block range and compare indexed events to Etherscan totals

### Implementation for User Story 1

- [ ] T007 [US1] Refactor scripts/indexer/transfer-indexer.ts to use fetchLogsWithSubdivision from utils/pagination.ts
- [ ] T008 [P] [US1] Refactor scripts/indexer/concord-indexer.ts to use fetchLogsWithSubdivision from utils/pagination.ts
- [ ] T009 [P] [US1] Refactor scripts/indexer/staking-indexer.ts to use fetchLogsWithSubdivision from utils/pagination.ts
- [ ] T010 [P] [US1] Refactor scripts/indexer/searing-indexer.ts to use fetchLogsWithSubdivision from utils/pagination.ts
- [ ] T011 [P] [US1] Refactor scripts/indexer/infection-indexer.ts to use fetchLogsWithSubdivision from utils/pagination.ts
- [ ] T012 [US1] Add logging for block range subdivision events (log when subdivision occurs and total events captured)
- [ ] T013 [US1] Test pagination fix with dense block range (START_BLOCK=15422334 END_BLOCK=15422400)

**Checkpoint**: At this point, User Story 1 should be fully functional - all events captured without skipping

---

## Phase 4: User Story 2 - Accurate Batch Transfer Tracking (Priority: P2)

**Goal**: ERC-1155 batch transfers record accurate identifiers with unique (tx_hash, log_index, batch_index, token_id) constraint

**Independent Test**: Process a known TransferBatch transaction and verify each token has unique record

### Implementation for User Story 2

- [ ] T014 [US2] Update scripts/indexer/concord-transfer-handler.ts to use real log_index and add batch_index (0 for TransferSingle, 0..N for TransferBatch)
- [ ] T015 [US2] Update ConcordTransferRecord type in concord-transfer-handler.ts to include batch_index: number field
- [ ] T016 [US2] Modify upsert conflict resolution to use new constraint (transaction_hash, log_index, batch_index, token_id)
- [ ] T017 [US2] Test batch transfer indexing with block range containing TransferBatch events (START_BLOCK=16000000 END_BLOCK=16000100)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Consistent Contract Configuration (Priority: P3)

**Goal**: All indexers use centralized contract addresses from lib/contracts/addresses.ts, no hardcoded addresses

**Independent Test**: grep for hardcoded addresses in scripts/indexer/ - should find none

### Implementation for User Story 3

- [ ] T018 [US3] Refactor scripts/indexer/transfer-indexer.ts to import WAGDIE_CONTRACT from lib/contracts/addresses.ts
- [ ] T019 [P] [US3] Refactor scripts/indexer/concord-indexer.ts to import CONCORD_CONTRACT from lib/contracts/addresses.ts
- [ ] T020 [P] [US3] Refactor scripts/indexer/staking-indexer.ts to import WAGDIE_WORLD_CONTRACT from lib/contracts/addresses.ts
- [ ] T021 [P] [US3] Refactor scripts/indexer/searing-indexer.ts to import SEARING_CONTRACT from lib/contracts/addresses.ts
- [ ] T022 [P] [US3] Refactor scripts/indexer/infection-indexer.ts to import SPREAD_CONTRACT and MUSHROOM_CONTRACT from lib/contracts/addresses.ts
- [ ] T023 [US3] Remove all hardcoded contract address strings from scripts/indexer/*.ts files
- [ ] T024 [US3] Verify no hardcoded addresses remain: grep -r "0x" scripts/indexer/*.ts should only show imports

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Efficient Bulk Data Processing (Priority: P3)

**Goal**: Backfill operations complete 3x faster using batched database writes instead of serial inserts

**Independent Test**: Measure backfill time before/after for 10,000+ events

### Implementation for User Story 4

- [ ] T025 [US4] Refactor scripts/indexer/concord-transfer-handler.ts to use batchUpsert from utils/batch-upsert.ts
- [ ] T026 [P] [US4] Refactor scripts/indexer/staking-event-handler.ts to use batchUpsert from utils/batch-upsert.ts
- [ ] T027 [P] [US4] Refactor scripts/indexer/searing-event-handler.ts to use batchUpsert from utils/batch-upsert.ts
- [ ] T028 [P] [US4] Refactor scripts/indexer/infection-event-handler.ts to use batchUpsert from utils/batch-upsert.ts
- [ ] T029 [P] [US4] Refactor scripts/indexer/event-handler.ts (if exists) to use batchUpsert from utils/batch-upsert.ts
- [ ] T030 [US4] Add performance logging: "Batch of X records in Yms" for each batch
- [ ] T031 [US4] Implement partial failure handling: continue on batch error, log failures, preserve successful records
- [ ] T032 [US4] Measure and document backfill performance improvement (target: 3x faster)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation

- [ ] T033 [P] Verify migration backwards compatibility: existing data has batch_index = 0
- [ ] T034 [P] Run full quickstart.md validation checklist
- [ ] T035 [P] Verify all success criteria from spec.md:
  - SC-001: Zero events skipped during backfill
  - SC-002: ERC-1155 batch transfers indexed without constraint violations
  - SC-003: Contract addresses defined in exactly one location
  - SC-004: Backfill 3x faster than serial baseline
  - SC-005: Graceful recovery from partial batch failures
- [ ] T036 Update CLAUDE.md with any new commands or operational notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3 → P3)
  - Or in parallel (if team capacity allows)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on Phase 2 (uses fetchLogsWithSubdivision utility)
- **User Story 2 (P2)**: Depends only on Phase 2 (uses batch_index from migration)
- **User Story 3 (P3)**: Depends only on Phase 2 (uses lib/contracts/addresses.ts)
- **User Story 4 (P3)**: Depends only on Phase 2 (uses batchUpsert utility)

**Note**: User stories 3 and 4 share same priority (P3) but are independent. Order doesn't matter.

### Within Each User Story

- File modifications should follow dependency order within story
- [P] tasks can run in parallel (different files)
- Verification task runs after all implementation tasks

### Parallel Opportunities

**Setup Phase:**
- T001 must complete before T002, T003

**Foundational Phase:**
- T004 and T005 can run in parallel [P] (different files)
- T006 is verification only

**User Story 1 (after Foundational):**
- T008, T009, T010, T011 can all run in parallel [P] after T007

**User Story 3 (after Foundational):**
- T019, T020, T021, T022 can all run in parallel [P] after T018

**User Story 4 (after Foundational):**
- T026, T027, T028, T029 can all run in parallel [P] after T025

**Cross-Story Parallelism:**
- All 4 user stories can run in parallel after Foundational phase completes
- Recommended order for single developer: US1 → US2 → US3 → US4 (P1 first)

---

## Parallel Example: User Story 1

```bash
# After T007 (transfer-indexer.ts) completes, launch remaining indexers in parallel:
Task: "Refactor scripts/indexer/concord-indexer.ts to use fetchLogsWithSubdivision"
Task: "Refactor scripts/indexer/staking-indexer.ts to use fetchLogsWithSubdivision"
Task: "Refactor scripts/indexer/searing-indexer.ts to use fetchLogsWithSubdivision"
Task: "Refactor scripts/indexer/infection-indexer.ts to use fetchLogsWithSubdivision"
```

## Parallel Example: User Story 4

```bash
# After T025 (concord-transfer-handler.ts) completes, launch remaining handlers in parallel:
Task: "Refactor scripts/indexer/staking-event-handler.ts to use batchUpsert"
Task: "Refactor scripts/indexer/searing-event-handler.ts to use batchUpsert"
Task: "Refactor scripts/indexer/infection-event-handler.ts to use batchUpsert"
Task: "Refactor scripts/indexer/event-handler.ts to use batchUpsert"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration for batch_index)
2. Complete Phase 2: Foundational (utilities)
3. Complete Phase 3: User Story 1 (pagination fix)
4. **STOP and VALIDATE**: Test with dense block range - all events captured
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test with dense blocks → Deploy (MVP! - solves P1 data loss)
3. Add User Story 2 → Test batch transfers → Deploy (fixes ERC-1155 tracking)
4. Add User Story 3 → Verify no hardcoded addresses → Deploy (config cleanup)
5. Add User Story 4 → Measure performance → Deploy (3x faster backfills)

### Risk-Based Order (from research.md)

Based on risk assessment, implementation order is:
1. **Contract addresses (US3)** - Lowest risk, simple import changes
2. **Batch_index column (US2)** - Schema change first, then handler update
3. **Batched writes (US4)** - After handlers modified
4. **Pagination fix (US1)** - Highest impact, most complex, requires careful testing

**Note**: Priority-based order (P1 first) is recommended for value delivery. Risk-based order is an alternative if team prefers lowest-risk-first approach.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All 5 indexers must be updated for pagination (US1)
- All 4+ handlers must be updated for batched writes (US4)
