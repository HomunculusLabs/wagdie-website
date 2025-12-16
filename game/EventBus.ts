/**
 * EventBus - Communication bridge between React and Phaser
 *
 * Type-safe event emitter for bidirectional messaging between React and Phaser.
 */

import type { MapScene } from './scenes/MapScene';

// ============================================================================
// Event Payload Types
// ============================================================================

/** Layer visibility settings */
export interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

/** Map location data from database */
export interface MapLocationData {
  id: string;
  name: string;
  description?: string;
  metadata?: {
    center?: [number, number];
    bounds?: [[number, number], [number, number]];
    [key: string]: unknown;
  };
  htmlcoordinates?: [number, number];
  created_at?: string;
  updated_at?: string;
}

/** Character location data with position */
export interface MapCharacterData {
  character_token_id: number;
  character_name?: string;
  wallet_address?: string;
  location?: {
    id: string;
    name: string;
    metadata?: {
      center?: [number, number];
    };
  };
  [key: string]: unknown;
}

/** Map event data (burns, deaths, fights) */
export interface MapEventData {
  wikiPageID?: number;
  name?: string;
  title?: string;
  htmlcoordinates?: [number, number];
  [key: string]: unknown;
}

/** Events collection */
export interface MapEventsData {
  burns: MapEventData[];
  deaths: MapEventData[];
  fights: MapEventData[];
}

/** Marker data emitted on interactions */
export interface MarkerPayload {
  id: string;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  name: string;
  x: number;
  y: number;
  data: MapLocationData | MapCharacterData | MapEventData;
}

/** Camera state */
export interface CameraInfo {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

/** Map dimensions */
export interface MapInfo {
  width: number;
  height: number;
  zoom: number;
}

/** Fly to location coordinates */
export interface FlyToPayload {
  x: number;
  y: number;
  zoom?: number;
}

/** Editor mode */
export type EditorMode = 'view' | 'create' | 'edit';

/** Map click coordinates */
export interface MapClickPayload {
  x: number;
  y: number;
}

/** Marker drag result */
export interface MarkerDragPayload {
  id: string;
  x: number;
  y: number;
}

// ============================================================================
// Type-safe Event Emitter
// ============================================================================

type EventCallback<T = unknown> = (payload: T) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback<unknown>>> = new Map();

  on<T>(event: string, callback: EventCallback<T>): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback as EventCallback<unknown>);
    return this;
  }

  off<T>(event: string, callback?: EventCallback<T>): this {
    if (callback) {
      this.events.get(event)?.delete(callback as EventCallback<unknown>);
    } else {
      this.events.delete(event);
    }
    return this;
  }

  emit<T>(event: string, payload?: T): this {
    this.events.get(event)?.forEach((callback) => callback(payload));
    return this;
  }

  once<T>(event: string, callback: EventCallback<T>): this {
    const onceCallback = (payload: T) => {
      callback(payload);
      this.off(event, onceCallback);
    };
    return this.on(event, onceCallback);
  }
}

// Create a singleton event emitter
export const EventBus = new SimpleEventEmitter();

// Event types for type safety
export const MapEvents = {
  // React -> Phaser
  SET_LAYER_VISIBILITY: 'set-layer-visibility',
  FLY_TO_LOCATION: 'fly-to-location',
  FLY_TO_CHARACTER: 'fly-to-character',
  UPDATE_LOCATIONS: 'update-locations',
  UPDATE_CHARACTERS: 'update-characters',
  UPDATE_EVENTS: 'update-events',

  // Phaser -> React
  SCENE_READY: 'current-scene-ready',
  MARKER_CLICKED: 'marker-clicked',
  MARKER_HOVERED: 'marker-hovered',
  MARKER_UNHOVERED: 'marker-unhovered',
  CAMERA_CHANGED: 'camera-changed',
  MAP_READY: 'map-ready',

  // Editor events (018-map-editor)
  EDITOR_MODE_CHANGED: 'editor-mode-changed',
  MAP_CLICKED: 'map-clicked',
  MARKER_DRAGGED: 'marker-dragged',
  LOCATION_CREATED: 'location-created',
  LOCATION_UPDATED: 'location-updated',
  LOCATION_DELETED: 'location-deleted',
} as const;

export type MapEventType = typeof MapEvents[keyof typeof MapEvents];
