'use client'

/**
 * Phaser Events Hook
 * Bidirectional communication with Phaser game via EventBus
 */

import { useEffect, useCallback, useRef } from 'react'
import { EventBus, MapEvents } from '@/game/EventBus'
import type { Location, EditorMode } from '@/lib/types/map'
import { toDomainLocationId } from '@/lib/utils/mapIds'

export interface PhaserEventHandlers {
  onMapClick?: (coords: { x: number; y: number }) => void
  onMarkerClick?: (id: string) => void
  onMarkerDrag?: (id: string, coords: { x: number; y: number }) => void
}

export interface UsePhaserEventsReturn {
  emitModeChange: (mode: EditorMode) => void
  emitLocationCreated: (location: Location) => void
  emitLocationUpdated: (location: Location) => void
  emitLocationDeleted: (id: string) => void
}

export function usePhaserEvents(handlers: PhaserEventHandlers): UsePhaserEventsReturn {
  // Use ref to avoid stale closures in event handlers
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const handleMapClick = (coords: { x: number; y: number }) => {
      handlersRef.current.onMapClick?.(coords)
    }

    const handleMarkerClick = (data: { id: string }) => {
      handlersRef.current.onMarkerClick?.(toDomainLocationId(data.id))
    }

    const handleMarkerDrag = (data: { id: string; x: number; y: number }) => {
      handlersRef.current.onMarkerDrag?.(toDomainLocationId(data.id), {
        x: data.x,
        y: data.y,
      })
    }

    // Register event listeners
    EventBus.on(MapEvents.MAP_CLICKED, handleMapClick)
    EventBus.on(MapEvents.MARKER_CLICKED, handleMarkerClick)
    EventBus.on(MapEvents.MARKER_DRAGGED, handleMarkerDrag)

    return () => {
      // Cleanup event listeners (always provide the handler to avoid nuking other listeners)
      EventBus.off(MapEvents.MAP_CLICKED, handleMapClick)
      EventBus.off(MapEvents.MARKER_CLICKED, handleMarkerClick)
      EventBus.off(MapEvents.MARKER_DRAGGED, handleMarkerDrag)
    }
  }, [])

  const emitModeChange = useCallback((mode: EditorMode) => {
    EventBus.emit(MapEvents.EDITOR_MODE_CHANGED, { mode })
  }, [])

  const emitLocationCreated = useCallback((location: Location) => {
    EventBus.emit(MapEvents.LOCATION_CREATED, location)
  }, [])

  const emitLocationUpdated = useCallback((location: Location) => {
    EventBus.emit(MapEvents.LOCATION_UPDATED, location)
  }, [])

  const emitLocationDeleted = useCallback((id: string) => {
    EventBus.emit(MapEvents.LOCATION_DELETED, { id })
  }, [])

  return {
    emitModeChange,
    emitLocationCreated,
    emitLocationUpdated,
    emitLocationDeleted,
  }
}
