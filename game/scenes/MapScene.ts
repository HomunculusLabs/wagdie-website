/**
 * MapScene - Main WAGDIE World Map Scene
 *
 * Renders the WAGDIE map with interactive markers for locations,
 * characters, and events. Supports zoom, pan, and marker interactions.
 */

import * as Phaser from 'phaser';
import {
  EventBus,
  MapEvents,
  type LayerVisibility,
  type MapLocationData,
  type MapCharacterData,
  type MapEventsData,
  type MarkerPayload,
  type FlyToPayload,
  type EditorMode,
} from '../EventBus';
import {
  type MarkerType,
  type LayerVisibilityKey,
  getMarkerIcon,
  getMarkerScale,
  getMarkerDepth,
  isMarkerVisible,
} from '../config/markerConfig';

import {
  MAP_WIDTH,
  MAP_HEIGHT,
  COORD_SCALE,
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
} from './map/coords';
import { bindMapSceneEvents, type MapSceneEventHandlers } from './map/event-bindings';

/**
 * Deterministic ring layout offsets for stacked character markers.
 */
function getStackOffset(index: number): { dx: number; dy: number } {
  if (index === 0) return { dx: 0, dy: 0 }; // First marker stays at center

  const baseRadius = 14; // World units for first ring
  const ringStep = 10; // Additional radius per ring
  const ringSize = 8; // Markers per ring

  const adjustedIndex = index - 1; // Skip center position
  const ring = Math.floor(adjustedIndex / ringSize);
  const positionInRing = adjustedIndex % ringSize;
  const radius = baseRadius + ring * ringStep;
  const angle = (2 * Math.PI * positionInRing) / ringSize;

  return {
    dx: Math.cos(angle) * radius,
    dy: Math.sin(angle) * radius,
  };
}

/** Internal marker data structure */
interface MarkerData {
  id: string;
  type: MarkerType;
  name: string;
  x: number;
  y: number;
  data: MapLocationData | MapCharacterData | Record<string, unknown>;
}

type InteractionState =
  | { kind: 'idle' }
  | {
      kind: 'panning';
      dragStartX: number;
      dragStartY: number;
      cameraStartX: number;
      cameraStartY: number;
    }
  | {
      kind: 'dragging-marker';
      marker: Phaser.GameObjects.Sprite;
      markerId: string;
    };

export class MapScene extends Phaser.Scene {
  private mapImage!: Phaser.GameObjects.Image;
  private markers: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private markerData: Map<string, MarkerData> = new Map();
  private layerVisibility: LayerVisibility = {
    locations: true,
    characters: true,
    burns: true,
    deaths: true,
    fights: true,
  };

  // Editor mode state
  private editorMode: 'view' | 'create' | 'edit' = 'view';

  // Unified interaction state (camera pan OR marker drag, never both)
  private interaction: InteractionState = { kind: 'idle' };

  // Tooltip
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private tooltipBg!: Phaser.GameObjects.Rectangle;

  private unbindEventBusListeners: (() => void) | null = null;

  constructor() {
    super('MapScene');
  }

  preload(): void {
    // Load map background
    this.load.image('wagdiemap', '/images/wagdiemap.png');

    // Load marker icons
    this.load.image('icon_location', '/images/mapicons/icon_location.png');
    this.load.image('icon_youarehere', '/images/mapicons/icon_youarehere.png');
    this.load.image('icon_burn', '/images/mapicons/icon_burn.png');
    this.load.image('icon_death', '/images/mapicons/icon_death.png');
    this.load.image('icon_fight', '/images/mapicons/icon_fight.png');
  }

