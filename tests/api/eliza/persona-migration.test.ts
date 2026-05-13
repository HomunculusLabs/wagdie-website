/**
 * @jest-environment node
 */

jest.mock('@/lib/eliza/client', () => ({
  createOfficialServerClient: jest.fn(),
}))

import { createOfficialServerClient } from '@/lib/eliza/client'
import {
  recordLegacyPersonaProfileLink,
  recordPersonaMigrationSuccess,
  syncOfficialPersonaShadow,
} from '@/lib/eliza/personaMigration'
import type { PersonaMigrationLink, PersonaMigrationLinkRepository } from '@/lib/eliza/personaMigrationRepository'
import type { WagdieElizaClient } from '@/lib/eliza/gateway/types'

function createRepositoryMock(existing: PersonaMigrationLink | null = null): jest.Mocked<PersonaMigrationLinkRepository> {
  return {
    findByTokenId: jest.fn().mockResolvedValue(existing),
    upsert: jest.fn(async (input) => ({
      tokenId: input.tokenId,
      legacyCharacterId: input.legacyCharacterId ?? null,
      officialAgentId: input.officialAgentId ?? null,
      status: input.status,
      lastError: input.lastError ?? null,
      lastSyncedAt: input.lastSyncedAt ?? null,
    })),
  }
}

function createOfficialClientMock(overrides: Partial<WagdieElizaClient['characters']> = {}): WagdieElizaClient {
  return {
    auth: { getNonce: jest.fn(), verify: jest.fn() },
    characters: {
      getRecord: jest.fn(),
      getRecordByExternalId: jest.fn(),
      createRecord: jest.fn(),
      replaceRecord: jest.fn(),
      ...overrides,
    },
    chat: { sendMessageStream: jest.fn() },
    conversations: {
      list: jest.fn(),
      listForCharacter: jest.fn(),
      get: jest.fn(),
      delete: jest.fn(),
    },
  }
}

