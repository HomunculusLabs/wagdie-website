/**
 * useAICharacter Hook
 * Manages AI character CRUD operations
 */

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { AICharacter, UpdateAICharacterInput } from '@/types/eliza'

interface UseAICharacterReturn {
  /** Current AI character data */
  aiCharacter: AICharacter | null
  /** Whether data is loading */
  isLoading: boolean
  /** Whether save is in progress */
  isSaving: boolean
  /** Error message if operation failed */
  error: string | null
  /** Fetch AI character by token ID */
  fetchAICharacter: () => Promise<void>
  /** Save AI character changes */
  saveAICharacter: (data: UpdateAICharacterInput) => Promise<boolean>
  /** Clear error */
  clearError: () => void
}

export function useAICharacter(tokenId: string): UseAICharacterReturn {
  const { isConnected } = useAccount()
  const [aiCharacter, setAICharacter] = useState<AICharacter | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch AI character data
  const fetchAICharacter = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/eliza/characters/${tokenId}`, {
        credentials: 'include',
      })

      if (response.status === 404) {
        // No AI character exists yet - that's OK
        setAICharacter(null)
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to fetch AI character')
      }

      const data: AICharacter = await response.json()
      setAICharacter(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch AI character'
      setError(message)
      console.error('[useAICharacter] Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [tokenId])

  // Save AI character changes
  const saveAICharacter = useCallback(async (data: UpdateAICharacterInput): Promise<boolean> => {
    if (!isConnected) {
      setError('Please connect your wallet to save changes')
      return false
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/eliza/characters/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save AI character')
      }

      const updated: AICharacter = await response.json()
      setAICharacter(updated)
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save AI character'
      setError(message)
      console.error('[useAICharacter] Save error:', err)
      return false
    } finally {
      setIsSaving(false)
    }
  }, [tokenId, isConnected])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    fetchAICharacter()
  }, [fetchAICharacter])

  return {
    aiCharacter,
    isLoading,
    isSaving,
    error,
    fetchAICharacter,
    saveAICharacter,
    clearError,
  }
}
