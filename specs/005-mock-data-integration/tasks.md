---

description: "Task list for implementing mock data integration and testing setup"
---

# Tasks: Mock Data Integration & Testing Setup

**Input**: Design documents from `/specs/005-mock-data-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, quickstart.md

**Tests**: This feature does not require tests as specified in the feature specification (seed script is a utility, not critical path). Manual verification via UI pages is sufficient.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Seed scripts**: `scripts/` at repository root
- **TypeScript**: `.ts` files for implementation
- **Documentation**: `README.md` in scripts/ directory
- **Data structures**: Arrays and interfaces in seed script

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create scripts directory for seed utilities
- [ ] T002 [P] Install ts-node dependency for TypeScript execution

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 Create scripts/README.md with usage instructions
- [ ] T004 Define TypeScript interfaces for sample data structures
- [ ] T005 [P] Define character image rotation logic for existing assets
- [ ] T006 [P] Define test wallet addresses array
- [ ] T007 [P] Define dark fantasy character names array
- [ ] T008 [P] Define sample tweet content templates
- [ ] T009 [P] Define character stat generation algorithms

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 5 - Verify Database Migrations (Priority: P1) 🎯 MVP

**Goal**: Verify all database migrations are applied correctly and schema matches application expectations

**Independent Test**: Check database schema and verify all tables exist with correct columns, indexes, and RLS policies

### Implementation for User Story 5

- [ ] T010 [US5] Create migration verification function in scripts/seed-database.ts
- [ ] T011 [US5] Implement schema validation for all required tables
- [ ] T012 [US5] Add table existence checks for users, characters, concords, character_concords, tweets, locations
- [ ] T013 [US5] Add column validation for character D&D stats (str, dex, con, int, wis, cha, level, hp, max_hp, ac, speed)
- [ ] T014 [US5] Add index validation for performance indexes (token_id, owner_address, infection_status, staking_status, location_id)
- [ ] T015 [US5] Add seeded data verification for locations and concords
- [ ] T016 [US5] Implement migration status reporting with success/failure details

**Checkpoint**: Database migrations verified and schema validated - safe to proceed with data seeding

---

## Phase 4: User Story 1 - View Sample Characters on Browse Page (Priority: P1) 🎯 MVP

**Goal**: Populate database with sample characters to enable testing of character browse page functionality

**Independent Test**: Navigate to characters page and verify 20+ sample characters display with names, images, stats, infection status, staking status, and ownership badges

### Implementation for User Story 1

- [ ] T017 [US1] Create character data generation function in scripts/seed-database.ts
- [ ] T018 [US1] [P] Generate 50 character records with token_ids 1-50
- [ ] T019 [US1] [P] Generate D&D stats distribution (str, dex, con, int, wis, cha between 1-20)
- [ ] T020 [US1] [P] Generate infection status distribution (17 healthy, 17 infected, 16 cured)
- [ ] T021 [US1] [P] Generate staking status distribution (25 unstaked, 25 staked across 4 locations)
- [ ] T022 [US1] [P] Generate ownership distribution (20 owned by wallet1, 20 by wallet2, 10 unowned)
- [ ] T023 [US1] [P] Generate equipment distribution (20 full sets, 15 partial, 15 none)
- [ ] T024 [US1] [P] Generate character classes distribution (Warrior/Mage/Rogue/Cleric, 12-13 each)
- [ ] T025 [US1] [P] Generate character levels with normal distribution (1-5)
- [ ] T026 [US1] [P] Generate character names using dark fantasy theme
- [ ] T027 [US1] [P] Generate image_url assignments rotating through existing images
- [ ] T028 [US1] Generate equipment JSONB objects for characters with varied items
- [ ] T029 [US1] Generate background stories for sample characters
- [ ] T030 [US1] Implement character data insertion with error handling
- [ ] T031 [US1] Add character data idempotency using ON CONFLICT DO NOTHING

**Checkpoint**: Sample characters seeded - browse page should display 50 characters with varied states

---

## Phase 5: User Story 2 - Edit Sample Character Sheets (Priority: P1) 🎯 MVP

**Goal**: Populate database with character sheet data to enable testing of character editing workflow

**Independent Test**: Navigate to character detail page, edit name/background story, save changes, verify persistence

### Implementation for User Story 2

- [ ] T032 [US2] Create character concord associations function in scripts/seed-database.ts
- [ ] T033 [US2] [P] Generate 10 character-concord associations linking characters to Concord #15
- [ ] T034 [US2] [P] Generate concord quantity distribution (6 with qty=1, 3 with qty=2, 1 with qty=3)
- [ ] T035 [US2] Implement character-concord data insertion with referential integrity
- [ ] T036 [US2] Add character-concord idempotency using ON CONFLICT DO NOTHING
- [ ] T037 [US2] Verify character sheet data relationships (characters → character_concords → concords)

**Checkpoint**: Character sheet data complete - detail pages should show full RPG sheets with equipment and concords

---

## Phase 6: User Story 3 - Browse Sample Lore/Tweets (Priority: P2)

**Goal**: Populate database with sample tweets to enable testing of lore feed with text, images, and videos

**Independent Test**: Navigate to lore page and verify 30+ sample tweets display with various media types, filters work, infinite scroll loads

### Implementation for User Story 3

- [ ] T038 [US3] Create tweet data generation function in scripts/seed-database.ts
- [ ] T039 [US3] [P] Generate 60 tweet records spread over past 30 days
- [ ] T040 [US3] [P] Generate media type distribution (30 text-only, 18 with images, 12 with videos)
- [ ] T041 [US3] [P] Generate tweet content themes (lore, announcements, community engagement)
- [ ] T042 [US3] [P] Generate tweet timestamps with realistic spread
- [ ] T043 [US3] [P] Generate image tweet media URLs using existing project images
- [ ] T044 [US3] [P] Generate video tweet URLs using public sample video sources
- [ ] T045 [US3] Implement tweet data insertion with error handling
- [ ] T046 [US3] Add tweet data idempotency using ON CONFLICT DO NOTHING

**Checkpoint**: Sample tweets seeded - lore page should display 60 tweets with media variety

---

## Phase 7: User Story 4 - Test Infection Spread Workflow (Priority: P2)

**Goal**: Populate database with test user records to enable testing of spread page workflow

**Independent Test**: Navigate to spread page and verify mock token balances display, workflows complete with loading states

### Implementation for User Story 4

- [ ] T047 [US4] Create test users generation function in scripts/seed-database.ts
- [ ] T048 [US4] [P] Generate 3 test user records with valid Ethereum addresses
- [ ] T049 [US4] [P] Generate user login history and statistics
- [ ] T050 [US4] Implement test users data insertion with error handling
- [ ] T051 [US4] Add test users data idempotency using ON CONFLICT DO NOTHING
- [ ] T052 [US4] Verify user-character ownership relationships in sample data

**Checkpoint**: Test users created - spread page should show mock token balances and allow workflow testing

---

## Phase 8: Script Integration & Error Handling

**Purpose**: Finalize seed script with comprehensive error handling and reporting

- [ ] T053 [P] Implement global error handling strategy in seed script
- [ ] T054 [P] Add comprehensive logging for all operations
- [ ] T055 [P] Create results tracking object for success/failure statistics
- [ ] T056 [P] Implement per-record error capture with context
- [ ] T057 [P] Add summary report generation with detailed statistics
- [ ] T058 [P] Implement graceful error recovery (continue on individual failures)
- [ ] T059 [P] Add script completion time tracking and performance metrics
- [ ] T060 Add npm script configuration in package.json for easy execution
- [ ] T061 Add environment variable validation for required keys
- [ ] T062 Implement script help text and usage instructions

**Checkpoint**: Complete seed script with error handling, reporting, and documentation

---

## Phase 9: Verification & Polish

**Purpose**: Final verification and cleanup tasks

- [ ] T063 [P] Update scripts/README.md with comprehensive usage instructions
- [ ] T064 [P] Add script examples to README for common use cases
- [ ] T065 [P] Add troubleshooting section to README
- [ ] T066 [P] Update package.json scripts section
- [ ] T067 [P] Update CLAUDE.md with seed script instructions
- [ ] T068 Run complete seed script test on fresh database
- [ ] T069 Verify idempotency by running script twice
- [ ] T070 Verify all UI pages load correctly with sample data
- [ ] T071 Verify all filter combinations work on characters page
- [ ] T072 Verify character detail pages display complete sheets
- [ ] T073 Verify lore page displays all media types correctly
- [ ] T074 Verify spread page displays mock token balances
- [ ] T075 Validate all success criteria from specification

**Checkpoint**: Complete implementation verified and ready for use

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 5 (Phase 3)**: Depends on Foundational phase completion - BLOCKS data seeding
- **User Stories 1-4 (Phases 4-7)**: Depend on User Story 5 completion (migration verification)
- **Script Integration (Phase 8)**: Depends on all user story phases complete
- **Verification (Phase 9)**: Depends on complete implementation

### User Story Dependencies

- **User Story 5 (Migration Verification)**: First - validates database before any seeding
- **User Story 1 (Characters)**: Can start after US5 - no dependencies on other stories
- **User Story 2 (Character Sheets)**: Can start after US1 - depends on character data
- **User Story 3 (Tweets)**: Can start after US5 - independent of character stories
- **User Story 4 (Spread Page)**: Can start after US1 & US3 - depends on users and character data

### Within Each User Story

- Data generation functions before insertion functions
- Insertion functions before error handling integration
- Core implementation before verification and polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Within User Story 1: T018-T027 can run in parallel (data generation)
- Within User Story 3: T039-T044 can run in parallel (tweet data generation)
- All error handling and logging tasks marked [P] can run in parallel
- All documentation and polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all character data generation tasks together:
Task: "T018 [US1] [P] Generate 50 character records with token_ids 1-50"
Task: "T019 [US1] [P] Generate D&D stats distribution (str, dex, con, int, wis, cha between 1-20)"
Task: "T020 [US1] [P] Generate infection status distribution (17 healthy, 17 infected, 16 cured)"
Task: "T021 [US1] [P] Generate staking status distribution (25 unstaked, 25 staked across 4 locations)"
Task: "T022 [US1] [P] Generate ownership distribution (20 owned by wallet1, 20 by wallet2, 10 unowned)"
Task: "T023 [US1] [P] Generate equipment distribution (20 full sets, 15 partial, 15 none)"
Task: "T024 [US1] [P] Generate character classes distribution (Warrior/Mage/Rogue/Cleric, 12-13 each)"
Task: "T025 [US1] [P] Generate character levels with normal distribution (1-5)"
Task: "T026 [US1] [P] Generate character names using dark fantasy theme"
Task: "T027 [US1] [P] Generate image_url assignments rotating through existing images"

# Then run insertion and error handling tasks:
Task: "T028 [US1] [P] Generate equipment JSONB objects for characters with varied items"
Task: "T029 [US1] [P] Generate background stories for sample characters"
Task: "T030 [US1] Implement character data insertion with error handling"
Task: "T031 [US1] Add character data idempotency using ON CONFLICT DO NOTHING"
```

