# Tasks: Blockchain Integration

**Input**: Design documents from `/specs/004-blockchain-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks are NOT included per constitution - pragmatic testing approach with E2E tests added during polish phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, etc.)
- Include exact file paths in descriptions

## Path Conventions

- **Web app (Next.js App Router)**: Uses repository root structure
- Primary directories: `app/`, `components/`, `hooks/`, `lib/`, `types/`, `supabase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Contract configuration, TypeScript types, and foundational blockchain setup

- [ ] T001 Create contract ABIs directory structure at lib/contracts/abis/
- [ ] T002 [P] Copy WAGDIE ERC721 ABI from original project to lib/contracts/abis/wagdie.ts
- [ ] T003 [P] Copy Tokens of Concord ERC1155 ABI to lib/contracts/abis/concord.ts
- [ ] T004 [P] Copy Corpse ERC1155 ABI to lib/contracts/abis/corpse.ts
- [ ] T005 [P] Copy Mushroom ERC1155 ABI to lib/contracts/abis/mushroom.ts
- [ ] T006 [P] Copy SearWagdie contract ABI to lib/contracts/abis/searing.ts
- [ ] T007 [P] Copy Spread contract ABI to lib/contracts/abis/spread.ts
- [ ] T008 [P] Copy WagdieWorld staking contract ABI to lib/contracts/abis/wagdie-world.ts
- [ ] T009 Create contract addresses configuration at lib/contracts/addresses.ts based on specs/004-blockchain-integration/contracts/addresses.json
- [ ] T010 [P] Create chain configuration at lib/contracts/chains.ts for mainnet and Sepolia
- [ ] T011 [P] Create blockchain type definitions at types/blockchain.ts (Address, TransactionHash, TransactionStatus, TokenBalance, etc.)
- [ ] T012 [P] Create contract parameter types at types/contracts.ts (SearConcordsParams, StakeWagdiesParams, etc.)
- [ ] T013 Update lib/wagmi.ts to include Alchemy RPC configuration with fallback endpoints
- [ ] T014 [P] Create environment variables in .env.example (NEXT_PUBLIC_ALCHEMY_API_KEY, NEXT_PUBLIC_CHAIN_ID)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T015 Create database migration at supabase/migrations/[timestamp]_add_blockchain_state.sql to add is_seared, is_infected, is_staked columns to characters table
- [ ] T016 Create database migration at supabase/migrations/[timestamp]_create_pending_transactions.sql to create pending_transactions table
- [ ] T017 [P] Create blockchain error parser utility at lib/utils/blockchain-errors.ts with parseBlockchainError function
- [ ] T018 [P] Create transaction storage utility at lib/utils/transaction-storage.ts for localStorage pending tx management
- [ ] T019 [P] Create gas estimation utility at lib/utils/gas-estimation.ts with estimateTransactionCost function
- [ ] T020 Create network check hook at hooks/blockchain/useNetworkCheck.ts to detect wrong network and provide switch function
- [ ] T021 Create pending transactions Zustand store at hooks/blockchain/usePendingTransactions.ts with persist middleware
- [ ] T022 [P] Create base TransactionButton component at components/blockchain/TransactionButton.tsx for reusable tx UI
- [ ] T023 [P] Create TransactionStatus component at components/blockchain/TransactionStatus.tsx for pending/confirmed/failed states
- [ ] T024 [P] Create NetworkChecker component at components/blockchain/NetworkChecker.tsx for wrong network warning banner
- [ ] T025 [P] Create GasEstimator component at components/blockchain/GasEstimator.tsx to display gas cost estimates
- [ ] T026 [P] Create TokenBalance component at components/blockchain/TokenBalance.tsx for displaying token balances with refresh

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Verify NFT Ownership Before Actions (Priority: P1) 🎯 MVP

**Goal**: Users connect wallet and see which WAGDIE characters they own. Application verifies ownership from blockchain before allowing edits.

**Independent Test**: Connect wallet with known token IDs, verify "Yours" badge appears only on owned characters, Edit button enabled only for owned characters.

