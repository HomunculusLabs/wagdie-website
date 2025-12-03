# Tasks: Root Folder Cleanup

**Input**: Design documents from `/specs/015-root-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Not required - this is a file system cleanup task with manual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Preparation)

**Purpose**: Verify clean git state and prepare for file operations

- [x] T001 Verify git working tree is clean with `git status`
- [x] T002 Create backup branch with `git branch backup-before-cleanup`

---

## Phase 2: User Story 1 - Clean Project Root (Priority: P1) 🎯 MVP

**Goal**: Remove temporary/generated files and obsolete large data files from root folder

**Independent Test**: Run `ls -la` in root and verify no tsc_output*.txt, wagdie.json, or tsconfig.tsbuildinfo files exist

### Implementation for User Story 1

- [x] T003 [P] [US1] Delete debug output file `tsc_output.txt`
- [x] T004 [P] [US1] Delete debug output file `tsc_output_2.txt`
- [x] T005 [P] [US1] Delete debug output file `tsc_output_3.txt`
- [x] T006 [P] [US1] Delete debug output file `tsc_output_4.txt`
- [x] T007 [P] [US1] Delete TypeScript build cache `tsconfig.tsbuildinfo`
- [x] T008 [P] [US1] Delete macOS metadata file `.DS_Store`
- [x] T009 [P] [US1] Delete large data file `wagdie.json` (35MB)
- [x] T010 [P] [US1] Delete obsolete script `claude_code_zai_env.sh`
- [x] T011 [US1] Verify build still works with `npm run build`

**Checkpoint**: Root folder should have no temporary/debug files. Build must pass.

---

## Phase 3: User Story 2 - Historical Documentation Preserved (Priority: P2)

**Goal**: Archive historical documentation files to `docs/archive/` for future reference

**Independent Test**: Run `ls docs/archive/` and verify all 11 markdown files plus firebasebackup/ directory exist

### Implementation for User Story 2

- [x] T012 [US2] Create archive directory `docs/archive/`
- [x] T013 [P] [US2] Move `010-storybook-import-implementation-report.md` to `docs/archive/`
- [x] T014 [P] [US2] Move `010-storybook-import-summary.md` to `docs/archive/`
- [x] T015 [P] [US2] Move `CONNECTOR-FIX.md` to `docs/archive/`
- [x] T016 [P] [US2] Move `FIXES_APPLIED.md` to `docs/archive/`
- [x] T017 [P] [US2] Move `PROVIDER-FIX.md` to `docs/archive/`
- [x] T018 [P] [US2] Move `REACT-IMPORT-FIX.md` to `docs/archive/`
- [x] T019 [P] [US2] Move `MAP_REBUILD_SUMMARY.md` to `docs/archive/`
- [x] T020 [P] [US2] Move `IMPLEMENTATION_NOTES.md` to `docs/archive/`
- [x] T021 [P] [US2] Move `TECHNICAL_DEBT_REPORT.md` to `docs/archive/`
- [x] T022 [P] [US2] Move `PAGE_WIREFRAMES.md` to `docs/archive/`
- [x] T023 [P] [US2] Move `FEATURES_CHECKLIST.md` to `docs/archive/`
- [x] T024 [US2] Move `firebasebackup/` directory to `docs/archive/firebasebackup/`
- [x] T025 [US2] Verify all 12 items exist in `docs/archive/`

**Checkpoint**: All historical documentation preserved in docs/archive/. Root folder cleaner.

---

## Phase 4: User Story 3 - Gitignore Updated (Priority: P3)

**Goal**: Update .gitignore to prevent future clutter from temporary/generated files

**Independent Test**: Create a test file matching pattern (e.g., `touch test_tsc_output.txt`) and verify `git status` shows it as ignored

### Implementation for User Story 3

- [x] T026 [US3] Add `*.tsbuildinfo` pattern to `.gitignore` (already present)
- [x] T027 [US3] Add `tsc_output*.txt` pattern to `.gitignore`
- [x] T028 [US3] Add `.DS_Store` pattern to `.gitignore` (already present)
- [x] T029 [US3] Add `wagdie.json` pattern to `.gitignore`
- [x] T030 [US3] Verify .gitignore patterns work with `git status`

**Checkpoint**: .gitignore updated. Future temporary files will be automatically ignored.

---

## Phase 5: Verification & Polish

**Purpose**: Final validation of all success criteria

- [x] T031 Count visible files in root with `ls -1 | wc -l` (must be ≤25) - Result: 20 visible files
- [x] T032 Run full build verification with `npm run build` - PASS
- [x] T033 Verify no tsc_output*.txt files exist with `ls tsc_output*.txt 2>/dev/null` - PASS
- [x] T034 Verify docs/archive/ contains 12 items with `ls docs/archive/ | wc -l` - PASS (12 items)
- [x] T035 Stage all changes with `git add -A`
- [x] T036 Commit cleanup with descriptive message

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Can run in parallel with US1 (different files)
- **User Story 3 (Phase 4)**: Can run in parallel with US1/US2 (different file)
- **Verification (Phase 5)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - deletes temporary files
- **User Story 2 (P2)**: Independent - archives documentation (T012 must complete before T013-T024)
- **User Story 3 (P3)**: Independent - updates .gitignore

### Parallel Opportunities

All delete operations in US1 (T003-T010) can run in parallel.
All move operations in US2 (T013-T023) can run in parallel after T012 creates the directory.
US1, US2, and US3 can run in parallel as they touch different files.

---

## Parallel Example: User Story 1

```bash
# Launch all delete operations together:
rm -f tsc_output.txt tsc_output_2.txt tsc_output_3.txt tsc_output_4.txt
rm -f tsconfig.tsbuildinfo .DS_Store wagdie.json claude_code_zai_env.sh
```

## Parallel Example: User Story 2

```bash
# Create archive directory first:
mkdir -p docs/archive

