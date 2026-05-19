/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET, PUT } from '@/app/api/eliza/characters/[tokenId]/route'
import { getSession } from '@/lib/auth/session'
import { getElizaClient } from '@/lib/eliza/client'
import { getCharacter } from '@/lib/services/character-service'
import { elizaConfig } from '@/lib/eliza/config'
import { recordPersonaMigrationSuccess, syncOfficialPersonaShadow } from '@/lib/eliza/personaMigration'

const mockIsAdmin = jest.fn()

jest.mock('@/lib/auth/session', () => ({ getSession: jest.fn() }))
jest.mock('@/lib/eliza/client', () => ({ getElizaClient: jest.fn() }))
jest.mock('@/lib/services/character-service', () => ({ getCharacter: jest.fn() }))
jest.mock('@/lib/auth/admin', () => ({ isAdmin: (address: string) => mockIsAdmin(address) }))
jest.mock('@/lib/eliza/personaMigration', () => ({
  recordLegacyPersonaProfileLink: jest.fn(),
  recordPersonaMigrationSuccess: jest.fn(),
  syncOfficialPersonaShadow: jest.fn(),
}))

function request(body?: unknown) {
  return new NextRequest('http://localhost/api/eliza/characters/123', {
    method: body === undefined ? 'GET' : 'PUT',
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

function params(tokenId = '123') {
  return { params: Promise.resolve({ tokenId }) }
}

describe('Eliza character record route', () => {
  const originalMode = elizaConfig.mode

  beforeEach(() => {
    jest.clearAllMocks()
    elizaConfig.mode = 'legacy'
    mockIsAdmin.mockReturnValue(false)
  })

  afterAll(() => {
    elizaConfig.mode = originalMode
  })

  it('GET resolves records by external token id through the gateway', async () => {
    const getRecordByExternalId = jest.fn().mockResolvedValueOnce({
      id: 'record-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Bio'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({ characters: { getRecordByExternalId } })

    const response = await GET(request(), params())

    expect(response.status).toBe(200)
    expect(getRecordByExternalId).toHaveBeenCalledWith('123')
    const data = await response.json()
    expect(data).toMatchObject({ name: 'Ash' })
  })

  it('PUT replaces an existing character record through the gateway', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xOwner' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      background_story: 'Old story',
    })

    const existingRecord = {
      id: 'record-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Old'], lore: ['Old story'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const replaceRecord = jest.fn().mockResolvedValueOnce({
      ...existingRecord,
      character: { ...existingRecord.character, bio: ['New bio'] },
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(existingRecord),
        replaceRecord,
      },
    })

    const response = await PUT(request({ bio: ['New bio'] }), params())

    expect(response.status).toBe(200)
    expect(replaceRecord).toHaveBeenCalledWith(
      'record-123',
      expect.objectContaining({ character: expect.objectContaining({ bio: ['New bio'] }) })
    )
  })

  it('PUT dual-writes official persona in dual mode without changing legacy-visible response', async () => {
    elizaConfig.mode = 'dual'

    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xOwner' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      background_story: 'Old story',
    })

    const existingRecord = {
      id: 'legacy-record-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Old'], lore: ['Old story'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const updatedRecord = {
      ...existingRecord,
      character: { ...existingRecord.character, bio: ['New bio'] },
    }
    const replaceRecord = jest.fn().mockResolvedValueOnce(updatedRecord)

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(existingRecord),
        replaceRecord,
      },
    })
    ;(syncOfficialPersonaShadow as jest.Mock).mockResolvedValueOnce({ attempted: true, ok: true })

    const response = await PUT(request({ bio: ['New bio'] }), params())

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.id).toBe('legacy-record-123')
    expect(syncOfficialPersonaShadow).toHaveBeenCalledWith({
      tokenId: '123',
      legacyCharacterId: 'legacy-record-123',
      character: updatedRecord.character,
    })
    expect(recordPersonaMigrationSuccess).not.toHaveBeenCalled()
  })

  it('PUT records official link in official mode after direct official update', async () => {
    elizaConfig.mode = 'official'

    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xOwner' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      background_story: 'Old story',
    })

    const existingRecord = {
      id: 'official-agent-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Old'], lore: ['Old story'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const updatedRecord = {
      ...existingRecord,
      character: { ...existingRecord.character, bio: ['Official bio'] },
    }

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(existingRecord),
        replaceRecord: jest.fn().mockResolvedValueOnce(updatedRecord),
      },
    })
    ;(recordPersonaMigrationSuccess as jest.Mock).mockResolvedValueOnce(null)

    const response = await PUT(request({ bio: ['Official bio'] }), params())

    expect(response.status).toBe(200)
    expect(recordPersonaMigrationSuccess).toHaveBeenCalledWith({
      tokenId: '123',
      officialAgentId: 'official-agent-123',
    })
    expect(syncOfficialPersonaShadow).not.toHaveBeenCalled()
  })

  it('PUT creates a new character record through the gateway when missing', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xOwner' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      background_story: 'Old story',
    })

    const createRecord = jest.fn().mockResolvedValueOnce({
      id: 'record-123',
      externalId: '123',
      character: { name: 'Created Ash', bio: ['Bio'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(null),
        createRecord,
      },
    })

    const response = await PUT(request({ name: 'Created Ash', bio: ['Bio'] }), params())

    expect(response.status).toBe(201)
    expect(createRecord).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: '123', character: expect.objectContaining({ name: 'Created Ash' }) })
    )
    expect(syncOfficialPersonaShadow).not.toHaveBeenCalled()
    expect(recordPersonaMigrationSuccess).not.toHaveBeenCalled()
  })

  it('PUT uses neutral default persona copy when creating a missing record without explicit persona text', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xOwner' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      background_story: null,
    })

    const createRecord = jest.fn().mockResolvedValueOnce({
      id: 'record-123',
      externalId: '123',
      character: {
        name: 'Ash',
        bio: ['A mysterious character whose story is still being written. Character #123.'],
      },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(null),
        createRecord,
      },
    })

    const response = await PUT(request({}), params())

    expect(response.status).toBe(201)
    const createdCharacter = createRecord.mock.calls[0][0].character
    expect(createdCharacter.bio).toContain(
      'A mysterious character whose story is still being written. Character #123.'
    )
    expect(JSON.stringify(createdCharacter)).not.toContain('world of WAGDIE')
  })

  it('PUT rejects missing wallet session before loading the character', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({})

    const response = await PUT(request({ bio: ['New bio'] }), params())

    expect(response.status).toBe(401)
    expect(getCharacter).not.toHaveBeenCalled()
    expect(getElizaClient).not.toHaveBeenCalled()
  })

  it.each(['123abc', '00123', '1e3'])(
    'PUT rejects non-canonical token id %s before authorization',
    async (tokenId) => {
      const response = await PUT(request({ bio: ['New bio'] }), params(tokenId))

      expect(response.status).toBe(400)
      expect(getSession).not.toHaveBeenCalled()
      expect(getCharacter).not.toHaveBeenCalled()
      expect(getElizaClient).not.toHaveBeenCalled()
    }
  )

  it('PUT rejects wallets that are neither owner, staker, nor admin', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xIntruder' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      staker_address: '0xstaker',
    })

    const response = await PUT(request({ bio: ['New bio'] }), params())

    expect(response.status).toBe(403)
    expect(getElizaClient).not.toHaveBeenCalled()
  })

  it('PUT allows the current staker to replace an existing character record', async () => {
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xStaker' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      staker_address: '0xstaker',
      background_story: 'Old story',
    })

    const existingRecord = {
      id: 'record-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Old'], lore: ['Old story'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const replaceRecord = jest.fn().mockResolvedValueOnce({
      ...existingRecord,
      character: { ...existingRecord.character, bio: ['Staker bio'] },
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(existingRecord),
        replaceRecord,
      },
    })

    const response = await PUT(request({ bio: ['Staker bio'] }), params())

    expect(response.status).toBe(200)
    expect(replaceRecord).toHaveBeenCalledWith(
      'record-123',
      expect.objectContaining({ character: expect.objectContaining({ bio: ['Staker bio'] }) })
    )
  })

  it('PUT allows admins to mutate characters they do not own or stake', async () => {
    mockIsAdmin.mockReturnValueOnce(true)
    ;(getSession as jest.Mock).mockResolvedValueOnce({ address: '0xAdmin' })
    ;(getCharacter as jest.Mock).mockResolvedValueOnce({
      name: 'Ash',
      owner_address: '0xowner',
      staker_address: '0xstaker',
      background_story: 'Old story',
    })

    const existingRecord = {
      id: 'record-123',
      externalId: '123',
      character: { name: 'Ash', bio: ['Old'], lore: ['Old story'] },
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-10T00:00:00.000Z',
    }
    const replaceRecord = jest.fn().mockResolvedValueOnce({
      ...existingRecord,
      character: { ...existingRecord.character, bio: ['Admin bio'] },
    })

    ;(getElizaClient as jest.Mock).mockReturnValue({
      characters: {
        getRecordByExternalId: jest.fn().mockResolvedValueOnce(existingRecord),
        replaceRecord,
      },
    })

    const response = await PUT(request({ bio: ['Admin bio'] }), params())

    expect(response.status).toBe(200)
    expect(replaceRecord).toHaveBeenCalledWith(
      'record-123',
      expect.objectContaining({ character: expect.objectContaining({ bio: ['Admin bio'] }) })
    )
  })
})
