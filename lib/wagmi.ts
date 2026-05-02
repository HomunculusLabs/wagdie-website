import { createConfig, fallback, http } from 'wagmi'
import { injected, coinbaseWallet } from 'wagmi/connectors'
import type { Chain } from 'wagmi/chains'
import { getSupportedChains, mainnet, sepolia } from './contracts/chains'

// Get supported chains based on environment
const chains = getSupportedChains()

const mainnetRpcUrl =
  process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
  process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://ethereum.publicnode.com')

const sepoliaRpcUrl =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
  (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    : 'https://rpc.sepolia.org')

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
    [mainnet.id]: fallback([
      http(mainnetRpcUrl, {
        batch: true,
        retryCount: 3,
      }),
      http('https://ethereum.publicnode.com', {
        batch: true,
        retryCount: 2,
      }),
      http('https://rpc.flashbots.net', {
        batch: true,
        retryCount: 2,
      }),
    ]),
    [sepolia.id]: http(sepoliaRpcUrl, {
      batch: true,
      retryCount: 3,
    }),
  },
})
