/**
 * useElizaAuth Hook
 * Manages Eliza authentication state and token lifecycle
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import type { TokenResponse } from '@/types/eliza'

interface UseElizaAuthReturn {
  /** Current access token (if authenticated) */
  accessToken: string | null
  /** Whether we have a valid token */
  isAuthenticated: boolean
  /** Whether authentication is in progress */
  isAuthenticating: boolean
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
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAccessToken(null)
      setExpiresAt(null)
      setError(null)
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
        refreshTimeoutRef.current = null
      }
    }
  }, [isConnected])

  // Schedule token refresh
  const scheduleRefresh = useCallback((expiry: number) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const refreshTime = expiry - Date.now() - REFRESH_BUFFER_MS
    if (refreshTime > 0) {
      refreshTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await fetch('/api/eliza/auth', {
            method: 'POST',
            credentials: 'include',
          })

          if (response.ok) {
            const data: TokenResponse = await response.json()
            setAccessToken(data.accessToken)
            const newExpiry = new Date(data.expiresAt).getTime()
            setExpiresAt(newExpiry)
            scheduleRefresh(newExpiry)
          }
        } catch (err) {
          console.error('[useElizaAuth] Token refresh failed:', err)
        }
      }, refreshTime)
    }
  }, [])

  // Get or refresh token
  const getToken = useCallback(async (): Promise<string | null> => {
    // Return cached token if still valid
    if (accessToken && expiresAt && expiresAt > Date.now() + 60000) {
      return accessToken
    }

    // Need to authenticate
    if (!isConnected) {
      setError('Wallet not connected')
      return null
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      const response = await fetch('/api/eliza/auth', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Authentication failed')
      }

      const data: TokenResponse = await response.json()
      setAccessToken(data.accessToken)
      const newExpiry = new Date(data.expiresAt).getTime()
      setExpiresAt(newExpiry)
      scheduleRefresh(newExpiry)

      return data.accessToken
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      console.error('[useElizaAuth] Authentication failed:', err)
      return null
    } finally {
      setIsAuthenticating(false)
    }
  }, [accessToken, expiresAt, isConnected, scheduleRefresh])

  // Clear authentication
  const clearAuth = useCallback(() => {
    setAccessToken(null)
    setExpiresAt(null)
    setError(null)
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

  const isAuthenticated = Boolean(
    accessToken && expiresAt && expiresAt > Date.now()
  )

  return {
    accessToken,
    isAuthenticated,
    isAuthenticating,
    getToken,
    clearAuth,
    error,
  }
}
