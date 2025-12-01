/**
 * Contract Hook Interfaces
 *
 * TypeScript interfaces defining the contract for all blockchain interaction hooks.
 * These interfaces serve as the contract between the UI components and the
 * wagmi/viem implementation layer.
 */

import type { Address } from 'viem';

// =============================================================================
// Common Types
// =============================================================================

export type TransactionHash = `0x${string}`;

export interface TransactionState {
  /** Whether a transaction is in progress */
  isPending: boolean;

  /** Whether the transaction was confirmed */
  isConfirmed: boolean;

  /** Whether the transaction failed */
  isError: boolean;

  /** Error object if transaction failed */
  error: Error | null;

  /** Transaction hash (available after submission) */
  hash: TransactionHash | null;

  /** Reset state for new transaction */
  reset: () => void;
}

// =============================================================================
// Read Hooks
// =============================================================================

/**
 * Hook for reading token balances from blockchain
 */
export interface UseTokenBalancesReturn {
  /** Corpse token balance (ERC-1155) */
  corpseBalance: bigint;

  /** Mushroom/concord token balance (Token ID 15) */
  mushroomBalance: bigint;

  /** ETH balance */
  ethBalance: bigint;

  /** Array of owned WAGDIE character token IDs */
  ownedCharacters: number[];

  /** Whether balances are loading */
  isLoading: boolean;

  /** Whether there was an error fetching balances */
  isError: boolean;

  /** Refetch all balances */
  refetch: () => Promise<void>;
}

/**
 * Hook for reading infection price from contract
 */
export interface UseInfectionPriceReturn {
  /** Price in wei to infect a specific character */
  price: bigint;

  /** Price formatted as ETH string */
  priceFormatted: string;

  /** Whether price is loading */
  isLoading: boolean;

  /** Whether there was an error */
  isError: boolean;
}

/**
 * Hook for checking character ownership
 */
export interface UseCharacterOwnershipReturn {
  /** Whether connected wallet owns the specified character */
  isOwner: boolean;

  /** Owner address of the character */
  ownerAddress: Address | null;

  /** Whether ownership check is loading */
  isLoading: boolean;

  /** Whether there was an error */
  isError: boolean;
}

// =============================================================================
// Write Hooks
// =============================================================================

/**
 * Hook for burning corpse tokens to receive mushrooms
 *
 * @contract Tokens Of Concord (0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634)
 * @function burn(address account, uint256 id, uint256 value)
 */
export interface UseBurnCorpsesReturn extends TransactionState {
  /**
   * Execute burn transaction
   * @param amount Number of corpse tokens to burn
   * @returns Transaction hash
   */
  burn: (amount: number) => Promise<TransactionHash>;

  /** Whether user has sufficient corpse balance */
  canBurn: boolean;
}

/**
 * Hook for spreading infections randomly
 *
 * @contract TBD (may be off-chain or undocumented contract)
 * @function spreadInfections(uint256 count)
 */
export interface UseSpreadInfectionsReturn extends TransactionState {
  /**
   * Execute spread transaction
   * @param count Number of mushrooms to use for spreading
   * @returns Transaction hash
   */
  spread: (count: number) => Promise<TransactionHash>;

  /** Whether user has sufficient mushroom balance */
  canSpread: boolean;
}

/**
 * Hook for infecting a specific character
 *
 * @contract TBD (may be off-chain or undocumented contract)
 * @function infectWagdie(uint256 tokenId) payable
 * @value 0.0025 ETH (or contract-specified amount)
 */
export interface UseInfectCharacterReturn extends TransactionState {
  /**
   * Execute targeted infection transaction
   * @param tokenId Target character token ID (1-6666)
   * @returns Transaction hash
   */
  infect: (tokenId: number) => Promise<TransactionHash>;

  /** Whether user has sufficient ETH and mushrooms */
  canInfect: boolean;

  /** Required ETH amount for infection */
  requiredEth: bigint;
}

/**
 * Hook for curing an infected character
 *
 * @contract TBD (may be part of main WAGDIE contract)
 * @function cure(uint256 tokenId)
 */
export interface UseCureCharacterReturn extends TransactionState {
  /**
   * Execute cure transaction
   * @param tokenId Character token ID to cure (must be owned by caller)
   * @returns Transaction hash
   */
  cure: (tokenId: number) => Promise<TransactionHash>;

  /** Whether caller owns the character */
  canCure: boolean;
}

/**
 * Hook for searing (burning) a concord for permanent effects
 *
 * @contract Tokens Of Concord (0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634)
 * @function burn(address account, uint256 id, uint256 value)
 */
export interface UseSearConcordReturn extends TransactionState {
  /**
   * Execute sear transaction
   * @param characterTokenId Character to apply effects to
   * @param concordTokenId Concord token ID to burn
   * @returns Transaction hash
   */
  sear: (characterTokenId: number, concordTokenId: number) => Promise<TransactionHash>;

  /** Whether caller owns the character and has the concord */
  canSear: boolean;
}

// =============================================================================
// Hook Factory Types
// =============================================================================

/**
 * Configuration for contract hooks
 */
export interface ContractHookConfig {
  /** Connected wallet address */
  address: Address | undefined;

  /** Whether wallet is connected */
  isConnected: boolean;

  /** Chain ID (1 for mainnet) */
  chainId: number | undefined;

  /** Callback when transaction is submitted */
  onTransactionSubmitted?: (hash: TransactionHash) => void;

  /** Callback when transaction is confirmed */
  onTransactionConfirmed?: (hash: TransactionHash) => void;

  /** Callback when transaction fails */
  onTransactionFailed?: (error: Error) => void;
}

// =============================================================================
// Contract Addresses
// =============================================================================

export interface ContractAddresses {
  /** Main WAGDIE NFT contract (ERC-721A) */
  WAGDIE_NFT: Address;

  /** Tokens Of Concord contract (ERC-1155) */
  TOKENS_OF_CONCORD: Address;

  /** Spread/infection contract (TBD) */
  SPREAD?: Address;
}

export const MAINNET_ADDRESSES: ContractAddresses = {
  WAGDIE_NFT: '0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A',
  TOKENS_OF_CONCORD: '0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634',
  // SPREAD address TBD pending research
};

// =============================================================================
// Token IDs
// =============================================================================

export const CONCORD_TOKEN_IDS = {
  STRANGE_MUSHROOM: 15,
  HER_ASH: 3,
  ARTIFICERS_CRYSTAL: 7,
  SEERS_GEM: 30,
  MONAD_CARVING: 36,
} as const;

export type ConcordTokenId = typeof CONCORD_TOKEN_IDS[keyof typeof CONCORD_TOKEN_IDS];
