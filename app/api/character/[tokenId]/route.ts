/**
 * Backwards-compatible Character Detail API Route (singular)
 *
 * Alias for `/api/characters/[tokenId]` to support older clients expecting `/api/character/:tokenId`.
 * Uses the same shared handler to ensure consistent behavior.
 */

import { NextRequest } from 'next/server'
import { handleCharacterGet, handleCharacterPatch } from '@/lib/api/handlers/character-update'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseInt(params.tokenId, 10)
  return handleCharacterGet(tokenId)
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseInt(params.tokenId, 10)
  return handleCharacterPatch(request, tokenId)
}
