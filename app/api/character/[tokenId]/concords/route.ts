/**
 * Backwards-compatible Character Concords API Route (singular)
 *
 * Alias for `/api/characters/[tokenId]/concords`.
 */

import { NextRequest } from 'next/server'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import { getCharacterConcords } from '@/lib/services/character-service'

export const runtime = 'nodejs'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const params = await context.params
    const tokenId = parseInt(params.tokenId, 10)

    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      return jsonRawError('Invalid token ID', 400)
    }

    const concords = await getCharacterConcords(tokenId)
    return jsonRaw({ concords })
  } catch (error) {
    console.error('Error fetching character concords:', error)
    return jsonRawError('Failed to fetch character concords', 500)
  }
}
