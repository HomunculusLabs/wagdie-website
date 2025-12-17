import {
  EventBus,
  MapEvents,
  type LayerVisibility,
  type MapLocationData,
  type MapCharacterData,
  type MapEventsData,
  type FlyToPayload,
  type EditorMode,
} from '../../EventBus';
import type { MapScene } from '../MapScene';

export interface MapSceneEventHandlers {
  setLayerVisibility: (layers: Partial<LayerVisibility>) => void;
  flyToLocation: (data: FlyToPayload) => void;
  updateLocations: (locations: MapLocationData[]) => void;
  updateCharacters: (characters: MapCharacterData[]) => void;
  updateEvents: (events: MapEventsData) => void;
  editorModeChanged: (data: { mode: EditorMode }) => void;
  locationDeleted: (data: { id: string }) => void;
}

export function bindMapSceneEvents(scene: MapScene, handlers: MapSceneEventHandlers): () => void {
  // Keep signature stable (scene can be useful for future scene-specific binding decisions)
  void scene;

  EventBus.on(MapEvents.SET_LAYER_VISIBILITY, handlers.setLayerVisibility);
  EventBus.on(MapEvents.FLY_TO_LOCATION, handlers.flyToLocation);
  EventBus.on(MapEvents.UPDATE_LOCATIONS, handlers.updateLocations);
  EventBus.on(MapEvents.UPDATE_CHARACTERS, handlers.updateCharacters);
  EventBus.on(MapEvents.UPDATE_EVENTS, handlers.updateEvents);
  EventBus.on(MapEvents.EDITOR_MODE_CHANGED, handlers.editorModeChanged);
  EventBus.on(MapEvents.LOCATION_DELETED, handlers.locationDeleted);

  return () => {
    EventBus.off(MapEvents.SET_LAYER_VISIBILITY, handlers.setLayerVisibility);
    EventBus.off(MapEvents.FLY_TO_LOCATION, handlers.flyToLocation);
    EventBus.off(MapEvents.UPDATE_LOCATIONS, handlers.updateLocations);
    EventBus.off(MapEvents.UPDATE_CHARACTERS, handlers.updateCharacters);
    EventBus.off(MapEvents.UPDATE_EVENTS, handlers.updateEvents);
    EventBus.off(MapEvents.EDITOR_MODE_CHANGED, handlers.editorModeChanged);
    EventBus.off(MapEvents.LOCATION_DELETED, handlers.locationDeleted);
  };
}