/**
 * Eliza Character Resolver
 *
 * Centralized helpers to resolve a WAGDIE tokenId to an Eliza CharacterRecord.
 * - getCharacterByTokenId(): simple lookup (no side effects)
 * - resolveCharacterByTokenId(): lookup + auto-create default character if missing
 */

import type { ElizaClient, Character as SDKCharacter } from '@eliza/sdk'
import type { CharacterRecord, AgentCharacter } from '@/lib/eliza/sdkAdapter'
import { toAgentCharacterFromAICharacter } from '@/lib/eliza/sdkAdapter'

/**
 * Convert SDK Character response to our CharacterRecord format.
 * The SDK returns a flat Character, we wrap it in CharacterRecord shape.
 */
function sdkCharacterToRecord(sdkChar: SDKCharacter, externalId?: string): CharacterRecord {
  return {
    id: sdkChar.id,
    externalId,
    character: {
      name: sdkChar.name,
      bio: sdkChar.personality ? [sdkChar.personality] : [],
      backstory: sdkChar.backstory ?? null,
      system: sdkChar.systemPrompt,
      messageExamples: sdkChar.exampleMessages?.map((msg) => [
        { name: '{{user1}}', content: { text: msg.role === 'user' ? msg.content : '' } },
        { name: '{{char}}', content: { text: msg.role === 'assistant' ? msg.content : '' } },
      ]) ?? [],
    },
    createdAt: sdkChar.createdAt,
    updatedAt: sdkChar.updatedAt,
  }
}

export type WagdieCharacterDefaults = {
  name: string | null
  backgroundStory: string | null
}

function assertValidTokenId(tokenId: string): string {
  const trimmed = tokenId.trim()
  if (trimmed.length === 0) {
    throw new Error('tokenId is required')
  }
  return trimmed
}

function buildDefaultCharacter(params: {
  tokenId: string
  wagdieDefaults: WagdieCharacterDefaults
}): AgentCharacter {
  const { tokenId, wagdieDefaults } = params

  const name =
    (typeof wagdieDefaults.name === 'string' && wagdieDefaults.name.trim().length > 0
      ? wagdieDefaults.name.trim()
      : null) || `Character #${tokenId}`

  const personality = `A mysterious character from the world of WAGDIE. Character #${tokenId}.`
  const backstory =
    typeof wagdieDefaults.backgroundStory === 'string' ? wagdieDefaults.backgroundStory : null

  // Use adapter mapping to ensure we follow canonical v0.2 AgentCharacter structure:
  // - systemPrompt -> system
  // - personality -> bio[] (via migratePersonalityToBio)
  // - backstory -> custom key + mirrored into lore[]
  // - exampleMessages -> messageExamples
  return toAgentCharacterFromAICharacter({
    name,
    personality,
    backstory,
    systemPrompt: null,
    exampleMessages: [],
  })
}

/**
 * Get Eliza character by WAGDIE tokenId.
 * No auto-create; returns null if missing.
 */
export async function getCharacterByTokenId(params: {
  elizaClient: ElizaClient
  tokenId: string
}): Promise<CharacterRecord | null> {
  const tokenId = assertValidTokenId(params.tokenId)
  const sdkChar = await params.elizaClient.characters.getByExternalId(tokenId)
  if (!sdkChar) return null
  return sdkCharacterToRecord(sdkChar, tokenId)
}

/**
 * Resolve Eliza character by WAGDIE tokenId, auto-creating a default character if missing.
 */
export async function resolveCharacterByTokenId(params: {
  elizaClient: ElizaClient
  tokenId: string
  wagdieDefaults: WagdieCharacterDefaults
}): Promise<CharacterRecord> {
  const tokenId = assertValidTokenId(params.tokenId)

  const existing = await params.elizaClient.characters.getByExternalId(tokenId)
  if (existing) return sdkCharacterToRecord(existing, tokenId)

  const character = buildDefaultCharacter({ tokenId, wagdieDefaults: params.wagdieDefaults })

  // The create method signature may differ from SDK types at runtime
  const createApi = params.elizaClient.characters.create as unknown as (
    input: { externalId: string; character: AgentCharacter }
  ) => Promise<SDKCharacter>
  const created = await createApi({
    externalId: tokenId,
    character,
  })
  return sdkCharacterToRecord(created, tokenId)
}