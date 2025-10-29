# Data Model: Blockchain Integration

**Feature**: 004-blockchain-integration
**Date**: 2025-10-28
**Status**: Complete

## Overview

This document defines the data structures and state management patterns for blockchain integration in the WAGDIE platform. The model separates on-chain data (source of truth from blockchain) from off-chain data (cached in Supabase for performance).

---

## 1. On-Chain Data (Blockchain Source of Truth)

### 1.1 Character Ownership

**Source**: WAGDIE ERC721 Contract (`ownerOf` function)

```typescript
// Type definition
interface CharacterOwnership {
  tokenId: bigint
  owner: `0x${string}` // Ethereum address
  isOwnedByCurrentUser: boolean
}

// Read pattern
const { data: owner } = useReadContract({
  address: WAGDIE_CONTRACT_ADDRESS,
  abi: wagdieABI,
  functionName: 'ownerOf',
  args: [tokenId],
})
```

**Validation Rules**:
- Token ID must exist (non-zero address returned)
- Address comparison is case-insensitive (normalize with `toLowerCase()`)
- Ownership check required before any edit or transaction

### 1.2 Token Balances

**Sources**:
- Tokens of Concord (ERC1155): `balanceOf(address, tokenId)`
- Corpse Token (ERC1155): `balanceOf(address, tokenId)`
- Mushroom Token (ERC1155): `balanceOf(address, tokenId)`

```typescript
// Type definition
interface TokenBalances {
  concords: bigint // Number of Concord tokens owned
  corpses: bigint // Number of Corpse tokens owned
  mushrooms: bigint // Number of Mushroom tokens owned
  lastUpdated: Date // Client-side timestamp
}

// Read pattern (multi-call for efficiency)
const { data } = useReadContracts({
  contracts: [
    {
      address: CONCORD_CONTRACT_ADDRESS,
      abi: erc1155ABI,
      functionName: 'balanceOf',
      args: [userAddress, CONCORD_TOKEN_ID],
    },
    {
      address: CORPSE_CONTRACT_ADDRESS,
      abi: erc1155ABI,
      functionName: 'balanceOf',
      args: [userAddress, CORPSE_TOKEN_ID],
    },
    {
      address: MUSHROOM_CONTRACT_ADDRESS,
      abi: erc1155ABI,
      functionName: 'balanceOf',
      args: [userAddress, MUSHROOM_TOKEN_ID],
    },
  ],
})
```

**Validation Rules**:
- Balance is always `>= 0` (uint256)
- Refetch on transaction confirmation
- Cache for 30 seconds to reduce RPC calls

### 1.3 Character State (On-Chain)

**Source**: Various contracts store character state

```typescript
// Type definition
interface CharacterOnChainState {
  tokenId: bigint
  isSeared: boolean // From SearWagdie contract
  isInfected: boolean // From Spread contract or events
  isStaked: boolean // From WagdieWorld contract
  stakedLocationId?: bigint // If staked, which location
  isBurned: boolean // If permanently burned
}

// Read pattern
const { data: isSeared } = useReadContract({
  address: SEARING_CONTRACT_ADDRESS,
  abi: searWagdieABI,
  functionName: 'isWagdieSeared',
  args: [tokenId],
})

const { data: locationInfo } = useReadContract({
  address: WAGDIE_WORLD_ADDRESS,
  abi: wagdieWorldABI,
  functionName: 'wagdieIdToStakedLocation',
  args: [tokenId],
})
```

**State Transitions**:
- `isSeared`: false → true (permanent, cannot reverse without new contract)
- `isInfected`: false ↔ true (can be cured)
- `isStaked`: false ↔ true (can stake and unstake)
- `isBurned`: false → true (permanent, NFT destroyed)

---

## 2. Off-Chain Data (Supabase Cache)

### 2.1 Pending Transactions Table

**Purpose**: Track pending transactions for admin monitoring and user recovery

```sql
CREATE TABLE pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sear', 'spread', 'burn', 'stake', 'unstake', 'cure')),
  token_id INTEGER,
  target_token_id INTEGER, -- For spread action
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'failed')),
  error_message TEXT,
  gas_used NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_pending_tx_wallet ON pending_transactions(wallet_address);
CREATE INDEX idx_pending_tx_status ON pending_transactions(status);
CREATE INDEX idx_pending_tx_created ON pending_transactions(created_at DESC);
```

