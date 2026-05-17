/**
 * Trait Counts API Route
 * GET handler for retrieving counts of a specific trait type (e.g., Armor, Back, Mask)
 */

import { NextRequest } from 'next/server'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import { serverCharacterRepository } from '@/lib/repositories/character-repository.server'

export const runtime = 'nodejs'

// Valid trait types that can be queried
const VALID_TRAIT_TYPES = ['Armor', 'Back', 'Mask', 'Body', 'Hair', 'Background', 'Class', 'Health']

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ traitType: string }> }
) {
  try {
    const { traitType } = await params

    // Validate trait type (case-insensitive match, return proper casing)
    const normalizedTraitType = VALID_TRAIT_TYPES.find(
      t => t.toLowerCase() === traitType.toLowerCase()
    )

    if (!normalizedTraitType) {
      return jsonRawError(`Invalid trait type. Valid types: ${VALID_TRAIT_TYPES.join(', ')}`, 400)
    }

    const result = await serverCharacterRepository.getTraitCounts(normalizedTraitType)
    return jsonRaw(result)
  } catch (error) {
    console.error('Error fetching trait counts:', error)
    return jsonRawError('Failed to fetch trait counts', 500)
  }
}
