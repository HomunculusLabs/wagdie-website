/**
 * TypeScript type definitions for WagdieWorld smart contract
 * Generated from contract specification in contracts/wagdie-world-contract.md
 */

// Contract address type
export type ContractAddress = `0x${string}`

// Stake parameters for contract call
export interface StakeWagdieContractParams {
  wagdieId: bigint // Character token ID as bigint
  locationId: bigint // Location ID as bigint
}

// Change location parameters for contract call
export interface ChangeWagdieLocationContractParams {
  wagdieId: bigint // Character token ID
  newLocationId: bigint // New location ID
}

// Unstake parameters for contract call
export interface UnstakeWagdieContractParams {
  wagdieId: bigint // Character token ID
}

// Contract location structure (from getAllLocations)
export interface ContractLocation {
  id: bigint // Location ID
  name: string // Location name
  metadata: string // JSON metadata string
}

// getLocation return type
export interface ContractLocationData {
  locationId: bigint // Current location ID, 0 if not staked
  staked: boolean // Whether character is currently staked
}

// Contract event types
export interface WagdieStakedEvent {
  owner: ContractAddress // Address who staked (indexed)
  wagdieId: bigint // Token ID (indexed)
  locationId: bigint // Location ID
  timestamp: bigint // Unix timestamp
}

export interface WagdieLocationChangedEvent {
  owner: ContractAddress // Address who moved (indexed)
  wagdieId: bigint // Token ID (indexed)
  fromLocation: bigint // Previous location
  toLocation: bigint // New location
  timestamp: bigint // Unix timestamp
}

export interface WagdieUnstakedEvent {
  owner: ContractAddress // Address who unstaked (indexed)
  wagdieId: bigint // Token ID (indexed)
  timestamp: bigint // Unix timestamp
}

// All contract events union type
export type WagdieWorldEvent =
  | WagdieStakedEvent
  | WagdieLocationChangedEvent
  | WagdieUnstakedEvent

// Transaction status from wagmi
export interface ContractTransactionStatus {
  hash: ContractAddress
  status: 'success' | 'reverted'
  blockNumber?: bigint
  gasUsed?: bigint
}

// Contract error types
export interface ContractError {
  code: string
  message: string
  data?: any
}

export type WagdieWorldContractError =
  | { code: 'NotOwner'; message: string }
  | { code: 'AlreadyStaked'; message: string }
  | { code: 'NotStaked'; message: string }
  | { code: 'InvalidLocation'; message: string }
  | { code: 'SameLocation'; message: string }
  | { code: 'InsufficientGas'; message: string }
  | { code: 'TransferFailed'; message: string }
  | ContractError

// Contract read function arguments
export interface GetLocationArgs {
  characterId: bigint
}

export interface OwnerOfArgs {
  tokenId: bigint
}

// Contract write function arguments
export interface StakeWagdiesArgs {
  params: StakeWagdieContractParams[]
}

export interface ChangeWagdieLocationsArgs {
  params: ChangeWagdieLocationContractParams[]
}

export interface UnstakeWagdiesArgs {
  params: UnstakeWagdieContractParams[]
}

// Gas estimates
export interface GasEstimate {
  stake: number // ~120,000 gas per character
  move: number // ~100,000 gas per character
  unstake: number // ~80,000 gas per character
  read: number // ~20,000 gas
}

// Event log from viem
export interface ContractEventLog {
  address: ContractAddress
  topics: string[]
  data: string
  blockNumber: bigint
  transactionHash: ContractAddress
  logIndex: number
  args: WagdieWorldEvent
}

// Contract configuration
export interface WagdieWorldContractConfig {
  address: ContractAddress
  abi: readonly any[] // Contract ABI
  network: 'mainnet' | 'goerli' | 'sepolia'
}

// Sync status for character location
export interface CharacterSyncStatus {
  characterId: string
  currentLocation?: string
  lastSyncBlock?: number
  lastSyncTime?: Date
  pendingSync: boolean
}

// Batch operation result
export interface BatchOperationResult<T> {
  successful: T[]
  failed: Array<{ item: T; error: WagdieWorldContractError }>
  totalCount: number
  successCount: number
  failureCount: number
}

// Contract hook return types
export interface UseContractReadResult<T> {
  data?: T
  error?: ContractError
  isLoading: boolean
  isError: boolean
  refetch: () => void
}

export interface UseContractWriteResult {
  writeContract: (args: any) => void
  data?: ContractTransactionStatus
  isLoading: boolean
  isPending: boolean
  isSuccess: boolean
  isError: boolean
  error?: ContractError
}

// Type guards for contract errors
export function isNotOwnerError(error: any): error is { code: 'NotOwner' } {
  return error?.code === 'NotOwner'
}

export function isAlreadyStakedError(error: any): error is { code: 'AlreadyStaked' } {
  return error?.code === 'AlreadyStaked'
}

export function isNotStakedError(error: any): error is { code: 'NotStaked' } {
  return error?.code === 'NotStaked'
}

export function isInvalidLocationError(error: any): error is { code: 'InvalidLocation' } {
  return error?.code === 'InvalidLocation'
}

export function isSameLocationError(error: any): error is { code: 'SameLocation' } {
  return error?.code === 'SameLocation'
}

// Convert between bigint and string for Supabase compatibility
export interface WagdieId {
  bigint: bigint
  string: string
}

export function toWagdieId(id: string | bigint): WagdieId {
  const bigintValue = typeof id === 'string' ? BigInt(id) : id
  return {
    bigint: bigintValue,
    string: bigintValue.toString(),
  }
}

// Validate Ethereum address
export function isValidEthereumAddress(address: string): address is ContractAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Event filter for watching contract events
export interface EventFilter {
  owner?: ContractAddress
  wagdieId?: bigint
  fromBlock?: bigint
  toBlock?: bigint
}
