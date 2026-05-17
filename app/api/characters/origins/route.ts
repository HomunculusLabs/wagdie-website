/**
 * Origins API Route
 * GET handler for fetching available character origins with counts
 */

import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import { serverCharacterRepository } from '@/lib/repositories/character-repository.server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const result = await serverCharacterRepository.getOrigins()
    return jsonRaw(result)
  } catch (error) {
    console.error('Error fetching origins:', error)
    return jsonRawError('Failed to fetch origins', 500)
  }
}
