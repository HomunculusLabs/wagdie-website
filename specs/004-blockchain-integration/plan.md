# Implementation Plan: Blockchain Integration

**Branch**: `004-blockchain-integration` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-blockchain-integration/spec.md`

## Summary

This feature implements real blockchain integration for the WAGDIE platform, replacing all mock transactions with actual smart contract interactions. Users will be able to verify NFT ownership, check token balances (Concords, Corpses, Mushrooms), execute character transformations (searing), spread infections, burn corpses, stake characters at locations, and cure infections. The implementation uses wagmi v2 and viem v2 for type-safe blockchain interactions with user-friendly error handling and transaction state management.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**:
- wagmi v2 (already installed) - React hooks for Ethereum
- viem v2 (already installed) - TypeScript Ethereum library
- RainbowKit 2.2+ (already installed) - Wallet connection UI
- Next.js 15 App Router (already installed)
- React Query v5 (via wagmi) - Async state management

**Storage**:
- Supabase PostgreSQL (existing) - Character state, transaction history
- Browser localStorage - Pending transaction hashes
- Blockchain - Source of truth for ownership, balances, game state

**Testing**:
- Playwright (to be added) - E2E transaction flows
- Vitest (to be added) - Unit tests for hooks and utilities
- Testnet deployment (Sepolia or Goerli) - Transaction testing

**Target Platform**: Web browsers with web3 wallet extensions (MetaMask, WalletConnect, Coinbase Wallet, etc.)

**Project Type**: Web application (Next.js App Router)

**Performance Goals**:
- Ownership verification: <5 seconds from wallet connection
- Token balance queries: <15 seconds latency from blockchain state
- Transaction execution: <3 minutes including approvals
- RPC caching: Reduce redundant blockchain reads by 80%

**Constraints**:
- Gas fees paid by users (no gasless transactions)
- Single network support initially (Ethereum mainnet or configured L1)
- 1 block confirmation for UI updates (trade-off between speed and finality)
- RPC rate limits: Max 3 requests/second per endpoint
- No transaction replacement/acceleration logic in v1

**Scale/Scope**:
- Support 1000+ NFT tokens per collection
- Handle 100 concurrent users executing transactions
- Track up to 50 pending transactions per user session
- Support 4 token types (WAGDIE ERC721, Concord ERC721, Corpse ERC1155, Mushroom ERC1155)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Simplicity First ✅

**Assessment**: PASS with monitoring

- ✅ Uses existing wagmi/viem stack (no new blockchain libraries)
- ✅ Direct contract calls via wagmi hooks (no custom abstraction layers)
- ✅ Managed RPC services (Alchemy/Infura) over self-hosted nodes
- ⚠️ **Monitoring needed**: Transaction state management could become complex if not carefully designed

**Justification for complexity**: Blockchain interactions inherently involve asynchronous multi-step flows (connect → approve → transact → confirm). This is domain complexity, not architectural complexity. We minimize it by using wagmi's built-in state management rather than adding custom solutions.

### Principle II: Community Accessibility ✅

**Assessment**: PASS

- ✅ wagmi/viem are industry-standard web3 tools with extensive documentation
- ✅ All contract interactions will have inline comments explaining gas, approvals, confirmations
- ✅ Error messages translated from technical blockchain errors to user-friendly language
- ✅ README will include "How Web3 Works" section for contributors unfamiliar with blockchain

**Community support plan**:
- Document every contract address and ABI source
- Create flowcharts for multi-step transactions (approve → sear, etc.)
- Include testnet testing guide for contributors without mainnet ETH

### Principle III: Clean Architecture ✅

**Assessment**: PASS

**Layer separation**:
- ✅ **UI Layer** (`app/`, `components/`): Transaction buttons, loading states, error displays
- ✅ **Service Layer** (`lib/services/wallet-service.ts`): Business logic for game actions (sear, spread, burn, stake)
- ✅ **Hooks Layer** (`hooks/`): Custom wagmi wrappers (`useCharacterOwnership`, `useTokenBalances`, `useSeareCharacter`)
- ✅ **Config Layer** (`lib/contracts/`): Contract addresses, ABIs, chain configurations

**Data flow**: UI → Custom Hooks → wagmi hooks → viem → RPC → Blockchain

No violations. UI components will never directly call contract functions.

### Principle IV: Type Safety & Contract Clarity ✅

**Assessment**: PASS

- ✅ wagmi v2 + viem v2 provide full TypeScript support for contract interactions
- ✅ Contract ABIs generate TypeScript types automatically (via wagmi CLI or manual typing)
- ✅ All transaction parameters typed (addresses as `0x${string}`, amounts as `bigint`)
- ✅ Transaction states typed (idle/loading/success/error with discriminated unions)

**Type generation plan**:
- Use wagmi CLI to generate types from contract ABIs: `wagmi generate`
- Store generated types in `lib/contracts/generated/`
- All blockchain addresses use viem's `Address` type
- BigNumber values use native `bigint` type (viem v2 standard)

### Principle V: Test-Driven for Critical Paths ✅

**Assessment**: PASS - Tests required

**Critical paths requiring tests**:
1. ✅ Ownership verification logic (must prevent unauthorized edits)
2. ✅ Token balance queries (must accurately reflect blockchain state)
3. ✅ Transaction approval flows (must handle rejection gracefully)
4. ✅ Transaction state persistence (must survive page refresh)
5. ✅ Network mismatch detection (must prevent wrong-chain transactions)

**Testing approach**:
- **Unit tests** (Vitest): Custom hooks, utility functions, error parsing
- **Integration tests** (Vitest + wagmi test utils): Mock contract interactions
- **E2E tests** (Playwright + testnet): Real transactions on Sepolia/Goerli
- **Manual QA**: Mainnet testing with small amounts before launch

### Principle VI: Documentation as Code ✅

**Assessment**: PASS

**Documentation requirements**:
- ✅ `lib/contracts/README.md`: Contract addresses, ABIs, deployment info
- ✅ `lib/services/README.md`: Explanation of searing, infection, staking mechanics
- ✅ `hooks/README.md`: How to use custom blockchain hooks
- ✅ Inline comments: Every contract call explains gas costs, failure modes
- ✅ ADR: "Why wagmi v2 over ethers.js" (justify tech choice)

### Principle VII: Web3 Pragmatism ✅

**Assessment**: PASS

- ✅ Wallet connection via RainbowKit (smooth UX, supports major wallets)
- ✅ Gas estimation displayed before transaction approval
- ✅ Loading states for every blockchain operation (pending/confirming/confirmed)
- ✅ Clear error messages ("Insufficient ETH for gas" not "Error: -32000")
- ✅ Metadata stored in Supabase (off-chain), only ownership/game state on-chain
- ✅ Read-only mode: Users can browse characters without connecting wallet

**UX enhancements**:
- Transaction history in browser storage (resume after refresh)
- Auto-retry failed RPC calls with exponential backoff
- Network switch prompts when user on wrong chain
- Testnet warning banner if detected

### Constitution Verdict: ✅ APPROVED

**Summary**: This feature aligns with all constitutional principles. The inherent complexity of blockchain interactions is unavoidable but is managed through:
1. Using standard tools (wagmi/viem) rather than custom solutions
2. Clear layer separation (UI/Hooks/Services/Contracts)
3. Comprehensive documentation and error handling
4. Pragmatic testing strategy focused on critical paths

**Re-evaluation required after Phase 1 design**: Verify that data model and contracts maintain simplicity.

## Project Structure

### Documentation (this feature)

```text
specs/004-blockchain-integration/
├── plan.md              # This file (/speckit.plan output)
├── research.md          # Phase 0: Contract ABIs, RPC endpoints, transaction patterns
├── data-model.md        # Phase 1: Transaction state schema, pending tx storage
├── quickstart.md        # Phase 1: How to test blockchain features locally
├── contracts/           # Phase 1: Contract interfaces, ABIs, addresses
│   ├── wagdie.json      # WAGDIE ERC721 ABI
│   ├── concord.json     # Tokens of Concord ERC721 ABI
│   ├── corpse.json      # Corpse ERC1155 ABI
│   ├── mushroom.json    # Mushroom ERC1155 ABI
│   ├── searing.json     # Searing contract ABI
│   ├── spread.json      # Infection spread contract ABI
│   ├── staking.json     # Character staking contract ABI
│   └── addresses.json   # Contract addresses per network
└── tasks.md             # Phase 2: Task breakdown (/speckit.tasks output - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
wagdie-simplified/
├── app/                          # Next.js App Router
│   ├── characters/
│   │   └── [tokenId]/
│   │       └── page.tsx          # [MODIFY] Add real searing, staking, cure actions
│   ├── spread/
│   │   └── page.tsx              # [MODIFY] Add real infection spread, corpse burn
│   └── api/
│       └── blockchain/           # [NEW] Blockchain proxy endpoints (if needed)
│           └── tx-status/
│               └── route.ts      # [NEW] Check transaction status
│
├── components/                   # React UI components
│   ├── blockchain/               # [NEW] Blockchain-specific components
│   │   ├── TransactionButton.tsx    # [NEW] Button with tx state management
│   │   ├── TransactionStatus.tsx    # [NEW] Pending/confirmed/failed indicator
│   │   ├── GasEstimator.tsx         # [NEW] Show estimated gas cost
│   │   ├── NetworkChecker.tsx       # [NEW] Wrong network warning
│   │   └── TokenBalance.tsx         # [NEW] Display token balance with refresh
│   ├── character/
│   │   ├── CharacterCard.tsx     # [MODIFY] Add ownership badge
│   │   └── SearDialog.tsx        # [MODIFY] Real searing transaction
│   └── spread/
│       ├── SpreadInfect.tsx      # [MODIFY] Real infection spread
│       └── BurnCorpseDialog.tsx  # [MODIFY] Real corpse burning
│
├── hooks/                        # Custom React hooks
│   ├── blockchain/               # [NEW] Blockchain interaction hooks
│   │   ├── useCharacterOwnership.ts  # [NEW] Check if user owns character
│   │   ├── useTokenBalances.ts       # [NEW] Get all token balances
│   │   ├── useSearCharacter.ts       # [NEW] Execute searing transaction
│   │   ├── useSpreadInfection.ts     # [NEW] Execute infection spread
│   │   ├── useBurnCorpse.ts          # [NEW] Execute corpse burn
│   │   ├── useStakeCharacter.ts      # [NEW] Execute staking
│   │   ├── useCureInfection.ts       # [NEW] Execute cure
│   │   ├── usePendingTransactions.ts # [NEW] Track pending tx in localStorage
│   │   └── useNetworkCheck.ts        # [NEW] Verify correct network
│   └── useCurrentUser.ts         # [EXISTING] Already exists
│
├── lib/                          # Core business logic
│   ├── contracts/                # [NEW] Contract configurations
│   │   ├── abis/                 # [NEW] Contract ABIs
│   │   │   ├── wagdie.ts         # [NEW] WAGDIE ERC721 ABI
│   │   │   ├── concord.ts        # [NEW] Concord ERC721 ABI
│   │   │   ├── corpse.ts         # [NEW] Corpse ERC1155 ABI
│   │   │   ├── mushroom.ts       # [NEW] Mushroom ERC1155 ABI
│   │   │   ├── searing.ts        # [NEW] Searing contract ABI
│   │   │   ├── spread.ts         # [NEW] Spread contract ABI
│   │   │   └── staking.ts        # [NEW] Staking contract ABI
│   │   ├── addresses.ts          # [NEW] Contract addresses per chain
│   │   ├── chains.ts             # [NEW] Supported chain configurations
│   │   └── types.ts              # [NEW] Generated types from ABIs
│   │
│   ├── services/
│   │   ├── character-service.ts  # [EXISTING] Database operations
│   │   ├── wallet-service.ts     # [MODIFY] Remove mocks, add real blockchain calls
│   │   ├── transaction-service.ts # [NEW] Transaction state management
│   │   └── blockchain-sync-service.ts # [NEW] Sync blockchain state to DB
│   │
│   ├── utils/                    # [NEW] Utility functions
│   │   ├── blockchain-errors.ts  # [NEW] Parse blockchain errors to user-friendly messages
│   │   ├── transaction-storage.ts # [NEW] LocalStorage for pending transactions
│   │   └── gas-estimation.ts     # [NEW] Gas estimation helpers
│   │
│   ├── auth/
│   │   ├── session.ts            # [EXISTING] Session management
│   │   └── siwe.ts               # [EXISTING] Sign-In with Ethereum
│   │
│   ├── supabase.ts               # [EXISTING] Supabase client
│   ├── database.types.ts         # [EXISTING] Generated DB types
│   └── wagmi.ts                  # [EXISTING] wagmi configuration
│
├── types/                        # Shared TypeScript types
│   ├── blockchain.ts             # [NEW] Transaction states, token balances
│   └── character.ts              # [EXISTING] Character types
│
├── supabase/                     # Database migrations
│   └── migrations/
│       └── [timestamp]_add_pending_transactions.sql  # [NEW] Track pending tx
│
└── tests/                        # [NEW] Test suite
    ├── unit/
    │   ├── hooks/
    │   │   └── useTokenBalances.test.ts
    │   └── utils/
    │       └── blockchain-errors.test.ts
    ├── integration/
    │   └── searing-flow.test.ts
    └── e2e/
        └── spread-infection.spec.ts
```

**Structure Decision**: This is a **web application** using Next.js App Router with clear separation of UI (app/, components/), business logic (lib/services/), blockchain interactions (hooks/blockchain/), and contract configurations (lib/contracts/). The structure follows the constitution's clean architecture requirements with unidirectional dependencies: UI → Hooks → Services → Contracts.

**Key additions**:
1. **`hooks/blockchain/`**: Custom hooks wrapping wagmi for game-specific actions
2. **`lib/contracts/`**: Centralized contract configuration (ABIs, addresses, types)
3. **`lib/utils/`**: Blockchain-specific utilities (error parsing, storage, gas)
4. **`components/blockchain/`**: Reusable transaction UI components
5. **`tests/`**: Comprehensive test suite for critical paths

**Modifications**:
1. **`lib/services/wallet-service.ts`**: Replace all mock functions with real wagmi calls
2. **`app/characters/[tokenId]/page.tsx`**: Integrate real searing/staking/cure buttons
3. **`app/spread/page.tsx`**: Integrate real infection spread and corpse burning

## Complexity Tracking

> This section is empty because there are no constitution violations requiring justification. All added complexity is inherent to blockchain interactions and is managed through standard tools (wagmi/viem) following clean architecture principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
