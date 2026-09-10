'use client';

import { useEffect, useRef, type RefObject } from 'react';
import {
  EventBus,
  MapEvents,
  type MapCharacterData,
  type MapEventsData,
} from '@/game/EventBus';
import type { IRefPhaserGame } from '@/game/PhaserGame';
import type { LayerVisibility, Location } from '@/lib/types/map';

interface UseMapPageEventBridgeInput {
  mapReady: boolean;
  layers: LayerVisibility;
  locations: Location[];
  characterMarkers: MapCharacterData[];
  eventsPayload: MapEventsData;
  isSidebarOpen: boolean;
  mapContentRef: RefObject<HTMLDivElement>;
  phaserRef: RefObject<IRefPhaserGame>;
  /** Optional location id from ?location= — initial fly targets it when known. */
  focusLocationId?: string | null;
}

export function useMapPageEventBridge({
  mapReady,
  layers,
  locations,
  characterMarkers,
  eventsPayload,
  isSidebarOpen,
  mapContentRef,
  phaserRef,
  focusLocationId,
}: UseMapPageEventBridgeInput): void {
  const didInitialFly = useRef(false);

  useEffect(() => {
    if (mapReady) {
      EventBus.emit(MapEvents.SET_LAYER_VISIBILITY, layers);
    }
  }, [layers, mapReady]);

  useEffect(() => {
    if (mapReady && locations.length > 0) {
      EventBus.emit(MapEvents.UPDATE_LOCATIONS, locations);
    }
  }, [locations, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    if (didInitialFly.current) return;

    // Deep link (?location=<id>): fly to the requested location if it has a center.
    if (focusLocationId) {
      const target = locations.find((location) => location.id === focusLocationId);
      const center = target?.metadata?.center;
      if (Array.isArray(center) && center.length === 2) {
        didInitialFly.current = true;
        EventBus.emit(MapEvents.FLY_TO_LOCATION, {
          x: center[0],
          y: center[1],
          zoom: 2.2,
        });
        return;
      }
    }

    const firstWithCenter = locations.find(
      (location) => Array.isArray(location.metadata?.center) && location.metadata.center.length === 2
    );
    if (!firstWithCenter?.metadata?.center) return;

    didInitialFly.current = true;
    EventBus.emit(MapEvents.FLY_TO_LOCATION, {
      x: firstWithCenter.metadata.center[0],
      y: firstWithCenter.metadata.center[1],
      zoom: 1.5,
    });
  }, [locations, mapReady, focusLocationId]);

  useEffect(() => {
    if (!mapReady) return;

    // Always emit, even if empty, so Phaser can clear stale markers on disconnect/wallet change.
    EventBus.emit(MapEvents.UPDATE_CHARACTERS, characterMarkers);
  }, [characterMarkers, mapReady]);

  useEffect(() => {
    if (!mapReady) return;

    // Always emit even if empty, so Phaser can reconcile and remove stale event markers.
    EventBus.emit(MapEvents.UPDATE_EVENTS, eventsPayload);
  }, [mapReady, eventsPayload]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new Event('resize'));

    const container = mapContentRef.current;
    const game = phaserRef.current?.game;

    if (!container || !game) return;

    const rect = container.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));

    const maybeScale = (game as unknown as { scale?: { resize?: (w: number, h: number) => void } }).scale;
    if (maybeScale && typeof maybeScale.resize === 'function' && width > 0 && height > 0) {
      maybeScale.resize(width, height);
    }
  }, [isSidebarOpen, mapContentRef, phaserRef]);
}
