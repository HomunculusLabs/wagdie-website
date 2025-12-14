'use client'

/**
 * Map Editor Hook
 * Main state management hook combining useLocationApi and usePhaserEvents
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useMapEditorState } from './editor/useMapEditorState'
import { useMapEditorCrud } from './editor/useMapEditorCrud'
import { useMapEditorPhaserBridge } from './editor/useMapEditorPhaserBridge'
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
  const { state, stateRef, actions } = useMapEditorState()

  const { refreshLocations, createLocation, updateLocation, deleteLocation } = useMapEditorCrud({
    stateRef,
    actions,
  })

  useMapEditorPhaserBridge({
    mode: state.mode,
    locations: state.locations,
    stateRef,
    actions,
  })

  const selectedLocation = useMemo(() => {
    if (!state.selectedLocationId) return null
    return state.locations.find((loc) => loc.id === state.selectedLocationId) ?? null
  }, [state.locations, state.selectedLocationId])

  useEffect(() => {
    refreshLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setMode = useCallback(
    (newMode: 'view' | 'create') => {
      if (newMode === 'view') {
        actions.setModeView()
        return
      }

      actions.setModeCreate()
    },
    [actions]
  )

  const selectLocation = useCallback(
    (id: string | null) => {
      if (id === null) {
        actions.exitEditToViewKeepPending()
        return
      }

      const location = stateRef.current.locations.find((loc) => loc.id === id)
      if (!location) return

      actions.selectLocationForEdit(location.id)
    },
    [actions, stateRef]
  )

  const setPendingCoordinates = useCallback(
    (coords: { x: number; y: number } | null) => {
      actions.setPendingCoordinates(coords)
    },
    [actions]
  )

  const clearError = useCallback(() => {
    actions.clearError()
  }, [actions])

  return {
    // State
    mode: state.mode,
    locations: state.locations,
    selectedLocation,
    pendingCoordinates: state.pendingCoordinates,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    error: state.error,

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
