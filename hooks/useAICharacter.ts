/**
 * useAICharacter Hook
 * Manages AI character CRUD operations including import/export
 */

import { useState, useCallback, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { readApiRaw } from '@/lib/api/client-response'
import type { AICharacter, UpdateAICharacterInput, ElizaCharacterExport } from '@/types/eliza'

interface ImportResult {
  success: boolean
  imported: string[]
  skipped: string[]
  warnings: string[]
}

interface UseAICharacterReturn {
  /** Current AI character data */
  aiCharacter: AICharacter | null
  /** Whether data is loading */
  isLoading: boolean
  /** Whether save is in progress */
  isSaving: boolean
  /** Whether import is in progress */
  isImporting: boolean
  /** Error message if operation failed */
  error: string | null
  /** Fetch AI character by token ID */
  fetchAICharacter: () => Promise<void>
  /** Save AI character changes */
  saveAICharacter: (data: UpdateAICharacterInput) => Promise<boolean>
  /** Export character as JSON file download */
  exportCharacter: () => Promise<void>
  /** Import character from JSON data */
  importCharacter: (data: ElizaCharacterExport) => Promise<ImportResult | null>
  /** Clear error */
  clearError: () => void
}

export function useAICharacter(tokenId: string): UseAICharacterReturn {
  const { isConnected } = useAccount()
  const [aiCharacter, setAICharacter] = useState<AICharacter | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
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

      const data = await readApiRaw<AICharacter>(response, 'Failed to fetch AI character')
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

      const updated = await readApiRaw<AICharacter>(response, 'Failed to save AI character')
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

  // Export character as JSON file download
  const exportCharacter = useCallback(async () => {
    setError(null)

    try {
      const response = await fetch(`/api/eliza/characters/${tokenId}/export`, {
        credentials: 'include',
      })

      if (!response.ok) {
        await readApiRaw<never>(response, 'Failed to export character')
      }

      // Get filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      const filename = filenameMatch?.[1] || 'character.json'

      // Download as file
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export character'
      setError(message)
      console.error('[useAICharacter] Export error:', err)
    }
  }, [tokenId])

  // Import character from JSON data
  const importCharacter = useCallback(async (data: ElizaCharacterExport): Promise<ImportResult | null> => {
    if (!isConnected) {
      setError('Please connect your wallet to import')
      return null
    }

    setIsImporting(true)
    setError(null)

    try {
      const response = await fetch(`/api/eliza/characters/${tokenId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const result = await readApiRaw<ImportResult>(response, 'Failed to import character')

      // Refresh character data after import
      await fetchAICharacter()

      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import character'
      setError(message)
      console.error('[useAICharacter] Import error:', err)
      return null
    } finally {
      setIsImporting(false)
    }
  }, [tokenId, isConnected, fetchAICharacter])

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
    isImporting,
    error,
    fetchAICharacter,
    saveAICharacter,
    exportCharacter,
    importCharacter,
    clearError,
  }
}
