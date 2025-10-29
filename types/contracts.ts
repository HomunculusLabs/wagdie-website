// Contract Parameter Types
// TypeScript types for smart contract function parameters

import { Address } from './blockchain'

// Searing contract parameters
export interface SearConcordsParams {
  wagdieId: number
  concordId: number
}

export interface TameBeastsParams {
  wagdieId: number
  concordId: number
}

// Staking contract parameters
export interface StakeWagdiesParams {
  locationId: bigint
  wagdieId: number
}

export interface UnstakeWagdiesParams {
  wagdieId: number
}

export interface ChangeWagdieLocationParams {
  locationId: bigint
  wagdieId: number
}

export interface AddLocationParams {
  name: string
  owner: Address
  nftsLocked: boolean
}

export interface BurnWagdieParams {
  wagdieId: number
  locationId: bigint
}

export interface MintConcordsToLocationParams {
  locationId: bigint
  amount: bigint
}

// Spread contract parameters
export interface InfectWagdieParams {
  tokenId: bigint
  value: bigint // ETH value to send
}

export interface SpreadInfectionsParams {
  quantity: bigint
  value: bigint // ETH value to send
}

// ERC721 parameters
export interface TransferFromParams {
  from: Address
  to: Address
  tokenId: bigint
}

export interface ApproveParams {
  to: Address
  tokenId: bigint
}

export interface SetApprovalForAllParams {
  operator: Address
  approved: boolean
}

// ERC1155 parameters
export interface SafeTransferFromParams {
  from: Address
  to: Address
  id: bigint
  amount: bigint
  data: `0x${string}`
}

export interface SafeBatchTransferFromParams {
  from: Address
  to: Address
  ids: bigint[]
  amounts: bigint[]
  data: `0x${string}`
}

// Batch operation types
export type BatchSearConcordsParams = SearConcordsParams[]
export type BatchTameBeastsParams = TameBeastsParams[]
export type BatchStakeWagdiesParams = StakeWagdiesParams[]
export type BatchUnstakeWagdiesParams = UnstakeWagdiesParams[]
export type BatchChangeWagdieLocationParams = ChangeWagdieLocationParams[]

// Query parameters
export interface OwnershipQueryParams {
  tokenId: bigint
  owner?: Address
}

export interface BalanceQueryParams {
  owner: Address
  tokenId?: bigint
}

export interface StakingQueryParams {
  wagdieId: number
}

export interface LocationQueryParams {
  locationId: bigint
}

export interface SearingQueryParams {
  wagdieId: number
}

// Contract read result types
export interface OwnershipResult {
  owner: Address
  isOwned: boolean
}

export interface BalanceResult {
  balance: bigint
}

export interface StakingResult {
  locationId: bigint
  isStaked: boolean
}

export interface LocationResult {
  name: string
  owner: Address
  nftsLocked: boolean
  exists: boolean
}

export interface SearingResult {
  isSeared: boolean
  isBlocked: boolean
  isTamingEnabled: boolean
  isSearingEnabled: boolean
}
