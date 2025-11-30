/**
 * Alignments API Route
 * GET handler for fetching available character alignments with counts
 */

import { NextResponse } from 'next/server'
import { characterRepository } from '@/lib/repositories/character-repository'

export async function GET() {
  try {
    const result = await characterRepository.getAlignments()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching alignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alignments' },
      { status: 500 }
    )
  }
}
