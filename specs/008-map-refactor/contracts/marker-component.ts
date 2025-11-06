/**
 * Marker Component Contract
 * Defines the interface for the generic MarkerComponent
 */

import type { Location, CharacterLocation, EventMarker } from '@/lib/types/map';

export interface BaseMarkerProps {
  id: string;
  position: [number, number];
  onClick?: (marker: MapMarkerData) => void;
  isMobile?: boolean;
}

export interface LocationMarkerProps extends BaseMarkerProps {
  type: 'location';
  data: Location;
  iconUrl?: string;
}

export interface CharacterMarkerProps extends BaseMarkerProps {
  type: 'character';
  data: CharacterLocation;
  iconUrl?: string;
}

export interface BurnMarkerProps extends BaseMarkerProps {
  type: 'burn';
  data: EventMarker;
  iconUrl?: string;
}

export interface DeathMarkerProps extends BaseMarkerProps {
  type: 'death';
  data: EventMarker;
  iconUrl?: string;
}

export interface FightMarkerProps extends BaseMarkerProps {
  type: 'fight';
  data: EventMarker;
  iconUrl?: string;
}

export type MarkerProps =
  | LocationMarkerProps
  | CharacterMarkerProps
  | BurnMarkerProps
  | DeathMarkerProps
  | FightMarkerProps;

export interface MapMarkerData {
  id: string;
  type: 'location' | 'character' | 'burn' | 'death' | 'fight';
  position: [number, number];
  data: Location | CharacterLocation | EventMarker;
}

// Export the component contract
export interface MarkerComponent {
  (props: MarkerProps): JSX.Element;
}
