/**
 * Character Detail API Route
 * GET: Fetch single character
 * PATCH: Update character (with ownership validation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCharacter, updateCharacter } from '@/lib/services/character-service'
import { getSession } from '@/lib/auth/session'

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

    const character = await getCharacter(tokenId)

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(character)
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Get session to verify ownership
    const session = await getSession()

    if (!session.address) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get character to check ownership
    const character = await getCharacter(tokenId)

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Verify ownership (case-insensitive comparison)
    if (character.owner_address?.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json(
        { error: 'You do not own this character' },
        { status: 403 }
      )
    }

    // Parse updates
    const updates = await request.json()

    // Only allow updating specific fields
    const allowedUpdates: any = {}
    if ('background_story' in updates) {
      allowedUpdates.background_story = updates.background_story
    }
    if ('equipment' in updates) {
      allowedUpdates.equipment = updates.equipment
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    // Update character
    const updated = await updateCharacter(tokenId, allowedUpdates)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating character:', error)
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    )
  }
}
