import { createOfficialServerClient } from '@/lib/eliza/client'
import { elizaConfig, type ElizaIntegrationMode } from '@/lib/eliza/config'
import type { AgentCharacter, CharacterRecord, WagdieElizaClient } from '@/lib/eliza/gateway/types'
import {
  personaMigrationLinkRepository,
  type PersonaMigrationLink,
  type PersonaMigrationLinkRepository,
} from '@/lib/eliza/personaMigrationRepository'

export interface PersonaShadowSyncResult {
  attempted: boolean
  ok: boolean
  link?: PersonaMigrationLink
  error?: string
}

export interface PersonaShadowSyncParams {
  tokenId: string
  legacyCharacterId?: string | null
  character: AgentCharacter
}

interface PersonaShadowSyncDeps {
  mode?: ElizaIntegrationMode
  repository?: PersonaMigrationLinkRepository
  officialClient?: WagdieElizaClient
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message.slice(0, 1000)
  }

  return 'Official ElizaOS persona sync failed'
}

function isShadowMode(mode: ElizaIntegrationMode): boolean {
  return mode === 'dual'
}

async function writeFailure(
  repository: PersonaMigrationLinkRepository,
  params: PersonaShadowSyncParams,
  officialAgentId: string | null | undefined,
  error: unknown
): Promise<PersonaShadowSyncResult> {
  const message = normalizeErrorMessage(error)

  try {
    const link = await repository.upsert({
      tokenId: params.tokenId,
      legacyCharacterId: params.legacyCharacterId ?? null,
      officialAgentId: officialAgentId ?? null,
      status: 'error',
      lastError: message,
      lastSyncedAt: null,
    })

    return { attempted: true, ok: false, link, error: message }
  } catch (recordError) {
    console.error('[Eliza Persona Migration] Failed to record official shadow-write error:', recordError)
    return { attempted: true, ok: false, error: message }
  }
}

export async function recordPersonaMigrationSuccess(
  params: {
    tokenId: string
    legacyCharacterId?: string | null
    officialAgentId: string
  },
  repository: PersonaMigrationLinkRepository = personaMigrationLinkRepository
): Promise<PersonaMigrationLink | null> {
  try {
    const existing =
      params.legacyCharacterId === undefined ? await repository.findByTokenId(params.tokenId) : null

    return await repository.upsert({
      tokenId: params.tokenId,
      legacyCharacterId:
        params.legacyCharacterId === undefined
          ? existing?.legacyCharacterId ?? null
          : params.legacyCharacterId,
      officialAgentId: params.officialAgentId,
      status: 'synced',
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Eliza Persona Migration] Failed to record successful persona sync:', error)
    return null
  }
}

export async function recordLegacyPersonaProfileLink(
  params: {
    tokenId: string
    legacyCharacterId: string
  },
  repository: PersonaMigrationLinkRepository = personaMigrationLinkRepository
): Promise<PersonaMigrationLink | null> {
  try {
    const existing = await repository.findByTokenId(params.tokenId)

    return await repository.upsert({
      tokenId: params.tokenId,
      legacyCharacterId: params.legacyCharacterId,
      officialAgentId: existing?.officialAgentId ?? null,
      status: existing?.status ?? 'pending',
      lastError: existing?.lastError ?? null,
      lastSyncedAt: existing?.lastSyncedAt ?? null,
    })
  } catch (error) {
    console.error('[Eliza Persona Migration] Failed to record legacy persona profile link:', error)
    return null
  }
}

export async function syncOfficialPersonaShadow(
  params: PersonaShadowSyncParams,
  deps: PersonaShadowSyncDeps = {}
): Promise<PersonaShadowSyncResult> {
  const mode = deps.mode ?? elizaConfig.mode

  if (!isShadowMode(mode)) {
    return { attempted: false, ok: true }
  }

  const repository = deps.repository ?? personaMigrationLinkRepository
  let officialAgentId: string | null | undefined

  try {
    const officialClient = deps.officialClient ?? createOfficialServerClient()
    const existingLink = await repository.findByTokenId(params.tokenId)
    officialAgentId = existingLink?.officialAgentId

    let officialRecord: CharacterRecord | null = null

    if (officialAgentId) {
      officialRecord = await officialClient.characters.getRecord(officialAgentId)
    } else {
      officialRecord = await officialClient.characters.getRecordByExternalId(params.tokenId)
      officialAgentId = officialRecord?.id
    }

    const synced = officialRecord
      ? await officialClient.characters.replaceRecord(officialRecord.id, { character: params.character })
      : await officialClient.characters.createRecord({
          externalId: params.tokenId,
          character: params.character,
        })

    const link = await repository.upsert({
      tokenId: params.tokenId,
      legacyCharacterId: params.legacyCharacterId ?? null,
      officialAgentId: synced.id,
      status: 'synced',
      lastError: null,
      lastSyncedAt: new Date().toISOString(),
    })

    return { attempted: true, ok: true, link }
  } catch (error) {
    return writeFailure(repository, params, officialAgentId, error)
  }
}
