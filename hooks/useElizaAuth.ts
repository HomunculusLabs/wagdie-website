/**
 * useElizaAuth Hook
 * Manages Eliza authentication state and token lifecycle.
 * Orchestrates the full SIWE flow: GET cached token, or POST nonce + sign + POST verify.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import type { TokenResponse, ElizaAuthNonceResponse } from '@/types/eliza'

interface UseElizaAuthReturn {
  /** Current access token (if authenticated) */
  accessToken: string | null
  /** Whether we have a valid token */
  isAuthenticated: boolean
  /** Whether authentication is in progress */
  isAuthenticating: boolean
  /** Current step in auth flow */
  authStep: 'idle' | 'checking' | 'nonce' | 'signing' | 'verifying' | 'complete' | 'error'
  /** Get or refresh the access token */
  getToken: () => Promise<string | null>
  /** Clear authentication state */
  clearAuth: () => void
  /** Error message if authentication failed */
  error: string | null
}

// Token refresh buffer (5 minutes before expiry)
const REFRESH_BUFFER_MS = 5 * 60 * 1000

export function useElizaAuth(): UseElizaAuthReturn {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authStep, setAuthStep] = useState<UseElizaAuthReturn['authStep']>('idle')
  const [error, setError] = useState<string | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAccessToken(null)
      setExpiresAt(null)
      setError(null)
      setAuthStep('idle')
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [isConnected])

  // Schedule token refresh
  const scheduleRefresh = useCallback(
    (expiry: number, getTokenFn: () => Promise<string | null>) => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      const refreshTime = expiry - Date.now() - REFRESH_BUFFER_MS
      if (refreshTime > 0) {
        refreshTimeoutRef.current = setTimeout(async () => {
          try {
            // Try to get a fresh token
            await getTokenFn()
          } catch (err) {
            console.error('[useElizaAuth] Token refresh failed:', err)
          }
        }, refreshTime)
      }
    },
    []
  )

  // Get or refresh token
  const getToken = useCallback(async (): Promise<string | null> => {
    // Return cached token if still valid
    if (accessToken && expiresAt && expiresAt > Date.now() + 60000) {
      return accessToken
    }

    // Need to authenticate
    if (!isConnected || !address) {
      setError('Wallet not connected')
      return null
    }

    setIsAuthenticating(true)
    setError(null)
    setAuthStep('checking')

    try {
      // Step 1: Check for existing valid token via GET
      const statusResponse = await fetch('/api/eliza/auth', {
        method: 'GET',
        credentials: 'include',
      })

      if (statusResponse.ok) {
        // Token exists and is valid
        const data: TokenResponse = await statusResponse.json()
        setAccessToken(data.accessToken)
        const newExpiry = new Date(data.expiresAt).getTime()
        setExpiresAt(newExpiry)
        setAuthStep('complete')
        scheduleRefresh(newExpiry, getToken)
        return data.accessToken
      }

      // Token missing or expired - need to do full SIWE flow
      const errorData = await statusResponse.json().catch(() => ({}))
      const errorCode = errorData.error as string | undefined

      // If token exists but expired or no token, proceed with SIWE
      if (
        statusResponse.status === 401 &&
        (errorCode === 'NO_TOKEN' || errorCode === 'TOKEN_EXPIRED')
      ) {
        // Step 2: Request nonce from Eliza
        setAuthStep('nonce')
        const nonceResponse = await fetch('/api/eliza/auth/nonce', {
          method: 'POST',
          credentials: 'include',
        })

        if (!nonceResponse.ok) {
          const nonceError = await nonceResponse.json().catch(() => ({}))
          throw new Error(nonceError.message || 'Failed to get nonce from Eliza')
        }

        const nonceData: ElizaAuthNonceResponse = await nonceResponse.json()

        // Step 3: Sign the SIWE message with wallet
        setAuthStep('signing')
        let signature: string
        try {
          signature = await signMessageAsync({ message: nonceData.message })
        } catch (signError) {
          // Handle user rejection or wallet errors explicitly
          if (signError instanceof Error) {
            if (
              signError.message.includes('rejected') ||
              signError.message.includes('denied') ||
              signError.message.includes('cancelled')
            ) {
              throw new Error('Signature request was rejected by user')
            }
            throw new Error(`Wallet signing failed: ${signError.message}`)
          }
          throw new Error('Wallet signing failed')
        }

        // Step 4: Verify signature with Eliza
        setAuthStep('verifying')
        const verifyResponse = await fetch('/api/eliza/auth/verify', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ signature }),
        })

        if (!verifyResponse.ok) {
          const verifyError = await verifyResponse.json().catch(() => ({}))
          throw new Error(verifyError.message || 'Eliza verification failed')
        }

        const verifyData: TokenResponse = await verifyResponse.json()
        setAccessToken(verifyData.accessToken)
        const newExpiry = new Date(verifyData.expiresAt).getTime()
        setExpiresAt(newExpiry)
        setAuthStep('complete')
        scheduleRefresh(newExpiry, getToken)
        return verifyData.accessToken
      }

      // Some other error
      throw new Error(errorData.message || 'Authentication failed')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setAuthStep('error')
      console.error('[useElizaAuth] Authentication failed:', err)
      return null
    } finally {
      setIsAuthenticating(false)
    }
  }, [accessToken, expiresAt, isConnected, address, signMessageAsync, scheduleRefresh])

  // Clear authentication
  const clearAuth = useCallback(() => {
    setAccessToken(null)
    setExpiresAt(null)
    setError(null)
    setAuthStep('idle')
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
      refreshTimeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const isAuthenticated = Boolean(accessToken && expiresAt && expiresAt > Date.now())

  return {
    accessToken,
    isAuthenticated,
    isAuthenticating,
    authStep,
    getToken,
    clearAuth,
    error,
  }
}
