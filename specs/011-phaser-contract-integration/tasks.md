# Tasks: Phaser Map & Contract Integration

**Input**: Design documents from `/specs/011-phaser-contract-integration/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: Not explicitly requested in spec. Tests are omitted per template guidelines.

**Organization**: Tasks grouped by user story (P1→P6) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Contract infrastructure, ABI setup, and address constants

- [X] T001 Create contract addresses constants file at lib/contracts/addresses.ts
- [X] T002 [P] Create WAGDIE NFT ABI file at lib/contracts/abis/wagdie.ts
- [X] T003 [P] Create Tokens Of Concord ABI file at lib/contracts/abis/concord.ts
- [X] T004 [P] Create placeholder spread contract ABI at lib/contracts/abis/spread.ts
- [X] T005 Create ABI barrel export at lib/contracts/abis/index.ts
- [X] T006 Update wagmi chain configuration in lib/contracts/chains.ts for mainnet

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Create base TransactionState type definitions at types/transactions.ts
- [X] T008 [P] Create useWalletConnection hook wrapper at hooks/useWalletConnection.ts
- [X] T009 [P] Create transaction toast notification component at components/shared/TransactionToast.tsx
- [X] T010 Create TransactionProvider context at contexts/TransactionContext.tsx
- [X] T011 Integrate TransactionProvider into app layout at app/layout.tsx
- [X] T012 Remove Leaflet dependencies from package.json (leaflet, react-leaflet, @types/leaflet)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - View Interactive World Map (Priority: P1) 🎯 MVP

**Goal**: Users can view and navigate the WAGDIE world map using Phaser with markers for locations, characters, and events

**Independent Test**: Load /map page, verify zoom/pan controls work, markers display correctly, map image renders

### Leaflet Cleanup (FR-002)

- [X] T013 [US1] Delete components/map/SimpleMap.tsx and SimpleMap.tsx.backup
- [X] T014 [P] [US1] Delete components/map/LeafletMapWrapper.tsx
- [X] T015 [P] [US1] Delete components/map/IconFactory.ts and IconFactory.ts.backup
- [X] T016 [P] [US1] Delete components/map/LayerController.tsx
- [X] T017 [P] [US1] Delete components/map/LayerControls.tsx
- [X] T018 [P] [US1] Delete components/map/MarkerComponent.tsx
- [X] T019 [P] [US1] Delete components/map/PopupRenderer.tsx
- [X] T020 [P] [US1] Delete components/map/TooltipRenderer.tsx
- [X] T021 [P] [US1] Delete components/map/MapPopup.tsx and MapTooltip.tsx
- [X] T022 [P] [US1] Delete components/map/MarkerCluster.css
- [X] T023 [P] [US1] Delete components/map/markers/ directory (all marker components)
- [X] T024 [P] [US1] Delete all components/map/*.stories.tsx files
- [X] T025 [US1] Review and preserve reusable hooks from hooks/map/ (useMapData.ts, useMapLayers.ts)

### Phaser Map Enhancement

- [X] T026 [US1] Verify Phaser MapScene loads map image at game/scenes/MapScene.ts
- [X] T027 [US1] Implement zoom constraints (min/max bounds) in game/scenes/MapScene.ts
- [X] T028 [US1] Implement pan/drag controls in game/scenes/MapScene.ts
- [X] T029 [US1] Create PhaserMarker class for location markers at game/objects/PhaserMarker.ts
- [X] T030 [US1] Implement location marker rendering in MapScene using PhaserMarker
- [X] T031 [US1] Create character marker rendering with staked position data
- [X] T032 [US1] Implement marker hover tooltips in Phaser
- [X] T033 [US1] Create layer visibility controls for Phaser at components/map/PhaserLayerControls.tsx
- [X] T034 [US1] Connect React layer controls to Phaser via EventBus in game/EventBus.ts
- [X] T035 [US1] Update app/map/page.tsx to use PhaserLayerControls

**Checkpoint**: Map is fully functional with Phaser - zoom, pan, markers, layer controls work

---

## Phase 4: User Story 2 - Burn Corpses for Mushrooms (Priority: P2)

**Goal**: Users can burn corpse tokens to receive Strange Mushroom concords

**Independent Test**: Connect wallet with corpse tokens, burn them, verify mushroom balance updates

### Read Hooks (Token Balances)

- [X] T036 [P] [US2] Create useTokenBalances hook at hooks/contracts/useTokenBalances.ts
- [X] T037 [P] [US2] Create useCorpseBalance hook at hooks/contracts/useCorpseBalance.ts

### Write Hooks (Burn)

- [X] T038 [US2] Create useBurnCorpses hook at hooks/contracts/useBurnCorpses.ts
- [X] T039 [US2] Update CorpseBurningModal with real contract integration at components/modals/CorpseBurningModal.tsx
- [X] T040 [US2] Add balance validation before burn transaction
- [X] T041 [US2] Add transaction status display (pending/confirmed/failed) to modal
- [X] T042 [US2] Implement toast notification on burn success/failure

**Checkpoint**: Corpse burning works with real blockchain transactions

---

## Phase 5: User Story 3 - Spread Infections Randomly (Priority: P2)

**Goal**: Users can spend mushroom tokens to spread infections to random characters

**Independent Test**: Connect wallet with mushrooms, spread infection, verify characters infected

- [X] T043 [P] [US3] Create useMushroomBalance hook at hooks/contracts/useMushroomBalance.ts
- [X] T044 [US3] Create useSpreadInfections hook at hooks/contracts/useSpreadInfections.ts
- [X] T045 [US3] Create SpreadInfectionModal component at components/modals/SpreadInfectionModal.tsx
- [X] T046 [US3] Integrate spread hook with spread page at app/spread/page.tsx
- [X] T047 [US3] Add mushroom balance validation before spread
- [X] T048 [US3] Add transaction status and infected characters result display

**Checkpoint**: Random infection spreading works with blockchain

---

## Phase 6: User Story 4 - Infect Specific Character (Priority: P3)

**Goal**: Users can target and infect a specific character by paying ETH + mushroom

**Independent Test**: Select target character, pay ETH, verify specific character infected

- [X] T049 [P] [US4] Create useInfectionPrice hook at hooks/contracts/useInfectionPrice.ts
- [X] T050 [US4] Create useInfectCharacter hook at hooks/contracts/useInfectCharacter.ts
- [X] T051 [US4] Update InfectionModal with target selection at components/modals/InfectionModal.tsx
- [X] T052 [US4] Display required ETH amount in modal
- [X] T053 [US4] Add ETH + mushroom balance validation
- [X] T054 [US4] Add payable transaction support with value parameter

**Checkpoint**: Targeted infection works with ETH payment

---

## Phase 7: User Story 5 - Cure Infected Character (Priority: P3)

**Goal**: Owners of infected characters can cure them

**Independent Test**: Own an infected character, cure it, verify infection status clears

- [X] T055 [P] [US5] Create useCharacterOwnership hook at hooks/contracts/useCharacterOwnership.ts
- [X] T056 [P] [US5] Create useIsInfected hook at hooks/contracts/useIsInfected.ts
- [X] T057 [US5] Create useCureCharacter hook at hooks/contracts/useCureCharacter.ts
- [X] T058 [US5] Update CureModal with ownership validation at components/modals/CureModal.tsx
- [X] T059 [US5] Add infection status check before cure action
- [X] T060 [US5] Display cure result and updated character status

**Checkpoint**: Character curing works for owners

---

## Phase 8: User Story 6 - Sear Concords (Priority: P4)

**Goal**: Users can sear (burn) concords attached to their characters for permanent effects

**Independent Test**: Have character with concord, sear it, verify concord burned and effects applied

- [X] T061 [P] [US6] Create useConcordBalance hook at hooks/contracts/useConcordBalance.ts
- [X] T062 [US6] Create useSearConcord hook at hooks/contracts/useSearConcord.ts
- [X] T063 [US6] Update SearingModal with concord selection at components/modals/SearingModal.tsx
- [X] T064 [US6] Add permanent action warning confirmation dialog
- [X] T065 [US6] Add ownership and concord attachment validation
- [X] T066 [US6] Display sear result with applied effects

**Checkpoint**: Concord searing works with permanent effects

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, performance, documentation

- [ ] T067 [P] Create contract hooks barrel export at hooks/contracts/index.ts
- [ ] T068 [P] Add error boundary for contract failures at components/shared/ContractErrorBoundary.tsx
- [ ] T069 [P] Implement retry logic for failed transactions in TransactionContext
- [ ] T070 Add loading states for all contract read operations
- [ ] T071 Implement balance auto-refresh after transactions
- [ ] T072 Add performance monitoring for map interactions
- [ ] T073 Update quickstart.md with final implementation details
- [ ] T074 Run npm run build to verify no TypeScript errors
- [ ] T075 Run npm test to ensure existing tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T006) - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

| Story | Priority | Depends On | Can Start After |
|-------|----------|------------|-----------------|
| US1 (Map) | P1 | Foundational only | T012 complete |
| US2 (Burn) | P2 | Foundational only | T012 complete |
| US3 (Spread) | P2 | Foundational only | T012 complete |
| US4 (Infect) | P3 | Foundational only | T012 complete |
| US5 (Cure) | P3 | Foundational only | T012 complete |
| US6 (Sear) | P4 | Foundational only | T012 complete |

**Note**: All user stories are independently implementable after foundational phase.

### Parallel Opportunities

**Phase 1 Parallel Group** (T002-T004):
```
Task: Create WAGDIE NFT ABI file at lib/contracts/abis/wagdie.ts
Task: Create Tokens Of Concord ABI file at lib/contracts/abis/concord.ts
Task: Create placeholder spread contract ABI at lib/contracts/abis/spread.ts
```

**Phase 2 Parallel Group** (T008-T009):
```
Task: Create useWalletConnection hook wrapper at hooks/useWalletConnection.ts
Task: Create transaction toast component at components/shared/TransactionToast.tsx
```

**US1 Leaflet Cleanup Parallel Group** (T014-T024):
```
Task: Delete LeafletMapWrapper.tsx
Task: Delete IconFactory.ts
Task: Delete LayerController.tsx
Task: Delete LayerControls.tsx
Task: Delete MarkerComponent.tsx
... (all can run in parallel)
```

**US2-US3 Read Hooks Parallel** (T036-T037, T043):
```
Task: Create useTokenBalances hook
Task: Create useCorpseBalance hook
Task: Create useMushroomBalance hook
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T012)
3. Complete Phase 3: User Story 1 - Map (T013-T035)
4. **STOP and VALIDATE**: Test Phaser map independently
5. Deploy/demo MVP - interactive map works!

### Incremental Delivery

1. **Foundation** (T001-T012) → Setup complete
2. **+US1 Map** (T013-T035) → Phaser map working, Leaflet removed → **MVP Deploy**
3. **+US2 Burn** (T036-T042) → Corpse burning works → Deploy
4. **+US3 Spread** (T043-T048) → Infection spreading works → Deploy
5. **+US4 Infect** (T049-T054) → Targeted infection works → Deploy
6. **+US5 Cure** (T055-T060) → Curing works → Deploy
7. **+US6 Sear** (T061-T066) → Searing works → Deploy
8. **+Polish** (T067-T075) → Production ready

### Parallel Team Strategy

With 3 developers after Foundational phase:
- **Dev A**: User Story 1 (Map) - Critical path, must complete first for full app testing
- **Dev B**: User Story 2 (Burn) + User Story 3 (Spread) - Core game loop
- **Dev C**: User Story 4-6 (Infect, Cure, Sear) - Advanced mechanics

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Research.md notes spread/cure/infect contracts may be off-chain - implement with placeholder hooks that can be updated when contract addresses are confirmed