  create(): void {
    // Create map background centered
    this.mapImage = this.add.image(MAP_WIDTH / 2, MAP_HEIGHT / 2, 'wagdiemap');
    this.mapImage.setOrigin(0.5, 0.5);

    // Set up camera
    const camera = this.cameras.main;
    camera.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    camera.setZoom(DEFAULT_ZOOM);
    camera.centerOn(MAP_WIDTH / 2, MAP_HEIGHT / 2);

    // Create tooltip (hidden by default)
    this.createTooltip();

    // Set up input handlers
    this.setupInputHandlers();

    const handlers: MapSceneEventHandlers = {
      setLayerVisibility: (layers: Partial<LayerVisibility>) => {
        Object.entries(layers).forEach(([key, visible]) => {
          this.layerVisibility[key as keyof LayerVisibility] = visible as boolean;
        });
        this.updateMarkerVisibility();
      },
      flyToLocation: (data: FlyToPayload) => {
        this.flyTo(data.x * COORD_SCALE, data.y * COORD_SCALE, data.zoom);
      },
      updateLocations: (locations: MapLocationData[]) => {
        this.updateLocations(locations);
      },
      updateCharacters: (characters: MapCharacterData[]) => {
        this.updateCharacters(characters);
      },
      updateEvents: (events: MapEventsData) => {
        this.updateEvents(events);
      },
      editorModeChanged: (data: { mode: EditorMode }) => {
        this.editorMode = data.mode;
        this.updateMarkerDraggability();
      },
      locationDeleted: (data: { id: string }) => {
        const markerId = `location-${data.id}`;
        const marker = this.markers.get(markerId);
        if (marker) {
          marker.destroy();
          this.markers.delete(markerId);
          this.markerData.delete(markerId);
        }
      },
    };

    this.unbindEventBusListeners = bindMapSceneEvents(this, handlers);

    // Ensure we always remove EventBus listeners when the scene is torn down
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupEventBusListeners, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanupEventBusListeners, this);

