/**
 * Blockchain Chain Configurations
 * Mainnet and Sepolia testnet support
 */

import { Chain } from 'wagmi/chains'

const mainnetRpcUrl =
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://eth.llamarpc.com')

const sepoliaRpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://rpc.sepolia.org')

export const mainnet: Chain = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [mainnetRpcUrl],
    },
    public: {
      http: ['https://eth.llamarpc.com', 'https://rpc.ankr.com/eth'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  contracts: {
    ensRegistry: {
      address: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    },
    ensUniversalResolver: {
      address: '0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62',
      blockCreated: 16773775,
    },
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 14353601,
    },
  },
}

export const sepolia: Chain = {
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'SEP',
  },
  rpcUrls: {
    default: {
      http: [sepoliaRpcUrl],
    },
    public: {
      http: ['https://rpc.sepolia.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 751532,
    },
  },
  testnet: true,
}

// Get supported chains based on environment
export function getSupportedChains(): Chain[] {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.CHAIN_ID

  if (chainId === '11155111') {
    return [sepolia, mainnet]
  }

  return [mainnet, sepolia]
}

// Get primary chain (first in list)
export function getPrimaryChain(): Chain {
  return getSupportedChains()[0]
}

// =============================================================================
// Explorer URL Helpers
// =============================================================================

const EXPLORER_URLS: Record<number, string> = {
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',
}

/**
 * Get the block explorer base URL for a chain
 */
export function getExplorerBaseUrl(chainId: number): string {
  return EXPLORER_URLS[chainId] || EXPLORER_URLS[1]
}

/**
 * Get the block explorer URL for a transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const baseUrl = getExplorerBaseUrl(chainId)
  return `${baseUrl}/tx/${txHash}`
}

/**
 * Get the block explorer URL for an address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const baseUrl = getExplorerBaseUrl(chainId)
  return `${baseUrl}/address/${address}`
}

/**
 * Get the block explorer URL for a token
 */
export function getExplorerTokenUrl(
  chainId: number,
  contractAddress: string,
  tokenId?: number
): string {
  const baseUrl = getExplorerBaseUrl(chainId)
  if (tokenId !== undefined) {
    return `${baseUrl}/nft/${contractAddress}/${tokenId}`
  }
  return `${baseUrl}/token/${contractAddress}`
}
