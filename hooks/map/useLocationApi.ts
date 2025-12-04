'use client'

/**
 * Location API Hook
 * Low-level API hook for location CRUD operations
 */

import { useCallback } from 'react'
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
    const response = await fetch('/api/locations', {
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch locations')
    }

    const { data } = await response.json()
    return data
  }, [])

  const getById = useCallback(async (id: string): Promise<Location> => {
    const response = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch location')
    }

    const { data } = await response.json()
    return data
  }, [])

  const create = useCallback(async (input: CreateLocationInput): Promise<Location> => {
    const response = await fetch('/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create location')
    }

    const { data } = await response.json()
    return data
  }, [])

  const update = useCallback(async (id: string, input: UpdateLocationInput): Promise<Location> => {
    const response = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update location')
    }

    const { data } = await response.json()
    return data
  }, [])

  const remove = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/locations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete location')
    }
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