**TypeScript Interface**:
```typescript
interface PendingTransaction {
  id: string
  txHash: `0x${string}`
  walletAddress: `0x${string}`
  action: 'sear' | 'spread' | 'burn' | 'stake' | 'unstake' | 'cure'
  tokenId?: number
  targetTokenId?: number // For spread
  status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  errorMessage?: string
  gasUsed?: string
  createdAt: Date
  updatedAt: Date
  confirmedAt?: Date
}
```

**Lifecycle**:
1. **Create**: When user initiates transaction
2. **Update to 'confirming'**: When tx hash received from wallet
3. **Update to 'confirmed'**: When tx mined and confirmed
4. **Update to 'failed'**: When tx reverts or fails
5. **Delete**: After 7 days (automated cleanup)

### 2.2 Character State Cache (Extend Existing Table)

**Purpose**: Cache blockchain state in database to reduce RPC calls

```sql
-- Add columns to existing `characters` table
ALTER TABLE characters
ADD COLUMN is_seared BOOLEAN DEFAULT FALSE,
ADD COLUMN is_infected BOOLEAN DEFAULT FALSE,
ADD COLUMN is_staked BOOLEAN DEFAULT FALSE,
ADD COLUMN staked_location_id INTEGER,
ADD COLUMN blockchain_state_updated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_characters_seared ON characters(is_seared) WHERE is_seared = TRUE;
CREATE INDEX idx_characters_infected ON characters(is_infected) WHERE is_infected = TRUE;
CREATE INDEX idx_characters_staked ON characters(is_staked) WHERE is_staked = TRUE;
```

**TypeScript Interface** (extends existing `Character` type):
```typescript
interface Character {
  // ... existing fields (id, name, strength, etc.)

  // Blockchain state (cached from contracts)
  isSeared: boolean
  isInfected: boolean
  isStaked: boolean
  stakedLocationId?: number
  blockchainStateUpdatedAt?: Date
}
```

**Sync Strategy**:
- **On transaction confirmation**: Update immediately after tx confirms
- **On page load**: Verify against blockchain if cache > 5 minutes old
- **Periodic sync**: Background job syncs all characters daily (future enhancement)

---

## 3. Client-Side State (React/Browser)

### 3.1 Transaction State (localStorage via Zustand)

**Purpose**: Track pending transactions across page refreshes

```typescript
// Browser localStorage schema
interface PendingTxLocalStorage {
  transactions: Array<{
    hash: `0x${string}`
    action: 'sear' | 'spread' | 'burn' | 'stake' | 'unstake' | 'cure'
    tokenId?: number
    targetTokenId?: number
    timestamp: number // Unix timestamp
    status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  }>
}

// Zustand store
interface PendingTxStore {
  transactions: PendingTxLocalStorage['transactions']
  addTx: (tx: Omit<PendingTxLocalStorage['transactions'][0], 'timestamp' | 'status'>) => void
  updateTxStatus: (hash: string, status: 'confirming' | 'confirmed' | 'failed') => void
  removeTx: (hash: string) => void
  clearOldTxs: () => void // Remove txs older than 24 hours
}
```

**Persistence**:
- Stored in `localStorage` key: `wagdie-pending-txs`
- Automatically synced via Zustand `persist` middleware
- Cleared after 24 hours or on manual removal

### 3.2 Wallet Connection State (wagmi)

**Purpose**: Track connected wallet and network

```typescript
// Provided by wagmi
interface WalletState {
  address?: `0x${string}`
  isConnected: boolean
  isConnecting: boolean
  isDisconnected: boolean
  chainId: number
  connector?: Connector
}

// Custom hook wrapper
interface WalletContext {
  wallet: WalletState
  isCorrectNetwork: boolean
  isWrongNetwork: boolean
  switchToMainnet: () => void
}
```

### 3.3 Transaction UI State

**Purpose**: UI-specific transaction state for forms and modals

