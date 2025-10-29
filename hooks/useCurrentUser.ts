/**
 * useCurrentUser Hook
 * Fetches and manages current user session from /api/auth/me
 */

'use client'

import { useEffect, useState } from 'react'
import type { UserSession } from '@/types/wallet'

interface UseCurrentUserReturn {
  user: UserSession | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useCurrentUser(): UseCurrentUserReturn {
  const [user, setUser] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchUser = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me')

      if (response.status === 401) {
        // Not authenticated
        setUser(null)
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user: ${response.statusText}`)
      }

      const data = await response.json()
      setUser(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser
  }
}
