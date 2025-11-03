/**
 * WagdieWorld Smart Contract Integration Service
 *
 * This service provides a high-level interface to the WagdieWorld blockchain contract
 * for staking, moving, and unstaking WAGDIE characters. It abstracts the complexity
 * of direct blockchain interactions and provides type-safe functions.
 *
 * BLOCKCHAIN ARCHITECTURE
 * ========================
 *
 * The WagdieWorld contract operates on Ethereum and uses the ERC-721 standard for NFT
 * ownership. Characters are represented as ERC-721 tokens, and locations are stored
 * on-chain with each character's staking position.
 *
 * CONTRACT FUNCTIONS
 * ==================
 *
 * 1. stakeWagdies(params[])
 *    - Purpose: Stake one or more characters to specific locations
 *    - Gas Cost: ~150,000 gas per character
 *    - Parameters: Array of { wagdieId: uint256, locationId: uint256 }
 *    - Requirements: User must own the character (ERC-721 owner)
 *    - Effects: Character is now staked at the specified location
 *
 * 2. changeWagdieLocations(params[])
 *    - Purpose: Move staked characters to different locations
 *    - Gas Cost: ~120,000 gas per character
 *    - Parameters: Array of { wagdieId: uint256, newLocationId: uint256 }
 *    - Requirements: Character must already be staked
 *    - Effects: Character's location is updated on-chain
 *
 * 3. unstakeWagdies(params[])
 *    - Purpose: Unstake characters from their current locations
 *    - Gas Cost: ~100,000 gas per character
 *    - Parameters: Array of { wagdieId: uint256 }
 *    - Requirements: Character must be staked
 *    - Effects: Character is no longer staked anywhere
 *
 * TRANSACTION FLOW
 * ================
 *
 * When a user interacts with the map feature:
 *
 * 1. UI calls hook function (stake/move/unstake)
 * 2. Hook uses wagmi's useWriteContract to initiate transaction
 * 3. User's wallet prompts to sign the transaction
 * 4. Transaction is broadcast to Ethereum network
 * 5. wagmi's useWaitForTransactionReceipt monitors for confirmation
 * 6. On success: handleTransactionConfirmation() updates Supabase cache
 * 7. UI updates to reflect new state
 *
 * ERROR HANDLING
 * ==============
 *
 * Common blockchain errors and their handling:
 *
 * - NotOwnerError: User doesn't own the character
 *   → Display: "You don't own this character"
 *
 * - AlreadyStakedError: Character is already staked
 *   → Display: "Character is already staked"
 *
 * - NotStakedError: Character is not staked (for move/unstake)
 *   → Display: "Character is not staked"
 *
 * - InvalidLocationError: Location doesn't exist
 *   → Display: "Invalid location selected"
 *
 * - SameLocationError: Moving to the same location
 *   → Display: "Character is already at this location"
 *
 * GAS CONSIDERATIONS
 * =================
 *
 * Batch Operations: Multiple characters can be staked/moved in a single transaction
 * to save on gas costs. The UI supports this via arrays of parameters.
 *
 * Gas Estimates:
 * - Single stake: ~150,000 gas
 * - Batch of 5 stakes: ~200,000 gas (40% savings per character)
 *
 * NETWORK CONSIDERATIONS
 * ======================
 *
 * - Mainnet: Full transaction costs, slow confirmation
 * - Testnet: Free test transactions for development
 * - Private Network: Custom deployment for testing
 *
 * The contract address is configurable via environment variables to support
 * different networks without code changes.
 *
 * SECURITY CONSIDERATIONS
 * =======================
 *
 * - All contract interactions require user signature (no server-side signing)
 * - Ownership is verified on-chain via ERC-721 ownerOf() function
 * - No arbitrary code execution (view/pure functions are safe)
 * - State changes require explicit user approval in wallet
 *
 * CACHING STRATEGY
 * ================
 *
 * On-chain data is cached in Supabase for performance:
 * - character_locations: Current staking positions
 * - location_transactions: Transaction history
 *
 * Cache is updated after successful blockchain transactions to provide
 * immediate UI feedback while ensuring eventual consistency with on-chain state.
 */

