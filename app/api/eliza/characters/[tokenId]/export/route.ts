/**
 * Export API Route
 * GET /api/eliza/characters/[tokenId]/export
 * Exports character configuration as standard Eliza character JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
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

    // Get character from Eliza API
    const client = getElizaClient()
    const character = await client.characters.get(tokenId)

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Convert example messages to Eliza export format
    // SDK stores messages in role/content format, need to pair them into conversations
    let convertedMessageExamples: Array<Array<{ user: string; content: { text: string } }>> | undefined

    if (character.exampleMessages && character.exampleMessages.length > 0) {
      const messages = character.exampleMessages as Array<{ role: 'user' | 'assistant'; content: string }>

      // Group consecutive user/assistant pairs into conversations
      const conversations: Array<Array<{ user: string; content: { text: string } }>> = []

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i]
        if (msg.role === 'user' && i + 1 < messages.length && messages[i + 1].role === 'assistant') {
          // Found a user/assistant pair
          conversations.push([
            { user: '{{user1}}', content: { text: msg.content } },
            { user: '{{char}}', content: { text: messages[i + 1].content } },
          ])
          i++ // Skip the assistant message as we've already processed it
        } else {
          // Single message (shouldn't happen with proper data, but handle gracefully)
          conversations.push([
            { user: msg.role === 'user' ? '{{user1}}' : '{{char}}', content: { text: msg.content } },
          ])
        }
      }

      convertedMessageExamples = conversations.length > 0 ? conversations : undefined
    }

    // Convert to standard Eliza export format
    // Note: The SDK Character type only has basic fields, so we provide defaults for missing fields
    const exportData: ElizaCharacterExport = {
      name: character.name,
      bio: [character.personality, character.backstory].filter(Boolean),
      lore: [],
      topics: [],
      adjectives: [],
      style: { all: [], chat: [], post: [] },
      messageExamples: convertedMessageExamples,
      postExamples: [],
      systemPrompt: character.systemPrompt || undefined,
      knowledge: undefined,
    }

    // Generate filename
    const sanitizedName = character.name
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
