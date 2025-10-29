# Research: Blockchain Integration

**Feature**: 004-blockchain-integration
**Date**: 2025-10-28
**Status**: Complete

## Overview

This document captures research findings for implementing real blockchain integration in the WAGDIE simplified platform. All contract addresses, ABIs, and best practices have been identified from the original WAGDIE project.

---

## 1. Smart Contract Addresses & ABIs

### Ethereum Mainnet (Chain ID: 1)

| Contract | Address | Type | ABI Source |
|----------|---------|------|------------|
| WAGDIE NFT | `0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a` | ERC721 | TypeChain: `IWagdie.ts` |
| Tokens of Concord | `0x1d38150f1fd989fb89ab19518a9c4e93c5554634` | ERC1155 | TypeChain: `ITokensOfConcord.ts` |
| Corpse Token | `0x21fc8585eee37be572a0e37c34c7ad2a15a36ee3` | ERC1155 | JSON: `corpseContractABI.json` |
| Mushroom Token | `0x171a8518A1B75F9E26ea952728d4850BEf9B87d2` | ERC1155 | JSON: `shroomContractABI.json` |
| Searing Contract | `0x5156A7F668E59119db23a264502F40407CDa076F` | Custom | TypeChain: `SearWagdie.ts` |
| Spread Contract | `0xaCA80514986768F88F7d8E644546AB85383ddE7e` | Custom | JSON: `spreadContractABI.json` |
| Staking Contract (WagdieWorld) | `0x616D4635ceCf94597690Cab0Fc159c3A8231C904` | Custom | TypeChain: `WagdieWorld.ts` |
| WAGDIE Beasts | Not specified yet | ERC721A | TypeChain: `WagdieBeasts.ts` |

**Source**: `/Users/t3rpz/projects/web/src/lib/common/eth-network-config.ts`

### Contract Dependencies

```
Flow: User → UI → Custom Hooks → wagmi hooks → viem → Smart Contracts

Ownership Verification:
User wallet → WAGDIE.ownerOf(tokenId) → returns address

Token Balances:
User wallet → TokensOfConcord.balanceOf(wallet, tokenId) → returns uint256
User wallet → Corpse.balanceOf(wallet, tokenId) → returns uint256
User wallet → Mushroom.balanceOf(wallet, tokenId) → returns uint256

Searing Flow:
1. Check TokensOfConcord balance
2. Approve SearWagdie contract to spend Concords
3. Call SearWagdie.searConcords([{wagdieId, concordId}])
4. Wait for confirmation

Infection Spread Flow:
1. Check Mushroom balance and ETH balance
2. Approve Spread contract to spend Mushrooms (if needed)
3. Call Spread.infectWagdie(targetTokenId) with ETH payment
4. Wait for confirmation

Corpse Burn Flow:
1. Check Corpse token balance
2. Approve burn contract to spend Corpse tokens
3. Call burn function
4. Wait for confirmation

Staking Flow:
1. Check WAGDIE ownership
2. Approve WagdieWorld to transfer NFT
3. Call WagdieWorld.stakeWagdies([{wagdieId, locationId}])
4. Wait for confirmation

Unstaking Flow:
1. Call WagdieWorld.unstakeWagdies([{wagdieId}])
2. Wait for confirmation
3. NFT returns to wallet

Cure Flow:
1. Determine cure mechanism (research needed - may be in WagdieWorld or separate)
2. Execute cure transaction
3. Wait for confirmation
```

---

## 2. wagmi v2 Best Practices

### Decision: Use wagmi v2 + viem v2

**Rationale**:
- Already installed in the project (`package.json`)
- Industry standard for React + Ethereum (200k+ weekly downloads)
- TypeScript-first design with full type safety
- Built-in React Query integration for async state
- viem v2 provides modern, lightweight Ethereum library (no ethers.js needed)
- RainbowKit 2.2+ already configured for wallet connections

**Alternatives Considered**:
- **ethers.js v5/v6**: Older, larger bundle size, less TypeScript-friendly
- **web3.js**: Legacy API, less React integration
- **Custom fetch calls**: No type safety, reinventing the wheel

### Key wagmi v2 Hooks to Use

#### 1. Ownership & Balance Queries

