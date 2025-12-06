/**
 * Import API Route
 * POST /api/eliza/characters/[tokenId]/import
 * Imports character configuration from standard Eliza character JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
import { elizaCharacterExportSchema } from '@/lib/eliza/validation'
import type { UpdateCharacterInput, ExampleMessage as SDKExampleMessage } from '@eliza/sdk'

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

    // Build update input from imported data (using SDK type directly)
    // Note: The SDK's UpdateCharacterInput only supports: name, personality, backstory, systemPrompt, exampleMessages
    const updateData: UpdateCharacterInput = {}

    // Import bio as personality (SDK uses 'personality' instead of 'bio')
    if (importData.bio && importData.bio.length > 0) {
      updateData.personality = importData.bio.join('\n\n')
      result.imported.push('bio (as personality)')
    }

    // Import lore as backstory (SDK uses 'backstory' instead of 'lore')
    if (importData.lore && importData.lore.length > 0) {
      updateData.backstory = importData.lore.join('\n\n')
      result.imported.push('lore (as backstory)')
    }

    // Fields not supported by SDK - skip with warnings
    if (importData.topics && importData.topics.length > 0) {
      result.skipped.push('topics')
      result.warnings.push('Topics are not supported by the current SDK and were skipped')
    }

    if (importData.adjectives && importData.adjectives.length > 0) {
      result.skipped.push('adjectives')
      result.warnings.push('Adjectives are not supported by the current SDK and were skipped')
    }

    if (importData.style) {
      const hasContent =
        (importData.style.all && importData.style.all.length > 0) ||
        (importData.style.chat && importData.style.chat.length > 0) ||
        (importData.style.post && importData.style.post.length > 0)

      if (hasContent) {
        result.skipped.push('style')
        result.warnings.push('Style settings are not supported by the current SDK and were skipped')
      }
    }

    // Import message examples - convert Eliza format to SDK format (role/content)
    if (importData.messageExamples && importData.messageExamples.length > 0) {
      const sdkMessages: SDKExampleMessage[] = []

      for (const conversation of importData.messageExamples) {
        for (const msg of conversation) {
          const role: 'user' | 'assistant' =
            msg.user === '{{user1}}' || !msg.user.startsWith('{{char') ? 'user' : 'assistant'
          sdkMessages.push({
            role,
            content: msg.content?.text || '',
          })
        }
      }

      if (sdkMessages.length > 0) {
        updateData.exampleMessages = sdkMessages
        result.imported.push('messageExamples')
      }
    }

    // Post examples not supported by SDK
    if (importData.postExamples && importData.postExamples.length > 0) {
      result.skipped.push('postExamples')
      result.warnings.push('Post examples are not supported by the current SDK and were skipped')
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

    // Update character via Eliza API
    const client = getElizaClient()
    await client.characters.update(tokenId, updateData)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[Import API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to import character' },
      { status: 500 }
    )
  }
}
