'use client'

import { useCallback } from 'react'
import type { MutableRefObject } from 'react'
import { useLocationApi } from '@/hooks/map/useLocationApi'
import { showErrorToast, showSuccessToast } from '@/lib/utils/toast'
import { EventBus, MapEvents } from '@/game/EventBus'
import type { CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'
import type { MapEditorState, MapEditorStateActions } from './useMapEditorState'

export interface UseMapEditorCrudParams {
  stateRef: MutableRefObject<MapEditorState>
  actions: MapEditorStateActions
}

export interface UseMapEditorCrudReturn {
  refreshLocations: () => Promise<void>
  createLocation: (input: CreateLocationInput) => Promise<void>
  updateLocation: (id: string, input: UpdateLocationInput) => Promise<void>
  deleteLocation: (id: string) => Promise<void>
}

export function useMapEditorCrud(params: UseMapEditorCrudParams): UseMapEditorCrudReturn {
  const { stateRef, actions } = params
  const api = useLocationApi()

  const refreshLocations = useCallback(async () => {
    actions.setIsLoading(true)
    actions.setError(null)

    try {
      const data = await api.getAll()
      actions.setLocations(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load locations'
      actions.setError(message)
    } finally {
      actions.setIsLoading(false)
    }
  }, [api, actions])

  const createLocation = useCallback(
    async (input: CreateLocationInput) => {
      actions.setIsSaving(true)
      actions.setError(null)

      try {
        const location = await api.create(input)

        actions.addLocation(location)

        EventBus.emit(MapEvents.LOCATION_CREATED, location)

        showSuccessToast('Location Created', `"${location.name}" has been added to the map.`)

        actions.setPendingCoordinates(null)
        actions.setModeInternal('view')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create location'
        actions.setError(message)
        showErrorToast('Create Failed', message)
        throw err
      } finally {
        actions.setIsSaving(false)
      }
    },
    [api, actions]
  )

  const updateLocation = useCallback(
    async (id: string, input: UpdateLocationInput) => {
      actions.setIsSaving(true)
      actions.setError(null)

      try {
        const location = await api.update(id, input)

        actions.updateLocation(location)

        EventBus.emit(MapEvents.LOCATION_UPDATED, location)

        showSuccessToast('Location Updated', `"${location.name}" has been saved.`)

        actions.setPendingCoordinates(null)
        actions.setModeInternal('view')
        actions.clearSelection()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update location'
        actions.setError(message)
        showErrorToast('Update Failed', message)
        throw err
      } finally {
        actions.setIsSaving(false)
      }
    },
    [api, actions]
  )

  const deleteLocation = useCallback(
    async (id: string) => {
      actions.setIsSaving(true)
      actions.setError(null)

      const deletedLocation = stateRef.current.locations.find((loc) => loc.id === id)
      const locationName = deletedLocation?.name ?? 'Location'

      try {
        await api.remove(id)

        actions.removeLocation(id)

        EventBus.emit(MapEvents.LOCATION_DELETED, { id })

        showSuccessToast('Location Deleted', `"${locationName}" has been removed from the map.`)

        actions.setModeInternal('view')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete location'
        actions.setError(message)
        showErrorToast('Delete Failed', message)
        throw err
      } finally {
        actions.setIsSaving(false)
      }
    },
    [api, actions, stateRef]
  )

  return {
    refreshLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  }
}