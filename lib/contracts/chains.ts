// Blockchain Chain Configurations
// Mainnet and Sepolia testnet support

import { Chain } from 'wagmi/chains'

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
      http: [
        process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
          'https://eth-mainnet.g.alchemy.com/v2/' + process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      ],
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
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
          'https://eth-sepolia.g.alchemy.com/v2/' + process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
      ],
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
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID

  if (chainId === '11155111') {
    return [sepolia, mainnet]
  }

  return [mainnet, sepolia]
}

// Get primary chain (first in list)
export function getPrimaryChain(): Chain {
  return getSupportedChains()[0]
}
