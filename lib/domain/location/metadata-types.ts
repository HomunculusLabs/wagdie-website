export type LocationBounds = [[number, number], [number, number]];
export type LocationCenter = [number, number];
export interface LocationCoordinatesObj { x: number; y: number; }

export interface NormalizedLocationMetadata extends Record<string, unknown> {
  bounds: LocationBounds;                 // always present
  center?: LocationCenter;                // present when derivable
  coordinates?: LocationCoordinatesObj;   // present when derivable
}