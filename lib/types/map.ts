/**
 * TypeScript type definitions for Native Map Integration
 *
 * This file contains all type definitions for:
 * - Location entities
 * - Character location entities
 * - Map markers and layers
 * - UI state types
 */

/**
 * Position type for map coordinates (replaces Leaflet's MapPosition)
 * Can be [lat, lng] tuple or {lat: number, lng: number} object
 */
export type MapPosition = [number, number] | { lat: number; lng: number };

// ============================================================================
// Core Entity Types
// ============================================================================

/**
 * Location entity from Supabase locations table
 */
export interface Location {
  id: string;
  name: string;
  description?: string;
  chain_location_id?: number | string;
  metadata: LocationMetadata;
  created_at: string;
  updated_at: string;
  character_locations?: {
    character_token_id: number;
    wallet_address: string;
    status: CharacterLocationStatus;
  }[];
}

/**
 * Location metadata containing map positioning information
 */
export interface LocationMetadata {
  bounds: [
    [number, number], // Southwest corner [x, y]
    [number, number], // Northeast corner [x, y]
  ];
  center?: [number, number];
  area?: number;
  properties?: {
    terrain?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    special?: boolean;
  };
  special_properties?: string[];
  // Editor coordinates (x, y position for map editor pins)
  coordinates?: { x: number; y: number };
}

/**
 * Character location from Supabase character_locations table
 */
export interface CharacterLocation {
  id: string;
  character_token_id: number;
  location_id: string;
  wallet_address: string;
  transaction_hash: string;
  status: CharacterLocationStatus;
  created_at: string;
  updated_at: string;

  // Relations (eager loaded)
  location?: Location;
}

/**
 * Status of character location assignment
 */
export type CharacterLocationStatus = 'pending' | 'confirmed' | 'failed';

// ============================================================================
// Map Display Types
// ============================================================================

/**
 * Types of markers that can be displayed on the map
 */
export type MarkerType = 'location' | 'character' | 'burn' | 'death' | 'fight';

/**
 * Generic map marker interface
 */
export interface MapMarkerData {
  id: string;
  type: MarkerType;
  position: MapPosition;
  data: Location | CharacterLocation | EventMarker;
  iconUrl?: string;
}

/**
 * Event markers (burns, deaths, fights)
 */
export interface EventMarker {
  id: string;
  type: 'burn' | 'death' | 'fight';
  title: string;
  description?: string;
  timestamp: string;
  position: MapPosition;
}

/**
 * Layer visibility state
 */
export interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

/**
 * Map bounds representing a rectangular area
 */
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

/**
 * Viewport state including bounds and zoom level
 */
export interface Viewport {
  bounds: MapBounds;
  zoom: number;
}

// ============================================================================
// UI Content Types
// ============================================================================

/**
 * Content for map popups
 */
export interface PopupContent {
  title: string;
  description?: string;
  details?: {
    label: string;
    value: string | number;
  }[];
  actions?: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  }[];
}

/**
 * Content for map tooltips
 */
export interface TooltipContent {
  title: string;
  subtitle?: string;
}

// ============================================================================
// Service Response Types
// ============================================================================

/**
 * Location with occupancy information
 */
export interface LocationOccupancy {
  location: Location;
  characterCount: number;
  characters: {
    tokenId: number;
    walletAddress: string;
  }[];
}

/**
 * Repository interfaces for data access
 */
export interface LocationRepository {
  getAll(): Promise<Location[]>;
  getById(id: string): Promise<Location | null>;
  getWithCharacters(id: string): Promise<Location | null>;
}

export interface CharacterLocationRepository {
  getAll(): Promise<CharacterLocation[]>;
  getByTokenId(tokenId: number): Promise<CharacterLocation | null>;
  getByWalletAddress(address: string): Promise<CharacterLocation[]>;
  getByLocationId(locationId: string): Promise<CharacterLocation[]>;
  getConfirmed(): Promise<CharacterLocation[]>;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Location service business logic
 */
export interface LocationService {
  getAvailableLocations(): Promise<Location[]>;
  getLocationWithOccupancy(id: string): Promise<LocationOccupancy | null>;
  validateLocationBounds(id: string, point: [number, number]): Promise<boolean>;
}

/**
 * Character location service business logic
 */
export interface CharacterLocationService {
  getCharacterLocation(tokenId: number): Promise<CharacterLocation | null>;
  getWalletCharacters(address: string): Promise<CharacterLocation[]>;
  getAllCharacterPositions(): Promise<MapMarkerData[]>;
  getPositionsByLayer(layer: MarkerType): Promise<MapMarkerData[]>;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for MapMarker component
 */
export interface MapMarkerProps {
  id: string;
  position: MapPosition;
  type: MarkerType;
  data: Location | CharacterLocation | EventMarker;
  iconUrl?: string;
  onClick?: (marker: MapMarkerData) => void;
  onHover?: (marker: MapMarkerData) => void;
}

/**
 * Props for NativeMap component
 */
export interface NativeMapProps {
  center?: MapPosition;
  zoom?: number;
  onMove?: (bounds: MapBounds) => void;
  onMarkerClick?: (marker: MapMarkerData) => void;
  onMarkerHover?: (marker: MapMarkerData) => void;
}

/**
 * Props for LayerControls component
 */
export interface LayerControlsProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Return value for useLocations hook
 */
export interface UseLocationsReturn {
  locations: Location[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Return value for useCharacterLocations hook
 */
export interface UseCharacterLocationsReturn {
  characterLocations: CharacterLocation[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Return value for useLayerVisibility hook
 */
export interface UseLayerVisibilityReturn {
  layers: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setLayers: (layers: LayerVisibility) => void;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Custom error for map-related operations
 */
export class MapError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MapError';
  }
}

/**
 * Error for asset loading failures
 */
export class AssetError extends MapError {
  constructor(assetPath: string, error: Error) {
    super(`Failed to load asset: ${assetPath}`, 'ASSET_LOAD_FAILED', error);
    this.name = 'AssetError';
  }
}

/**
 * Error for location-related operations
 */
export class LocationError extends MapError {
  constructor(message: string, details?: unknown) {
    super(message, 'LOCATION_ERROR', details);
    this.name = 'LocationError';
  }
}

// ============================================================================
// Map Editor Types (018-map-editor)
// ============================================================================

/**
 * Input for creating a new location
 */
export interface CreateLocationInput {
  name: string // Required, non-empty, 1-200 chars
  description?: string // Optional, max 2000 chars
  coordinates: { x: number; y: number } // Required for placement
}

/**
 * Input for updating an existing location
 */
export interface UpdateLocationInput {
  name?: string // Optional update, 1-200 chars if provided
  description?: string // Optional update, max 2000 chars
  coordinates?: { x: number; y: number } // For repositioning
}

/**
 * Standard API response for single location
 */
export interface LocationResponse {
  success: boolean
  data?: Location
  error?: string
  details?: string[]
}

/**
 * Standard API response for location list
 */
export interface LocationListResponse {
  success: boolean
  data?: Location[]
  error?: string
}

/**
 * Editor mode state
 */
export type EditorMode = 'view' | 'create' | 'edit'

/**
 * Editor state for map editor component
 */
export interface EditorState {
  mode: EditorMode
  selectedLocation: Location | null
  pendingLocation: { x: number; y: number } | null
  locations: Location[]
  isLoading: boolean
  error: string | null
}
