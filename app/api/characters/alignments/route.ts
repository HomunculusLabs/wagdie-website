/**
 * Alignments API Route
 * GET handler for fetching available character alignments with counts
 */

import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import { serverCharacterRepository } from '@/lib/repositories/character-repository.server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const result = await serverCharacterRepository.getAlignments()
    return jsonRaw(result)
  } catch (error) {
    console.error('Error fetching alignments:', error)
    return jsonRawError('Failed to fetch alignments', 500)
  }
}
