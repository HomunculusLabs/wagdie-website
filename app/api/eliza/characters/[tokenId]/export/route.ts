/**
 * Export API Route
 * GET /api/eliza/characters/[tokenId]/export
 * Exports character configuration as standard Eliza character JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
import { getCharacterRecordByExternalId } from '@/lib/eliza/characterResolver'
import { toElizaExportMessageExamples } from '@/lib/eliza/sdkAdapter'
import type { ElizaCharacterExport } from '@/types/eliza'

interface RouteParams {
  params: Promise<{ tokenId: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { tokenId } = await params

    if (!tokenId) {
      return NextResponse.json(
        { error: 'Token ID is required' },
        { status: 400 }
      )
    }

    // Get character using canonical record lookup
    const client = getElizaClient()
    const record = await getCharacterRecordByExternalId(client, tokenId)

    if (!record) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    const character = record.character as Record<string, unknown>

    // Use SDK adapter to convert messageExamples to Eliza export format
    const messageExamples = toElizaExportMessageExamples(
      character.messageExamples as Array<Array<{ name: string; content: { text: string } }>> | undefined
    )

    // Extract arrays safely
    const bio = Array.isArray(character.bio) ? character.bio : []
    const lore = Array.isArray(character.lore) ? character.lore : []
    const topics = Array.isArray(character.topics) ? character.topics : undefined
    const adjectives = Array.isArray(character.adjectives) ? character.adjectives : undefined
    const postExamples = Array.isArray(character.postExamples) ? character.postExamples : undefined
    const knowledge = Array.isArray(character.knowledge) ? character.knowledge : undefined

    // Convert to standard Eliza export format
    const exportData: ElizaCharacterExport = {
      name: character.name as string,
      bio: bio as string[],
      lore: lore as string[],
      topics: topics as string[] | undefined,
      adjectives: adjectives as string[] | undefined,
      style: character.style as ElizaCharacterExport['style'],
      messageExamples,
      postExamples: postExamples as string[] | undefined,
      systemPrompt: (character.system as string) || (character.systemPrompt as string) || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      knowledge: knowledge?.map((doc: any) => ({
        id: doc.id,
        path: doc.path,
        content: doc.content || '',
      })),
    }

    // Generate filename
    const name = (character.name as string) || 'character'
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    const filename = `${sanitizedName}-character.json`

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Export API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to export character' },
      { status: 500 }
    )
  }
}
