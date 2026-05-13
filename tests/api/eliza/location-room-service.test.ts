/**
 * @jest-environment node
 */

jest.mock('@/lib/eliza/locationRooms/officialTurnGenerator', () => ({
  officialLocationRoomTurnGenerator: { generateTurn: jest.fn() },
  normalizeLocationRoomGeneratedContent: (content: string) => content.trim() || null,
}))

import { LocationRoomService, selectLocationRoomSpeaker } from '@/lib/eliza/locationRooms/service'
import { elizaConfig } from '@/lib/eliza/config'
import type { LocationRoom, LocationRoomMessage, LocationRoomParticipant, LocationRoomTick } from '@/lib/eliza/locationRooms/types'
import type { LocationRoomRepository } from '@/lib/eliza/locationRooms/repository'
import type { LocationRoomMembershipRepository } from '@/lib/eliza/locationRooms/membership'
import type { OfficialLocationRoomTurnGenerator } from '@/lib/eliza/locationRooms/officialTurnGenerator'

const now = '2026-05-11T12:00:00.000Z'

function room(overrides: Partial<LocationRoom> = {}): LocationRoom {
  return {
    id: 'room-1',
    locationId: 'loc-1',
    officialRoomId: 'official-room-1',
    officialWorldId: 'official-world-1',
    officialUserId: 'official-user-1',
    channelId: 'wagdie-location-loc-1',
    tickEnabled: true,
    lastTickAt: null,
    nextTickAt: null,
    tickCount: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function participant(tokenId: number, name = `Character #${tokenId}`): LocationRoomParticipant {
  return {
    tokenId,
    name,
    imageUrl: null,
    backgroundStory: null,
    ownerAddress: `0x${tokenId}`,
    stakerAddress: null,
    locationId: 'loc-1',
  }
}

function message(overrides: Partial<LocationRoomMessage>): LocationRoomMessage {
  return {
    id: `msg-${overrides.sequence ?? 1}`,
    roomId: 'room-1',
    locationId: 'loc-1',
    tickId: null,
    sequence: 1,
    visibility: 'public',
    authorKind: 'agent',
    tokenId: 1,
    officialAgentId: 'agent-1',
    authorName: 'Character #1',
    content: 'hello',
    metadata: {},
    createdAt: now,
    ...overrides,
  }
}

function tick(overrides: Partial<LocationRoomTick> = {}): LocationRoomTick {
  return {
    id: 'tick-1',
    roomId: 'room-1',
    locationId: 'loc-1',
    triggerType: 'scheduled',
    requestedByWallet: null,
    requestedByTokenId: null,
    status: 'processing',
    attempts: 1,
    nextAttemptAt: now,
    lockedAt: now,
    lockedBy: 'worker',
    selectedTokenId: null,
    startedAt: now,
    completedAt: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function makeRepository(overrides: Partial<jest.Mocked<LocationRoomRepository>> = {}): jest.Mocked<LocationRoomRepository> {
  const baseRoom = room()
  const baseTick = tick()
  const appended = message({ id: 'msg-new', sequence: 3, tokenId: 1, content: 'The room stirs.' })

  return {
    getLocation: jest.fn(async () => ({ id: 'loc-1', name: 'The Bell Gate' })),
    findRoomById: jest.fn(async () => baseRoom),
    findRoomByLocationId: jest.fn(async () => baseRoom),
    ensureRoomForLocation: jest.fn(async () => baseRoom),
    listDueRooms: jest.fn(async () => [baseRoom]),
    enqueueTick: jest.fn(async () => ({ tick: baseTick, deduped: false })),
    findRecentCompletedOwnerTick: jest.fn(async () => null),
    claimDueTicks: jest.fn(async () => [baseTick]),
    markTickSelected: jest.fn(async (_tickId, tokenId) => tick({ selectedTokenId: tokenId })),
    appendMessage: jest.fn(async () => appended),
    markTickCompleted: jest.fn(async () => tick({ status: 'completed', completedAt: now })),
    markTickSkipped: jest.fn(async () => tick({ status: 'skipped', completedAt: now })),
    markTickFailed: jest.fn(async () => tick({ status: 'failed' })),
    markTickDead: jest.fn(async () => tick({ status: 'dead', completedAt: now })),
    updateRoomAfterProcessedTick: jest.fn(async () => room({ tickCount: 1, lastTickAt: now })),
    recordRoomError: jest.fn(async () => undefined),
    listPublicMessages: jest.fn(async () => ({ messages: [], total: 0, page: 1, pageSize: 20, hasMore: false })),
    listRecentPublicMessages: jest.fn(async () => []),
    ...overrides,
  }
}

function makeMembership(participants = [participant(1, 'Ash'), participant(2, 'Bone')]): jest.Mocked<LocationRoomMembershipRepository> {
  return {
    listEligibleParticipantsByLocation: jest.fn(async () => participants),
    listEligibleLocationIds: jest.fn(async () => ['loc-1']),
    walletHasEligibleParticipant: jest.fn(async () => true),
  }
}

describe('location room domain service', () => {
  const originalEnabled = elizaConfig.locationRooms.enabled
  const originalOfficialBaseUrl = elizaConfig.official.baseUrl
  const mutableLocationRoomsConfig = elizaConfig.locationRooms as { enabled: boolean }
  const mutableOfficialConfig = elizaConfig.official as { baseUrl: string }

  beforeEach(() => {
    jest.clearAllMocks()
    mutableLocationRoomsConfig.enabled = true
    mutableOfficialConfig.baseUrl = 'https://elizaos.example'
  })

  afterAll(() => {
    mutableLocationRoomsConfig.enabled = originalEnabled
    mutableOfficialConfig.baseUrl = originalOfficialBaseUrl
  })

  it('selects the speaker with the fewest recent messages, then oldest last message, then lowest token id', () => {
    const participants = [participant(1), participant(2), participant(3)]
    const selected = selectLocationRoomSpeaker(participants, [
      message({ sequence: 1, tokenId: 1 }),
      message({ sequence: 2, tokenId: 2 }),
      message({ sequence: 3, tokenId: 2 }),
    ])

    expect(selected.tokenId).toBe(3)
  })

  it('queues an owner-requested tick only when the wallet owns an eligible participant', async () => {
    const repository = makeRepository()
    const membership = makeMembership([
      participant(2, 'Bone'),
      { ...participant(1, 'Ash'), ownerAddress: '0xabc', stakerAddress: null },
    ])
    const turnGenerator: jest.Mocked<OfficialLocationRoomTurnGenerator> = {
      generateTurn: jest.fn(),
    }
    const service = new LocationRoomService(repository, membership, turnGenerator)

    const result = await service.requestTick('loc-1', {
      actor: 'owner',
      walletAddress: '0xAbC',
      now: new Date(now),
    })

    expect(result).toMatchObject({
      roomId: 'room-1',
      locationId: 'loc-1',
      triggerType: 'owner',
      requestedByTokenId: 1,
      participantCount: 2,
      deduped: false,
    })
    expect(repository.enqueueTick).toHaveBeenCalledWith(expect.objectContaining({
      triggerType: 'owner',
      requestedByWallet: '0xabc',
      requestedByTokenId: 1,
    }))
  })

  it('rejects owner-requested ticks for non-owner wallets', async () => {
    const repository = makeRepository()
    const service = new LocationRoomService(repository, makeMembership(), { generateTurn: jest.fn() })

    await expect(service.requestTick('loc-1', {
      actor: 'owner',
      walletAddress: '0xnotowner',
      now: new Date(now),
    })).rejects.toMatchObject({ name: 'LocationRoomForbiddenError' })

    expect(repository.enqueueTick).not.toHaveBeenCalled()
  })

  it('rejects manual ticks when fewer than two participants are eligible', async () => {
    const repository = makeRepository()
    const service = new LocationRoomService(
      repository,
      makeMembership([{ ...participant(1), ownerAddress: '0xabc' }]),
      { generateTurn: jest.fn() }
    )

    await expect(service.requestTick('loc-1', {
      actor: 'owner',
      walletAddress: '0xabc',
      now: new Date(now),
    })).rejects.toMatchObject({ name: 'LocationRoomInsufficientParticipantsError' })

    expect(repository.enqueueTick).not.toHaveBeenCalled()
  })

  it('enforces owner manual trigger cooldown after recent completed owner ticks', async () => {
    const recentTick = tick({
      triggerType: 'owner',
      requestedByWallet: '0xabc',
      status: 'completed',
      createdAt: new Date(new Date(now).getTime() - 60_000).toISOString(),
    })
    const repository = makeRepository({
      findRecentCompletedOwnerTick: jest.fn(async () => recentTick),
    })
    const service = new LocationRoomService(
      repository,
      makeMembership([{ ...participant(1), ownerAddress: '0xabc' }, participant(2)]),
      { generateTurn: jest.fn() }
    )

    await expect(service.requestTick('loc-1', {
      actor: 'owner',
      walletAddress: '0xabc',
      now: new Date(now),
    })).rejects.toMatchObject({ name: 'LocationRoomManualCooldownError', retryAfterSeconds: 240 })

    expect(repository.enqueueTick).not.toHaveBeenCalled()
  })

  it('allows admin-requested ticks without participant ownership', async () => {
    const repository = makeRepository()
    const service = new LocationRoomService(repository, makeMembership(), { generateTurn: jest.fn() })

    const result = await service.requestTick('loc-1', {
      actor: 'admin',
      walletAddress: '0xAdmin',
      now: new Date(now),
    })

    expect(result).toMatchObject({ triggerType: 'admin', requestedByTokenId: null })
    expect(repository.findRecentCompletedOwnerTick).not.toHaveBeenCalled()
    expect(repository.enqueueTick).toHaveBeenCalledWith(expect.objectContaining({
      triggerType: 'admin',
      requestedByWallet: '0xadmin',
      requestedByTokenId: null,
    }))
  })

  it('runs a scheduled tick, generates one turn, appends a public message, and advances room state', async () => {
    const repository = makeRepository()
    const membership = makeMembership()
    const turnGenerator: jest.Mocked<OfficialLocationRoomTurnGenerator> = {
      generateTurn: jest.fn(async () => ({ officialAgentId: 'agent-1', content: 'The room stirs.' })),
    }
    const service = new LocationRoomService(repository, membership, turnGenerator)

    const result = await service.runScheduledWorker(new Date(now))

    expect(result).toMatchObject({ enqueued: 1, processed: 1, completed: 1, skipped: 0, failed: 0, dead: 0 })
    expect(repository.ensureRoomForLocation).toHaveBeenCalledWith('loc-1')
    expect(repository.enqueueTick).toHaveBeenCalledWith(expect.objectContaining({ triggerType: 'scheduled' }))
    expect(turnGenerator.generateTurn).toHaveBeenCalledWith(expect.objectContaining({ speaker: expect.objectContaining({ tokenId: 1 }) }))
    expect(repository.appendMessage).toHaveBeenCalledWith(expect.objectContaining({
      authorKind: 'agent',
      tokenId: 1,
      officialAgentId: 'agent-1',
      content: 'The room stirs.',
      visibility: 'public',
    }))
    expect(repository.markTickCompleted).toHaveBeenCalledWith('tick-1')
    expect(repository.updateRoomAfterProcessedTick).toHaveBeenCalled()
  })

  it('skips a claimed tick without generating when fewer than two eligible participants remain', async () => {
    const repository = makeRepository()
    const membership = makeMembership([participant(1)])
    const turnGenerator: jest.Mocked<OfficialLocationRoomTurnGenerator> = {
      generateTurn: jest.fn(),
    }
    const service = new LocationRoomService(repository, membership, turnGenerator)

    const result = await service.runScheduledWorker(new Date(now))

    expect(result).toMatchObject({ processed: 1, completed: 0, skipped: 1 })
    expect(turnGenerator.generateTurn).not.toHaveBeenCalled()
    expect(repository.markTickSkipped).toHaveBeenCalledWith('tick-1', 'Fewer than two eligible participants')
  })

  it('marks a claimed tick failed when membership loading throws before generation', async () => {
    const repository = makeRepository()
    const membership = makeMembership()
    membership.listEligibleParticipantsByLocation.mockRejectedValueOnce(new Error('membership unavailable'))
    const turnGenerator: jest.Mocked<OfficialLocationRoomTurnGenerator> = {
      generateTurn: jest.fn(),
    }
    const service = new LocationRoomService(repository, membership, turnGenerator)

    const result = await service.runScheduledWorker(new Date(now))

    expect(result).toMatchObject({ processed: 1, failed: 1, dead: 0 })
    expect(repository.markTickFailed).toHaveBeenCalledWith('tick-1', 'membership unavailable', expect.any(String))
    expect(turnGenerator.generateTurn).not.toHaveBeenCalled()
  })

  it('does not mark a tick failed after a public message has been appended', async () => {
    const repository = makeRepository({
      markTickCompleted: jest.fn(async () => {
        throw new Error('completion failed')
      }),
    })
    const membership = makeMembership()
    const turnGenerator: jest.Mocked<OfficialLocationRoomTurnGenerator> = {
      generateTurn: jest.fn(async () => ({ officialAgentId: 'agent-1', content: 'The room stirs.' })),
    }
    const service = new LocationRoomService(repository, membership, turnGenerator)

    const result = await service.runScheduledWorker(new Date(now))

    expect(result).toMatchObject({ processed: 1, completed: 1, failed: 0, dead: 0 })
    expect(repository.appendMessage).toHaveBeenCalledTimes(1)
    expect(repository.markTickFailed).not.toHaveBeenCalled()
  })
})
