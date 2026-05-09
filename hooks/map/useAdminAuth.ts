'use client'

/**
 * Admin Authentication Hook
 * Checks admin status using wagmi useAccount and lib/auth/admin.ts
 */

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { isAdmin } from '@/lib/auth/admin'

export interface UseAdminAuthReturn {
  isConnected: boolean
  isAdmin: boolean
  isLoading: boolean
  address: string | null
  connect: () => void
  connectInjected: () => void
  disconnect: () => void
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors, isPending } = useConnect()
  const { openConnectModal } = useConnectModal()

  const isLoading = isConnecting || isReconnecting || isPending
  const adminStatus = isConnected && address ? isAdmin(address) : false

  const injectedConnector = connectors.find((connector) => connector.id === 'injected') ?? connectors[0]

  const connectInjected = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector })
    }
  }

  return {
    isConnected,
    isAdmin: adminStatus,
    isLoading,
    address: address ?? null,
    connect: () => {
      if (openConnectModal) {
        openConnectModal()
        return
      }

      connectInjected()
    },
    connectInjected,
    disconnect,
  }
}
