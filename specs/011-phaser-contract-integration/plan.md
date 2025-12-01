# Implementation Plan: Phaser Map & Contract Integration

**Branch**: `011-phaser-contract-integration` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-phaser-contract-integration/spec.md`

## Summary

This feature consolidates the WAGDIE map to use Phaser as the single canonical implementation (removing Leaflet) and integrates real blockchain contract interactions to replace placeholder hooks. The implementation enables users to view an interactive world map and perform five contract operations: burn corpses, spread infections, infect specific characters, cure infected characters, and sear concords.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15, React 18, Phaser 3.90, wagmi 2.0, viem 2.0, RainbowKit 2.2
**Storage**: Supabase PostgreSQL (existing), Ethereum mainnet (blockchain state)
**Testing**: Jest 29, React Testing Library, MSW for mocking
**Target Platform**: Web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Map loads <3s, 60fps interactions, transaction feedback <2s post-confirmation
**Constraints**: Ethereum mainnet gas costs, wallet connection required for transactions
**Scale/Scope**: 6666 WAGDIE characters, 50+ concurrent map markers, 5 contract operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution is a template without specific constraints defined. Standard best practices apply:

| Gate | Status | Notes |
|------|--------|-------|
| Test coverage | PASS | Jest + RTL already configured |
| Type safety | PASS | TypeScript strict mode enabled |
| Code organization | PASS | Clean architecture in place |
| Documentation | PASS | Spec, plan, and contracts will be generated |

## Project Structure

### Documentation (this feature)

```text
specs/011-phaser-contract-integration/
├── plan.md              # This file
├── research.md          # Phase 0: Contract research, ABI analysis
├── data-model.md        # Phase 1: Entity relationships
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/           # Phase 1: TypeScript contract interfaces
└── tasks.md             # Phase 2: Implementation tasks (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Next.js Web Application Structure (existing)
app/
├── map/
│   └── page.tsx                    # Map page (Phaser integration)
├── spread/
│   └── page.tsx                    # Spread mechanics page
└── characters/
    └── [tokenId]/
        └── page.tsx                # Character detail with cure/sear actions

components/
├── map/                            # TO BE REMOVED: Leaflet components
│   ├── SimpleMap.tsx               # DELETE
│   ├── LeafletMapWrapper.tsx       # DELETE
│   ├── IconFactory.ts              # DELETE (Phaser handles icons)
│   └── markers/                    # DELETE
└── modals/
    ├── CorpseBurningModal.tsx      # Update with real contract
    ├── CureModal.tsx               # Update with real contract
    ├── InfectionModal.tsx          # Update with real contract
    └── SearingModal.tsx            # Update with real contract

game/
├── EventBus.ts                     # React-Phaser communication
├── PhaserGame.tsx                  # Phaser React wrapper
├── main.ts                         # Phaser entry point
└── scenes/
    └── MapScene.ts                 # Main map scene (keep/enhance)

hooks/
├── useContractWrite.ts             # REPLACE: Real wagmi implementation
├── useBurnCorpses.ts               # NEW: Burn corpse hook
├── useSpreadInfections.ts          # NEW: Spread infections hook
├── useInfectCharacter.ts           # NEW: Targeted infection hook
├── useCureCharacter.ts             # NEW: Cure character hook
├── useSearConcord.ts               # NEW: Sear concord hook
└── useTokenBalances.ts             # NEW: Read balances hook

lib/
├── contracts/
│   ├── addresses.ts                # NEW: Hardcoded mainnet addresses
│   ├── abis/                       # NEW: Contract ABIs
│   │   ├── wagdie.ts               # Main NFT contract ABI
│   │   ├── corpse.ts               # ERC-1155 corpse ABI
│   │   ├── shroom.ts               # Mushroom/concord ABI
│   │   └── spread.ts               # Infection spread ABI
│   └── chains.ts                   # Existing chain config
└── services/
    └── wallet-service.ts           # Update with real implementations

tests/
├── hooks/
│   └── contracts/                  # NEW: Contract hook tests
├── integration/
│   └── map-contract-flow.test.tsx  # NEW: End-to-end flow tests
└── map/
    └── components/                 # Existing map tests (update)
```

**Structure Decision**: Existing Next.js App Router structure. New contract hooks will be added to `hooks/`, ABIs to `lib/contracts/abis/`, and Leaflet components under `components/map/` will be deleted.

## Complexity Tracking

No constitution violations requiring justification. The implementation follows existing patterns.

## Files to Delete (Leaflet Cleanup)

The following files will be completely removed as part of FR-002:

```text
components/map/
├── SimpleMap.tsx
├── SimpleMap.tsx.backup
├── LeafletMapWrapper.tsx
├── IconFactory.ts
├── IconFactory.ts.backup
├── LayerController.tsx
├── LayerControls.tsx
├── MarkerComponent.tsx
├── PopupRenderer.tsx
├── TooltipRenderer.tsx
├── MapPopup.tsx
├── MapTooltip.tsx
├── MarkerCluster.css
├── markers/
│   ├── LocationMarker.tsx
│   ├── CharacterMarker.tsx
│   ├── BurnMarker.tsx
│   ├── DeathMarker.tsx
│   └── FightMarker.tsx
└── All associated .stories.tsx files

hooks/map/
├── useMapData.ts                   # Review: may be reusable for Phaser
├── useMapLayers.ts                 # Review: may be reusable for Phaser
└── useEventMarkers.ts              # Review: may be reusable for Phaser

Dependencies to remove from package.json:
- leaflet
- react-leaflet
- react-leaflet-markercluster
- @types/leaflet
- @types/leaflet.markercluster
```

## Implementation Phases

### Phase 0: Research (research.md)
- Research WAGDIE contract addresses on Etherscan
- Extract and document contract ABIs
- Identify function signatures for all 5 operations
- Document gas estimation patterns

### Phase 1: Design (data-model.md, contracts/)
- Define TypeScript interfaces for contract interactions
- Document entity relationships
- Create hook contracts/interfaces
- Generate quickstart guide

### Phase 2: Tasks (via /speckit.tasks)
- Task breakdown for implementation
- Dependency ordering
- Acceptance criteria per task
