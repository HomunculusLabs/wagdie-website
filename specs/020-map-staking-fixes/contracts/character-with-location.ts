/**
 * Contract: CharacterWithLocation Type
 *
 * This contract defines the TypeScript interface for characters with joined location data.
 * It replaces the unsafe `as unknown as { location?: any }` casts.
 */

import type { NormalizedLocationMetadata } from '@/lib/domain/location/metadata-types';
import type { Character } from '@/types/character';

/**
 * Location data joined from the locations table.
 * The metadata field is normalized to ensure center can be derived from bounds.
 */
export interface JoinedLocation {
  /** UUID of the location */
  id: string;

  /** Human-readable location name */
  name: string;

  /**
   * Normalized metadata with guaranteed bounds field.
   * Center and coordinates are derived if not present in raw data.
   */
  metadata: NormalizedLocationMetadata;
}

/**
 * Character with optional joined location data.
 *
 * Returned by:
 * - CharacterRepository.getStakedCharacters()
 *
 * Consumed by:
 * - useMapData() hook
 * - app/map/page.tsx mapCharacterMarkers memo
 *
 * @example
 * ```typescript
 * const characters = await getStakedCharacters();
 * for (const char of characters) {
 *   if (char.location) {
 *     // TypeScript knows location.id is string, location.metadata.center is [number, number] | undefined
 *     console.log(`${char.token_id} at ${char.location.name}`);
 *   }
 * }
 * ```
 */
export interface CharacterWithLocation extends Character {
  /**
   * Joined location data. Null if:
   * - Character's location_id is null (not staked)
   * - Character's location_id references a deleted location (orphaned FK)
   */
  location?: JoinedLocation | null;
}

/**
 * Type guard to check if a character has valid location data for map display.
 */
export function hasValidLocation(char: CharacterWithLocation): char is CharacterWithLocation & { location: JoinedLocation } {
  return char.location != null && typeof char.location.id === 'string';
}

/**
 * Type guard to check if location metadata has a derivable center.
 */
export function hasCenter(metadata: NormalizedLocationMetadata): metadata is NormalizedLocationMetadata & { center: [number, number] } {
  return Array.isArray(metadata.center) && metadata.center.length === 2;
}
