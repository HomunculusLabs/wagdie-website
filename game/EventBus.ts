/**
 * EventBus - Communication bridge between React and Phaser
 *
 * Simple event emitter for bidirectional messaging between React and Phaser.
 */

type EventCallback = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): this {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
    return this;
  }

  off(event: string, callback?: EventCallback): this {
    if (callback) {
      this.events.get(event)?.delete(callback);
    } else {
      this.events.delete(event);
    }
    return this;
  }

  emit(event: string, ...args: any[]): this {
    this.events.get(event)?.forEach((callback) => callback(...args));
    return this;
  }

  once(event: string, callback: EventCallback): this {
    const onceCallback = (...args: any[]) => {
      callback(...args);
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
} as const;

export type MapEventType = typeof MapEvents[keyof typeof MapEvents];
