/**
 * Map ID Utilities
 *
 * Shared helpers for converting between Phaser marker IDs and domain IDs.
 */

/**
 * Convert a Phaser marker id to a domain location id.
 *
 * Examples:
 * - \"location-dragons_lair\" -> \"dragons_lair\"
 * - \"dragons_lair\" -> \"dragons_lair\"
 */
export function toDomainLocationId(markerId: string): string {
  return markerId.startsWith('location-') ? markerId.slice('location-'.length) : markerId
}