import { parseEther, getAddress } from 'viem'
import {
  ContractAddress,
  StakeWagdieContractParams,
  ChangeWagdieLocationContractParams,
  UnstakeWagdieContractParams,
  ContractTransactionStatus,
  WagdieWorldContractError,
  isNotOwnerError,
  isAlreadyStakedError,
  isNotStakedError,
  isInvalidLocationError,
  isSameLocationError,
} from '@/types/wagdie-world'

// Contract ABI from contracts/wagdie-world-contract.md
export const wagdieWorldAbi = [
  {
    type: 'function',
    name: 'getLocation',
    stateMutability: 'view',
    inputs: [{ name: 'characterId', type: 'uint256' }],
    outputs: [
      { name: 'locationId', type: 'uint256' },
      { name: 'staked', type: 'bool' }
    ]
  },
  {
    type: 'function',
    name: 'getAllLocations',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      {
        name: 'locations',
        type: 'tuple[]',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'name', type: 'string' },
          { name: 'metadata', type: 'string' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'owner', type: 'address' }]
  },
  {
    type: 'function',
    name: 'stakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' },
          { name: 'locationId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'changeWagdieLocations',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' },
          { name: 'newLocationId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'unstakeWagdies',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple[]',
        components: [
          { name: 'wagdieId', type: 'uint256' }
        ]
      }
    ],
    outputs: []
  }
] as const

/**
 * Get WagdieWorld contract address from environment
 * @returns ContractAddress - Ethereum address of the contract
 * @throws Error if environment variable not set
 */
function getContractAddress(): ContractAddress {
  const address = process.env.WAGDIE_WORLD_CONTRACT_ADDRESS

  if (!address) {
    throw new Error('WAGDIE_WORLD_CONTRACT_ADDRESS environment variable not set')
  }

  if (address === '0x0000000000000000000000000000000000000000') {
    throw new Error('WAGDIE_WORLD_CONTRACT_ADDRESS not configured - please set actual contract address')
  }

  return getAddress(address)
}

/**
 * Get wagdieWorld contract configuration
 * @returns Contract configuration object
 */
export function getWagdieWorldContract() {
  return {
    address: getContractAddress(),
    abi: wagdieWorldAbi,
  }
}

/**
 * Get current location of a character from blockchain
 * @param characterId - WAGDIE token ID as bigint
 * @returns Promise<{ locationId: bigint; staked: boolean }>
 * @throws Error if contract call fails
 */
export async function getCharacterLocationOnChain(characterId: bigint): Promise<{ locationId: bigint; staked: boolean }> {
  // This function would be used with wagmi's useReadContract
  // For now, it's a placeholder that shows the expected API
  throw new Error('getCharacterLocationOnChain requires wagmi integration - use wagmi hooks instead')
}

/**
 * Stake characters to locations
 * @param params - Array of { wagdieId, locationId }
 * @returns Transaction hash
 * @throws WagdieWorldContractError on failure
 */
export async function stakeWagdies(
  params: StakeWagdieContractParams[]
): Promise<ContractTransactionStatus> {
  // This function would be used with wagmi's useWriteContract
  // For now, it's a placeholder that shows the expected API
  throw new Error('stakeWagdies requires wagmi integration - use wagmi hooks instead')
}

/**
 * Change locations of already staked characters
 * @param params - Array of { wagdieId, newLocationId }
 * @returns Transaction hash
 * @throws WagdieWorldContractError on failure
 */
export async function changeWagdieLocations(
  params: ChangeWagdieLocationContractParams[]
): Promise<ContractTransactionStatus> {
  // This function would be used with wagmi's useWriteContract
  // For now, it's a placeholder that shows the expected API
  throw new Error('changeWagdieLocations requires wagmi integration - use wagmi hooks instead')
}

/**
 * Unstake characters from their current locations
 * @param params - Array of { wagdieId }
 * @returns Transaction hash
 * @throws WagdieWorldContractError on failure
 */
export async function unstakeWagdies(
  params: UnstakeWagdieContractParams[]
): Promise<ContractTransactionStatus> {
  // This function would be used with wagmi's useWriteContract
  // For now, it's a placeholder that shows the expected API
  throw new Error('unstakeWagdies requires wagmi integration - use wagmi hooks instead')
}

