/**
 * Import API Route
 * POST /api/eliza/characters/[tokenId]/import
 * Imports character configuration from standard Eliza character JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
import { getCharacterRecordByExternalId } from '@/lib/eliza/characterResolver'
import { fromElizaExportMessageExamples } from '@/lib/eliza/sdkAdapter'
import { elizaCharacterExportSchema } from '@/lib/eliza/validation'

interface RouteParams {
  params: Promise<{ tokenId: string }>
}

interface ImportResult {
  success: boolean
  imported: string[]
  skipped: string[]
  warnings: string[]
}

export async function POST(
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

    // Parse request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate against Eliza character schema
    const parseResult = elizaCharacterExportSchema.safeParse(body)

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }))

      return NextResponse.json(
        {
          error: 'Invalid character format',
          details: errors,
        },
        { status: 400 }
      )
    }

    const importData = parseResult.data
    const result: ImportResult = {
      success: true,
      imported: [],
      skipped: [],
      warnings: [],
    }

    // Build update input from imported data
    // Note: SDK's UpdateCharacterInput doesn't include all Eliza character fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {}

    // Import bio (required)
    if (importData.bio && importData.bio.length > 0) {
      updateData.bio = importData.bio
      result.imported.push('bio')
    }

    // Import lore
    if (importData.lore && importData.lore.length > 0) {
      updateData.lore = importData.lore
      result.imported.push('lore')
    }

    // Import topics
    if (importData.topics && importData.topics.length > 0) {
      updateData.topics = importData.topics
      result.imported.push('topics')
    }

    // Import adjectives
    if (importData.adjectives && importData.adjectives.length > 0) {
      updateData.adjectives = importData.adjectives
      result.imported.push('adjectives')
    }

    // Import style
    if (importData.style) {
      const hasContent =
        (importData.style.all && importData.style.all.length > 0) ||
        (importData.style.chat && importData.style.chat.length > 0) ||
        (importData.style.post && importData.style.post.length > 0)

      if (hasContent) {
        updateData.style = importData.style
        result.imported.push('style')
      }
    }

    // Import message examples - use SDK adapter to convert Eliza format to canonical format
    if (importData.messageExamples && importData.messageExamples.length > 0) {
      const canonicalMessageExamples = fromElizaExportMessageExamples(importData.messageExamples)

      if (canonicalMessageExamples && canonicalMessageExamples.length > 0) {
        updateData.messageExamples = canonicalMessageExamples
        result.imported.push('messageExamples')
      }
    }

    // Import post examples
    if (importData.postExamples && importData.postExamples.length > 0) {
      updateData.postExamples = importData.postExamples
      result.imported.push('postExamples')
    }

    // Import system prompt
    if (importData.systemPrompt) {
      updateData.systemPrompt = importData.systemPrompt
      result.imported.push('systemPrompt')
    }

    // Note: Knowledge documents require separate upload and are skipped
    if (importData.knowledge && importData.knowledge.length > 0) {
      result.skipped.push('knowledge')
      result.warnings.push(
        'Knowledge documents must be uploaded separately and were not imported'
      )
    }

    // Check if name differs
    if (importData.name) {
      result.warnings.push(
        `Imported character name "${importData.name}" was ignored. Name is synced from WAGDIE character.`
      )
    }

    // Get current character using canonical record lookup
    const client = getElizaClient()
    const record = await getCharacterRecordByExternalId(client, tokenId)

    if (!record) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Merge update data with existing character
    const updatedCharacter = {
      ...record.character,
      ...updateData,
    }

    // Update character using canonical replaceRecord
    await client.characters.replaceRecord(record.id, { character: updatedCharacter })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Import API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to import character' },
      { status: 500 }
    )
  }
}
