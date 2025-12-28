/**
 * Shared Character Update Handler
 * Consolidates PATCH logic for /api/characters/[tokenId] and /api/character/[tokenId]
 * Fixes: ownership check (staker_address), null update result handling
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCharacter, updateCharacter } from '@/lib/services/character-service'
import { getSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/admin'
import {
  validateName,
  validateCoreStat,
  validateHp,
  validateMaxHp,
  validateAc,
  validateSpeed,
  validateLevel,
  validateExperience,
} from '@/lib/utils/stat-validation'
import type { CharacterUpdate } from '@/types/character'
import type { Character } from '@/types/character'

// Fields allowed for PATCH updates
const ALLOWED_FIELDS = [
  'background_story', 'equipment', 'name',
  'str', 'dex', 'con', 'int', 'wis', 'cha',
  'hp', 'max_hp', 'ac', 'speed', 'level', 'experience'
] as const

/**
 * Check if a user can edit a character.
 * Allows editing if:
 * - User is an admin, OR
 * - User's address matches the owner_address (unstaked ownership), OR
 * - User's address matches the staker_address (staked ownership - user is the staker)
 */
export function canEditCharacter(
  character: Character,
  userAddress: string,
  userIsAdmin: boolean
): boolean {
  if (userIsAdmin) return true

  const addr = userAddress.toLowerCase()
  const owner = character.owner_address?.toLowerCase()
  const staker = character.staker_address?.toLowerCase()

  return owner === addr || staker === addr
}

/**
 * Handle GET request for a character
 */
export async function handleCharacterGet(tokenId: number): Promise<NextResponse> {
  try {
    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }

    const character = await getCharacter(tokenId)

    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json(character)
  } catch (error) {
    console.error('[GET /api/characters] Error fetching character:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
  }
}

/**
 * Handle PATCH request to update a character
 */
export async function handleCharacterPatch(
  request: NextRequest,
  tokenId: number
): Promise<NextResponse> {
  try {
    console.log('[PATCH /api/characters] tokenId:', tokenId)

    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      console.log('[PATCH] Invalid token ID')
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }

    // Get session to verify ownership
    const session = await getSession()
    console.log('[PATCH] Session address:', session.address)

    if (!session.address) {
      console.log('[PATCH] Not authenticated - no session address')
      return NextResponse.json(
        { error: 'Not authenticated. Please sign in with your wallet.' },
        { status: 401 }
      )
    }

    // Get character to check ownership
    const character = await getCharacter(tokenId)
    console.log('[PATCH] Character owner_address:', character?.owner_address)
    console.log('[PATCH] Character staker_address:', character?.staker_address)

    if (!character) {
      console.log('[PATCH] Character not found')
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    // Check if user is admin (can edit any character)
    const userIsAdmin = isAdmin(session.address)
    console.log('[PATCH] User is admin:', userIsAdmin)

    // Verify ownership using consolidated check (includes staker_address)
    if (!canEditCharacter(character, session.address, userIsAdmin)) {
      console.log('[PATCH] Ownership check failed')
      console.log('[PATCH] Character owner:', character.owner_address?.toLowerCase())
      console.log('[PATCH] Character staker:', character.staker_address?.toLowerCase())
      console.log('[PATCH] Session user:', session.address.toLowerCase())
      return NextResponse.json(
        { error: 'You do not own this character' },
        { status: 403 }
      )
    }

    // Parse updates
    const updates = await request.json()
    console.log('[PATCH] Received updates:', JSON.stringify(updates, null, 2))

    // Filter to allowed fields only
    const allowedUpdates: CharacterUpdate = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) {
        (allowedUpdates as Record<string, unknown>)[field] = updates[field]
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    // Validate stat fields
    const validationErrors: string[] = []

    // Validate name
    if ('name' in allowedUpdates) {
      console.log('[PATCH] Validating name:', allowedUpdates.name)
      const result = validateName(allowedUpdates.name)
      console.log('[PATCH] Name validation result:', result)
      if (!result.valid && result.error) {
        validationErrors.push(result.error)
      }
    }

    // Validate core stats
    const coreStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
    for (const stat of coreStats) {
      if (stat in allowedUpdates) {
        const value = allowedUpdates[stat]
        const result = validateCoreStat(value, stat.toUpperCase())
        if (!result.valid && result.error) {
          validationErrors.push(result.error)
        }
      }
    }

    // Validate derived stats
    if ('hp' in allowedUpdates) {
      const result = validateHp(allowedUpdates.hp)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }
    if ('max_hp' in allowedUpdates) {
      const result = validateMaxHp(allowedUpdates.max_hp)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }
    if ('ac' in allowedUpdates) {
      const result = validateAc(allowedUpdates.ac)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }
    if ('speed' in allowedUpdates) {
      const result = validateSpeed(allowedUpdates.speed)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }
    if ('level' in allowedUpdates) {
      const result = validateLevel(allowedUpdates.level)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }
    if ('experience' in allowedUpdates) {
      const result = validateExperience(allowedUpdates.experience)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      console.log('[PATCH] Validation errors:', validationErrors)
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // Update character
    console.log('[PATCH] Calling updateCharacter with:', JSON.stringify(allowedUpdates, null, 2))
    const updated = await updateCharacter(tokenId, allowedUpdates)
    console.log('[PATCH] updateCharacter result:', updated ? 'success' : 'null/undefined')

    // Handle null result as an error (previously would return null to client causing UI issues)
    if (!updated) {
      console.error('[PATCH] Update returned null - database write may have failed')
      return NextResponse.json(
        { error: 'Failed to update character. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH] Error updating character:', error)
    console.error('[PATCH] Error stack:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: 'Failed to update character' },
      { status: 500 }
    )
  }
}
