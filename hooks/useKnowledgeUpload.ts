/**
 * useKnowledgeUpload Hook
 * Manages knowledge document upload and deletion operations
 */

'use client'

import { useState, useCallback } from 'react'
import { readApiRaw } from '@/lib/api/client-response'
import type { KnowledgeDocument } from '@/types/eliza'

interface UseKnowledgeUploadReturn {
  /** List of knowledge documents */
  documents: KnowledgeDocument[]
  /** Whether upload is in progress */
  isUploading: boolean
  /** Whether deletion is in progress */
  isDeleting: boolean
  /** Error message */
  error: string | null
  /** Upload a document */
  uploadDocument: (file: File) => Promise<KnowledgeDocument | null>
  /** Delete a document */
  deleteDocument: (documentId: string) => Promise<boolean>
  /** Set documents (for initialization) */
  setDocuments: (docs: KnowledgeDocument[]) => void
  /** Clear error */
  clearError: () => void
}

export function useKnowledgeUpload(tokenId: string): UseKnowledgeUploadReturn {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadDocument = useCallback(
    async (file: File): Promise<KnowledgeDocument | null> => {
      setIsUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/eliza/characters/${tokenId}/knowledge`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        })

        const newDoc = await readApiRaw<KnowledgeDocument>(response, 'Failed to upload document')
        setDocuments((prev) => [...prev, newDoc])
        return newDoc
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload document'
        setError(message)
        console.error('[useKnowledgeUpload] Upload error:', err)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [tokenId]
  )

  const deleteDocument = useCallback(
    async (documentId: string): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/eliza/characters/${tokenId}/knowledge/${documentId}`,
          {
            method: 'DELETE',
            credentials: 'include',
          }
        )

        await readApiRaw<{ success: boolean; message?: string }>(
          response,
          'Failed to delete document'
        )

        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId))
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete document'
        setError(message)
        console.error('[useKnowledgeUpload] Delete error:', err)
        return false
      } finally {
        setIsDeleting(false)
      }
    },
    [tokenId]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    documents,
    isUploading,
    isDeleting,
    error,
    uploadDocument,
    deleteDocument,
    setDocuments,
    clearError,
  }
}