---

## Implementation Strategy

### MVP First (User Stories 5, 1, and 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 5 (Migration Verification)
4. Complete Phase 4: User Story 1 (Character Browse Page)
5. Complete Phase 5: User Story 2 (Character Sheet Editing)
6. **STOP and VALIDATE**: Test core character functionality independently
7. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 5 → Test migrations → Validate schema
3. Add User Story 1 → Test character browse → Deploy/Demo (MVP!)
4. Add User Story 2 → Test character editing → Deploy/Demo
5. Add User Story 3 → Test lore feed → Deploy/Demo
6. Add User Story 4 → Test spread page → Deploy/Demo
7. Complete polish and verification → Final delivery
8. Each story adds value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 5 (Migration Verification)
   - Developer B: User Story 1 (Characters)
   - Developer C: User Story 3 (Tweets)
3. After US5 and US1 complete:
   - Developer A: User Story 2 (Character Sheets)
   - Developer B: User Story 4 (Spread Page)
4. Team completes integration and polish phases together
5. Stories complete and integrate independently

---

## Success Metrics Validation

The following success criteria from the specification will be verified:

- **SC-001**: All database migrations execute successfully (US5 verification)
- **SC-002**: Character browse page loads with 20+ characters within 2 seconds (US1)
- **SC-003**: Character detail page displays complete stats within 1 second (US2)
- **SC-004**: Lore page loads with 30+ tweets within 2 seconds (US3)
- **SC-005**: All filter tabs return correct results (US1)
- **SC-006**: Character edit workflow completes successfully (US2)
- **SC-007**: Spread page displays mock token balances (US4)
- **SC-008**: 100% of characters have valid stat values within constraints (US1)
- **SC-009**: 100% of images reference valid existing assets (US1)
- **SC-010**: Seed script is idempotent (re-run test in Phase 9)
- **SC-011**: All features demonstrable with sample data (final verification)
- **SC-012**: Sufficient variety for testing all UI states (all stories)
- **SC-013**: Equipment displays correctly (US2)
- **SC-014**: Mock transactions show 1-2 second loading states (US4)
- **SC-015**: Seed script displays summary report (Phase 8)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- User Story 5 must complete first to validate database before seeding
- Manual verification via UI pages replaces automated tests for this feature
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Seed script must use existing image assets from public/images/
- Script must be idempotent and handle errors gracefully per specification