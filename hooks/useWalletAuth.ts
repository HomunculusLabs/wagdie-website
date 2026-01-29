'use client'

import { useAccount, useDisconnect, useSignMessage } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { useState, useEffect, useCallback, useRef } from 'react'
import { SiweMessage } from 'siwe'
import type { Address, WalletAuthError } from '@/types/wallet'

/**
 * useWalletAuth Hook
 *
 * Integrates wagmi wallet connection with SIWE (Sign-In with Ethereum) authentication.
 * Manages the complete authentication flow: wallet connect → get nonce → sign → verify → session.
 *
 * @returns {Object} Wallet and authentication state with actions
 * @property {Address | null} address - Connected wallet address (checksummed)
 * @property {number} chainId - Current chain ID (always 1 for Ethereum Mainnet)
 * @property {boolean} isConnected - Whether wallet is connected
 * @property {boolean} isConnecting - Whether wallet connection is in progress
 * @property {WalletStatus} walletStatus - Current wallet connection status
 * @property {boolean} isAuthenticated - Whether user is authenticated via SIWE
 * @property {boolean} isAuthenticating - Whether SIWE authentication is in progress
 * @property {SIWEStep} siweStep - Current step in SIWE authentication flow
 * @property {Function} connect - Opens RainbowKit wallet connection modal
 * @property {Function} disconnect - Disconnects wallet and clears session
 * @property {Function} authenticate - Manually trigger SIWE authentication
 * @property {WalletAuthError | null} error - Current error state, if any
 * @property {Function} clearError - Clears the current error state
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { address, isAuthenticated, connect, disconnect } = useWalletAuth()
 *
 *   if (!isAuthenticated) {
 *     return <button onClick={connect}>Connect Wallet</button>
 *   }
 *
 *   return <button onClick={disconnect}>{address}</button>
 * }
 * ```
 */
export function useWalletAuth() {
  const { address, isConnected, isConnecting } = useAccount()
  const { openConnectModal } = useConnectModal()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<WalletAuthError | null>(null)

  // Use ref to track if auth has been attempted for current address
  const authAttemptedRef = useRef<string | null>(null)

  /**
   * Authenticate with SIWE (Sign-In with Ethereum)
   *
   * Flow:
   * 1. Fetch nonce from backend
   * 2. Create and sign SIWE message
   * 3. Verify signature with backend
   * 4. Set authenticated state on success
   */
  const authenticateWithSIWE = useCallback(async () => {
    if (!address) {
      setError({ message: 'No wallet address found', step: 'wallet' })
      return
    }

    try {
      setIsAuthenticating(true)
      setError(null)

      // Step 1: Get nonce from backend
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })

      if (!nonceRes.ok) {
        throw new Error('Failed to fetch nonce')
      }

      const { nonce } = await nonceRes.json()

      // Step 2: Create SIWE message
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to WAGDIE',
        uri: window.location.origin,
        version: '1',
        chainId: 1, // Ethereum Mainnet
        nonce,
      })

      const preparedMessage = message.prepareMessage()

      // Step 3: Sign message with wallet
      const signature = await signMessageAsync({ message: preparedMessage })

      // Step 4: Verify signature with backend
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          signature,
          message: preparedMessage,
        }),
      })

      if (!verifyRes.ok) {
        throw new Error('Signature verification failed')
      }

      const { success } = await verifyRes.json()

      if (success) {
        setIsAuthenticated(true)
      } else {
        throw new Error('Authentication failed')
      }
    } catch (err: unknown) {
      console.error('SIWE authentication error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      const errorCode = (err as { code?: string })?.code

      // User rejected signature request
      if (errorMessage.includes('User rejected') || errorCode === 'ACTION_REJECTED') {
        setError({ message: 'Signature rejected', step: 'signing' })
      } else {
        setError({
          message: errorMessage || 'Authentication failed. Please try again.',
          step: 'verifying',
        })
      }
    } finally {
      setIsAuthenticating(false)
    }
  }, [address, signMessageAsync])

  // Auto-authenticate when wallet connects (with proper dependency tracking)
  useEffect(() => {
    // Only attempt auth once per address
    if (address && !isAuthenticated && !isAuthenticating && authAttemptedRef.current !== address) {
      authAttemptedRef.current = address
      authenticateWithSIWE()
    }

    // Reset auth attempt tracking when address changes
    if (!address) {
      authAttemptedRef.current = null
    }
  }, [address, isAuthenticated, isAuthenticating, authenticateWithSIWE])

  /**
   * Disconnect wallet and clear session
   */
  const handleDisconnect = useCallback(async () => {
    try {
      // Clear backend session
      await fetch('/api/auth/logout', { method: 'POST' })

      // Disconnect wallet
      await disconnectAsync()

      // Clear local state
      setIsAuthenticated(false)
      setError(null)
      authAttemptedRef.current = null
    } catch (err) {
      console.error('Disconnect error:', err)
    }
  }, [disconnectAsync])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // Wallet state
    address: address as Address | null,
    chainId: 1, // Only supporting Mainnet
    isConnected,
    isConnecting,
    walletStatus: isConnecting
      ? 'connecting'
      : isConnected
      ? 'connected'
      : 'disconnected',

    // Authentication state
    isAuthenticated,
    isAuthenticating,
    siweStep: isAuthenticating
      ? 'signing'
      : isAuthenticated
      ? 'complete'
      : 'idle',

    // Actions
    connect: openConnectModal,
    disconnect: handleDisconnect,
    authenticate: authenticateWithSIWE,

    // Error handling
    error,
    clearError,
  }
}
