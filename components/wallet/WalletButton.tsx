'use client'

import { useAuth } from '@/hooks/useAuth'

/**
 * WalletButton Component
 *
 * Displays wallet connection status and provides connect/disconnect functionality.
 * Shows "Connect Wallet" button when disconnected, or truncated address when connected.
 * Uses clean architecture: presentation layer only
 *
 * @component
 * @example
 * ```tsx
 * import { WalletButton } from '@/components/wallet/WalletButton'
 *
 * function Header() {
 *   return (
 *     <header>
 *       <WalletButton />
 *     </header>
 *   )
 * }
 * ```
 *
 * States:
 * - **Disconnected**: Shows "Connect Wallet" button (btn-primary style)
 * - **Connecting**: Shows loading spinner with "Connecting..." text
 * - **Connected**: Shows truncated address (0x1234...5678) as clickable button
 *
 * Accessibility:
 * - Minimum 44x44px touch target for mobile
 * - Disabled state during connection
 * - Title attribute on connected state for full address tooltip
 */
export function WalletButton() {
  const { address, isConnected, isAuthenticating, connect, disconnect } = useAuth()

  /**
   * Truncate Ethereum address to "0x1234...5678" format
   */
  const truncateAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Loading state
  if (isAuthenticating) {
    return (
      <button className="btn-primary" disabled>
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting...
        </span>
      </button>
    )
  }

  // Connected state - show address
  if (isConnected && address) {
    return (
      <button
        className="btn-secondary min-h-[44px] min-w-[44px]"
        onClick={disconnect}
        title="Click to disconnect"
      >
        {truncateAddress(address)}
      </button>
    )
  }

  // Disconnected state - show connect button
  return (
    <button
      className="btn-primary min-h-[44px] min-w-[44px]"
      onClick={connect}
    >
      Connect Wallet
    </button>
  )
}
