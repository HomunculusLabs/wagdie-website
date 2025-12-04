'use client'

/**
 * Admin Authentication Hook
 * Checks admin status using wagmi useAccount and lib/auth/admin.ts
 */

import { useAccount, useDisconnect } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { isAdmin } from '@/lib/auth/admin'

export interface UseAdminAuthReturn {
  isConnected: boolean
  isAdmin: boolean
  isLoading: boolean
  address: string | null
  connect: () => void
  disconnect: () => void
}

export function useAdminAuth(): UseAdminAuthReturn {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount()
  const { disconnect } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  const isLoading = isConnecting || isReconnecting
  const adminStatus = isConnected && address ? isAdmin(address) : false

  return {
    isConnected,
    isAdmin: adminStatus,
    isLoading,
    address: address ?? null,
    connect: () => openConnectModal?.(),
    disconnect,
  }
}
