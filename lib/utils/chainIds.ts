/**
 * Chain ID Utilities
 *
 * Helpers for parsing and converting chain location IDs
 */

/**
 * Parse a location ID to extract the chain location ID as a bigint.
 *
 * Location IDs may be in formats like:
 * - "location_1" -> 1n
 * - "loc-5" -> 5n
 * - Pure numeric string "42" -> 42n
 *
 * Returns null if no valid chain location ID can be extracted.
 */
export function parseChainLocationId(locationId: string): bigint | null {
  if (!locationId || typeof locationId !== 'string') {
    return null
  }

  // Try to extract numeric portion from the ID
  // Handle formats like "location_1", "loc-5", or just "42"
  const numericMatch = locationId.match(/(\d+)$/)

  if (numericMatch) {
    try {
      return BigInt(numericMatch[1])
    } catch {
      return null
    }
  }

  // If the entire string is numeric
  if (/^\d+$/.test(locationId)) {
    try {
      return BigInt(locationId)
    } catch {
      return null
    }
  }

  return null
}
