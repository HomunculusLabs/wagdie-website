/**
 * Knowledge API Route
 * GET /api/eliza/characters/[tokenId]/knowledge - List knowledge documents
 * POST /api/eliza/characters/[tokenId]/knowledge - Upload knowledge document
 *
 * NOTE: Knowledge management is not currently supported by the Eliza SDK.
 * These endpoints return 501 Not Implemented until SDK support is added.
 */

import { NextResponse } from 'next/server'

/**
 * GET /api/eliza/characters/[tokenId]/knowledge
 * Returns list of knowledge documents for a character
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Knowledge management is not supported by the current Eliza SDK', documents: [] },
    { status: 501 }
  )
}

/**
 * POST /api/eliza/characters/[tokenId]/knowledge
 * Upload a new knowledge document
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Knowledge management is not supported by the current Eliza SDK' },
    { status: 501 }
  )
}
