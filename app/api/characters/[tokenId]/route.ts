/**
 * Character Detail API Route
 * GET: Fetch single character
 * PATCH: Update character (with ownership validation including staker_address)
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
