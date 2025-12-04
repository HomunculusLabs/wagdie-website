/**
 * Slug Utility
 * Generates URL-safe slugs from human-readable names
 */

/**
 * Generate a URL-safe slug from a location name
 * @param name - Human readable name (e.g., "Dragon's Lair")
 * @returns Slug string (e.g., "dragons_lair")
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Trim leading/trailing underscores
}

/**
 * Generate a unique slug by appending a number if the base slug already exists
 * @param name - Human readable name
 * @param existingSlugs - Array of existing slugs to check against
 * @returns Unique slug string
 */
export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(name)

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  // Find the next available number suffix
  let counter = 2
  while (existingSlugs.includes(`${baseSlug}_${counter}`)) {
    counter++
  }

  return `${baseSlug}_${counter}`
}

/**
 * Validate a slug format
 * @param slug - Slug to validate
 * @returns true if valid slug format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_]+$/.test(slug) && slug.length >= 1 && slug.length <= 100
}