/**
 * Check if wallet owns a character
 * @param characterId - WAGDIE token ID as bigint
 * @param ownerAddress - Wallet address to check
 * @returns Promise<boolean> - True if wallet owns character
 */
export async function checkCharacterOwnership(
  characterId: bigint,
  ownerAddress: ContractAddress
): Promise<boolean> {
  // This function would be used with wagmi's useReadContract
  // For now, it's a placeholder
  throw new Error('checkCharacterOwnership requires wagmi integration - use wagmi hooks instead')
}

/**
 * Format contract error for user-friendly display
 * @param error - Contract error object
 * @returns User-friendly error message
 */
export function formatContractError(error: WagdieWorldContractError): string {
  if (isNotOwnerError(error)) {
    return 'You do not own this character. Please connect the correct wallet.'
  }

  if (isAlreadyStakedError(error)) {
    return 'This character is already staked. Try moving it instead.'
  }

  if (isNotStakedError(error)) {
    return 'This character is not currently staked. Try staking it first.'
  }

  if (isInvalidLocationError(error)) {
    return 'Invalid location selected. Please choose a valid location.'
  }

  if (isSameLocationError(error)) {
    return 'Character is already at this location. Please select a different location.'
  }

  // Generic error messages for other cases
  if (error?.message) {
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Estimate gas for a staking operation
 * @param operation - Type of operation
 * @param count - Number of characters
 * @returns Estimated gas in wei
 */
export function estimateGas(
  operation: 'stake' | 'move' | 'unstake',
  count: number
): bigint {
  const gasEstimates = {
    stake: 120000n, // ~120,000 gas per character
    move: 100000n, // ~100,000 gas per character
    unstake: 80000n, // ~80,000 gas per character
  }

  const gasPerOperation = gasEstimates[operation]
  return gasPerOperation * BigInt(count)
}

/**
 * Validate staking parameters before sending transaction
 * @param params - Staking parameters to validate
 * @throws Error if parameters are invalid
 */
export function validateStakeParams(params: StakeWagdieContractParams[]): void {
  if (!params || params.length === 0) {
    throw new Error('No characters provided for staking')
  }

  params.forEach((param, index) => {
    if (param.wagdieId <= 0n) {
      throw new Error(`Invalid wagdieId at index ${index}: must be greater than 0`)
    }

    if (param.locationId <= 0n) {
      throw new Error(`Invalid locationId at index ${index}: must be greater than 0`)
    }
  })
}

/**
 * Validate move parameters before sending transaction
 * @param params - Move parameters to validate
 * @throws Error if parameters are invalid
 */
export function validateMoveParams(params: ChangeWagdieLocationContractParams[]): void {
  if (!params || params.length === 0) {
    throw new Error('No characters provided for moving')
  }

  params.forEach((param, index) => {
    if (param.wagdieId <= 0n) {
      throw new Error(`Invalid wagdieId at index ${index}: must be greater than 0`)
    }

    if (param.newLocationId <= 0n) {
      throw new Error(`Invalid newLocationId at index ${index}: must be greater than 0`)
    }
  })
}

/**
 * Validate unstake parameters before sending transaction
 * @param params - Unstake parameters to validate
 * @throws Error if parameters are invalid
 */
export function validateUnstakeParams(params: UnstakeWagdieContractParams[]): void {
  if (!params || params.length === 0) {
    throw new Error('No characters provided for unstaking')
  }

  params.forEach((param, index) => {
    if (param.wagdieId <= 0n) {
      throw new Error(`Invalid wagdieId at index ${index}: must be greater than 0`)
    }
  })
}

/**
 * Convert location ID from string (Supabase) to bigint (contract)
 * @param locationId - Location ID as string
 * @returns bigint for contract call
 */
export function locationIdStringToBigInt(locationId: string): bigint {
  // If location IDs are numeric strings in Supabase
  // Convert them to bigint for contract calls
  return BigInt(locationId)
}

/**
 * Convert character ID from string (Supabase) to bigint (contract)
 * @param characterId - Character ID as string
 * @returns bigint for contract call
 */
export function characterIdStringToBigInt(characterId: string): bigint {
  return BigInt(characterId)
}