### Implementation for User Story 1

- [ ] T027 [P] [US1] Create useCharacterOwnership hook at hooks/blockchain/useCharacterOwnership.ts using wagmi useReadContract for ownerOf calls
- [ ] T028 [P] [US1] Create useOwnedCharacters hook at hooks/blockchain/useOwnedCharacters.ts to get all characters owned by connected wallet
- [ ] T029 [US1] Update CharacterCard component at components/character/CharacterCard.tsx to display "Yours" badge when user owns character
- [ ] T030 [US1] Update app/characters/page.tsx to integrate useOwnedCharacters hook and filter owned characters
- [ ] T031 [US1] Update app/characters/[tokenId]/page.tsx to use useCharacterOwnership and conditionally enable/disable Edit button
- [ ] T032 [US1] Add ownership verification to character edit flow - prevent edits if user doesn't own character
- [ ] T033 [US1] Update lib/services/character-service.ts to verify ownership before database updates

**Checkpoint**: User Story 1 complete - ownership badges and edit protection working

---

## Phase 4: User Story 2 - Check Token Balances for Game Actions (Priority: P1) 🎯 MVP

**Goal**: Users view real-time token balances (Concords, Corpses, Mushrooms) to know what game actions are possible.

**Independent Test**: Connect wallet, verify correct token balances displayed, balances update after transactions, actions disabled when insufficient tokens.

### Implementation for User Story 2

- [ ] T034 [P] [US2] Create useTokenBalances hook at hooks/blockchain/useTokenBalances.ts using wagmi useReadContracts for multi-call efficiency
- [ ] T035 [P] [US2] Create useConcordBalance hook at hooks/blockchain/useConcordBalance.ts for Tokens of Concord balance
- [ ] T036 [P] [US2] Create useCorpseBalance hook at hooks/blockchain/useCorpseBalance.ts for Corpse token balance
- [ ] T037 [P] [US2] Create useMushroomBalance hook at hooks/blockchain/useMushroomBalance.ts for Mushroom token balance
- [ ] T038 [US2] Update app/characters/[tokenId]/page.tsx to display token balances in character sheet UI
- [ ] T039 [US2] Update app/spread/page.tsx to display token balances and disable actions when balances insufficient
- [ ] T040 [US2] Add balance validation logic - check sufficient tokens before enabling transaction buttons
- [ ] T041 [US2] Add balance refresh trigger after transaction confirmations using React Query invalidation

**Checkpoint**: User Story 2 complete - all token balances displaying correctly, actions validate balances

---

## Phase 5: User Story 3 - Sear Characters by Burning Concords (Priority: P2)

**Goal**: Users can permanently transform characters through searing by burning Concord tokens. Two-step flow: approve tokens, then execute searing.

**Independent Test**: Own character + Concords, initiate searing, approve token spending, execute searing transaction, verify character seared status updates.

### Implementation for User Story 3

- [ ] T042 [P] [US3] Create useSearCharacter hook at hooks/blockchain/useSearCharacter.ts using wagmi useWriteContract for searing transaction
- [ ] T043 [P] [US3] Create useApproveConcords hook at hooks/blockchain/useApproveConcords.ts for ERC1155 setApprovalForAll
- [ ] T044 [P] [US3] Create useIsSeared hook at hooks/blockchain/useIsSeared.ts to check if character already seared
- [ ] T045 [US3] Create SearDialog component at components/character/SearDialog.tsx for searing approval flow UI
- [ ] T046 [US3] Create SearButton component at components/character/SearButton.tsx with two-step transaction handling
- [ ] T047 [US3] Update app/characters/[tokenId]/page.tsx to integrate searing button and dialog
- [ ] T048 [US3] Add searing transaction state management - track approval and searing tx separately
- [ ] T049 [US3] Add database sync - update characters.is_seared after blockchain confirmation
- [ ] T050 [US3] Add error handling for searing - parse blockchain errors and display user-friendly messages
- [ ] T051 [US3] Update lib/services/wallet-service.ts - remove mock searing, integrate real blockchain calls

