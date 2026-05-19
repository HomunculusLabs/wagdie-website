/**
 * AI Character Proxy Endpoints
 * GET /api/eliza/characters/[tokenId] - Get AI character by WAGDIE token ID
 * PUT /api/eliza/characters/[tokenId] - Create or update AI character
 *
 * v0.2: Uses SDK adapter helpers and canonical record APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getElizaClient } from '@/lib/eliza/client'
import { elizaConfig } from '@/lib/eliza/config'
import { recordLegacyPersonaProfileLink, recordPersonaMigrationSuccess, syncOfficialPersonaShadow } from '@/lib/eliza/personaMigration'
import { authorizeElizaCharacterMutation } from '@/lib/eliza/routeAuth'
import { getCharacterRecordByExternalId } from '@/lib/eliza/characterResolver'
import {
  toAICharacterFromRecord,
  toAgentCharacterFromAICharacter,
  applyWagdieUpdateToAgentCharacter,
} from '@/lib/eliza/sdkAdapter'
import { validatePutCharacterSheetUpdate } from '@/lib/eliza/character-sheet-policy'
import type { AICharacter, ErrorResponse } from '@/types/eliza'

export const runtime = 'nodejs'

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

    const authorization = await authorizeElizaCharacterMutation(tokenId)

    if (!authorization.authorized) {
      if (authorization.reason === 'missing_token' || authorization.reason === 'invalid_token') {
        return NextResponse.json(
          { error: 'INVALID_TOKEN_ID', message: 'Invalid token ID' },
          { status: 400 }
        )
      }

      if (authorization.reason === 'unauthenticated') {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Wallet not connected' },
          { status: 401 }
        )
      }

      if (authorization.reason === 'not_found') {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Not character owner' },
        { status: 403 }
      )
    }

    const wagdieCharacter = authorization.character
    const externalTokenId = authorization.externalId

    // Parse and validate request body
    let rawBody: unknown
    try {
      rawBody = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const policyResult = validatePutCharacterSheetUpdate(rawBody)
    if (!policyResult.ok) {
      console.error('[Eliza Characters] PUT validation failed:', { issues: policyResult.issues })
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid character update payload',
          details: { issues: policyResult.issues },
        },
        { status: policyResult.status }
      )
    }

    const body = policyResult.update

    const elizaClient = getElizaClient()

    // Use canonical record lookup by external ID
    const existing = await getCharacterRecordByExternalId(elizaClient, externalTokenId)

    let record
    if (existing) {
      // Use SDK adapter to merge update with existing character
      const merged = applyWagdieUpdateToAgentCharacter(existing.character, body)

      // Use canonical replaceRecord to preserve unknown keys
      record = await elizaClient.characters.replaceRecord(existing.id, { character: merged })
    } else {
      // Build new character using SDK adapter
      const fallbackName = wagdieCharacter.name || `Character #${externalTokenId}`
      const name =
        typeof body.name === 'string' && body.name.trim().length > 0 ? body.name : fallbackName

      const defaultPersonality = `A mysterious character from the world of WAGDIE. Character #${externalTokenId}.`

      const character = toAgentCharacterFromAICharacter({
        name,
        personality: body.personality ?? defaultPersonality,
        backstory: body.backstory ?? wagdieCharacter.background_story ?? null,
        system: body.system ?? body.systemPrompt ?? null,
        systemPrompt: body.system ?? body.systemPrompt ?? null,
        exampleMessages: body.exampleMessages ?? [],
        bio: body.bio,
        lore: body.lore,
        topics: body.topics,
        adjectives: body.adjectives,
        style: body.style,
        postExamples: body.postExamples,
        username: body.username,
        templates: body.templates ?? undefined,
        settings: body.settings,
      })

      // Use canonical createRecord to preserve unknown keys
      record = await elizaClient.characters.createRecord({
        externalId: externalTokenId,
        character,
      })
    }

    if (elizaConfig.mode === 'dual') {
      await syncOfficialPersonaShadow({
        tokenId: externalTokenId,
        legacyCharacterId: record.id,
        character: record.character,
      })
    } else if (elizaConfig.mode === 'official') {
      await recordPersonaMigrationSuccess({
        tokenId: externalTokenId,
        officialAgentId: record.id,
      })
    } else {
      await recordLegacyPersonaProfileLink({
        tokenId: externalTokenId,
        legacyCharacterId: record.id,
      })
    }

    // Use SDK adapter to convert to AICharacter DTO
    const aiCharacter = toAICharacterFromRecord(externalTokenId, record)
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
