/**
 * AI Character Proxy Endpoints
 * GET /api/eliza/characters/[tokenId] - Get AI character by WAGDIE token ID
 * PUT /api/eliza/characters/[tokenId] - Create or update AI character
 *
 * v0.2: Uses SDK adapter helpers and canonical record APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { isAdmin } from '@/lib/auth/admin'
import { getCharacter } from '@/lib/services/character-service'
import { getCharacterRecordByExternalId } from '@/lib/eliza/characterResolver'
import {
  toAICharacterFromRecord,
  toAgentCharacterFromAICharacter,
  applyWagdieUpdateToAgentCharacter,
} from '@/lib/eliza/sdkAdapter'
import type { AICharacter, UpdateAICharacterInput, ErrorResponse } from '@/types/eliza'

interface RouteParams {
  params: Promise<{ tokenId: string }>
}

/**
 * GET /api/eliza/characters/[tokenId]
 * Retrieves AI character linked to WAGDIE character
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AICharacter | ErrorResponse>> {
  try {
    const { tokenId } = await params

    // Validate tokenId
    const parsedTokenId = parseInt(tokenId, 10)
    if (isNaN(parsedTokenId) || parsedTokenId < 0) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN_ID', message: 'Invalid token ID' },
        { status: 400 }
      )
    }

    const elizaClient = getElizaClient()

    // Use canonical record lookup by external ID
    const record = await getCharacterRecordByExternalId(elizaClient, tokenId)

    if (!record) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No AI character exists for this token' },
        { status: 404 }
      )
    }

    // Use SDK adapter to convert to AICharacter DTO
    const aiCharacter = toAICharacterFromRecord(tokenId, record)
    return NextResponse.json(aiCharacter)
  } catch (error) {
    console.error('[Eliza Characters] GET failed:', error)

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch AI character' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/eliza/characters/[tokenId]
 * Creates AI character if none exists, or updates existing
 * Only character owner can update
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<AICharacter | ErrorResponse>> {
  try {
    const { tokenId } = await params

    // Validate tokenId
    const parsedTokenId = parseInt(tokenId, 10)
    if (isNaN(parsedTokenId) || parsedTokenId < 0) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN_ID', message: 'Invalid token ID' },
        { status: 400 }
      )
    }

    // Get user session
    const session = await getSession()
    if (!session.address) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const userIsAdmin = isAdmin(session.address)

    // Check character ownership in WAGDIE database
    const wagdieCharacter = await getCharacter(parsedTokenId)

    if (!wagdieCharacter) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
        { status: 404 }
      )
    }

    // Verify ownership (admins bypass this check)
    const isOwner = wagdieCharacter.owner_address?.toLowerCase() === session.address.toLowerCase()
    if (!userIsAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Not character owner' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdateAICharacterInput = await request.json()

    const elizaClient = getElizaClient()

    // Use canonical record lookup by external ID
    const existing = await getCharacterRecordByExternalId(elizaClient, tokenId)

    let record
    if (existing) {
      // Use SDK adapter to merge update with existing character
      const merged = applyWagdieUpdateToAgentCharacter(existing.character, body)

      // Use canonical replaceRecord to preserve unknown keys
      record = await elizaClient.characters.replaceRecord(existing.id, { character: merged })
    } else {
      // Build new character using SDK adapter
      const fallbackName = wagdieCharacter.name || `Character #${tokenId}`
      const name =
        typeof body.name === 'string' && body.name.trim().length > 0 ? body.name : fallbackName

      const defaultPersonality = `A mysterious character from the world of WAGDIE. Character #${tokenId}.`

      const character = toAgentCharacterFromAICharacter({
        name,
        personality: body.personality ?? defaultPersonality,
        backstory: body.backstory ?? wagdieCharacter.background_story ?? null,
        systemPrompt: body.systemPrompt ?? null,
        exampleMessages: body.exampleMessages ?? [],
        bio: body.bio,
        lore: body.lore,
        topics: body.topics,
        adjectives: body.adjectives,
        style: body.style,
        postExamples: body.postExamples,
      })

      // Use canonical createRecord to preserve unknown keys
      record = await elizaClient.characters.createRecord({
        externalId: tokenId,
        character,
      })
    }

    // Use SDK adapter to convert to AICharacter DTO
    const aiCharacter = toAICharacterFromRecord(tokenId, record)
    return NextResponse.json(aiCharacter, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('[Eliza Characters] PUT failed:', error)

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save AI character' },
      { status: 500 }
    )
  }
}