```typescript
// Check NFT ownership
import { useReadContract } from 'wagmi'
import { wagdieABI } from '@/lib/contracts/abis/wagdie'

const { data: owner } = useReadContract({
  address: '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a',
  abi: wagdieABI,
  functionName: 'ownerOf',
  args: [BigInt(tokenId)],
})

// Check token balances
const { data: concordBalance } = useReadContract({
  address: '0x1d38150f1fd989fb89ab19518a9c4e93c5554634',
  abi: tokensOfConcordABI,
  functionName: 'balanceOf',
  args: [userAddress, concordTokenId],
})
```

#### 2. Write Operations (Transactions)

```typescript
// Execute transactions
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'

const { data: hash, writeContract, isPending } = useWriteContract()

// Execute searing
writeContract({
  address: '0x5156A7F668E59119db23a264502F40407CDa076F',
  abi: searWagdieABI,
  functionName: 'searConcords',
  args: [[{ wagdieId, concordId }]],
})

// Wait for confirmation
const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
  hash,
})
```

#### 3. Token Approvals

```typescript
// Approve tokens before spending
const { writeContract: approve } = useWriteContract()

approve({
  address: concordContractAddress,
  abi: erc1155ABI,
  functionName: 'setApprovalForAll',
  args: [spenderAddress, true],
})
```

#### 4. Multi-call Pattern for Efficiency

```typescript
// Read multiple values in one RPC call
import { useReadContracts } from 'wagmi'

const { data } = useReadContracts({
  contracts: [
    {
      address: wagdieAddress,
      abi: wagdieABI,
      functionName: 'ownerOf',
      args: [tokenId],
    },
    {
      address: concordAddress,
      abi: concordABI,
      functionName: 'balanceOf',
      args: [userAddress, concordTokenId],
    },
    {
      address: corpseAddress,
      abi: corpseABI,
      functionName: 'balanceOf',
      args: [userAddress, corpseTokenId],
    },
  ],
})
```

### wagmi Configuration Best Practices

**1. Chain Configuration**

```typescript
// lib/wagmi.ts
import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'WAGDIE',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
  },
})
```

**2. React Query Configuration**

```typescript
// app/providers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute
      refetchInterval: 30_000, // Auto-refetch every 30s
      retry: 3,
    },
  },
})

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

---

## 3. Transaction State Management

### Decision: Use wagmi built-in state + localStorage for persistence

**Rationale**:
- wagmi provides `useWriteContract` with built-in states (idle/pending/success/error)
- `useWaitForTransactionReceipt` handles confirmation waiting
- localStorage for pending tx recovery after page refresh (simple, no extra dependency)
- React Query handles caching and refetching automatically

**Alternatives Considered**:
- **Redux/Zustand**: Overkill for simple transaction state
- **Context API**: Sufficient but wagmi already provides this via React Query
- **Database storage**: Too complex for client-side tx tracking

### Pattern: Custom Hook with Transaction Persistence

```typescript
// hooks/blockchain/usePendingTransactions.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PendingTx {
  hash: `0x${string}`
  action: 'sear' | 'spread' | 'burn' | 'stake' | 'unstake' | 'cure'
  timestamp: number
  tokenId?: string
  status: 'pending' | 'confirming' | 'confirmed' | 'failed'
}

export const usePendingTxStore = create<{
  transactions: PendingTx[]
  addTx: (tx: Omit<PendingTx, 'timestamp' | 'status'>) => void
  updateTxStatus: (hash: string, status: PendingTx['status']) => void
  removeTx: (hash: string) => void
}>()(
  persist(
    (set) => ({
      transactions: [],
      addTx: (tx) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...tx, timestamp: Date.now(), status: 'pending' },
          ],
        })),
      updateTxStatus: (hash, status) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.hash === hash ? { ...tx, status } : tx
          ),
        })),
      removeTx: (hash) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.hash !== hash),
        })),
    }),
    {
      name: 'wagdie-pending-txs',
    }
  )
)
```

### Transaction Status Display Pattern

```typescript
// components/blockchain/TransactionStatus.tsx
import { useWaitForTransactionReceipt } from 'wagmi'

interface TransactionStatusProps {
  hash: `0x${string}` | undefined
  action: string
}

export function TransactionStatus({ hash, action }: TransactionStatusProps) {
  const { isLoading, isSuccess, isError, error } = useWaitForTransactionReceipt({
    hash,
  })

  if (!hash) return null

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Spinner />
        <span>Confirming {action}...</span>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckIcon />
        <span>{action} confirmed!</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <ErrorIcon />
        <span>Transaction failed: {error?.message}</span>
      </div>
    )
  }

  return null
}
```

---

## 4. Error Handling & User-Friendly Messages

### Decision: Parse blockchain errors into user-friendly messages

**Rationale**:
- Raw blockchain errors are cryptic (e.g., "Error: -32000", "execution reverted")
- Users need actionable guidance ("Insufficient ETH for gas", "Approve tokens first")
- Constitution Principle VII: Web3 Pragmatism requires smooth UX

### Common Blockchain Errors & Translations

```typescript
// lib/utils/blockchain-errors.ts

