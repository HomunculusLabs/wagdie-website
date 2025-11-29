/**
 * MapScene - Main WAGDIE World Map Scene
 *
 * Renders the WAGDIE map with interactive markers for locations,
 * characters, and events. Supports zoom, pan, and marker interactions.
 */

import * as Phaser from 'phaser';
import { EventBus, MapEvents } from '../EventBus';

// Map dimensions (matches original Leaflet implementation)
const MAP_WIDTH = 2222;
const MAP_HEIGHT = 2222;

// Coordinate system (0-1000 like original)
const COORD_SCALE = MAP_WIDTH / 1000;

// Zoom constraints
const MIN_ZOOM = 1.0;
const MAX_ZOOM = 3;
const DEFAULT_ZOOM = 1.0;

// Marker types
type MarkerType = 'location' | 'character' | 'burn' | 'death' | 'fight';

interface MarkerData {
  id: string;
  type: MarkerType;
  name: string;
  x: number;
  y: number;
  data: any;
}

interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

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

  // Drag state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private cameraStartX = 0;
  private cameraStartY = 0;

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

    // Drag to pan
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
        this.cameraStartX = camera.scrollX;
        this.cameraStartY = camera.scrollY;
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = (this.dragStartX - pointer.x) / camera.zoom;
        const dy = (this.dragStartY - pointer.y) / camera.zoom;
        camera.scrollX = this.cameraStartX + dx;
        camera.scrollY = this.cameraStartY + dy;
      }
    });

    this.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.emitCameraChanged();
      }
    });

    this.input.on('pointerupoutside', () => {
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

    const iconKey = this.getIconKey(data.type);
    const scale = this.getMarkerScale(data.type);

    if (!marker) {
      // Create new marker
      marker = this.add.sprite(data.x, data.y, iconKey);
      marker.setScale(scale);
      marker.setInteractive({ useHandCursor: true });
      marker.setDepth(this.getMarkerDepth(data.type));

      // Set up marker events
      marker.on('pointerover', () => this.onMarkerHover(data));
      marker.on('pointerout', () => this.onMarkerOut(data));
      marker.on('pointerdown', () => this.onMarkerClick(data));

      this.markers.set(data.id, marker);
    } else {
      // Update existing marker
      marker.setPosition(data.x, data.y);
    }

    // Store marker data
    this.markerData.set(data.id, data);

    // Apply visibility based on layer settings
    marker.setVisible(this.isMarkerVisible(data.type));
  }

  private getIconKey(type: MarkerType): string {
    switch (type) {
      case 'location':
        return 'icon_location';
      case 'character':
        return 'icon_youarehere';
      case 'burn':
        return 'icon_burn';
      case 'death':
        return 'icon_death';
      case 'fight':
        return 'icon_fight';
      default:
        return 'icon_location';
    }
  }

  private getMarkerScale(type: MarkerType): number {
    switch (type) {
      case 'character':
        return 0.8;
      default:
        return 0.6;
    }
  }

  private getMarkerDepth(type: MarkerType): number {
    switch (type) {
      case 'character':
        return 100;
      case 'location':
        return 50;
      default:
        return 75;
    }
  }

  private isMarkerVisible(type: MarkerType): boolean {
    switch (type) {
      case 'location':
        return this.layerVisibility.locations;
      case 'character':
        return this.layerVisibility.characters;
      case 'burn':
        return this.layerVisibility.burns;
      case 'death':
        return this.layerVisibility.deaths;
      case 'fight':
        return this.layerVisibility.fights;
      default:
        return true;
    }
  }

  private updateMarkerVisibility(): void {
    this.markers.forEach((marker, id) => {
      const data = this.markerData.get(id);
      if (data) {
        marker.setVisible(this.isMarkerVisible(data.type));
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
  }
}