**Checkpoint**: User Story 3 complete - character searing working with approval flow, database synced

---

## Phase 6: User Story 4 - Spread Infection by Paying ETH and Burning Mushrooms (Priority: P2)

**Goal**: Users spread infection from infected character to target by paying ETH and burning mushrooms. Updates both characters' infection status.

**Independent Test**: Own infected character + mushrooms + ETH, select target, approve mushrooms, execute spread with ETH payment, verify both characters update infection status.

### Implementation for User Story 4

- [ ] T052 [P] [US4] Create useSpreadInfection hook at hooks/blockchain/useSpreadInfection.ts using wagmi useWriteContract with payable ETH
- [ ] T053 [P] [US4] Create useApproveMushroomsburns hook at hooks/blockchain/useApproveMushrooms.ts for ERC1155 approval
- [ ] T054 [P] [US4] Create useIsInfected hook at hooks/blockchain/useIsInfected.ts to check character infection status
- [ ] T055 [P] [US4] Create useInfectionPrice hook at hooks/blockchain/useInfectionPrice.ts to get current infection cost in ETH
- [ ] T056 [US4] Update SpreadInfect component at components/spread/SpreadInfect.tsx to use real blockchain hooks
- [ ] T057 [US4] Add infected character selector - only show user's infected characters as source
- [ ] T058 [US4] Add target character validation - prevent spreading to already infected characters
- [ ] T059 [US4] Add mushroom approval flow - request ERC1155 approval if not already approved
- [ ] T060 [US4] Add ETH balance check - disable spread if insufficient ETH for payment + gas
- [ ] T061 [US4] Add infection transaction execution with ETH value parameter
- [ ] T062 [US4] Add database sync - update characters.is_infected for both source and target after confirmation
- [ ] T063 [US4] Update app/spread/page.tsx to integrate infection spreading with all validations

**Checkpoint**: User Story 4 complete - infection spreading working with ETH payment, mushroom burning, database synced

---

## Phase 7: User Story 5 - Burn Corpse Tokens (Priority: P2)

**Goal**: Users burn their Corpse tokens through two-step flow: approve burn contract, execute burn. Corpse balance decreases.

**Independent Test**: Own corpse tokens, select quantity, approve burn contract, execute burn, verify corpse balance decreases by burn quantity.

### Implementation for User Story 5

- [ ] T064 [P] [US5] Create useBurnCorpse hook at hooks/blockchain/useBurnCorpse.ts using wagmi useWriteContract for ERC1155 burn
- [ ] T065 [P] [US5] Create useApproveCorpseBurn hook at hooks/blockchain/useApproveCorpseBurn.ts for ERC1155 approval
- [ ] T066 [US5] Create BurnCorpseDialog component at components/spread/BurnCorpseDialog.tsx for burn approval flow
- [ ] T067 [US5] Add quantity selector with validation - prevent burning more than owned
- [ ] T068 [US5] Add corpse approval flow - request ERC1155 approval for burn contract
- [ ] T069 [US5] Add burn transaction execution with quantity parameter
- [ ] T070 [US5] Add success feedback - display "Successfully burned X corpses" message
- [ ] T071 [US5] Update app/spread/page.tsx to integrate corpse burning section
- [ ] T072 [US5] Add corpse balance refresh after burn confirmation using React Query invalidation

**Checkpoint**: User Story 5 complete - corpse burning working with approval, balance updates correctly

---

## Phase 8: User Story 6 - Stake Characters at Locations (Priority: P3)

**Goal**: Users stake characters at game locations. Staking locks character in contract, associates with location. Users can unstake to retrieve.

**Independent Test**: Own character, select location, approve staking, verify character shows as staked at location, unstake, verify character returns to wallet.

### Implementation for User Story 6