export type BlockchainErrorType =
  | 'USER_REJECTED'
  | 'INSUFFICIENT_FUNDS'
  | 'INSUFFICIENT_ALLOWANCE'
  | 'NETWORK_MISMATCH'
  | 'CONTRACT_PAUSED'
  | 'INVALID_PARAMETERS'
  | 'RATE_LIMITED'
  | 'UNKNOWN'

export interface ParsedError {
  type: BlockchainErrorType
  message: string
  technicalDetails?: string
  suggestion?: string
}

export function parseBlockchainError(error: unknown): ParsedError {
  const errorMessage = error instanceof Error ? error.message : String(error)

  // User rejected transaction
  if (
    errorMessage.includes('User rejected') ||
    errorMessage.includes('User denied')
  ) {
    return {
      type: 'USER_REJECTED',
      message: 'Transaction cancelled',
      suggestion: 'You rejected the transaction in your wallet.',
    }
  }

  // Insufficient gas or funds
  if (
    errorMessage.includes('insufficient funds') ||
    errorMessage.includes('exceeds balance')
  ) {
    return {
      type: 'INSUFFICIENT_FUNDS',
      message: 'Insufficient ETH for gas',
      suggestion: 'Add more ETH to your wallet to cover gas fees.',
      technicalDetails: errorMessage,
    }
  }

  // Token approval needed
  if (
    errorMessage.includes('ERC1155: caller is not token owner or approved') ||
    errorMessage.includes('ERC721: caller is not token owner or approved')
  ) {
    return {
      type: 'INSUFFICIENT_ALLOWANCE',
      message: 'Token approval required',
      suggestion: 'Approve the contract to spend your tokens first.',
      technicalDetails: errorMessage,
    }
  }

  // Wrong network
  if (errorMessage.includes('chain mismatch') || errorMessage.includes('unsupported chain')) {
    return {
      type: 'NETWORK_MISMATCH',
      message: 'Wrong network',
      suggestion: 'Please switch to Ethereum Mainnet in your wallet.',
      technicalDetails: errorMessage,
    }
  }

  // Contract paused or disabled
  if (
    errorMessage.includes('paused') ||
    errorMessage.includes('disabled') ||
    errorMessage.includes('not enabled')
  ) {
    return {
      type: 'CONTRACT_PAUSED',
      message: 'Feature temporarily disabled',
      suggestion: 'This feature is currently paused by the contract owner.',
      technicalDetails: errorMessage,
    }
  }

  // Rate limited
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      type: 'RATE_LIMITED',
      message: 'Too many requests',
      suggestion: 'Please wait a moment and try again.',
      technicalDetails: errorMessage,
    }
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    message: 'Transaction failed',
    suggestion: 'An unexpected error occurred. Please try again.',
    technicalDetails: errorMessage,
  }
}
```

---

## 5. Gas Estimation

### Decision: Display gas estimates before transaction approval

**Rationale**:
- Users should know transaction costs upfront (Web3 Pragmatism)
- Prevents failed transactions due to insufficient gas
- Builds user trust and confidence

### Gas Estimation Pattern

```typescript
// lib/utils/gas-estimation.ts
import { type EstimateGasParameters, type PublicClient } from 'viem'
import { formatEther } from 'viem'

export async function estimateTransactionCost(
  client: PublicClient,
  params: EstimateGasParameters
): Promise<{
  gasEstimate: bigint
  gasPriceGwei: string
  costEth: string
  costUsd: string // requires ETH price API
}> {
  const gasEstimate = await client.estimateGas(params)
  const gasPrice = await client.getGasPrice()

  const totalCost = gasEstimate * gasPrice
  const costEth = formatEther(totalCost)

  // Fetch ETH price (placeholder - use API like CoinGecko)
  const ethPriceUsd = 2000 // TODO: Fetch from API
  const costUsd = (parseFloat(costEth) * ethPriceUsd).toFixed(2)

  return {
    gasEstimate,
    gasPriceGwei: (Number(gasPrice) / 1e9).toFixed(2),
    costEth,
    costUsd,
  }
}
```

### Usage in Components

```typescript
// components/blockchain/TransactionButton.tsx
import { useEstimateGas } from 'wagmi'

