import { createConfig, http } from 'wagmi'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import type { Chain } from 'wagmi/chains'
import { getSupportedChains, mainnet, sepolia } from './contracts/chains'

// Get supported chains based on environment
const chains = getSupportedChains()

export const config = createConfig({
  chains: chains as unknown as readonly [Chain, ...Chain[]],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: 'WAGDIE',
      preference: 'eoaOnly', // Only Externally Owned Accounts (no smart wallets)
    }),
  ],
  ssr: true,
  transports: {
    [mainnet.id]: http(
      process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      {
        batch: true,
        retryCount: 3,
      }
    ),
    [sepolia.id]: http(
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      {
        batch: true,
        retryCount: 3,
      }
    ),
  },
})