```typescript
interface TransactionUIState {
  // Searing
  searing: {
    isDialogOpen: boolean
    selectedConcordId?: bigint
    isApproving: boolean
    isSearing: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }

  // Infection Spreading
  spreading: {
    isDialogOpen: boolean
    sourceTokenId?: number
    targetTokenId?: number
    mushroomQuantity: number
    isApproving: boolean
    isSpreading: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }

  // Corpse Burning
  burning: {
    isDialogOpen: boolean
    corpseQuantity: number
    isApproving: boolean
    isBurning: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }

  // Staking
  staking: {
    isDialogOpen: boolean
    selectedLocationId?: bigint
    isApproving: boolean
    isStaking: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }

  // Unstaking
  unstaking: {
    isUnstaking: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }

  // Curing
  curing: {
    isCuring: boolean
    txHash?: `0x${string}`
    error?: ParsedError
  }
}
```

---

## 4. Type Definitions

### 4.1 Blockchain Types

```typescript
// types/blockchain.ts

export type Address = `0x${string}`
export type TransactionHash = `0x${string}`

export type TransactionAction = 'sear' | 'spread' | 'burn' | 'stake' | 'unstake' | 'cure'

export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed'

export interface TokenBalance {
  tokenId: bigint
  balance: bigint
  formattedBalance: string // Human-readable (e.g., "5")
}

export interface CharacterOwnership {
  tokenId: bigint
  owner: Address
  isOwnedByCurrentUser: boolean
}

export interface TransactionReceipt {
  hash: TransactionHash
  status: 'success' | 'reverted'
  blockNumber: bigint
  gasUsed: bigint
  effectiveGasPrice: bigint
  totalCost: bigint // gasUsed * effectiveGasPrice
}

export interface GasEstimate {
  gasLimit: bigint
  gasPrice: bigint
  totalCostWei: bigint
  totalCostEth: string
  totalCostUsd: string
}

export interface ParsedError {
  type:
    | 'USER_REJECTED'
    | 'INSUFFICIENT_FUNDS'
    | 'INSUFFICIENT_ALLOWANCE'
    | 'NETWORK_MISMATCH'
    | 'CONTRACT_PAUSED'
    | 'INVALID_PARAMETERS'
    | 'RATE_LIMITED'
    | 'UNKNOWN'
  message: string
  suggestion?: string
  technicalDetails?: string
}
```

### 4.2 Contract Parameter Types

```typescript
// types/contracts.ts

export interface SearConcordsParams {
  wagdieId: bigint
  concordId: bigint
}

export interface StakeWagdiesParams {
  wagdieId: bigint
  locationId: bigint
}

export interface UnstakeWagdiesParams {
  wagdieId: bigint
}

export interface SpreadInfectionParams {
  targetTokenId: bigint
  mushroomQuantity: bigint
  ethPayment: bigint
}

export interface BurnCorpseParams {
  corpseQuantity: bigint
}

export interface CureInfectionParams {
  tokenId: bigint
}
```

---

## 5. Data Flow Diagrams

### 5.1 Ownership Verification Flow

```
User connects wallet
     ↓
wagmi provides address
     ↓
useCharacterOwnership hook
     ↓
useReadContract(wagdieContract.ownerOf)
     ↓
Compare owner address with user address
     ↓
Return boolean: isOwner
     ↓
UI enables/disables edit button
```

### 5.2 Transaction Execution Flow

```
User initiates action (e.g., sear character)
     ↓
Check preconditions:
  - Is user owner?
  - Has sufficient tokens?
  - Is on correct network?
     ↓
[If needs approval]
  - Execute approval tx
  - Wait for confirmation
  - Update UI state
     ↓
Execute main transaction
  - useWriteContract
  - Get tx hash
  - Add to pending tx store
  - Add to Supabase
     ↓
Wait for confirmation
  - useWaitForTransactionReceipt
  - Monitor tx status
     ↓
On confirmation:
  - Update Supabase status
  - Update character state cache
  - Remove from pending tx store
  - Refetch blockchain data
  - Show success message
     ↓
On failure:
  - Parse error
  - Update Supabase with error
  - Show user-friendly error
  - Allow retry
```

### 5.3 State Sync Flow

```
Transaction confirms
     ↓
Update Supabase cache
  - characters.is_seared = true
  - characters.blockchain_state_updated_at = NOW()
     ↓
Invalidate React Query cache
  - queryClient.invalidateQueries(['character', tokenId])
     ↓
Refetch character data
  - UI re-renders with updated state
     ↓
Background verification (optional)
  - Verify cache matches blockchain
  - Log discrepancies
```