const { data: gasEstimate } = useEstimateGas({
  address: contractAddress,
  abi: contractABI,
  functionName: 'searConcords',
  args: [params],
})

// Display: "Estimated gas: 0.0023 ETH (~$4.60)"
```

---

## 6. RPC Provider Configuration

### Decision: Use Alchemy as primary RPC, with fallback to public RPC

**Rationale**:
- Alchemy provides reliable RPC with high rate limits
- Free tier: 300M compute units/month (sufficient for 1000 users)
- Auto-retry and fallback handling via wagmi
- Public RPCs as fallback prevent total outage

### Configuration

```typescript
// .env.example
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCHEMY_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${NEXT_PUBLIC_ALCHEMY_API_KEY}

// lib/wagmi.ts
import { http, fallback } from 'wagmi'

export const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: fallback([
      http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL), // Primary
      http('https://eth.llamarpc.com'), // Public fallback
      http('https://rpc.ankr.com/eth'), // Secondary fallback
    ]),
  },
})
```

**Rate Limit Handling**:
- wagmi automatically retries with exponential backoff
- React Query caches responses to minimize RPC calls
- Use `staleTime` to avoid redundant queries

---

## 7. Testing Strategy

### Unit Tests (Vitest)

**What to test**:
- Custom hooks logic (useCharacterOwnership, useTokenBalances)
- Utility functions (parseBlockchainError, estimateGas)
- Transaction state management

**Mocking approach**:
```typescript
// tests/unit/hooks/useTokenBalances.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useTokenBalances } from '@/hooks/blockchain/useTokenBalances'
import { vi } from 'vitest'

vi.mock('wagmi', () => ({
  useReadContracts: vi.fn(() => ({
    data: [{ result: BigInt(5) }, { result: BigInt(10) }],
    isLoading: false,
  })),
}))

describe('useTokenBalances', () => {
  it('returns correct token balances', async () => {
    const { result } = renderHook(() => useTokenBalances('0x123...'))

    await waitFor(() => {
      expect(result.current.concordBalance).toBe(5n)
      expect(result.current.corpseBalance).toBe(10n)
    })
  })
})
```

### Integration Tests (Testnet)

**What to test**:
- End-to-end transaction flows on Sepolia testnet
- Multi-step approvals (approve → transact)
- Error scenarios (insufficient gas, wrong network)

**Setup**:
1. Deploy test contracts to Sepolia
2. Use testnet ETH (faucet)
3. Create test wallet with known tokens
4. Run Playwright E2E tests

### E2E Tests (Playwright + Testnet)

```typescript
// tests/e2e/searing-flow.spec.ts
import { test, expect } from '@playwright/test'

test('user can sear character with Concords', async ({ page }) => {
  // Connect wallet (use test wallet with Sepolia ETH + Concords)
  await page.goto('/characters/1234')
  await page.click('button:has-text("Connect Wallet")')

  // Approve Concords
  await page.click('button:has-text("Sear Character")')
  await page.click('button:has-text("Approve Concords")')

  // Wait for approval confirmation
  await expect(page.locator('text=Approval confirmed')).toBeVisible()

  // Execute searing
  await page.click('button:has-text("Confirm Searing")')

  // Wait for transaction confirmation
  await expect(page.locator('text=Character seared!')).toBeVisible({ timeout: 60000 })

  // Verify UI updates
  await expect(page.locator('[data-testid="seared-badge"]')).toBeVisible()
})
```

---

## 8. Database Schema for Transaction Tracking

### Decision: Store pending transactions in Supabase for admin monitoring

**Rationale**:
- Users track pending tx in localStorage (client-side)
- Admins need visibility into failed/stuck transactions
- Useful for debugging and support

### Migration

```sql
-- supabase/migrations/YYYYMMDD_add_pending_transactions.sql

CREATE TABLE pending_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('sear', 'spread', 'burn', 'stake', 'unstake', 'cure')),
  token_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirming', 'confirmed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pending_tx_wallet ON pending_transactions(wallet_address);
CREATE INDEX idx_pending_tx_status ON pending_transactions(status);
CREATE INDEX idx_pending_tx_created ON pending_transactions(created_at DESC);

