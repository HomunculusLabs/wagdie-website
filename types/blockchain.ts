// Blockchain Type Definitions
// Core types for blockchain interactions and state management

import { Address as ViemAddress, Hash } from 'viem'

// Address types
export type Address = ViemAddress
export type TransactionHash = Hash

// Transaction status
export enum TransactionStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  SUCCESS = 'success',
  ERROR = 'error',
}

// Transaction state
export interface TransactionState {
  hash?: TransactionHash
  status: TransactionStatus
  error?: string
  confirmations?: number
}

// Token balance
export interface TokenBalance {
  tokenId: bigint
  balance: bigint
  contractAddress: Address
  tokenType: 'ERC721' | 'ERC1155'
}

// Character ownership
export interface CharacterOwnership {
  tokenId: bigint
  owner: Address
  isOwned: boolean
  contractAddress: Address
}

// Staking status
export interface StakingStatus {
  tokenId: bigint
  isStaked: boolean
  locationId?: bigint
  locationName?: string
  locationOwner?: Address
  nftsLocked?: boolean
}

// Searing status
export interface SearingStatus {
  tokenId: bigint
  isSeared: boolean
  isBlocked: boolean
  canSear: boolean
}

// Location info
export interface LocationInfo {
  locationId: bigint
  name: string
  owner: Address
  nftsLocked: boolean
  exists: boolean
}

// Contract error types
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

// Blockchain configuration
export interface BlockchainConfig {
  chainId: number
  alchemyApiKey?: string
  rpcUrl?: string
}

// Multi-call result
export interface MultiCallResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Contract call options
export interface ContractCallOptions {
  gas?: bigint
  gasPrice?: bigint
  value?: bigint
}

// Pagination
export interface PaginationParams {
  offset: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
}
