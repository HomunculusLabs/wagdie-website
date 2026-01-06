/**
 * Image utility functions for character images
 */

/**
 * Get the local image path for a character
 */
export function getLocalImagePath(tokenId: number): string {
  return `/images/characters/${tokenId}.png`
}

/**
 * Get the IPFS gateway URL for an image
 */
export function getIpfsUrl(ipfsUri: string | undefined | null): string | null {
  if (!ipfsUri) return null
  if (ipfsUri.startsWith('ipfs://')) {
    // Use Cloudflare IPFS gateway as fallback
    return ipfsUri.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
  }
  return ipfsUri
}

/**
 * Get the best image URL for a character
 * Prioritizes local images, falls back to IPFS
 */
export function getCharacterImageUrl(
  tokenId: number,
  _ipfsUri?: string | null,
  _fallbackUrl?: string | null
): string {
  // Primary: local image (downloaded from IPFS)
  const localPath = getLocalImagePath(tokenId)

  // We return local path - Next.js will handle 404s
  // If local doesn't exist, the onError handler in the component should fallback
  return localPath
}

/**
 * Get fallback URL for when local image fails to load
 * Always uses local placeholder - no external IPFS calls
 */
export function getCharacterImageFallback(
  _ipfsUri?: string | null,
  _fallbackUrl?: string | null
): string {
  // Always use local placeholder to avoid external image loading issues
  return '/images/placeholder-character.svg'
}

// =============================================================================
// Public URL Helpers (for external services like Discord)
// =============================================================================

/**
 * Get the public (absolute) URL for a character image
 * Used for external services that need absolute URLs (Discord embeds, etc.)
 */
export function getPublicCharacterImageUrl(
  tokenId: number,
  publicBaseUrl?: string
): string | null {
  const baseUrl =
    publicBaseUrl ||
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL

  if (!baseUrl) {
    return null
  }

  // Remove trailing slash if present
  const normalizedBase = baseUrl.replace(/\/$/, '')
  return `${normalizedBase}/images/characters/${tokenId}.png`
}

/**
 * Get the public (absolute) URL for a placeholder image
 */
export function getPublicPlaceholderImageUrl(publicBaseUrl?: string): string | null {
  const baseUrl =
    publicBaseUrl ||
    process.env.PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL

  if (!baseUrl) {
    return null
  }

  const normalizedBase = baseUrl.replace(/\/$/, '')
  return `${normalizedBase}/images/placeholder-character.svg`
}