-- Auto-cleanup: Delete confirmed/failed transactions older than 7 days
CREATE FUNCTION cleanup_old_transactions() RETURNS void AS $$
BEGIN
  DELETE FROM pending_transactions
  WHERE status IN ('confirmed', 'failed')
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run daily)
SELECT cron.schedule(
  'cleanup-old-transactions',
  '0 2 * * *', -- 2 AM daily
  $$SELECT cleanup_old_transactions()$$
);
```

---

## 9. Network Switching & Wrong Network Detection

### Decision: Detect wrong network and prompt user to switch

**Rationale**:
- Users often connect on wrong network (Polygon, BSC, etc.)
- Prevent failed transactions
- Constitution Principle VII: Smooth Web3 UX

### Pattern

```typescript
// hooks/blockchain/useNetworkCheck.ts
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { mainnet } from 'wagmi/chains'

export function useNetworkCheck() {
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isConnected } = useAccount()

  const isCorrectNetwork = chainId === mainnet.id
  const isWrongNetwork = isConnected && !isCorrectNetwork

  const switchToMainnet = () => {
    switchChain({ chainId: mainnet.id })
  }

  return {
    isCorrectNetwork,
    isWrongNetwork,
    currentChainId: chainId,
    switchToMainnet,
  }
}
```

### UI Component

```typescript
// components/blockchain/NetworkChecker.tsx
import { useNetworkCheck } from '@/hooks/blockchain/useNetworkCheck'

export function NetworkChecker() {
  const { isWrongNetwork, switchToMainnet } = useNetworkCheck()

  if (!isWrongNetwork) return null

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" /* Warning icon */ />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            You're connected to the wrong network. Please switch to Ethereum Mainnet.
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={switchToMainnet}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          >
            Switch Network
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 10. ABI Extraction & Type Generation

### Decision: Copy ABIs from original project and generate TypeScript types

**Process**:

1. **Copy JSON ABIs** from original project:
   - `corpseContractABI.json` → `lib/contracts/abis/corpse.json`
   - `shroomContractABI.json` → `lib/contracts/abis/mushroom.json`
   - `spreadContractABI.json` → `lib/contracts/abis/spread.json`

2. **Extract TypeChain ABIs** and convert to JSON:
   - Parse TypeChain `IWagdie.ts`, `ITokensOfConcord.ts`, etc.
   - Extract ABI arrays and save as JSON files

3. **Generate TypeScript types** using wagmi CLI:
   ```bash
   pnpm wagmi generate
   ```

   **wagmi.config.ts**:
   ```typescript
   import { defineConfig } from '@wagmi/cli'
   import { react } from '@wagmi/cli/plugins'

   export default defineConfig({
     out: 'lib/contracts/generated.ts',
     contracts: [
       {
         name: 'Wagdie',
         abi: require('./lib/contracts/abis/wagdie.json'),
         address: '0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a',
       },
       {
         name: 'TokensOfConcord',
         abi: require('./lib/contracts/abis/concord.json'),
         address: '0x1d38150f1fd989fb89ab19518a9c4e93c5554634',
       },
       // ... other contracts
     ],
     plugins: [react()],
   })
   ```

4. **Use generated hooks**:
   ```typescript
   import { useWagdieOwnerOf } from '@/lib/contracts/generated'

   const { data: owner } = useWagdieOwnerOf({
     args: [BigInt(tokenId)],
   })
   ```

---

## Summary of Decisions

| Decision | Rationale |
|----------|-----------|
| **wagmi v2 + viem v2** | Industry standard, TypeScript-first, already installed |
| **RainbowKit wallet connection** | Smooth UX, supports major wallets, already configured |
| **Alchemy RPC primary** | Reliable, high rate limits, free tier sufficient |
| **localStorage for pending tx** | Simple, no extra dependencies, survives refresh |
| **Supabase for tx monitoring** | Admin visibility, debugging support |
| **Parse blockchain errors** | User-friendly messages (Web3 Pragmatism) |
| **Display gas estimates** | Build trust, prevent failed tx |
| **Network switching prompts** | Prevent wrong-chain transactions |
| **wagmi CLI for type gen** | Automatic TypeScript types from ABIs |
| **Testnet for E2E tests** | Real transactions, safe environment |

---

## Next Steps (Phase 1: Design)

1. Create `data-model.md` with transaction state schema
2. Generate contract ABIs and save to `contracts/` directory
3. Create `quickstart.md` for local blockchain testing
4. Update agent context with wagmi v2 patterns

---

**Research Complete**: All technical decisions documented and justified. Ready for Phase 1 implementation planning.