# Then move all files together:
mv 010-storybook-import-implementation-report.md docs/archive/
mv 010-storybook-import-summary.md docs/archive/
mv CONNECTOR-FIX.md FIXES_APPLIED.md PROVIDER-FIX.md REACT-IMPORT-FIX.md docs/archive/
mv MAP_REBUILD_SUMMARY.md IMPLEMENTATION_NOTES.md TECHNICAL_DEBT_REPORT.md docs/archive/
mv PAGE_WIREFRAMES.md FEATURES_CHECKLIST.md docs/archive/
mv firebasebackup docs/archive/
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (2 tasks)
2. Complete Phase 2: User Story 1 - Delete temp files (9 tasks)
3. **STOP and VALIDATE**: Run `npm run build` to verify no breakage
4. Root is already cleaner - MVP delivered!

### Incremental Delivery

1. Setup → Ready to work
2. User Story 1 → Temp files gone → Build verified
3. User Story 2 → Docs archived → Historical context preserved
4. User Story 3 → .gitignore updated → Future-proofed
5. Each story adds value without breaking previous work

### Quick Execution (All at Once)

For experienced developers, all operations can be executed in ~5 minutes:

```bash
# Verify clean state
git status

# Delete all temp files (US1)
rm -f tsc_output*.txt tsconfig.tsbuildinfo .DS_Store wagdie.json claude_code_zai_env.sh

# Archive docs (US2)
mkdir -p docs/archive
mv 010-storybook-*.md CONNECTOR-FIX.md FIXES_APPLIED.md PROVIDER-FIX.md docs/archive/
mv REACT-IMPORT-FIX.md MAP_REBUILD_SUMMARY.md IMPLEMENTATION_NOTES.md docs/archive/
mv TECHNICAL_DEBT_REPORT.md PAGE_WIREFRAMES.md FEATURES_CHECKLIST.md docs/archive/
mv firebasebackup docs/archive/

# Update .gitignore (US3)
echo -e "\n# TypeScript build artifacts\n*.tsbuildinfo\ntsc_output*.txt\n\n# macOS\n.DS_Store\n\n# Large data files\nwagdie.json" >> .gitignore

# Verify
npm run build
ls -1 | wc -l  # Should be ≤25
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each phase or all at once
- Verify `npm run build` passes before committing
- Total: 36 tasks (2 setup + 9 US1 + 14 US2 + 5 US3 + 6 verification)