- [ ] T073 [P] [US6] Create useStakeCharacter hook at hooks/blockchain/useStakeCharacter.ts using wagmi useWriteContract for staking
- [ ] T074 [P] [US6] Create useUnstakeCharacter hook at hooks/blockchain/useUnstakeCharacter.ts for unstaking transaction
- [ ] T075 [P] [US6] Create useCharacterStakingStatus hook at hooks/blockchain/useCharacterStakingStatus.ts to check if character staked
- [ ] T076 [P] [US6] Create useLocations hook at hooks/blockchain/useLocations.ts to get available staking locations
- [ ] T077 [P] [US6] Create useApproveStaking hook at hooks/blockchain/useApproveStaking.ts for ERC721 approval
- [ ] T078 [US6] Create StakeDialog component at components/character/StakeDialog.tsx for location selection and staking flow
- [ ] T079 [US6] Create UnstakeButton component at components/character/UnstakeButton.tsx for unstaking action
- [ ] T080 [US6] Create CharacterLocationSelector component at components/character/CharacterLocationSelector.tsx for location picker UI
- [ ] T081 [US6] Update app/characters/[tokenId]/page.tsx to show Stake button (if not staked) or Unstake button (if staked)
- [ ] T082 [US6] Add NFT approval flow - request ERC721 approval for WagdieWorld contract before staking
- [ ] T083 [US6] Add staking transaction execution with location ID parameter
- [ ] T084 [US6] Add unstaking transaction execution
- [ ] T085 [US6] Add database sync - update characters.is_staked and characters.staked_location_id after transactions
- [ ] T086 [US6] Update app/characters/page.tsx to support "staked" filter showing only staked characters
- [ ] T087 [US6] Add location filter - show characters staked at specific locations

**Checkpoint**: User Story 6 complete - character staking and unstaking working, location filtering functional

---

## Phase 9: User Story 7 - Cure Infected Characters (Priority: P3)

**Goal**: Users cure infected characters by executing cure transaction. Infection status clears.

**Independent Test**: Own infected character, execute cure transaction, verify infection status updates to false, "Infected" badge removed.

### Implementation for User Story 7

- [ ] T088 [P] [US7] Research cure mechanism in original contracts - determine if cure is in WagdieWorld or separate contract
- [ ] T089 [P] [US7] Create useCureInfection hook at hooks/blockchain/useCureInfection.ts using wagmi useWriteContract
- [ ] T090 [US7] Create CureButton component at components/character/CureButton.tsx for cure action
- [ ] T091 [US7] Update app/characters/[tokenId]/page.tsx to show "Cure Infection" button only for infected characters
- [ ] T092 [US7] Add cure transaction execution
- [ ] T093 [US7] Add database sync - update characters.is_infected to false after cure confirmation
- [ ] T094 [US7] Add success feedback - display "Infection cured successfully" message

**Checkpoint**: User Story 7 complete - infection curing working, database synced

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, testing, documentation

