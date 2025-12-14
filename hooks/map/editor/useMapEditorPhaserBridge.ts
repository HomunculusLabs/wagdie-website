'use client'

import { useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { EventBus, MapEvents } from '@/game/EventBus'
import { toDomainLocationId } from '@/lib/utils/mapIds'
import type { EditorMode, Location } from '@/lib/types/map'
import type { MapEditorState, MapEditorStateActions } from './useMapEditorState'

export interface UseMapEditorPhaserBridgeParams {
  mode: EditorMode
  locations: Location[]
  stateRef: MutableRefObject<MapEditorState>
  actions: MapEditorStateActions
}

export function useMapEditorPhaserBridge(params: UseMapEditorPhaserBridgeParams): void {
  const { mode, locations, stateRef, actions } = params
  const [isPhaserReady, setIsPhaserReady] = useState(false)

  const actionsRef = useRef(actions)
  useEffect(() => {
    actionsRef.current = actions
  }, [actions])

  useEffect(() => {
    const handleMapReady = () => {
      setIsPhaserReady(true)
    }

    const handleSceneReady = () => {
      setIsPhaserReady(true)
    }

    const handleMapClicked = (coords: { x: number; y: number }) => {
      if (stateRef.current.mode !== 'create') return
      actionsRef.current.setPendingCoordinates(coords)
      actionsRef.current.clearSelection()
    }

    const handleMarkerClicked = (data: { id: string }) => {
      const currentMode = stateRef.current.mode
      if (currentMode !== 'view' && currentMode !== 'edit') return

      const locationId = toDomainLocationId(data.id)
      const location = stateRef.current.locations.find((loc) => loc.id === locationId)
      if (!location) return

      actionsRef.current.selectLocationForEdit(location.id)
    }

    const handleMarkerDragged = (data: { id: string; x: number; y: number }) => {
      const locationId = toDomainLocationId(data.id)
      const location = stateRef.current.locations.find((loc) => loc.id === locationId)
      if (!location) return

      actionsRef.current.setSelectedLocationId(location.id)
      actionsRef.current.setPendingCoordinates({ x: data.x, y: data.y })
    }

    EventBus.on(MapEvents.MAP_READY, handleMapReady)
    EventBus.on(MapEvents.SCENE_READY, handleSceneReady)

    EventBus.on(MapEvents.MAP_CLICKED, handleMapClicked)
    EventBus.on(MapEvents.MARKER_CLICKED, handleMarkerClicked)
    EventBus.on(MapEvents.MARKER_DRAGGED, handleMarkerDragged)

    return () => {
      EventBus.off(MapEvents.MAP_READY, handleMapReady)
      EventBus.off(MapEvents.SCENE_READY, handleSceneReady)

      EventBus.off(MapEvents.MAP_CLICKED, handleMapClicked)
      EventBus.off(MapEvents.MARKER_CLICKED, handleMarkerClicked)
      EventBus.off(MapEvents.MARKER_DRAGGED, handleMarkerDragged)
    }
  }, [stateRef])

  // Single effect: sync editor mode to Phaser when ready
  useEffect(() => {
    if (!isPhaserReady) return
    EventBus.emit(MapEvents.EDITOR_MODE_CHANGED, { mode })
  }, [isPhaserReady, mode])

  // Single effect: sync locations to Phaser when ready
  useEffect(() => {
    if (!isPhaserReady) return
    if (locations.length > 0) {
      EventBus.emit(MapEvents.UPDATE_LOCATIONS, locations)
    }
  }, [isPhaserReady, locations])
}