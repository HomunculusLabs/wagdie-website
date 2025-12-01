/**
 * useAuth Hook
 * Application layer - Authentication state and SIWE flow
 * Combines wallet connection with SIWE authentication
 */

'use client'

import { useState, useEffect } from 'react'
import { useSignMessage } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useWallet } from './useWallet'
import { api } from '@/lib/api'
import type { WalletAuthError } from '@/types/wallet'

/**
 * Authentication hook return type
 */
export interface UseAuthReturn {
  address: string | undefined
  isConnected: boolean
  isAuthenticated: boolean
  isAuthenticating: boolean
  error: WalletAuthError | null
  connect: () => void
  disconnect: () => Promise<void>
  authenticate: () => Promise<void>
  clearError: () => void
}

/**
 * Custom hook for wallet authentication with SIWE
 * Manages the complete auth flow: connect → sign → verify → session
 */
export function useAuth(): UseAuthReturn {
  const wallet = useWallet()
  const { signMessageAsync } = useSignMessage()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<WalletAuthError | null>(null)

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (wallet.address && !isAuthenticated && !isAuthenticating) {
      authenticate()
    }
  }, [wallet.address])

  /**
   * Authenticate with SIWE
   */
  const authenticate = async () => {
    if (!wallet.address) {
      setError({ message: 'No wallet address found', step: 'wallet' })
      return
    }

    try {
      setIsAuthenticating(true)
      setError(null)

      // Step 1: Get nonce
      const { nonce } = await api.auth.getNonce(wallet.address)

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
        address: wallet.address,
        statement: 'Sign in to WAGDIE',
        uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        version: '1',
        chainId: 1,
        nonce,
      })

      const preparedMessage = message.prepareMessage()

      // Step 3: Sign message
      const signature = await signMessageAsync({ message: preparedMessage })

      // Step 4: Verify signature
      const { success } = await api.auth.verify({
        address: wallet.address,
        signature,
        message: preparedMessage,
      })

      if (success) {
        setIsAuthenticated(true)
      } else {
        throw new Error('Authentication failed')
      }
    } catch (err: any) {
      console.error('SIWE authentication error:', err)

      // User rejected signature
      if (err.message?.includes('User rejected') || err.code === 'ACTION_REJECTED') {
        setError({ message: 'Signature rejected', step: 'signing' })
      } else {
        setError({
          message: err.message || 'Authentication failed. Please try again.',
          step: 'verifying',
        })
      }
    } finally {
      setIsAuthenticating(false)
    }
  }

  /**
   * Disconnect wallet and clear session
   */
  const disconnect = async () => {
    try {
      // Clear backend session
      await api.auth.logout()

      // Disconnect wallet
      await wallet.disconnect()

      // Clear local state
      setIsAuthenticated(false)
      setError(null)
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null)
  }

  return {
    address: wallet.address,
    isConnected: wallet.isConnected,
    isAuthenticated,
    isAuthenticating,
    error,
    connect: wallet.connect,
    disconnect,
    authenticate,
    clearError,
  }
}