- [ ] T095 [P] Create lib/contracts/README.md documenting all contract addresses, ABIs, and usage examples
- [ ] T096 [P] Create lib/services/README.md explaining blockchain service patterns
- [ ] T097 [P] Create hooks/blockchain/README.md with hook usage documentation
- [ ] T098 [P] Add inline comments to all contract interaction code explaining gas costs and failure modes
- [ ] T099 [P] Create ADR document at docs/adr/001-wagmi-v2-choice.md explaining technology decision
- [ ] T100 Add transaction history view - display recent transactions from localStorage pending tx store
- [ ] T101 Add transaction resume functionality - detect pending txs on page load and show status
- [ ] T102 Add RPC retry logic with exponential backoff for rate limit handling
- [ ] T103 Add testnet warning banner component at components/blockchain/TestnetBanner.tsx
- [ ] T104 [P] Install and configure Playwright for E2E testing (npm install -D @playwright/test)
- [ ] T105 [P] Install and configure Vitest for unit testing (npm install -D vitest @testing-library/react)
- [ ] T106 Create E2E test for User Story 1 at tests/e2e/ownership-verification.spec.ts
- [ ] T107 [P] Create E2E test for User Story 2 at tests/e2e/token-balances.spec.ts
- [ ] T108 [P] Create E2E test for User Story 3 at tests/e2e/character-searing.spec.ts
- [ ] T109 [P] Create unit tests for blockchain error parser at tests/unit/blockchain-errors.test.ts
- [ ] T110 [P] Create unit tests for useTokenBalances hook at tests/unit/hooks/useTokenBalances.test.ts
- [ ] T111 Update quickstart.md with any implementation-specific testing notes
- [ ] T112 Run through all test scenarios in quickstart.md on Sepolia testnet
- [ ] T113 Verify all transaction error scenarios work correctly (wrong network, insufficient funds, rejection)
- [ ] T114 Optimize RPC caching - verify React Query staleTime and cacheTime settings
- [ ] T115 Add performance monitoring - log RPC call counts and response times
- [ ] T116 Security review - verify no private keys stored, all signing in wallet
- [ ] T117 Final constitution compliance check - verify clean architecture maintained

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phases 3-9)**: All depend on Foundational (Phase 2) completion
  - User Story 1 (P1): Can start after Foundational - No dependencies on other stories ✅
  - User Story 2 (P1): Can start after Foundational - No dependencies on other stories ✅
  - User Story 3 (P2): Can start after Foundational - Integrates with US1/US2 but independently testable ✅
  - User Story 4 (P2): Can start after Foundational - Integrates with US2 but independently testable ✅
  - User Story 5 (P2): Can start after Foundational - No dependencies on other stories ✅
  - User Story 6 (P3): Can start after Foundational - Integrates with US1 but independently testable ✅
  - User Story 7 (P3): Can start after Foundational - Integrates with US1/US4 but independently testable ✅
- **Polish (Phase 10)**: Depends on desired user stories being complete

### User Story Dependencies

All user stories are **independently testable** after Foundational phase completes:

- **User Story 1 (P1)**: Ownership verification - Foundation for security model
- **User Story 2 (P1)**: Token balances - Standalone, enables informed user decisions
- **User Story 3 (P2)**: Character searing - Uses US1 ownership, US2 balances, but works independently
- **User Story 4 (P2)**: Infection spreading - Uses US2 balances, but works independently
- **User Story 5 (P2)**: Corpse burning - Uses US2 balances, but works independently
- **User Story 6 (P3)**: Character staking - Uses US1 ownership, but works independently
- **User Story 7 (P3)**: Cure infection - Works independently, reverses US4 infection

### Within Each User Story

- Create all hooks first (can be parallel)
- Create all components next (can be parallel after hooks)
- Integrate into pages (sequential, depends on hooks + components)
- Add database sync (depends on transaction confirmation)
- Add error handling (final step)

### Parallel Opportunities

- **Phase 1 (Setup)**: All ABI copy tasks (T002-T008) can run in parallel, all type definitions (T011-T012) can run in parallel
- **Phase 2 (Foundational)**: All utility files (T017-T019) can run in parallel, all components (T022-T026) can run in parallel
- **Within User Stories**: All hooks for a story can be created in parallel, all components for a story can be created in parallel
- **Across User Stories**: After Phase 2, all user stories can be worked on in parallel by different developers
- **Phase 10 (Polish)**: All documentation tasks (T095-T099) can run in parallel, all test files (T106-T110) can run in parallel

---

## Parallel Example: User Story 1 (Ownership Verification)

```bash
# Launch all hooks for User Story 1 together:
Task T027: "Create useCharacterOwnership hook at hooks/blockchain/useCharacterOwnership.ts"
Task T028: "Create useOwnedCharacters hook at hooks/blockchain/useOwnedCharacters.ts"

# Then integrate sequentially:
Task T029: "Update CharacterCard component to display ownership badge"
Task T030: "Update characters page to filter owned characters"
Task T031: "Update character detail page to enable/disable edit button"
```

---

## Parallel Example: User Story 3 (Character Searing)

