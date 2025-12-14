/**
 * Backwards-compatible Character Detail API Route (singular)
 *
 * Alias for `/api/characters/[tokenId]` to support older clients expecting `/api/character/:tokenId`.
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

const ALLOWED_FIELDS = [
  'background_story', 'equipment', 'name',
  'str', 'dex', 'con', 'int', 'wis', 'cha',
  'hp', 'max_hp', 'ac', 'speed', 'level', 'experience',
] as const

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  try {
    const params = await context.params
    const tokenId = parseInt(params.tokenId, 10)

    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }

    const character = await getCharacter(tokenId)
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    return NextResponse.json(character)
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json({ error: 'Failed to fetch character' }, { status: 500 })
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
      return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 })
    }

    const session = await getSession()
    if (!session.address) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const character = await getCharacter(tokenId)
    if (!character) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 })
    }

    const userIsAdmin = isAdmin(session.address)
    if (!userIsAdmin && character.owner_address?.toLowerCase() !== session.address.toLowerCase()) {
      return NextResponse.json({ error: 'You do not own this character' }, { status: 403 })
    }

    const updates = await request.json()

    const allowedUpdates: CharacterUpdate = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in updates) {
        (allowedUpdates as Record<string, unknown>)[field] = updates[field]
      }
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const validationErrors: string[] = []

    if ('name' in allowedUpdates) {
      const result = validateName(allowedUpdates.name)
      if (!result.valid && result.error) validationErrors.push(result.error)
    }

    const coreStats = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
    for (const stat of coreStats) {
      if (stat in allowedUpdates) {
        const value = allowedUpdates[stat]
        const result = validateCoreStat(value, stat.toUpperCase())
        if (!result.valid && result.error) validationErrors.push(result.error)
      }
    }

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

    if (validationErrors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: validationErrors }, { status: 400 })
    }

    const updated = await updateCharacter(tokenId, allowedUpdates)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PATCH /api/character] Error updating character:', error)
    return NextResponse.json({ error: 'Failed to update character' }, { status: 500 })
  }
}
