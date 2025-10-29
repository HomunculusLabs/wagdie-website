# Blockchain Integration - API Documentation

Complete API reference for all blockchain services, hooks, and utilities.

## Table of Contents
1. [Services](#services)
2. [React Hooks](#react-hooks)
3. [Utilities](#utilities)
4. [Types](#types)

---

## Services

All services extend `BaseBlockchainService` and provide error handling, transaction management, and multicall optimization.

### BaseBlockchainService

Base class for all blockchain services.

```typescript
abstract class BaseBlockchainService {
  constructor(config: BaseServiceConfig)

  // Protected methods
  protected readContract<T>(fn: () => Promise<T>, context?: string)
  protected writeContract(fn: () => Promise<`0x${string}`>, context?: string)
  protected waitForTransaction(hash: `0x${string}`, confirmations?: number)
  protected multicall<T>(contracts: MultiCallRequest[])
}
```

### OwnershipService

**Path:** `lib/services/blockchain/ownership.ts`

NFT ownership verification and management.

#### Methods

```typescript
// Initialize service with correct chain
async initialize(): Promise<void>

// Check if address owns a specific WAGDIE
async checkOwnership(
  tokenId: bigint,
  address: Address
): Promise<{ data?: CharacterOwnership; error?: ContractError }>

// Get owner of a WAGDIE token
async getOwner(
  tokenId: bigint
): Promise<{ data?: Address; error?: ContractError }>

// Get WAGDIE balance for address
async getBalance(
  address: Address
): Promise<{ data?: bigint; error?: ContractError }>

// Batch ownership check
async checkMultipleOwnership(
  tokenIds: bigint[],
  address: Address
): Promise<{ data?: CharacterOwnership[]; error?: ContractError }>

// Check token approval
async isApproved(
  tokenId: bigint,
  operator: Address
): Promise<{ data?: boolean; error?: ContractError }>

// Check operator approval
async isApprovedForAll(
  owner: Address,
  operator: Address
): Promise<{ data?: boolean; error?: ContractError }>
```

#### Example Usage

```typescript
const service = new OwnershipService({ publicClient, walletClient })
await service.initialize()

// Check ownership
const { data, error } = await service.checkOwnership(
  BigInt(1234),
  '0x...'
)

if (data) {
  console.log(`Owned: ${data.isOwned}`)
}
```

### BalancesService

**Path:** `lib/services/blockchain/balances.ts`

ERC1155 token balance queries.

#### Methods

```typescript
async initialize(): Promise<void>

// Get balance for specific token type
async getTokenBalance(
  tokenType: 'concord' | 'corpse' | 'mushroom',
  address: Address
): Promise<{ data?: TokenBalance; error?: ContractError }>

// Get all token balances
async getAllBalances(
  address: Address
): Promise<{
  data?: Record<'concord' | 'corpse' | 'mushroom', TokenBalance>
  error?: ContractError
}>

// Batch balance queries
async getMultipleBalances(
  tokenType: 'concord' | 'corpse' | 'mushroom',
  addresses: Address[]
): Promise<{ data?: TokenBalance[]; error?: ContractError }>

// Check approval status
async isApprovedForAll(
  tokenType: 'concord' | 'corpse' | 'mushroom',
  owner: Address,
  operator: Address
): Promise<{ data?: boolean; error?: ContractError }>
```

### SearingService

**Path:** `lib/services/blockchain/searing.ts`

Character searing and taming operations.

#### Methods

```typescript
async initialize(): Promise<void>

// Global status checks
async isSearingEnabled(): Promise<{ data?: boolean; error?: ContractError }>
async isTamingEnabled(): Promise<{ data?: boolean; error?: ContractError }>

// Character status
async isWagdieSeared(wagdieId: number): Promise<{ data?: boolean; error?: ContractError }>
async isWagdieBlocked(wagdieId: number): Promise<{ data?: boolean; error?: ContractError }>
async isConcordBlocked(concordId: number): Promise<{ data?: boolean; error?: ContractError }>

// Comprehensive status
async getSearingStatus(wagdieId: number): Promise<{
  data?: SearingStatus
  error?: ContractError
}>

// Approval
async isApprovedForAll(owner: Address): Promise<{ data?: boolean; error?: ContractError }>
async approveForSearing(owner: Address): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Searing operations
async searConcords(
  params: SearConcordsParams[],
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

async tameBeasts(
  params: TameBeastsParams[],
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

async getMaxBeastId(): Promise<{ data?: number; error?: ContractError }>
```

### SpreadService

**Path:** `lib/services/blockchain/spread.ts`

Infection spreading mechanics.

#### Methods

```typescript
async initialize(): Promise<void>

// Price queries
async getInfectionPrice(): Promise<{ data?: bigint; error?: ContractError }>
async calculateTotalCost(quantity: bigint): Promise<{ data?: bigint; error?: ContractError }>

// Contract addresses
async getConcordAddress(): Promise<{ data?: Address; error?: ContractError }>
async getWagdieAddress(): Promise<{ data?: Address; error?: ContractError }>

// Infection operations
async infectWagdie(
  tokenId: bigint,
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

async spreadInfections(
  quantity: bigint,
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Balance check
async getEthBalance(address: Address): Promise<{ data?: bigint; error?: ContractError }>
```

### CorpseService

**Path:** `lib/services/blockchain/corpse.ts`

Corpse token burning to mint mushrooms.

#### Methods

```typescript
async initialize(): Promise<void>

// Balance queries
async getCorpseBalance(owner: Address): Promise<{ data?: bigint; error?: ContractError }>
async getMushroomBalance(owner: Address): Promise<{ data?: bigint; error?: ContractError }>
async getBothBalances(owner: Address): Promise<{
  data?: { corpse: bigint; mushroom: bigint }
  error?: ContractError
}>

// Approval
async isCorpseApproved(owner: Address): Promise<{ data?: boolean; error?: ContractError }>
async approveCorpseForBurning(owner: Address): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Burning
async burnCorpse(
  amount: bigint,
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Status check
async isMushroomMintingEnabled(): Promise<{ data?: boolean; error?: ContractError }>
```

### StakingService

**Path:** `lib/services/blockchain/staking.ts`

Character staking in WagdieWorld.

#### Methods

```typescript
async initialize(): Promise<void>

// Status checks
async isStakingEnabled(): Promise<{ data?: boolean; error?: ContractError }>
async getStakingStatus(wagdieId: number): Promise<{
  data?: StakingStatus
  error?: ContractError
}>

// Location info
async getLocationInfo(locationId: bigint): Promise<{
  data?: LocationInfo
  error?: ContractError
}>

// Approval
async isApprovedForStaking(
  owner: Address,
  tokenId?: bigint
): Promise<{ data?: boolean; error?: ContractError }>

async approveForStaking(
  owner: Address,
  tokenId?: bigint
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Staking operations
async stakeWagdies(
  params: StakeWagdiesParams[],
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

async unstakeWagdies(
  params: UnstakeWagdiesParams[],
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

async changeWagdieLocations(
  params: ChangeWagdieLocationParams[],
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>
```

### CureService

**Path:** `lib/services/blockchain/cure.ts`

Curing infected characters.

#### Methods

```typescript
async initialize(): Promise<void>

// Balance and status
async getMushroomBalance(owner: Address): Promise<{ data?: bigint; error?: ContractError }>
async isMushroomMintingEnabled(): Promise<{ data?: boolean; error?: ContractError }>
async getCureStatus(owner: Address): Promise<{
  data?: CureStatus
  error?: ContractError
}>

// Cure operations
async burnMushroomsForCure(
  amount: bigint,
  account: Address
): Promise<{ hash?: `0x${string}`; error?: ContractError }>

// Utilities
getRequiredMushrooms(characterCount: number): bigint
async canCureCharacters(
  owner: Address,
  characterCount: number
): Promise<{ data?: boolean; error?: ContractError }>
```

---

## React Hooks

### useCharacterOwnership

**Path:** `hooks/useCharacterOwnership.ts`

Check ownership of a specific character.

```typescript
function useCharacterOwnership(tokenId: bigint | null): {
  ownership: CharacterOwnership | null
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

**Example:**
```typescript
const { ownership, isLoading, error } = useCharacterOwnership(BigInt(1234))

if (ownership?.isOwned) {
  console.log('You own this character!')
}
```

### useTokenOwner

Get owner of a token without wallet connection.

```typescript
function useTokenOwner(tokenId: bigint | null): {
  owner: string | null
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

### useWalletCharacters

Get all characters owned by connected wallet.

```typescript
function useWalletCharacters(): {
  characters: WalletCharacter[]
  totalBalance: bigint
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

### useTokenBalances

**Path:** `hooks/useTokenBalances.ts`

Fetch all ERC1155 token balances.

```typescript
function useTokenBalances(): {
  balances: {
    concord: TokenBalance | null
    corpse: TokenBalance | null
    mushroom: TokenBalance | null
  }
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

### useSingleTokenBalance

Query specific token balance.

```typescript
function useSingleTokenBalance(tokenType: TokenType | null): {
  balance: TokenBalance | null
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

### useSearing

**Path:** `hooks/useSearing.ts`

Execute searing operations.

```typescript
function useSearing(): {
  isSearing: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  searConcords: (wagdieId: number, concordId: number) => Promise<void>
  checkApproval: () => Promise<boolean>
  approveForSearing: () => Promise<void>
}
```

**Example:**
```typescript
const { searConcords, checkApproval, approveForSearing, isSearing } = useSearing()

const handleSear = async () => {
  const approved = await checkApproval()
  if (!approved) {
    await approveForSearing()
  }
  await searConcords(1234, 5678)
}
```

### useSpread

**Path:** `hooks/useSpread.ts`

Infection spreading operations.

```typescript
function useSpread(): {
  isSpreading: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  infectionPrice: bigint | null
  ethBalance: bigint | null
  infectWagdie: (tokenId: bigint) => Promise<void>
  spreadInfections: (quantity: bigint) => Promise<void>
  fetchInfectionPrice: () => Promise<void>
  fetchEthBalance: () => Promise<void>
}
```

### useCorpseBurning

**Path:** `hooks/useCorpseBurning.ts`

Corpse burning operations.

```typescript
function useCorpseBurning(): {
  isBurning: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  corpseBalance: bigint | null
  mushroomBalance: bigint | null
  burnCorpse: (amount: bigint) => Promise<void>
  checkApproval: () => Promise<boolean>
  approveForBurning: () => Promise<void>
  fetchBalances: () => Promise<void>
}
```

### useStaking

**Path:** `hooks/useStaking.ts`

Character staking operations.

```typescript
function useStaking(): {
  isStaking: boolean
  isUnstaking: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  stakeWagdie: (wagdieId: number, locationId: bigint) => Promise<void>
  unstakeWagdie: (wagdieId: number) => Promise<void>
  checkApproval: (tokenId?: bigint) => Promise<boolean>
  approveForStaking: (tokenId?: bigint) => Promise<void>
}
```

### useStakingStatus

Query staking status for a character.

```typescript
function useStakingStatus(wagdieId: number | null): {
  status: StakingStatus | null
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}
```

### useCure

**Path:** `hooks/useCure.ts`

Cure infected characters.

```typescript
function useCure(): {
  isCuring: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  cureStatus: CureStatus | null
  cureCharacter: (characterId: number) => Promise<void>
  fetchCureStatus: () => Promise<void>
}
```

---

## Utilities

### Error Handling

**Path:** `lib/utils/errors.ts`

```typescript
// User-friendly error messages
function getUserFriendlyErrorMessage(error: unknown): string

// Error type detection
function isUserRejectedError(error: unknown): boolean
function isInsufficientFundsError(error: unknown): boolean
function isNetworkError(error: unknown): boolean

// Error logging
function logError(error: unknown, context?: string): void
```

### Blockchain Utilities

**Path:** `lib/utils/blockchain.ts`

```typescript
// Address validation
function validateAddress(address: string): boolean
function normalizeAddress(address: string): Address
function compareAddresses(address1: string, address2: string): boolean
function shortenAddress(address: string, chars?: number): string

// Token ID validation
function validateTokenId(tokenId: bigint | number | string): boolean
function normalizeTokenId(tokenId: bigint | number | string): bigint

// Transaction utilities
function validateTransactionHash(hash: string): boolean
function shortenTransactionHash(hash: string, chars?: number): string

// Balance formatting
function formatTokenBalance(balance: bigint, decimals?: number, displayDecimals?: number): string
function parseTokenAmount(amount: string, decimals?: number): bigint

// Chain utilities
function isValidChainId(chainId: number): boolean
function getChainName(chainId: number): string
function getExplorerUrl(chainId: number): string
function getTransactionUrl(chainId: number, txHash: string): string
function getAddressUrl(chainId: number, address: string): string

// Helper functions
function paginateArray<T>(array: T[], page: number, pageSize: number): T[]
function delay(ms: number): Promise<void>
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number): Promise<T>
```

### Balance Utilities

**Path:** `lib/utils/balances.ts`

```typescript
// Token information
const TOKEN_INFO: Record<'concord' | 'corpse' | 'mushroom', TokenInfo>

// Balance formatting
function formatBalance(balance: bigint, decimals?: number): string
function formatBalanceWithSymbol(tokenType: string, balance: bigint): string

// Balance checks
function isBalanceZero(balance: TokenBalance | null): boolean
function hasAnyBalance(balances: Record<string, TokenBalance | null>): boolean
```

### Toast Notifications

**Path:** `lib/utils/toast.ts`

```typescript
// Basic toasts
function showSuccessToast(title: string, description?: string): void
function showErrorToast(title: string, description?: string): void
function showInfoToast(title: string, description?: string): void
function showLoadingToast(title: string, description?: string): void

// Transaction toasts
function showTransactionPendingToast(txHash: TransactionHash): void
function showTransactionSuccessToast(txHash: TransactionHash, message?: string): void
function showTransactionErrorToast(error: ContractError): void

// Approval toasts
function showApprovalRequiredToast(contractName: string): void
function showApprovalSuccessToast(contractName: string): void
```

---

## Types

### Core Types

**Path:** `types/blockchain.ts`

```typescript
export type Address = `0x${string}`
export type TransactionHash = `0x${string}`

export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface TransactionState {
  hash?: TransactionHash
  status: TransactionStatus
  error?: string
  confirmations?: number
}

export interface TokenBalance {
  tokenId: bigint
  balance: bigint
  contractAddress: Address
  tokenType: 'ERC721' | 'ERC1155'
}

export interface CharacterOwnership {
  tokenId: bigint
  owner: Address
  isOwned: boolean
  contractAddress: Address
}

export interface StakingStatus {
  tokenId: bigint
  isStaked: boolean
  locationId?: bigint
  locationName?: string
  locationOwner?: Address
  nftsLocked?: boolean
}

export interface LocationInfo {
  locationId: bigint
  name: string
  owner: Address
  nftsLocked: boolean
  exists: boolean
}

export enum ContractErrorType {
  USER_REJECTED = 'user_rejected',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  NETWORK_ERROR = 'network_error',
  CONTRACT_ERROR = 'contract_error',
  INVALID_PARAMS = 'invalid_params',
  UNKNOWN = 'unknown',
}

export interface ContractError {
  type: ContractErrorType
  message: string
  originalError?: Error
  txHash?: TransactionHash
}
```

### Contract Parameters

**Path:** `types/contracts.ts`

```typescript
export interface SearConcordsParams {
  wagdieId: number
  concordId: number
}

export interface StakeWagdiesParams {
  locationId: bigint
  wagdieId: number
}

export interface UnstakeWagdiesParams {
  wagdieId: number
}

// ... and more
```

---

## Best Practices

### Service Usage

```typescript
// Always initialize services
const service = new OwnershipService({ publicClient, walletClient })
await service.initialize() // Sets correct chain

// Check for errors
const { data, error } = await service.checkOwnership(tokenId, address)
if (error) {
  console.error(error.message)
  return
}
console.log(data)
```

### Hook Usage

```typescript
// Use hooks in React components only
function MyComponent() {
  const { ownership, isLoading, error, refetch } = useCharacterOwnership(tokenId)

  useEffect(() => {
    // Auto-refetch on mount
    refetch()
  }, [])

  if (isLoading) return <Loading />
  if (error) return <Error message={error.message} />
  return <Display data={ownership} />
}
```

### Error Handling

```typescript
try {
  const result = await service.someOperation()
  if (result.error) {
    showTransactionErrorToast(result.error)
    return
  }
  // Success
  showTransactionSuccessToast(result.hash, 'Operation successful!')
} catch (err) {
  logError(err, 'someOperation')
  showErrorToast('Operation failed')
}
```

---

## Migration Guide

### From Mock to Real Implementation

```typescript
// Before (mock)
const handleBurn = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000))
  toast.success('Burned!')
}

// After (real)
const { burnCorpse } = useCorpseBurning()

const handleBurn = async (amount: bigint) => {
  await burnCorpse(amount)
  // Toast notifications handled automatically
}
```

---

## Support

For issues or questions:
1. Check error messages in browser console
2. Verify contract addresses and chain ID
3. Confirm wallet connection and network
4. Review transaction history in Etherscan
5. Check Alchemy API status and rate limits
