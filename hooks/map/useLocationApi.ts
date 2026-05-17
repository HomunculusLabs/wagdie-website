'use client'

/**
 * Location API Hook
 * Low-level API hook for location CRUD operations
 */

import { useCallback } from 'react'
import { apiClient } from '@/lib/api/client'
import type { Location, CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'

export interface UseLocationApiReturn {
  getAll: () => Promise<Location[]>
  getById: (id: string) => Promise<Location>
  create: (input: CreateLocationInput) => Promise<Location>
  update: (id: string, input: UpdateLocationInput) => Promise<Location>
  remove: (id: string) => Promise<void>
  checkStakedCharacters: (id: string) => Promise<number>
}

export function useLocationApi(): UseLocationApiReturn {
  const getAll = useCallback(async (): Promise<Location[]> => {
    return apiClient.getEnvelope<Location[]>('/api/locations', {
      credentials: 'include',
      fallbackMessage: 'Failed to fetch locations',
    })
  }, [])

  const getById = useCallback(async (id: string): Promise<Location> => {
    return apiClient.getEnvelope<Location>(`/api/locations/${encodeURIComponent(id)}`, {
      credentials: 'include',
      fallbackMessage: 'Failed to fetch location',
    })
  }, [])

  const create = useCallback(async (input: CreateLocationInput): Promise<Location> => {
    return apiClient.postEnvelope<Location>('/api/locations', input, {
      credentials: 'include',
      fallbackMessage: 'Failed to create location',
    })
  }, [])

  const update = useCallback(async (id: string, input: UpdateLocationInput): Promise<Location> => {
    return apiClient.patchEnvelope<Location>(`/api/locations/${encodeURIComponent(id)}`, input, {
      credentials: 'include',
      fallbackMessage: 'Failed to update location',
    })
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    await apiClient.deleteEnvelope<void>(`/api/locations/${encodeURIComponent(id)}`, {
      credentials: 'include',
      fallbackMessage: 'Failed to delete location',
      requireData: false,
    })
  }, [])

  const checkStakedCharacters = useCallback(async (id: string): Promise<number> => {
    const response = await fetch(`/api/locations/${encodeURIComponent(id)}/staked-count`, {
      credentials: 'include',
    })

    if (!response.ok) {
      // If endpoint doesn't exist or fails, assume 0 staked
      return 0
    }

    const { count } = await response.json()
    return count ?? 0
  }, [])

  return {
    getAll,
    getById,
    create,
    update,
    remove,
    checkStakedCharacters,
  }
}
