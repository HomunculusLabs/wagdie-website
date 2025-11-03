# Implementation Plan: Interactive Map Integration

**Branch**: `006-map-integration` | **Date**: 2025-11-03 | **Spec**: [link to spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-map-integration/spec.md`

## Summary

Integrate interactive map feature into wagdie-simplified app, enabling users to:
1. Access the WAGDIE world map via iframe embedding
2. View character locations for authenticated wallet users
3. Stake/move characters to locations via WagdieWorld smart contract

Technical approach: Next.js App Router page with wagdie.world iframe, wagmi v2 integration for blockchain interactions, Supabase for character data, clean architecture separation of UI/Service/Data layers.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), React 18, wagmi v2, viem v2, Tailwind CSS 3.4, Supabase PostgreSQL, RainbowKit 2.2+
**Storage**: Supabase PostgreSQL (characters, locations data), Browser localStorage (wallet persistence)
**Testing**: Jest, React Testing Library (existing test suite)
**Target Platform**: Web browser (desktop + mobile responsive)
**Project Type**: Single web application (Next.js monorepo)
**Performance Goals**: Map loads <3s, handles 100+ characters, 90% transaction success rate
**Constraints**: Clean Architecture (UI/Service/Data layers), Community accessibility, Type Safety & Contract Clarity
**Scale/Scope**: Community Web3 platform supporting ~1,000 concurrent users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Gate Evaluation

**I. Simplicity First** ✅ PASS
- iframe embedding is minimal implementation
- No Docker, GraphQL, or complex infrastructure
- Uses existing wagdie.world service
- Direct Supabase queries (no ORM)

**II. Community Accessibility** ✅ PASS
- Standard Next.js App Router patterns
- Clear component separation (UI/Service/Data)
- Well-commented code and README files required
- No specialized expertise needed beyond React/TypeScript

**III. Clean Architecture** ⚠️ REQUIRES VIGILANCE
- Must maintain UI/Service/Data layer separation
- UI components (`app/map/page.tsx`) cannot directly access blockchain
- Services (`lib/services/map/`) handle business logic
- Data layer (`lib/supabase.ts`, types) for database access
- **Gate**: Architecture review in PR to ensure no layer violations

**IV. Type Safety & Contract Clarity** ✅ PASS
- All interfaces explicitly typed
- Contract ABIs with TypeScript types
- No `any` types without justification
- Component props with TypeScript interfaces

**V. Test-Driven for Critical Paths** ✅ PASS
- Tests required for:
  - Wallet connection → location display flow
  - Character location fetching
  - Transaction status handling
- Integration tests for user journeys
- Optional for simple UI components

**VI. Documentation as Code** ✅ PASS
- README in `app/map/` explaining feature
- Inline comments for blockchain interactions
- Architecture Decision Record (ADR) for map integration
- Function-level comments for non-obvious logic

**VII. Web3 Pragmatism** ✅ PASS
- Clear wallet connection UX with RainbowKit
- Loading states and error handling for all blockchain calls
- Read-only mode (view map without wallet)
- Gas-free metadata viewing (only stake/unstake on-chain)

**OVERALL**: ✅ PASS - Feature aligns with constitution with proper architecture vigilance

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
wagdie-simplified/
├── app/
│   ├── map/                    # Map feature pages
│   │   ├── page.tsx           # Interactive map page
│   │   ├── loading.tsx        # Map loading state
│   │   └── README.md          # Map feature documentation
│   └── api/                    # API routes (if needed for backend)
│
├── components/
│   ├── map/                    # Map-specific UI components
│   │   ├── MapEmbed.tsx       # iframe wrapper component
│   │   ├── CharacterList.tsx  # Character location display
│   │   ├── LocationSelector.tsx # Location selection dialog
│   │   └── TransactionStatus.tsx # Blockchain transaction status
│   ├── characters/            # Character-related components (existing)
│   └── layout/                # Navigation/header components (existing)
│
├── lib/
│   ├── services/
│   │   └── map/               # Map business logic services
│   │       ├── characterLocationService.ts
│   │       ├── locationService.ts
│   │       └── wagdieWorldContract.ts
│   ├── supabase.ts            # Database client (existing)
│   ├── wagmi.ts               # Blockchain client (existing)
│   └── types/
│       ├── map.ts             # Map-specific TypeScript types
│       └── wagdie-world.ts    # Contract types
│
├── hooks/
│   └── map/                   # Map feature hooks
│       ├── useCharacterLocation.ts
│       ├── useLocations.ts
│       └── useLocationStaking.ts
│
└── tests/
    ├── map/                    # Map feature tests
    │   ├── integration/
    │   │   ├── map-page.test.tsx
    │   │   └── character-location.test.tsx
    │   └── e2e/
    │       └── map-user-flow.spec.ts
    └── setup.ts                # Test setup (existing)
```

**Structure Decision**: Next.js App Router with clean architecture separation. UI components isolated in `components/map/`, business logic in `lib/services/map/`, custom hooks in `hooks/map/`, following existing wagdie-simplified patterns. All components follow TypeScript strict mode with explicit interfaces.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No complexity violations identified. Clean architecture maintained throughout.

---

## Phase 0: Research & Unknowns Resolution

**Status**: ✅ COMPLETE

### Unknowns Identified

1. **WagdieWorld Contract Details**
   - Contract ABI (Application Binary Interface)
   - Contract address on Ethereum mainnet
   - Available functions for location staking/movement

2. **Map Locations Data Structure**
   - List of available locations in the WAGDIE world
   - Location metadata (name, coordinates, properties)
   - How locations are stored/retrieved

3. **wagdie.world Integration Approach**
   - Best practices for iframe embedding
   - iframe URL parameters or API
   - PostMessage communication (if needed)

4. **Character Location Metadata**
   - Data structure for character location assignments
   - Sync strategy between blockchain and Supabase
   - Caching strategy for performance

### Research Tasks

**Task 1**: Extract WagdieWorld contract details from `~/projects/web`
- Review contract ABIs in `/typechain-types/`
- Extract staking location functions
- Document contract address and network

**Task 2**: Analyze location data in original web app
- Review `use-locations` hook implementation
- Extract location type definitions
- Understand Firestore/Supabase data structure

**Task 3**: Research wagdie.world iframe integration
- Test iframe embedding approach
- Identify any required parameters
- Document integration method

**Task 4**: Design character location sync strategy
- Define data flow: blockchain → Supabase → UI
- Identify real-time sync requirements
- Plan caching layer

### Research Findings

**Finding 1: WagdieWorld Contract Integration**
- Contract ABIs available in `~/projects/web/src/typechain-types/`
- Key functions: `stakeWagdies()`, `changeWagdieLocations()`, `unstakeWagdies()`
- Use wagmi v2 with viem for type-safe contract calls
- Contract address available in environment configuration

**Finding 2: Location Data Structure**
- Locations stored in Firestore/Supabase with structure:
  ```typescript
  {
    id: string,
    name: string,
    description?: string,
    metadata?: object
  }
  ```
- `useLocations` hook fetches available locations
- Character location linked via `CharacterLocation` entity

**Finding 3: wagdie.world Integration**
- Simple iframe embedding: `<iframe src="https://wagdie.world" />`
- No special parameters or PostMessage required for basic display
- Map shows character positions automatically
- Location selection happens via blockchain transaction

**Finding 4: Character Location Sync**
- Store canonical location data in Supabase for fast queries
- On-chain data is source of truth for ownership
- Sync strategy: Poll blockchain periodically + manual refresh button
- Cache location data in browser for 30 seconds

---

## Phase 1: Design & Contracts

**Status**: ✅ COMPLETE

### Deliverables Generated

- [x] `data-model.md` - Entity relationships and data structure
- [x] `quickstart.md` - Setup and development guide
- [x] `contracts/location-api.md` - REST API contracts
- [x] `contracts/wagdie-world-contract.md` - Smart contract interface
- [x] Agent context updated in CLAUDE.md

### Design Decisions

**Decision 1: iframe Embedding Approach**
- **Choice**: Simple iframe without PostMessage
- **Rationale**: Wagdie.world handles all map interactivity
- **Alternative**: Custom integration - rejected (unnecessary complexity)
- **Status**: ✅ Finalized

**Decision 2: Location Data Storage**
- **Choice**: Supabase as cache, blockchain as source of truth
- **Rationale**: Fast queries + decentralization
- **Alternative**: Only blockchain - rejected (poor UX, slow)
- **Alternative**: Only Supabase - rejected (centralization)
- **Status**: ✅ Finalized

**Decision 3: Service Layer Pattern**
- **Choice**: Service functions in `lib/services/map/`
- **Rationale**: Encapsulates blockchain/database logic
- **Alternative**: Direct hooks - rejected (duplicates logic)
- **Status**: ✅ Finalized

**Decision 4: Transaction UX**
- **Choice**: Inline status with "Traveling..." indicator
- **Rationale**: Clear feedback, follows web app pattern
- **Alternative**: Modal - rejected (interrupts map viewing)
- **Status**: ✅ Finalized

### Constitution Check (Re-evaluation)

**Post-Design Gate Check**:

✅ All design decisions align with Simplicity First (iframe, direct Supabase queries)
✅ Architecture supports Community Accessibility (clear separation, standard patterns)
✅ Clean Architecture maintained (UI/Service/Data layers defined)
✅ Type Safety enforced (TypeScript throughout, explicit interfaces)
✅ Test coverage planned (integration + e2e tests specified)
✅ Documentation requirements defined (README, inline comments, ADR)
✅ Web3 Pragmatism achieved (smooth UX, loading states, read-only mode)

**OVERALL**: ✅ PASS - Design validated, ready for implementation

---

## Summary

**Phase 0**: ✅ Research completed - All unknowns resolved
**Phase 1**: ✅ Design completed - Contracts and data models defined

**Next**: Phase 2 - `/speckit.tasks` for implementation planning
