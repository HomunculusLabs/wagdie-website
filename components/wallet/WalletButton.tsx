'use client'

import React from 'react';
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

/**
 * WalletButton Component
 *
 * Displays wallet connection status and provides connect/disconnect functionality.
 */
export function WalletButton() {
  const { address, isConnected, isAuthenticating, connect, disconnect } = useAuth()

  const truncateAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isConnected && address) {
    return (
      <Button
        variant="secondary"
        onClick={disconnect}
        title="Click to disconnect"
      >
        {truncateAddress(address)}
      </Button>
    )
  }

  return (
    <Button
      variant="primary"
      onClick={connect}
      isLoading={isAuthenticating}
    >
      Connect Wallet
    </Button>
  )
}
