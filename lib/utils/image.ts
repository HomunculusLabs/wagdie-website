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
 */
export function getCharacterImageFallback(
  ipfsUri?: string | null,
  fallbackUrl?: string | null
): string {
  const ipfsUrl = getIpfsUrl(ipfsUri)
  return ipfsUrl || fallbackUrl || '/images/placeholder-character.png'
}
