/**
 * Layer Controller Contract
 * Defines the interface for managing map layer visibility and rendering
 */

import type { MarkerProps } from './marker-component';

export interface LayerVisibility {
  locations: boolean;
  characters: boolean;
  burns: boolean;
  deaths: boolean;
  fights: boolean;
}

export interface LayerState {
  visible: LayerVisibility;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  setLayerVisibility: (layer: keyof LayerVisibility, visible: boolean) => void;
  isLayerVisible: (layer: keyof LayerVisibility) => boolean;
  getVisibleMarkers: <T extends MarkerProps>(markers: T[]) => T[];
  getVisibleLayerCount: () => number;
}

export interface LayerControllerProps {
  locations: React.ReactNode[];
  characterLocations: React.ReactNode[];
  burnMarkers: React.ReactNode[];
  deathMarkers: React.ReactNode[];
  fightMarkers: React.ReactNode[];
  children?: React.ReactNode;
}

export interface LayerController {
  (props: LayerControllerProps): JSX.Element;
}

/**
 * Layer control UI props
 */
export interface LayerControlsProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
  onVisibilityChange?: (layers: LayerVisibility) => void;
  className?: string;
  showCounts?: boolean;
}

export interface LayerControls {
  (props: LayerControlsProps): JSX.Element;
}

/**
 * Layer configuration for each marker type
 */
export interface LayerConfig {
  key: keyof LayerVisibility;
  label: string;
  iconPath: string;
  defaultVisible: boolean;
  description?: string;
  keyboardShortcut?: string;
}

/**
 * Event emitted when layer visibility changes
 */
export interface LayerVisibilityChangeEvent {
  layer: keyof LayerVisibility;
  visible: boolean;
  timestamp: number;
}