```bash
# Launch all hooks for User Story 3 together:
Task T042: "Create useSearCharacter hook"
Task T043: "Create useApproveConcords hook"
Task T044: "Create useIsSeared hook"

# Then launch all components together:
Task T045: "Create SearDialog component"
Task T046: "Create SearButton component"

# Finally integrate sequentially:
Task T047: "Update character detail page to integrate searing"
Task T048: "Add transaction state management"
Task T049: "Add database sync"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001-T014) - ~2 hours
2. Complete Phase 2: Foundational (T015-T026) - ~4 hours
3. Complete Phase 3: User Story 1 (T027-T033) - ~3 hours
4. Complete Phase 4: User Story 2 (T034-T041) - ~3 hours
5. **STOP and VALIDATE**: Test ownership and balances on testnet
6. **MVP READY**: Users can verify ownership and see balances

**Estimated MVP Time**: ~12 hours

### Incremental Delivery (Recommended)

1. **Foundation** (Phases 1-2): Setup + Foundational → ~6 hours
2. **MVP** (Phases 3-4): User Stories 1-2 → Test independently → ~6 hours total → **Deploy MVP**
3. **Core Mechanics** (Phases 5-7): User Stories 3-5 → Test independently → ~12 hours total → **Deploy v2**
4. **Advanced Features** (Phases 8-9): User Stories 6-7 → Test independently → ~10 hours total → **Deploy v3**
5. **Production Ready** (Phase 10): Polish + Testing → ~8 hours → **Deploy v4**

**Total Estimated Time**: ~42 hours for full implementation

### Parallel Team Strategy

With 3 developers after Foundational phase completes:

1. **Week 1**: Team completes Setup + Foundational together (Phases 1-2)
2. **Week 2**:
   - Developer A: User Story 1 + User Story 2 (ownership + balances) - MVP ready
   - Developer B: User Story 3 + User Story 5 (searing + corpse burning)
   - Developer C: User Story 4 (infection spreading)
3. **Week 3**:
   - Developer A: User Story 6 (staking)
   - Developer B: User Story 7 (cure)
   - Developer C: Polish + Testing (Phase 10)

**Parallel Development Time**: ~3 weeks with 3 developers

---

## Notes

- [P] tasks = different files, no dependencies, can run in parallel
- [Story] label maps task to specific user story for traceability (US1, US2, US3, US4, US5, US6, US7)
- Each user story should be independently completable and testable
- All blockchain interactions use wagmi v2 + viem v2 patterns from research.md
- All error messages must be user-friendly per blockchain-errors.ts parser
- All transactions must update database cache after confirmation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- **Tests included in Polish phase** (pragmatic approach per constitution)
- Testnet testing required before mainnet deployment

---

## Task Summary

**Total Tasks**: 117
**Setup Tasks**: 14 (Phase 1)
**Foundational Tasks**: 12 (Phase 2)
**User Story Tasks**: 84 (Phases 3-9)
  - User Story 1 (P1): 7 tasks (T027-T033)
  - User Story 2 (P1): 8 tasks (T034-T041)
  - User Story 3 (P2): 10 tasks (T042-T051)
  - User Story 4 (P2): 12 tasks (T052-T063)
  - User Story 5 (P2): 9 tasks (T064-T072)
  - User Story 6 (P3): 15 tasks (T073-T087)
  - User Story 7 (P3): 7 tasks (T088-T094)
**Polish Tasks**: 23 (Phase 10)

**Parallel Opportunities Identified**: 45 tasks marked [P] for parallel execution

**Independent Test Criteria**:
- ✅ User Story 1: Connect wallet, verify ownership badges and edit button states
- ✅ User Story 2: Verify all token balances display correctly and update
- ✅ User Story 3: Execute full searing flow with approval and confirm status updates
- ✅ User Story 4: Execute infection spread with ETH payment and confirm both characters update
- ✅ User Story 5: Execute corpse burn and verify balance decreases
- ✅ User Story 6: Execute stake and unstake, verify location association
- ✅ User Story 7: Execute cure and verify infection status clears

**Suggested MVP Scope**: User Stories 1 + 2 (ownership verification + token balances)
**Estimated MVP Time**: ~12 hours
**Estimated Full Feature Time**: ~42 hours (or ~3 weeks with 3 developers in parallel)

---

**Status**: Tasks ready for execution via `/speckit.implement`
**Next Step**: Run `/speckit.implement` to begin task-by-task implementation
