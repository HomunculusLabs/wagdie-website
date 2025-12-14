/**
 * AI Character Proxy Endpoints
 * GET /api/eliza/characters/[tokenId] - Get AI character by WAGDIE token ID
 * PUT /api/eliza/characters/[tokenId] - Create or update AI character
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { isAdmin } from '@/lib/auth/admin'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import { createClient } from '@supabase/supabase-js'
import type { AICharacter, UpdateAICharacterInput, ErrorResponse } from '@/types/eliza'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // Try to get character by external ID (WAGDIE tokenId)
    const character = await elizaClient.characters.getByExternalId(tokenId)

    if (!character) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No AI character exists for this token' },
        { status: 404 }
      )
    }

    // Map to our AICharacter type
    const aiCharacter: AICharacter = {
      id: character.id,
      externalId: tokenId,
      name: character.name,
      personality: character.personality || null,
      backstory: character.backstory || null,
      systemPrompt: character.systemPrompt || null,
      exampleMessages: character.exampleMessages?.map(msg => ({
        userMessage: msg.role === 'user' ? msg.content : '',
        assistantMessage: msg.role === 'assistant' ? msg.content : '',
      })).filter(msg => msg.userMessage && msg.assistantMessage) || [],
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    }

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
    console.log('[Eliza PUT] User is admin:', userIsAdmin)
    console.log('[Eliza PUT] Session address:', session.address)

    // Check character ownership in WAGDIE database
    console.log('[Eliza PUT] Fetching character from Supabase, tokenId:', parsedTokenId)
    const { data: wagdieCharacter, error: dbError } = await supabase
      .from(CHARACTERS_TABLE)
      .select('token_id, name, background_story, owner_address')
      .eq('token_id', parsedTokenId)
      .single()

    console.log('[Eliza PUT] Supabase result:', { wagdieCharacter, dbError })

    if (dbError || !wagdieCharacter) {
      console.log('[Eliza PUT] Character not found in WAGDIE database')
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'WAGDIE character not found' },
        { status: 404 }
      )
    }

    // Verify ownership (admins bypass this check)
    const isOwner = wagdieCharacter.owner_address?.toLowerCase() === session.address.toLowerCase()
    if (!userIsAdmin && !isOwner) {
      console.log('[Eliza PUT] Ownership check failed - not owner and not admin')
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Not character owner' },
        { status: 403 }
      )
    }

    // Parse request body
    const body: UpdateAICharacterInput = await request.json()

    const elizaClient = getElizaClient()

    // Check if AI character already exists
    const existing = await elizaClient.characters.getByExternalId(tokenId)

    let character
    if (existing) {
      // Update existing character
      character = await elizaClient.characters.update(existing.id, {
        name: body.name,
        personality: body.personality,
        backstory: body.backstory,
        systemPrompt: body.systemPrompt,
        exampleMessages: body.exampleMessages?.flatMap(msg => [
          { role: 'user' as const, content: msg.userMessage },
          { role: 'assistant' as const, content: msg.assistantMessage },
        ]),
      })
    } else {
      // Create new character with WAGDIE data as defaults
      character = await elizaClient.characters.create({
        externalId: tokenId,
        name: body.name || wagdieCharacter.name || `Character #${tokenId}`,
        personality: body.personality || '',
        backstory: body.backstory || wagdieCharacter.background_story || '',
        systemPrompt: body.systemPrompt,
        exampleMessages: body.exampleMessages?.flatMap(msg => [
          { role: 'user' as const, content: msg.userMessage },
          { role: 'assistant' as const, content: msg.assistantMessage },
        ]),
      })
    }

    // Map to our AICharacter type
    const aiCharacter: AICharacter = {
      id: character.id,
      externalId: tokenId,
      name: character.name,
      personality: character.personality || null,
      backstory: character.backstory || null,
      systemPrompt: character.systemPrompt || null,
      exampleMessages: character.exampleMessages?.map(msg => ({
        userMessage: msg.role === 'user' ? msg.content : '',
        assistantMessage: msg.role === 'assistant' ? msg.content : '',
      })).filter(msg => msg.userMessage && msg.assistantMessage) || [],
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
    }

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
