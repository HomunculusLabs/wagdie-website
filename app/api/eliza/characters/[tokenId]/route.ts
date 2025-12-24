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

type AgentCharacter = {
  name: string
  personality?: string | null
  backstory?: string | null
  systemPrompt?: string | null
  exampleMessages?: Array<{ role: 'user' | 'assistant'; content: string }>
  bio?: unknown
  lore?: unknown
  topics?: unknown
  adjectives?: unknown
  style?: unknown
  postExamples?: unknown
  [key: string]: unknown
}

type CharacterRecord = {
  id: string
  externalId?: string
  character: AgentCharacter
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

function toRoleContentExampleMessages(
  exampleMessages: UpdateAICharacterInput['exampleMessages'] | undefined
): AgentCharacter['exampleMessages'] {
  if (!exampleMessages) return []

  return exampleMessages.flatMap(msg => {
    const userMessage = typeof msg.userMessage === 'string' ? msg.userMessage : ''
    const assistantMessage = typeof msg.assistantMessage === 'string' ? msg.assistantMessage : ''

    if (!userMessage || !assistantMessage) return []

    return [
      { role: 'user' as const, content: userMessage },
      { role: 'assistant' as const, content: assistantMessage },
    ]
  })
}

function toAIExampleMessages(exampleMessages: unknown): UpdateAICharacterInput['exampleMessages'] {
  if (!Array.isArray(exampleMessages)) return []

  const first = exampleMessages[0] as { userMessage?: unknown; assistantMessage?: unknown } | undefined
  if (first && typeof first === 'object' && 'userMessage' in first && 'assistantMessage' in first) {
    return (exampleMessages as Array<{ userMessage?: unknown; assistantMessage?: unknown }>)
      .map(msg => ({
        userMessage: typeof msg?.userMessage === 'string' ? msg.userMessage : '',
        assistantMessage: typeof msg?.assistantMessage === 'string' ? msg.assistantMessage : '',
      }))
      .filter(msg => msg.userMessage && msg.assistantMessage)
  }

  const messages = exampleMessages as Array<{ role?: unknown; content?: unknown }>
  const pairs: Array<{ userMessage: string; assistantMessage: string }> = []
  let pendingUser: string | null = null

  for (const msg of messages) {
    const role = msg?.role
    const content = typeof msg?.content === 'string' ? msg.content : ''
    if (!content) continue

    if (role === 'user') {
      pendingUser = content
      continue
    }

    if (role === 'assistant' && pendingUser) {
      pairs.push({ userMessage: pendingUser, assistantMessage: content })
      pendingUser = null
    }
  }

  return pairs
}

function toAgentCharacterFromAICharacter(input: {
  name: string
  personality: string
  backstory: string | null
  systemPrompt: string | null
  exampleMessages: UpdateAICharacterInput['exampleMessages']
  bio?: unknown
  lore?: unknown
  topics?: unknown
  adjectives?: unknown
  style?: unknown
  postExamples?: unknown
}): AgentCharacter {
  return {
    name: input.name,
    personality: input.personality,
    backstory: input.backstory,
    systemPrompt: input.systemPrompt,
    exampleMessages: toRoleContentExampleMessages(input.exampleMessages),
    bio: input.bio,
    lore: input.lore,
    topics: input.topics,
    adjectives: input.adjectives,
    style: input.style,
    postExamples: input.postExamples,
  }
}

function applyWagdieUpdateToAgentCharacter(
  existing: AgentCharacter,
  update: UpdateAICharacterInput
): AgentCharacter {
  const next: AgentCharacter = { ...existing }

  if (typeof update.name === 'string') next.name = update.name
  if (typeof update.personality !== 'undefined') next.personality = update.personality ?? null
  if (typeof update.backstory !== 'undefined') next.backstory = update.backstory ?? null
  if (typeof update.systemPrompt !== 'undefined') next.systemPrompt = update.systemPrompt ?? null
  if (typeof update.exampleMessages !== 'undefined') {
    next.exampleMessages = toRoleContentExampleMessages(update.exampleMessages)
  }

  if (typeof update.bio !== 'undefined') next.bio = update.bio
  if (typeof update.lore !== 'undefined') next.lore = update.lore
  if (typeof update.topics !== 'undefined') next.topics = update.topics
  if (typeof update.adjectives !== 'undefined') next.adjectives = update.adjectives
  if (typeof update.style !== 'undefined') next.style = update.style
  if (typeof update.postExamples !== 'undefined') next.postExamples = update.postExamples

  return next
}

async function getCharacterByTokenId(args: {
  elizaClient: ReturnType<typeof getElizaClient>
  tokenId: string
}): Promise<CharacterRecord | null> {
  const record = await args.elizaClient.characters.getByExternalId(args.tokenId)
  if (!record) return null

  if (record && typeof record === 'object' && 'character' in record) {
    return record as unknown as CharacterRecord
  }

  const flat = record as unknown as Record<string, unknown>
  return {
    id: flat.id as string,
    externalId: (flat.externalId as string | undefined) ?? args.tokenId,
    character: {
      name: flat.name as string,
      personality: (flat.personality as string | null) ?? null,
      backstory: (flat.backstory as string | null) ?? null,
      systemPrompt: (flat.systemPrompt as string | null) ?? null,
      exampleMessages: Array.isArray(flat.exampleMessages) ? flat.exampleMessages as AgentCharacter['exampleMessages'] : [],
    },
    createdAt: flat.createdAt as string | undefined,
    updatedAt: flat.updatedAt as string | undefined,
  }
}

function toAICharacterFromRecord(tokenId: string, record: CharacterRecord): AICharacter {
  const character = record.character

  return {
    id: record.id,
    externalId: tokenId,
    name: character.name,
    personality: character.personality ?? null,
    backstory: character.backstory ?? null,
    systemPrompt: character.systemPrompt ?? null,
    exampleMessages: toAIExampleMessages(character.exampleMessages) ?? [],
    bio: (character.bio as string[] | undefined) ?? undefined,
    lore: (character.lore as string[] | undefined) ?? undefined,
    topics: (character.topics as string[] | undefined) ?? undefined,
    adjectives: (character.adjectives as string[] | undefined) ?? undefined,
    style: (character.style as AICharacter['style']) ?? undefined,
    postExamples: (character.postExamples as string[] | undefined) ?? undefined,
    createdAt: record.createdAt ?? '',
    updatedAt: record.updatedAt ?? '',
  }
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
    const record = await getCharacterByTokenId({ elizaClient, tokenId })

    if (!record) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No AI character exists for this token' },
        { status: 404 }
      )
    }

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

    // Check if AI character already exists (v0.2 CharacterRecord)
    const existing = await getCharacterByTokenId({ elizaClient, tokenId })

    let record
    if (existing) {
      // v0.2: full replace using merged AgentCharacter
      const merged = applyWagdieUpdateToAgentCharacter(existing.character, body)
      // The replace method exists at runtime but may not be typed in the SDK
      const charactersApi = elizaClient.characters as unknown as {
        replace: (id: string, data: { character: AgentCharacter }) => Promise<CharacterRecord>
      }
      record = await charactersApi.replace(existing.id, { character: merged })
    } else {
      // v0.2: create with canonical AgentCharacter payload (defaults from WAGDIE + request overrides)
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

      // The create method signature may differ from SDK types at runtime
      const createApi = elizaClient.characters.create as unknown as (
        input: { externalId: string; character: AgentCharacter }
      ) => Promise<CharacterRecord>
      record = await createApi({
        externalId: tokenId,
        character,
      })
    }

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
