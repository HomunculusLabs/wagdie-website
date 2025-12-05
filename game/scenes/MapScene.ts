/**
 * MapScene - Main WAGDIE World Map Scene
 *
 * Renders the WAGDIE map with interactive markers for locations,
 * characters, and events. Supports zoom, pan, and marker interactions.
 */

import * as Phaser from 'phaser';
import { EventBus, MapEvents } from '../EventBus';
import {
  type MarkerType,
  type LayerVisibilityKey,
  getMarkerIcon,
  getMarkerScale,
  getMarkerDepth,
  isMarkerVisible,
} from '../config/markerConfig';

// Map dimensions (matches original Leaflet implementation)
const MAP_WIDTH = 2222;
const MAP_HEIGHT = 2222;

// Coordinate system (0-1000 like original)
const COORD_SCALE = MAP_WIDTH / 1000;

// Zoom constraints
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1.0;

interface MarkerData {
  id: string;
  type: MarkerType;
  name: string;
  x: number;
  y: number;
  data: any;
}

type LayerVisibility = Record<LayerVisibilityKey, boolean>;

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

  // Drag state (for camera panning)
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

  // Editor mode state
  private editorMode: 'view' | 'create' | 'edit' = 'view';
  private draggingMarker: Phaser.GameObjects.Sprite | null = null;
  private draggingMarkerId: string | null = null;

  // Tooltip
  private tooltip!: Phaser.GameObjects.Container;
  private tooltipText!: Phaser.GameObjects.Text;
  private tooltipBg!: Phaser.GameObjects.Rectangle;

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

    // Set up event listeners from React
    this.setupEventListeners();

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

    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, _gameObjects: any, _deltaX: number, deltaY: number) => {
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
    });

    // Drag to pan (or drag marker in edit mode)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Check if we're in create mode and clicked on the map (not a marker)
        if (this.editorMode === 'create') {
          // Get world coordinates
          const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
          // Convert back to 0-1000 coordinate system
          const x = worldPoint.x / COORD_SCALE;
          const y = worldPoint.y / COORD_SCALE;

          // Emit map clicked event to React
          EventBus.emit(MapEvents.MAP_CLICKED, { x, y });
          return;
        }

        // Normal camera drag
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = camera.scrollX;
        this.cameraStartY = camera.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Handle marker dragging
      if (this.draggingMarker && this.draggingMarkerId) {
        const worldPoint = camera.getWorldPoint(pointer.x, pointer.y);
        this.draggingMarker.setPosition(worldPoint.x, worldPoint.y);
        return;
      }

      // Handle camera dragging
      if (this.isDragging) {
        const dx = (this.dragStartX - pointer.x) / camera.zoom;
        const dy = (this.dragStartY - pointer.y) / camera.zoom;
        camera.scrollX = this.cameraStartX + dx;
        camera.scrollY = this.cameraStartY + dy;
      }
    });

    this.input.on('pointerup', () => {
      // Handle marker drag end
      if (this.draggingMarker && this.draggingMarkerId) {
        const worldPoint = camera.getWorldPoint(this.input.activePointer.x, this.input.activePointer.y);
        // Convert back to 0-1000 coordinate system
        const x = worldPoint.x / COORD_SCALE;
        const y = worldPoint.y / COORD_SCALE;

        // Emit marker dragged event to React
        EventBus.emit(MapEvents.MARKER_DRAGGED, {
          id: this.draggingMarkerId.replace('location-', ''),
          x,
          y,
        });

        this.draggingMarker = null;
        this.draggingMarkerId = null;
        return;
      }

      if (this.isDragging) {
        this.isDragging = false;
        this.emitCameraChanged();
      }
    });

    this.input.on('pointerupoutside', () => {
      // Cancel marker drag
      if (this.draggingMarker && this.draggingMarkerId) {
        // Restore original position
        const data = this.markerData.get(this.draggingMarkerId);
        if (data) {
          this.draggingMarker.setPosition(data.x, data.y);
        }
        this.draggingMarker = null;
        this.draggingMarkerId = null;
      }

      if (this.isDragging) {
        this.isDragging = false;
        this.emitCameraChanged();
      }
    });

    // Pinch zoom for touch devices
    this.input.on('pinch', (pointer: Phaser.Input.Pointer, _gameObject: any, _startDistance: number, _distance: number, scaleFactor: number) => {
      const newZoom = Phaser.Math.Clamp(camera.zoom * scaleFactor, MIN_ZOOM, MAX_ZOOM);
      camera.zoom = newZoom;
      this.emitCameraChanged();
    });
  }

  private setupEventListeners(): void {
    // Layer visibility changes from React
    EventBus.on(MapEvents.SET_LAYER_VISIBILITY, (layers: Partial<LayerVisibility>) => {
      Object.entries(layers).forEach(([key, visible]) => {
        this.layerVisibility[key as keyof LayerVisibility] = visible as boolean;
      });
      this.updateMarkerVisibility();
    });

    // Fly to location
    EventBus.on(MapEvents.FLY_TO_LOCATION, (data: { x: number; y: number; zoom?: number }) => {
      this.flyTo(data.x * COORD_SCALE, data.y * COORD_SCALE, data.zoom);
    });

    // Update locations from React
    EventBus.on(MapEvents.UPDATE_LOCATIONS, (locations: any[]) => {
      this.updateLocations(locations);
    });

    // Update characters from React
    EventBus.on(MapEvents.UPDATE_CHARACTERS, (characters: any[]) => {
      this.updateCharacters(characters);
    });

    // Update events (burns, deaths, fights) from React
    EventBus.on(MapEvents.UPDATE_EVENTS, (events: { burns: any[]; deaths: any[]; fights: any[] }) => {
      this.updateEvents(events);
    });

    // Editor mode changes from React (018-map-editor)
    EventBus.on(MapEvents.EDITOR_MODE_CHANGED, (data: { mode: 'view' | 'create' | 'edit' }) => {
      this.editorMode = data.mode;
      this.updateMarkerDraggability();
    });

    // Location deleted - remove marker
    EventBus.on(MapEvents.LOCATION_DELETED, (data: { id: string }) => {
      const markerId = `location-${data.id}`;
      const marker = this.markers.get(markerId);
      if (marker) {
        marker.destroy();
        this.markers.delete(markerId);
        this.markerData.delete(markerId);
      }
    });
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
    const camera = this.cameras.main;
    const duration = 500;

    camera.pan(x, y, duration, 'Power2');
    if (zoom !== undefined) {
      camera.zoomTo(zoom, duration, 'Power2');
    }
  }

  /**
   * Add or update location markers
   */
  public updateLocations(locations: any[]): void {
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
  public updateCharacters(characters: any[]): void {
    characters.forEach((charLocation) => {
      const coords = charLocation.location?.metadata?.center;
      if (!coords) return;

      const x = coords[0] * COORD_SCALE;
      const y = coords[1] * COORD_SCALE;
      const id = `character-${charLocation.character_token_id}`;

      this.createOrUpdateMarker({
        id,
        type: 'character',
        name: charLocation.character_name || `Character #${charLocation.character_token_id}`,
        x,
        y,
        data: charLocation,
      });
    });
  }

  /**
   * Add or update event markers (burns, deaths, fights)
   */
  public updateEvents(events: { burns: any[]; deaths: any[]; fights: any[] }): void {
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
        // Start drag if in edit mode and it's a location marker
        if (this.editorMode === 'edit' && data.type === 'location') {
          this.draggingMarker = marker!;
          this.draggingMarkerId = data.id;
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

  /**
   * Clean up when scene is destroyed
   */
  shutdown(): void {
    // Remove event listeners
    EventBus.off(MapEvents.SET_LAYER_VISIBILITY);
    EventBus.off(MapEvents.FLY_TO_LOCATION);
    EventBus.off(MapEvents.UPDATE_LOCATIONS);
    EventBus.off(MapEvents.UPDATE_CHARACTERS);
    EventBus.off(MapEvents.UPDATE_EVENTS);

    // Remove editor event listeners
    EventBus.off(MapEvents.EDITOR_MODE_CHANGED);
    EventBus.off(MapEvents.LOCATION_DELETED);
  }
}
