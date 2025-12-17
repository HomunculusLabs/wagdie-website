export const MAP_WIDTH = 2222;
export const MAP_HEIGHT = 2222;
export const COORD_SCALE = MAP_WIDTH / 1000;
export const MIN_ZOOM = 1.0;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1.0;

export function domainToWorld(p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x * COORD_SCALE, y: p.y * COORD_SCALE };
}

export function worldToDomain(p: { x: number; y: number }): { x: number; y: number } {
  return { x: p.x / COORD_SCALE, y: p.y / COORD_SCALE };
}