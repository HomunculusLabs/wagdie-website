'use client'

/**
 * Phaser Events Hook
 * Bidirectional communication with Phaser game via EventBus
 */

import { useEffect, useCallback, useRef } from 'react'
import { EventBus } from '@/game/EventBus'
import type { Location, EditorMode } from '@/lib/types/map'

// Editor-specific event names
export const EditorEvents = {
  // React -> Phaser
  EDITOR_MODE_CHANGED: 'editor-mode-changed',
  LOCATION_CREATED: 'location-created',
  LOCATION_UPDATED: 'location-updated',
  LOCATION_DELETED: 'location-deleted',

  // Phaser -> React
  MAP_CLICKED: 'map-clicked',
  MARKER_CLICKED: 'marker-clicked',
  MARKER_DRAGGED: 'marker-dragged',
} as const

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
      handlersRef.current.onMarkerClick?.(data.id)
    }

    const handleMarkerDrag = (data: { id: string; x: number; y: number }) => {
      handlersRef.current.onMarkerDrag?.(data.id, { x: data.x, y: data.y })
    }

    // Register event listeners
    EventBus.on(EditorEvents.MAP_CLICKED, handleMapClick)
    EventBus.on(EditorEvents.MARKER_CLICKED, handleMarkerClick)
    EventBus.on(EditorEvents.MARKER_DRAGGED, handleMarkerDrag)

    return () => {
      // Cleanup event listeners
      EventBus.off(EditorEvents.MAP_CLICKED, handleMapClick)
      EventBus.off(EditorEvents.MARKER_CLICKED, handleMarkerClick)
      EventBus.off(EditorEvents.MARKER_DRAGGED, handleMarkerDrag)
    }
  }, [])

  const emitModeChange = useCallback((mode: EditorMode) => {
    EventBus.emit(EditorEvents.EDITOR_MODE_CHANGED, { mode })
  }, [])

  const emitLocationCreated = useCallback((location: Location) => {
    EventBus.emit(EditorEvents.LOCATION_CREATED, location)
  }, [])

  const emitLocationUpdated = useCallback((location: Location) => {
    EventBus.emit(EditorEvents.LOCATION_UPDATED, location)
  }, [])

  const emitLocationDeleted = useCallback((id: string) => {
    EventBus.emit(EditorEvents.LOCATION_DELETED, { id })
  }, [])

  return {
    emitModeChange,
    emitLocationCreated,
    emitLocationUpdated,
    emitLocationDeleted,
  }
}
