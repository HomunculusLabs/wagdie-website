/**
 * Character Concords API Route
 * GET: Fetch concords owned by a character
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCharacterConcords } from '@/lib/services/character-service'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const params = await context.params
    const tokenId = parseInt(params.tokenId, 10)

    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      return NextResponse.json(
        { error: 'Invalid token ID' },
        { status: 400 }
      )
    }

    const concords = await getCharacterConcords(tokenId)

    return NextResponse.json({ concords })
  } catch (error) {
    console.error('Error fetching character concords:', error)
    return NextResponse.json(
      { error: 'Failed to fetch character concords' },
      { status: 500 }
    )
  }
}
