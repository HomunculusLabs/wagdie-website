/**
 * Origins API Route
 * GET handler for fetching available character origins with counts
 */

import { NextResponse } from 'next/server'
import { characterRepository } from '@/lib/repositories/character-repository'

export async function GET() {
  try {
    const result = await characterRepository.getOrigins()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching origins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch origins' },
      { status: 500 }
    )
  }
}
