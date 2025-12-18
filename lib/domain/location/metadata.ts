import type {
  LocationBounds,
  LocationCenter,
  LocationCoordinatesObj,
  NormalizedLocationMetadata,
} from './metadata-types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function parseCoordinates(meta: unknown): LocationCoordinatesObj | undefined {
  if (!isPlainObject(meta)) return undefined;

  const coordinatesValue = meta['coordinates'];
  if (!isPlainObject(coordinatesValue)) return undefined;

  const x = coordinatesValue['x'];
  const y = coordinatesValue['y'];

  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return undefined;

  return { x, y };
}

export function parseBounds(meta: unknown): LocationBounds | undefined {
  if (!isPlainObject(meta)) return undefined;

  const boundsValue = meta['bounds'];

  // Format 1: [[x0, y0], [x1, y1]] - array format
  if (Array.isArray(boundsValue) && boundsValue.length === 2) {
    const b0 = boundsValue[0];
    const b1 = boundsValue[1];

    if (Array.isArray(b0) && Array.isArray(b1) && b0.length === 2 && b1.length === 2) {
      const x0 = b0[0];
      const y0 = b0[1];
      const x1 = b1[0];
      const y1 = b1[1];

      if (isFiniteNumber(x0) && isFiniteNumber(y0) && isFiniteNumber(x1) && isFiniteNumber(y1)) {
        return [[x0, y0], [x1, y1]];
      }
    }
  }

  // Format 2: { north, south, east, west } - cardinal format
  if (isPlainObject(boundsValue)) {
    const north = boundsValue['north'];
    const south = boundsValue['south'];
    const east = boundsValue['east'];
    const west = boundsValue['west'];

    if (isFiniteNumber(north) && isFiniteNumber(south) && isFiniteNumber(east) && isFiniteNumber(west)) {
      // Convert to [[west, south], [east, north]] format (min, max)
      return [[west, south], [east, north]];
    }

    // Format 3: { maxLat/latMax, minLat/latMin, maxLng/lngMax, minLng/lngMin }
    const maxLat = boundsValue['maxLat'] ?? boundsValue['latMax'];
    const minLat = boundsValue['minLat'] ?? boundsValue['latMin'];
    const maxLng = boundsValue['maxLng'] ?? boundsValue['lngMax'];
    const minLng = boundsValue['minLng'] ?? boundsValue['lngMin'];

    if (isFiniteNumber(maxLat) && isFiniteNumber(minLat) && isFiniteNumber(maxLng) && isFiniteNumber(minLng)) {
      return [[minLng, minLat], [maxLng, maxLat]];
    }

    // Format 4: { northeast: { lat, lng }, southwest: { lat, lng } }
    const ne = boundsValue['northeast'];
    const sw = boundsValue['southwest'];

    if (isPlainObject(ne) && isPlainObject(sw)) {
      const neLat = ne['lat'] ?? ne['latitude'];
      const neLng = ne['lng'] ?? ne['longitude'];
      const swLat = sw['lat'] ?? sw['latitude'];
      const swLng = sw['lng'] ?? sw['longitude'];

      if (isFiniteNumber(neLat) && isFiniteNumber(neLng) && isFiniteNumber(swLat) && isFiniteNumber(swLng)) {
        return [[swLng, swLat], [neLng, neLat]];
      }
    }
  }

  return undefined;
}

export function parseCenter(meta: unknown): LocationCenter | undefined {
  if (!isPlainObject(meta)) return undefined;

  const centerValue = meta['center'];

  // Format 1: [x, y] - array format
  if (Array.isArray(centerValue) && centerValue.length === 2) {
    const x = centerValue[0];
    const y = centerValue[1];

    if (isFiniteNumber(x) && isFiniteNumber(y)) {
      return [x, y];
    }
  }

  // Format 2: { lat, lng } or { latitude, longitude } - object format
  if (isPlainObject(centerValue)) {
    const lat = centerValue['lat'] ?? centerValue['latitude'] ?? centerValue['y'];
    const lng = centerValue['lng'] ?? centerValue['longitude'] ?? centerValue['x'];

    if (isFiniteNumber(lat) && isFiniteNumber(lng)) {
      return [lng, lat];
    }
  }

  return undefined;
}

export function deriveCenterFromBounds(bounds: LocationBounds): LocationCenter {
  return [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ];
}

export function deriveBoundsFromPoint(
  point: LocationCoordinatesObj | LocationCenter,
  halfSize: number = 25
): LocationBounds {
  const x = Array.isArray(point) ? point[0] : point.x;
  const y = Array.isArray(point) ? point[1] : point.y;

  return [
    [x - halfSize, y - halfSize],
    [x + halfSize, y + halfSize],
  ];
}

export function normalizeLocationMetadata(rawMetadata: unknown): NormalizedLocationMetadata {
  const meta: Record<string, unknown> = isPlainObject(rawMetadata) ? rawMetadata : {};

  const coordinatesFromMeta = parseCoordinates(meta);
  const boundsFromMeta = parseBounds(meta);
  const centerFromMeta = parseCenter(meta);

  const centerFromBounds = boundsFromMeta ? deriveCenterFromBounds(boundsFromMeta) : undefined;

  const center: LocationCenter | undefined =
    centerFromMeta ??
    centerFromBounds ??
    (coordinatesFromMeta ? ([coordinatesFromMeta.x, coordinatesFromMeta.y] as LocationCenter) : undefined);

  const coordinates: LocationCoordinatesObj | undefined =
    coordinatesFromMeta ??
    (center ? { x: center[0], y: center[1] } : undefined);

  const bounds: LocationBounds =
    boundsFromMeta ??
    (coordinates
      ? deriveBoundsFromPoint(coordinates, 25)
      : center
        ? deriveBoundsFromPoint(center, 25)
        : ([[0, 0], [0, 0]] as LocationBounds));

  return {
    ...meta,
    bounds,
    ...(center ? { center } : {}),
    ...(coordinates ? { coordinates } : {}),
  };
}