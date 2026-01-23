/**
 * Knowledge Document API Route
 * GET /api/eliza/characters/[tokenId]/knowledge/[documentId] - Get document
 * DELETE /api/eliza/characters/[tokenId]/knowledge/[documentId] - Delete document
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
import { getCharacterRecordByExternalId } from '@/lib/eliza/characterResolver'

interface RouteParams {
  params: Promise<{ tokenId: string; documentId: string }>
}

/**
 * GET /api/eliza/characters/[tokenId]/knowledge/[documentId]
 * Returns a specific knowledge document with full content
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { tokenId, documentId } = await params

    if (!tokenId || !documentId) {
      return NextResponse.json(
        { error: 'Token ID and Document ID are required' },
        { status: 400 }
      )
    }

    const client = getElizaClient()

    // Use canonical record lookup by external ID (tokenId)
    const record = await getCharacterRecordByExternalId(client, tokenId)

    if (!record) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    const character = record.character as Record<string, unknown>
    const knowledge = Array.isArray(character.knowledge) ? character.knowledge : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const document = knowledge.find((doc: any) => doc.id === documentId)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        id: document.id,
        path: document.path,
        filename: document.path,
        content: document.content,
        size: document.content?.length || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Knowledge API] GET document error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/eliza/characters/[tokenId]/knowledge/[documentId]
 * Deletes a specific knowledge document
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { tokenId, documentId } = await params

    if (!tokenId || !documentId) {
      return NextResponse.json(
        { error: 'Token ID and Document ID are required' },
        { status: 400 }
      )
    }

    const client = getElizaClient()

    // Use canonical record lookup by external ID (tokenId)
    const record = await getCharacterRecordByExternalId(client, tokenId)

    if (!record) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    const character = record.character as Record<string, unknown>
    const currentKnowledge = Array.isArray(character.knowledge) ? character.knowledge : []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const documentIndex = currentKnowledge.findIndex((doc: any) => doc.id === documentId)

    if (documentIndex === -1) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Remove the document
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedKnowledge = currentKnowledge.filter((doc: any) => doc.id !== documentId)

    // Update character using canonical replaceRecord
    const updatedCharacter = {
      ...record.character,
      knowledge: updatedKnowledge,
    }

    await client.characters.replaceRecord(record.id, { character: updatedCharacter })

    return NextResponse.json(
      { success: true, message: 'Document deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Knowledge API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete knowledge document' },
      { status: 500 }
    )
  }
}