    // Notify React that scene is ready
    EventBus.emit(MapEvents.SCENE_READY, this);
    EventBus.emit(MapEvents.MAP_READY, {
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      zoom: camera.zoom,
    });
  }

  private createTooltip(): void {
    // Create tooltip background
    this.tooltipBg = this.add.rectangle(0, 0, 200, 40, 0x0f0f0f, 0.95);
    this.tooltipBg.setStrokeStyle(2, 0xd4af37);
    this.tooltipBg.setOrigin(0.5, 1);

    // Create tooltip text
    this.tooltipText = this.add.text(0, -20, '', {
      fontFamily: 'serif',
      fontSize: '14px',
      color: '#e8e8e8',
      align: 'center',
    });
    this.tooltipText.setOrigin(0.5, 0.5);

    // Create container
    this.tooltip = this.add.container(0, 0, [this.tooltipBg, this.tooltipText]);
    this.tooltip.setDepth(1000);
    this.tooltip.setVisible(false);

    // Make tooltip follow camera
    this.tooltip.setScrollFactor(0);
  }

  private setupInputHandlers(): void {
    const camera = this.cameras.main;

    this.setupWheelZoomHandlers(camera);
    this.setupPointerInteractionHandlers(camera);
    this.setupPointerUpHandlers(camera);
    this.setupPinchZoomHandlers(camera);
  }

  private setupWheelZoomHandlers(camera: Phaser.Cameras.Scene2D.Camera): void {
    // Mouse wheel zoom
    this.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        const oldZoom = camera.zoom;
        const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
        const newZoom = Phaser.Math.Clamp(oldZoom + zoomDelta, MIN_ZOOM, MAX_ZOOM);

        if (newZoom !== oldZoom) {
          // Zoom towards mouse position
          const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
          camera.zoom = newZoom;

          // Adjust camera to zoom towards pointer
          const newWorldPoint = camera.getWorldPoint(pointer.x, pointer.y);
          camera.scrollX += worldPoint.x - newWorldPoint.x;
          camera.scrollY += worldPoint.y - newWorldPoint.y;

          this.emitCameraChanged();
        }
      }
    );
  }

  private setupPointerInteractionHandlers(camera: Phaser.Cameras.Scene2D.Camera): void {
    // Pointer down: create-mode click OR begin panning (marker drag is initiated from marker pointerdown)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return;

      // Create mode: always emit MAP_CLICKED (behavior preserved)
      if (this.editorMode === 'create') {
        const coords = this.getMapCoordsFromPointer(pointer, camera);
        EventBus.emit(MapEvents.MAP_CLICKED, coords);
        return;
      }

      // If a marker drag was initiated by a marker's pointerdown, do not start panning.
      if (this.interaction.kind === 'dragging-marker') {
        return;
      }

      // Begin camera panning (only if idle)
      this.interaction = {
        kind: 'panning',
        dragStartX: pointer.x,
        dragStartY: pointer.y,
        cameraStartX: camera.scrollX,
        cameraStartY: camera.scrollY,
      };
    });

    // Pointer move: drag marker OR pan camera
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.interaction.kind === 'dragging-marker') {
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        this.interaction.marker.setPosition(worldPoint.x, worldPoint.y);
        return;
      }

      if (this.interaction.kind === 'panning') {
        const dx = (this.interaction.dragStartX - pointer.x) / camera.zoom;
        const dy = (this.interaction.dragStartY - pointer.y) / camera.zoom;
        camera.scrollX = this.interaction.cameraStartX + dx;
        camera.scrollY = this.interaction.cameraStartY + dy;
      }
    });
  }

  private setupPointerUpHandlers(camera: Phaser.Cameras.Scene2D.Camera): void {
    // Pointer up: finish marker drag OR finish panning
    this.input.on('pointerup', () => {
      if (this.interaction.kind === 'dragging-marker') {
        const worldPoint = camera.getWorldPoint(
          this.input.activePointer.x,
          this.input.activePointer.y
        );

        // Convert back to 0-1000 coordinate system
        const x = worldPoint.x / COORD_SCALE;
        const y = worldPoint.y / COORD_SCALE;

        // Emit marker dragged event to React (domain id, behavior preserved)
        EventBus.emit(MapEvents.MARKER_DRAGGED, {
          id: this.interaction.markerId.replace('location-', ''),
          x,
          y,
        });

        // Always clear interaction so camera pan cannot remain \"stuck\"
        this.interaction = { kind: 'idle' };
        return;
      }

      if (this.interaction.kind === 'panning') {
        this.interaction = { kind: 'idle' };
        this.emitCameraChanged();
      }
    });

    // Pointer up outside: cancel marker drag (restore position) OR finish panning
    this.input.on('pointerupoutside', () => {
      if (this.interaction.kind === 'dragging-marker') {
        // Restore original position from stored marker data (behavior preserved)
        const data = this.markerData.get(this.interaction.markerId);
        if (data) {
          this.interaction.marker.setPosition(data.x, data.y);
        }

        this.interaction = { kind: 'idle' };
        return;
      }

      if (this.interaction.kind === 'panning') {
        this.interaction = { kind: 'idle' };
        this.emitCameraChanged();
      }
    });
  }

  private setupPinchZoomHandlers(camera: Phaser.Cameras.Scene2D.Camera): void {
    // Pinch zoom for touch devices (behavior unchanged)
    this.input.on(
      'pinch',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObject: Phaser.GameObjects.GameObject | null,
        _startDistance: number,
        _distance: number,
        scaleFactor: number
      ) => {
        const newZoom = Phaser.Math.Clamp(camera.zoom * scaleFactor, MIN_ZOOM, MAX_ZOOM);
        camera.zoom = newZoom;
        this.emitCameraChanged();
      }
    );
  }

  private getMapCoordsFromPointer(
    pointer: Phaser.Input.Pointer,
    camera: Phaser.Cameras.Scene2D.Camera
  ): { x: number; y: number } {
    const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
    const x = worldPoint.x / COORD_SCALE;
    const y = worldPoint.y / COORD_SCALE;
    return { x, y };
  }

  private emitCameraChanged(): void {
    const camera = this.cameras.main;
    EventBus.emit(MapEvents.CAMERA_CHANGED, {
      scrollX: camera.scrollX,
      scrollY: camera.scrollY,
      zoom: camera.zoom,
    });
  }

  /**
   * Fly camera to a specific position with animation
   */
  public flyTo(x: number, y: number, zoom?: number): void {
    const camera = this.cameras?.main;
    if (!camera) return;
    const duration = 500;

    camera.pan(x, y, duration, 'Power2');
    if (zoom !== undefined) {
      camera.zoomTo(zoom, duration, 'Power2');
    }
  }

  /**
   * Add or update location markers
   */
  public updateLocations(locations: MapLocationData[]): void {
    locations.forEach((location) => {
      const coords = location.metadata?.center || location.htmlcoordinates;
      if (!coords) return;

      const x = coords[0] * COORD_SCALE;
      const y = coords[1] * COORD_SCALE;
      const id = `location-${location.id}`;

      this.createOrUpdateMarker({
        id,
        type: 'location',
        name: location.name,
        x,
        y,
        data: location,
      });
    });
  }

  /**
   * Add or update character markers
   */
  public updateCharacters(characters: MapCharacterData[]): void {
    const charactersByLocationId = new Map<string, MapCharacterData[]>();

    for (const charLocation of characters) {
      const locationId = charLocation.location?.id;
      if (!locationId) continue;

      const list = charactersByLocationId.get(locationId);
      if (list) list.push(charLocation);
      else charactersByLocationId.set(locationId, [charLocation]);
    }

    // Sort each location group for stable positioning (same inputs => same offsets)
    for (const [, list] of charactersByLocationId) {
      list.sort((a, b) => a.character_token_id - b.character_token_id);
    }

    // Precompute world positions per token id (including offsets)
    const positionsByTokenId = new Map<number, { x: number; y: number }>();

    for (const [, list] of charactersByLocationId) {
      const baseCenter = list.find((row) => {
        const center = row.location?.metadata?.center;
        return Array.isArray(center) && center.length === 2;
      })?.location?.metadata?.center;

      if (!Array.isArray(baseCenter) || baseCenter.length !== 2) {
        continue;
      }

      const baseX = baseCenter[0] * COORD_SCALE;
      const baseY = baseCenter[1] * COORD_SCALE;

      for (let i = 0; i < list.length; i++) {
        const row = list[i];
        const { dx, dy } = getStackOffset(i);
        positionsByTokenId.set(row.character_token_id, {
          x: baseX + dx,
          y: baseY + dy,
        });
      }
    }

    // Create/update markers using the computed positions (fallback to base center if not grouped)
    characters.forEach((charLocation) => {
      const coords = charLocation.location?.metadata?.center;
      if (!Array.isArray(coords) || coords.length !== 2) return;

      const fallbackX = coords[0] * COORD_SCALE;
      const fallbackY = coords[1] * COORD_SCALE;

      const position = positionsByTokenId.get(charLocation.character_token_id) ?? {
        x: fallbackX,
        y: fallbackY,
      };

      const id = `character-${charLocation.character_token_id}`;

      this.createOrUpdateMarker({
        id,
        type: 'character',
        name: charLocation.character_name || `Character #${charLocation.character_token_id}`,
        x: position.x,
        y: position.y,
        data: charLocation,
      });
    });
  }

  /**
   * Add or update event markers (burns, deaths, fights)
   */
  public updateEvents(events: MapEventsData): void {
    // Burns
    events.burns?.forEach((burn, index) => {
      if (!burn.htmlcoordinates) return;
      const x = burn.htmlcoordinates[0] * COORD_SCALE;
      const y = burn.htmlcoordinates[1] * COORD_SCALE;
      this.createOrUpdateMarker({
        id: `burn-${burn.wikiPageID || index}`,
        type: 'burn',
        name: burn.name || burn.title || 'Burn Event',
        x,
        y,
        data: burn,
      });
    });

    // Deaths
    events.deaths?.forEach((death, index) => {
      if (!death.htmlcoordinates) return;
      const x = death.htmlcoordinates[0] * COORD_SCALE;
      const y = death.htmlcoordinates[1] * COORD_SCALE;
      this.createOrUpdateMarker({
        id: `death-${death.wikiPageID || index}`,
        type: 'death',
        name: death.name || death.title || 'Death Event',
        x,
        y,
        data: death,
      });
    });

    // Fights
    events.fights?.forEach((fight, index) => {
      if (!fight.htmlcoordinates) return;
      const x = fight.htmlcoordinates[0] * COORD_SCALE;
      const y = fight.htmlcoordinates[1] * COORD_SCALE;
      this.createOrUpdateMarker({
        id: `fight-${fight.wikiPageID || index}`,
        type: 'fight',
        name: fight.name || fight.title || 'Battle Event',
        x,
        y,
        data: fight,
      });
    });
  }

  /**
   * Create or update a marker sprite
   */
  private createOrUpdateMarker(data: MarkerData): void {
    let marker = this.markers.get(data.id);

    const iconKey = getMarkerIcon(data.type);
    const scale = getMarkerScale(data.type);

    if (!marker) {
      // Create new marker
      marker = this.add.sprite(data.x, data.y, iconKey);
      marker.setScale(scale);

      // Set interactive with drag support for location markers in edit mode
      const isDraggable = data.type === 'location' && this.editorMode === 'edit';
      marker.setInteractive({ useHandCursor: true, draggable: isDraggable });
      marker.setDepth(getMarkerDepth(data.type));

      // Set up marker events
      marker.on('pointerover', () => this.onMarkerHover(data));
      marker.on('pointerout', () => this.onMarkerOut(data));
      marker.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
        // Start drag if in edit mode and it's a location marker (manual drag behavior preserved)
        if (this.editorMode === 'edit' && data.type === 'location') {
          this.interaction = {
            kind: 'dragging-marker',
            marker: marker!,
            markerId: data.id,
          };
        }
        this.onMarkerClick(data);
      });

      this.markers.set(data.id, marker);
    } else {
      // Update existing marker
      marker.setPosition(data.x, data.y);
    }

    // Store marker data
    this.markerData.set(data.id, data);

    // Apply visibility based on layer settings
    marker.setVisible(isMarkerVisible(data.type, this.layerVisibility));
  }

  // Removed: getIconKey, getMarkerScale, getMarkerDepth, isMarkerVisible
  // Now using imported helpers from '../config/markerConfig'

  private updateMarkerVisibility(): void {
    this.markers.forEach((marker, id) => {
      const data = this.markerData.get(id);
      if (data) {
        marker.setVisible(isMarkerVisible(data.type, this.layerVisibility));
      }
    });
  }

  /**
   * Update marker draggability based on editor mode
   */
  private updateMarkerDraggability(): void {
    this.markers.forEach((marker, id) => {
      const data = this.markerData.get(id);
      if (data && data.type === 'location') {
        // Location markers are draggable in edit mode
        const isDraggable = this.editorMode === 'edit';
        if (isDraggable) {
          marker.setInteractive({ useHandCursor: true, draggable: true });
        } else {
          marker.setInteractive({ useHandCursor: true, draggable: false });
        }
      }
    });
  }

  private onMarkerHover(data: MarkerData): void {
    // Update tooltip
    this.tooltipText.setText(data.name);
    this.tooltipBg.setSize(this.tooltipText.width + 24, 36);

    // Position tooltip in screen space
    const pointer = this.input.activePointer;
    this.tooltip.setPosition(pointer.x, pointer.y - 20);
    this.tooltip.setVisible(true);

    // Emit event to React
    EventBus.emit(MapEvents.MARKER_HOVERED, data);
  }

  private onMarkerOut(_data: MarkerData): void {
    this.tooltip.setVisible(false);
    EventBus.emit(MapEvents.MARKER_UNHOVERED);
  }

  private onMarkerClick(data: MarkerData): void {
    // Emit event to React
    EventBus.emit(MapEvents.MARKER_CLICKED, data);

    // Fly to marker
    this.flyTo(data.x, data.y, 1.5);
  }

  update(): void {
    // Update tooltip position to follow mouse
    if (this.tooltip.visible) {
      const pointer = this.input.activePointer;
      this.tooltip.setPosition(pointer.x, pointer.y - 20);
    }
  }

  private cleanupEventBusListeners(): void {
    if (this.unbindEventBusListeners) {
      this.unbindEventBusListeners();
      this.unbindEventBusListeners = null;
    }
  }
}
