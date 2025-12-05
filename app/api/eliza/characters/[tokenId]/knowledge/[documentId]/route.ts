/**
 * Knowledge Document API Route
 * GET /api/eliza/characters/[tokenId]/knowledge/[documentId] - Get document
 * DELETE /api/eliza/characters/[tokenId]/knowledge/[documentId] - Delete document
 *
 * NOTE: Knowledge management is not currently supported by the Eliza SDK.
 * These endpoints return 501 Not Implemented until SDK support is added.
 */

import { NextResponse } from 'next/server'

/**
 * GET /api/eliza/characters/[tokenId]/knowledge/[documentId]
 * Returns a specific knowledge document with full content
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Knowledge management is not supported by the current Eliza SDK' },
    { status: 501 }
  )
}

/**
 * DELETE /api/eliza/characters/[tokenId]/knowledge/[documentId]
 * Deletes a specific knowledge document
 */
export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Knowledge management is not supported by the current Eliza SDK' },
    { status: 501 }
  )
}
