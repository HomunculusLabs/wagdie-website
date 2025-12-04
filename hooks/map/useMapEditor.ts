'use client'

/**
 * Map Editor Hook
 * Main state management hook combining useLocationApi and usePhaserEvents
 */

import { useState, useCallback, useEffect } from 'react'
import { useLocationApi } from './useLocationApi'
import { usePhaserEvents } from './usePhaserEvents'
import { showSuccessToast, showErrorToast } from '@/lib/utils/toast'
import type {
  Location,
  EditorMode,
  CreateLocationInput,
  UpdateLocationInput,
} from '@/lib/types/map'

export interface UseMapEditorReturn {
  // State
  mode: EditorMode
  locations: Location[]
  selectedLocation: Location | null
  pendingCoordinates: { x: number; y: number } | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions
  setMode: (mode: 'view' | 'create') => void
  selectLocation: (id: string | null) => void
  setPendingCoordinates: (coords: { x: number; y: number } | null) => void
  createLocation: (input: CreateLocationInput) => Promise<void>
  updateLocation: (id: string, input: UpdateLocationInput) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
  refreshLocations: () => Promise<void>
  clearError: () => void
}

export function useMapEditor(): UseMapEditorReturn {
  // State
  const [mode, setModeInternal] = useState<EditorMode>('view')
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [pendingCoordinates, setPendingCoordinates] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // API hook
  const api = useLocationApi()

  // Phaser events hook with handlers
  const phaserEvents = usePhaserEvents({
    onMapClick: (coords) => {
      if (mode === 'create') {
        setPendingCoordinates(coords)
        setSelectedLocation(null)
      }
    },
    onMarkerClick: (id) => {
      if (mode === 'view' || mode === 'edit') {
        const location = locations.find((loc) => loc.id === id)
        if (location) {
          setSelectedLocation(location)
          setModeInternal('edit')
          setPendingCoordinates(null)
        }
      }
    },
    onMarkerDrag: (id, coords) => {
      // Handle drag-to-reposition
      const location = locations.find((loc) => loc.id === id)
      if (location) {
        setSelectedLocation(location)
        setPendingCoordinates(coords)
      }
    },
  })

  // Load locations on mount
  useEffect(() => {
    refreshLocations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Actions
  const setMode = useCallback((newMode: 'view' | 'create') => {
    setModeInternal(newMode)
    phaserEvents.emitModeChange(newMode)

    // Clear selection when switching modes
    if (newMode === 'view') {
      setSelectedLocation(null)
      setPendingCoordinates(null)
    } else if (newMode === 'create') {
      setSelectedLocation(null)
    }
  }, [phaserEvents])

  const selectLocation = useCallback((id: string | null) => {
    if (id === null) {
      setSelectedLocation(null)
      setModeInternal('view')
      return
    }

    const location = locations.find((loc) => loc.id === id)
    if (location) {
      setSelectedLocation(location)
      setModeInternal('edit')
    }
  }, [locations])

  const refreshLocations = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await api.getAll()
      setLocations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load locations'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [api])

  const createLocation = useCallback(async (input: CreateLocationInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const location = await api.create(input)

      // Optimistic update
      setLocations((prev) => [...prev, location])

      // Emit event to Phaser
      phaserEvents.emitLocationCreated(location)

      // Show success toast
      showSuccessToast('Location Created', `"${location.name}" has been added to the map.`)

      // Reset state
      setPendingCoordinates(null)
      setModeInternal('view')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create location'
      setError(message)
      showErrorToast('Create Failed', message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [api, phaserEvents])

  const updateLocation = useCallback(async (id: string, input: UpdateLocationInput) => {
    setIsSaving(true)
    setError(null)

    try {
      const location = await api.update(id, input)

      // Optimistic update
      setLocations((prev) =>
        prev.map((loc) => (loc.id === id ? location : loc))
      )

      // Update selected location if it was updated
      if (selectedLocation?.id === id) {
        setSelectedLocation(location)
      }

      // Emit event to Phaser
      phaserEvents.emitLocationUpdated(location)

      // Show success toast
      showSuccessToast('Location Updated', `"${location.name}" has been saved.`)

      // Reset state
      setPendingCoordinates(null)
      setModeInternal('view')
      setSelectedLocation(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update location'
      setError(message)
      showErrorToast('Update Failed', message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [api, phaserEvents, selectedLocation?.id])

  const deleteLocation = useCallback(async (id: string) => {
    setIsSaving(true)
    setError(null)

    try {
      await api.remove(id)

      // Optimistic update
      setLocations((prev) => prev.filter((loc) => loc.id !== id))

      // Get location name before clearing for toast
      const deletedLocation = locations.find((loc) => loc.id === id)
      const locationName = deletedLocation?.name ?? 'Location'

      // Clear selection if deleted
      if (selectedLocation?.id === id) {
        setSelectedLocation(null)
      }

      // Emit event to Phaser
      phaserEvents.emitLocationDeleted(id)

      // Show success toast
      showSuccessToast('Location Deleted', `"${locationName}" has been removed from the map.`)

      // Reset state
      setModeInternal('view')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete location'
      setError(message)
      showErrorToast('Delete Failed', message)
      throw err
    } finally {
      setIsSaving(false)
    }
  }, [api, phaserEvents, selectedLocation?.id, locations])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    mode,
    locations,
    selectedLocation,
    pendingCoordinates,
    isLoading,
    isSaving,
    error,

    // Actions
    setMode,
    selectLocation,
    setPendingCoordinates,
    createLocation,
    updateLocation,
    deleteLocation,
    refreshLocations,
    clearError,
  }
}