---

## 6. Validation Rules

### 6.1 Pre-Transaction Validation

| Action | Validation Rules |
|--------|------------------|
| **Sear** | • User owns character<br>• Character not already seared<br>• User has ≥1 Concord token<br>• Searing is enabled in contract<br>• User on correct network |
| **Spread Infection** | • User owns source character<br>• Source character is infected<br>• User has ≥1 Mushroom token<br>• User has sufficient ETH for payment + gas<br>• Target character exists and is not infected<br>• Spread contract not paused |
| **Burn Corpse** | • User has ≥ requested corpse quantity<br>• Quantity > 0<br>• User has sufficient ETH for gas<br>• Burn contract not paused |
| **Stake** | • User owns character<br>• Character not already staked<br>• Location exists and is active<br>• Staking is enabled<br>• User has sufficient ETH for gas |
| **Unstake** | • User owns character<br>• Character is currently staked<br>• User has sufficient ETH for gas |
| **Cure** | • User owns character<br>• Character is infected<br>• User has sufficient resources (TBD)<br>• User has sufficient ETH for gas |

### 6.2 Post-Transaction Validation

After transaction confirms, verify:
1. **On-chain state matches expected**: Query blockchain to confirm state change
2. **Database cache updated**: Supabase reflects new state
3. **UI reflects change**: React Query cache invalidated and refetched
4. **No orphaned pending txs**: Transaction removed from pending stores

---

## 7. Caching Strategy

### 7.1 React Query Cache Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Blockchain queries
      staleTime: 30_000, // Consider fresh for 30 seconds
      cacheTime: 5 * 60_000, // Keep in cache for 5 minutes
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchInterval: 60_000, // Auto-refetch every 60 seconds
      retry: 3, // Retry failed queries 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
})
```

### 7.2 Cache Invalidation Rules

| Event | Invalidate Queries |
|-------|-------------------|
| Transaction confirmed | • `['character', tokenId]`<br>• `['tokenBalances', address]`<br>• `['characterOwnership', tokenId]` |
| Wallet connected | • `['tokenBalances', address]`<br>• `['characterOwnership', '*']` |
| Network switched | • All blockchain queries |
| Manual refresh | • All queries for current page |

---

## 8. Error Handling

### 8.1 Error Types & Recovery

| Error Type | User Message | Recovery Action | Retry Allowed? |
|------------|--------------|-----------------|----------------|
| **USER_REJECTED** | "Transaction cancelled" | None | Yes |
| **INSUFFICIENT_FUNDS** | "Insufficient ETH for gas" | "Add ETH to wallet" | Yes (after adding ETH) |
| **INSUFFICIENT_ALLOWANCE** | "Token approval required" | "Click Approve first" | Yes (after approving) |
| **NETWORK_MISMATCH** | "Wrong network" | "Switch to Mainnet" | Yes (after switching) |
| **CONTRACT_PAUSED** | "Feature temporarily disabled" | None | No (wait for unpause) |
| **RATE_LIMITED** | "Too many requests" | "Wait a moment" | Yes (after delay) |
| **UNKNOWN** | "Transaction failed" | "Try again or contact support" | Yes |

### 8.2 Error Storage

```typescript
interface StoredError {
  txHash?: TransactionHash
  action: TransactionAction
  errorType: ParsedError['type']
  message: string
  technicalDetails?: string
  timestamp: number
  userId?: string
  walletAddress: Address
}
```

Store errors in:
1. **Browser console**: Full technical details for debugging
2. **Supabase**: For admin monitoring (optional)
3. **User-facing UI**: Simplified message with suggestion

---

## Summary

This data model provides:
1. ✅ **Clear separation** between on-chain (source of truth) and off-chain (cache) data
2. ✅ **Robust validation** at pre-transaction, transaction, and post-transaction stages
3. ✅ **Comprehensive error handling** with user-friendly messages
4. ✅ **Efficient caching** to minimize RPC calls while maintaining freshness
5. ✅ **Transaction persistence** across page refreshes via localStorage
6. ✅ **Admin monitoring** via Supabase pending_transactions table
7. ✅ **Type safety** throughout with TypeScript interfaces

**Status**: Ready for implementation. All data structures align with wagmi v2 patterns and WAGDIE game mechanics.
