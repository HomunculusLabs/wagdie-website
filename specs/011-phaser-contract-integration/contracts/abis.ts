/**
 * Contract ABIs for WAGDIE Integration
 *
 * Partial ABIs containing only the functions needed for the integration.
 * Full ABIs can be obtained from Etherscan for the verified contracts.
 */

// =============================================================================
// WAGDIE NFT Contract (ERC-721A)
// Address: 0x659A4BdaAaCc62d2bd9Cb18225D9C89b5B697A5A
// =============================================================================

export const WAGDIE_NFT_ABI = [
  // Read functions
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Enumeration (ERC-721 Enumerable)
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// =============================================================================
// Tokens Of Concord Contract (ERC-1155)
// Address: 0x1d38150f1Fd989Fb89Ab19518A9C4E93C5554634
// =============================================================================

export const TOKENS_OF_CONCORD_ABI = [
  // Read functions
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'id', type: 'uint256' }],
    name: 'uri',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'ids', type: 'uint256[]' },
      { name: 'values', type: 'uint256[]' },
    ],
    name: 'burnMany',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'id', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // ERC-2981 Royalty Info
  {
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' },
    ],
    name: 'royaltyInfo',
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'operator', type: 'address' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'id', type: 'uint256' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    name: 'TransferSingle',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'operator', type: 'address' },
      { indexed: true, name: 'from', type: 'address' },
      { indexed: true, name: 'to', type: 'address' },
      { indexed: false, name: 'ids', type: 'uint256[]' },
      { indexed: false, name: 'values', type: 'uint256[]' },
    ],
    name: 'TransferBatch',
    type: 'event',
  },
] as const;

// =============================================================================
// Standard ERC-20 ABI (for ETH balance via viem)
// =============================================================================

export const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// =============================================================================
// Placeholder: Spread/Infection Contract ABI
// Address: TBD - functions documented but contract not yet identified
// =============================================================================

/**
 * NOTE: These function signatures are based on the existing codebase
 * (wallet-service.ts) but the actual contract has not been identified.
 * Implementation may need to be off-chain or use a different approach.
 */
export const SPREAD_CONTRACT_ABI_PLACEHOLDER = [
  // Spread infections randomly
  {
    inputs: [{ name: 'count', type: 'uint256' }],
    name: 'spreadInfections',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Infect specific character (payable)
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'infectWagdie',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  // Cure infected character
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'cure',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Read infection price
  {
    inputs: [],
    name: 'infectionPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Check if character is infected
  {
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    name: 'isInfected',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// =============================================================================
// Type exports for viem compatibility
// =============================================================================

export type WagdieNftAbi = typeof WAGDIE_NFT_ABI;
export type TokensOfConcordAbi = typeof TOKENS_OF_CONCORD_ABI;
export type SpreadContractAbi = typeof SPREAD_CONTRACT_ABI_PLACEHOLDER;