describe('persona migration shadow sync', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing in legacy mode', async () => {
    const repository = createRepositoryMock()
    const officialClient = createOfficialClientMock()

    const result = await syncOfficialPersonaShadow(
      { tokenId: '123', legacyCharacterId: 'legacy-123', character: { name: 'Ash' } },
      { mode: 'legacy', repository, officialClient }
    )

    expect(result).toEqual({ attempted: false, ok: true })
    expect(repository.findByTokenId).not.toHaveBeenCalled()
  })

  it('preserves existing legacy id when recording official-mode success', async () => {
    const repository = createRepositoryMock({
      tokenId: '123',
      legacyCharacterId: 'legacy-123',
      officialAgentId: 'old-official-123',
      status: 'synced',
      lastError: null,
      lastSyncedAt: '2026-05-10T00:00:00.000Z',
    })

    await recordPersonaMigrationSuccess(
      { tokenId: '123', officialAgentId: 'official-123' },
      repository
    )

    expect(repository.findByTokenId).toHaveBeenCalledWith('123')
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: '123',
        legacyCharacterId: 'legacy-123',
        officialAgentId: 'official-123',
        status: 'synced',
      })
    )
  })

  it('records a pending legacy profile link when no existing row exists', async () => {
    const repository = createRepositoryMock(null)

    await recordLegacyPersonaProfileLink(
      { tokenId: '123', legacyCharacterId: 'legacy-123' },
      repository
    )

    expect(repository.findByTokenId).toHaveBeenCalledWith('123')
    expect(repository.upsert).toHaveBeenCalledWith({
      tokenId: '123',
      legacyCharacterId: 'legacy-123',
      officialAgentId: null,
      status: 'pending',
      lastError: null,
      lastSyncedAt: null,
    })
  })

  it('preserves existing official link metadata when recording a legacy profile link', async () => {
    const repository = createRepositoryMock({
      tokenId: '123',
      legacyCharacterId: null,
      officialAgentId: 'official-123',
      status: 'synced',
      lastError: null,
      lastSyncedAt: '2026-05-10T00:00:00.000Z',
    })

    await recordLegacyPersonaProfileLink(
      { tokenId: '123', legacyCharacterId: 'legacy-123' },
      repository
    )

    expect(repository.findByTokenId).toHaveBeenCalledWith('123')
    expect(repository.upsert).toHaveBeenCalledWith({
      tokenId: '123',
      legacyCharacterId: 'legacy-123',
      officialAgentId: 'official-123',
      status: 'synced',
      lastError: null,
      lastSyncedAt: '2026-05-10T00:00:00.000Z',
    })
  })

  it('uses an existing official link idempotently and records success', async () => {
    const repository = createRepositoryMock({
      tokenId: '123',
      legacyCharacterId: 'legacy-123',
      officialAgentId: 'official-123',
      status: 'synced',
      lastError: null,
      lastSyncedAt: '2026-05-10T00:00:00.000Z',
    })
    const officialRecord = {
      id: 'official-123',
      externalId: '123',
      character: { name: 'Old Ash' },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const officialClient = createOfficialClientMock({
      getRecord: jest.fn().mockResolvedValueOnce(officialRecord),
      replaceRecord: jest.fn().mockResolvedValueOnce({
        ...officialRecord,
        character: { name: 'New Ash' },
      }),
      createRecord: jest.fn(),
    })

    const result = await syncOfficialPersonaShadow(
      { tokenId: '123', legacyCharacterId: 'legacy-123', character: { name: 'New Ash' } },
      { mode: 'dual', repository, officialClient }
    )

    expect(result.ok).toBe(true)
    expect(officialClient.characters.getRecord).toHaveBeenCalledWith('official-123')
    expect(officialClient.characters.replaceRecord).toHaveBeenCalledWith('official-123', {
      character: { name: 'New Ash' },
    })
    expect(officialClient.characters.createRecord).not.toHaveBeenCalled()
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: '123',
        legacyCharacterId: 'legacy-123',
        officialAgentId: 'official-123',
        status: 'synced',
        lastError: null,
      })
    )
  })

  it('creates official agent when no link or official external id exists', async () => {
    const repository = createRepositoryMock(null)
    const officialClient = createOfficialClientMock({
      getRecordByExternalId: jest.fn().mockResolvedValueOnce(null),
      createRecord: jest.fn().mockResolvedValueOnce({
        id: 'official-created-123',
        externalId: '123',
        character: { name: 'Ash' },
        createdAt: '2026-05-10T00:00:00.000Z',
        updatedAt: '2026-05-10T00:00:00.000Z',
      }),
    })

    const result = await syncOfficialPersonaShadow(
      { tokenId: '123', legacyCharacterId: 'legacy-123', character: { name: 'Ash' } },
      { mode: 'dual', repository, officialClient }
    )

    expect(result.ok).toBe(true)
    expect(officialClient.characters.getRecordByExternalId).toHaveBeenCalledWith('123')
    expect(officialClient.characters.createRecord).toHaveBeenCalledWith({
      externalId: '123',
      character: { name: 'Ash' },
    })
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ officialAgentId: 'official-created-123', status: 'synced' })
    )
  })

  it('records official client construction failure without breaking dual path', async () => {
    const repository = createRepositoryMock(null)
    ;(createOfficialServerClient as jest.Mock).mockImplementationOnce(() => {
      throw new Error('official config missing')
    })

    const result = await syncOfficialPersonaShadow(
      { tokenId: '123', legacyCharacterId: 'legacy-123', character: { name: 'Ash' } },
      { mode: 'dual', repository }
    )

    expect(result).toMatchObject({ attempted: true, ok: false, error: 'official config missing' })
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', lastError: 'official config missing' })
    )
  })

  it('records official shadow-write failure without throwing', async () => {
    const repository = createRepositoryMock(null)
    const officialClient = createOfficialClientMock({
      getRecordByExternalId: jest.fn().mockResolvedValueOnce(null),
      createRecord: jest.fn().mockRejectedValueOnce(new Error('official unavailable')),
    })

    const result = await syncOfficialPersonaShadow(
      { tokenId: '123', legacyCharacterId: 'legacy-123', character: { name: 'Ash' } },
      { mode: 'dual', repository, officialClient }
    )

    expect(result).toMatchObject({ attempted: true, ok: false, error: 'official unavailable' })
    expect(repository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenId: '123',
        legacyCharacterId: 'legacy-123',
        officialAgentId: null,
        status: 'error',
        lastError: 'official unavailable',
        lastSyncedAt: null,
      })
    )
  })
})
