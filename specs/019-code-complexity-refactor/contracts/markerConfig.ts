/**
 * Marker Configuration Contract
 *
 * Single source of truth for map marker visual properties.
 * Replaces 4 switch statements in MapScene.ts.
 */

// Marker type union
type MarkerType = 'location' | 'character' | 'burn' | 'death' | 'fight';

// Layer visibility keys
type LayerVisibilityKey = 'locations' | 'characters' | 'burns' | 'deaths' | 'fights';

// Configuration shape for each marker type
interface MarkerConfig {
  icon: string;              // Icon asset key (e.g., 'icon_location')
  scale: number;             // Display scale (0.0 - 1.0+)
  depth: number;             // Z-index for layering (higher = on top)
  visibilityKey: LayerVisibilityKey;  // Key in LayerVisibility object
}

// Complete configuration map
type MarkerConfigMap = Record<MarkerType, MarkerConfig>;

// Configuration values
const MARKER_CONFIG: MarkerConfigMap = {
  location: {
    icon: 'icon_location',
    scale: 0.6,
    depth: 50,
    visibilityKey: 'locations',
  },
  character: {
    icon: 'icon_youarehere',
    scale: 0.8,
    depth: 100,
    visibilityKey: 'characters',
  },
  burn: {
    icon: 'icon_burn',
    scale: 0.6,
    depth: 75,
    visibilityKey: 'burns',
  },
  death: {
    icon: 'icon_death',
    scale: 0.6,
    depth: 75,
    visibilityKey: 'deaths',
  },
  fight: {
    icon: 'icon_fight',
    scale: 0.6,
    depth: 75,
    visibilityKey: 'fights',
  },
};

// Helper functions (replace switch statements)
function getMarkerIcon(type: MarkerType): string {
  return MARKER_CONFIG[type].icon;
}

function getMarkerScale(type: MarkerType): number {
  return MARKER_CONFIG[type].scale;
}

function getMarkerDepth(type: MarkerType): number {
  return MARKER_CONFIG[type].depth;
}

function isMarkerVisible(type: MarkerType, visibility: Record<LayerVisibilityKey, boolean>): boolean {
  return visibility[MARKER_CONFIG[type].visibilityKey];
}

// Usage example in MapScene:
// import { MARKER_CONFIG, getMarkerIcon, isMarkerVisible } from '@/game/config/markerConfig';
//
// const iconKey = MARKER_CONFIG[data.type].icon;  // or getMarkerIcon(data.type)
// const scale = MARKER_CONFIG[data.type].scale;
// const visible = isMarkerVisible(data.type, this.layerVisibility);
