/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { GET as getPublicRoom } from '@/app/api/eliza/location-rooms/[locationId]/route'
import { POST as postManualTick } from '@/app/api/eliza/location-rooms/[locationId]/tick/route'
import { GET as syncGet, POST as syncPost } from '@/app/api/sync/eliza-location-rooms/route'
import { requireAuth } from '@/lib/api/auth'
import { isAdmin } from '@/lib/auth/admin'
import {
  LocationRoomFeatureDisabledError,
  LocationRoomForbiddenError,
  LocationRoomInsufficientParticipantsError,
  LocationRoomManualCooldownError,
  LocationRoomNotFoundError,
  LocationRoomOfficialServiceDisabledError,
  locationRoomService,
} from '@/lib/eliza/locationRooms/service'

const requireAuthMock = requireAuth as jest.Mock
const isAdminMock = isAdmin as jest.Mock
const locationRoomServiceMock = locationRoomService as jest.Mocked<typeof locationRoomService>

jest.mock('@/lib/api/auth', () => {
  const { NextResponse: MockNextResponse } = jest.requireActual('next/server')

  return {
    requireAuth: jest.fn(),
    isAuthError: (result: unknown) => result instanceof MockNextResponse,
  }
})

jest.mock('@/lib/auth/admin', () => ({
  isAdmin: jest.fn(),
}))

jest.mock('@/lib/eliza/locationRooms/service', () => {
  class LocationRoomNotFoundError extends Error {}
  class LocationRoomFeatureDisabledError extends Error {}
  class LocationRoomOfficialServiceDisabledError extends Error {}
  class LocationRoomForbiddenError extends Error {}
  class LocationRoomInsufficientParticipantsError extends Error {}
  class LocationRoomManualCooldownError extends Error {
    constructor(public readonly retryAfterSeconds: number) {
      super('cooldown')
    }
  }
  class LocationRoomTickDisabledError extends Error {}

  return {
    LocationRoomNotFoundError,
    LocationRoomFeatureDisabledError,
    LocationRoomOfficialServiceDisabledError,
    LocationRoomForbiddenError,
    LocationRoomInsufficientParticipantsError,
    LocationRoomManualCooldownError,
    LocationRoomTickDisabledError,
    locationRoomService: {
      getPublicRoom: jest.fn(),
      requestTick: jest.fn(),
      runScheduledWorker: jest.fn(),
    },
  }
})

function publicRequest(query = '') {
  return new NextRequest(`http://localhost/api/eliza/location-rooms/loc-1${query}`, { method: 'GET' })
}

function publicContext(locationId = 'loc-1') {
  return { params: Promise.resolve({ locationId }) }
}

function manualRequest() {
  return new NextRequest('http://localhost/api/eliza/location-rooms/loc-1/tick', { method: 'POST' })
}

function syncRequest(url = 'http://localhost/api/sync/eliza-location-rooms', method = 'GET', headers?: HeadersInit) {
  return new NextRequest(url, { method, headers })
}

describe('Eliza location room routes', () => {
  const originalSecret = process.env.SYNC_SECRET_KEY

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SYNC_SECRET_KEY = 'sync-secret'
    requireAuthMock.mockResolvedValue({ address: '0xOwner' })
    isAdminMock.mockReturnValue(false)
  })

  afterAll(() => {
    process.env.SYNC_SECRET_KEY = originalSecret
  })

  it('public read returns no-store room data and forwards pagination', async () => {
    locationRoomServiceMock.getPublicRoom.mockResolvedValueOnce({
      room: { id: 'room-1', locationId: 'loc-1', locationName: 'Bell', tickEnabled: true, lastTickAt: null, nextTickAt: null, tickCount: 0, createdAt: 'now', updatedAt: 'now' },
      participants: [],
      messages: [],
      pagination: { page: 2, pageSize: 5, total: 0, hasMore: false },
    })

    const response = await getPublicRoom(publicRequest('?page=2&pageSize=5'), publicContext())

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(locationRoomService.getPublicRoom).toHaveBeenCalledWith('loc-1', { page: '2', pageSize: '5' })
    await expect(response.json()).resolves.toMatchObject({ room: { id: 'room-1' } })
  })

  it('public read returns 404 when the location does not exist', async () => {
    locationRoomServiceMock.getPublicRoom.mockRejectedValueOnce(new LocationRoomNotFoundError('missing'))

    const response = await getPublicRoom(publicRequest(), publicContext('missing'))

    expect(response.status).toBe(404)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    await expect(response.json()).resolves.toEqual({ error: 'Location not found' })
  })

  it('manual tick queues owner requests through the location room service', async () => {
    locationRoomServiceMock.requestTick.mockResolvedValueOnce({
      roomId: 'room-1',
      locationId: 'loc-1',
      tickId: 'tick-1',
      triggerType: 'owner',
      deduped: false,
      requestedByTokenId: 7,
      participantCount: 2,
    })

    const response = await postManualTick(manualRequest(), publicContext())

    expect(response.status).toBe(202)
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(locationRoomService.requestTick).toHaveBeenCalledWith('loc-1', {
      actor: 'owner',
      walletAddress: '0xOwner',
    })
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      queued: true,
      tickId: 'tick-1',
      triggerType: 'owner',
    })
  })

  it('manual tick queues admin requests as admin actor', async () => {
    isAdminMock.mockReturnValueOnce(true)
    locationRoomServiceMock.requestTick.mockResolvedValueOnce({
      roomId: 'room-1',
      locationId: 'loc-1',
      tickId: null,
      triggerType: 'admin',
      deduped: true,
      requestedByTokenId: null,
      participantCount: 2,
    })

    const response = await postManualTick(manualRequest(), publicContext())

    expect(response.status).toBe(202)
    expect(locationRoomService.requestTick).toHaveBeenCalledWith('loc-1', {
      actor: 'admin',
      walletAddress: '0xOwner',
    })
    await expect(response.json()).resolves.toMatchObject({ deduped: true, triggerType: 'admin' })
  })

  it('manual tick returns auth errors before calling the service', async () => {
    requireAuthMock.mockResolvedValueOnce(NextResponse.json({ error: 'nope' }, { status: 401 }))

    const response = await postManualTick(manualRequest(), publicContext())

    expect(response.status).toBe(401)
    expect(locationRoomService.requestTick).not.toHaveBeenCalled()
  })

  it('manual tick maps owner, participant, cooldown, and disabled errors', async () => {
    locationRoomServiceMock.requestTick
      .mockRejectedValueOnce(new LocationRoomForbiddenError())
      .mockRejectedValueOnce(new LocationRoomInsufficientParticipantsError())
      .mockRejectedValueOnce(new LocationRoomManualCooldownError(120))
      .mockRejectedValueOnce(new LocationRoomFeatureDisabledError())

    const forbidden = await postManualTick(manualRequest(), publicContext())
    const insufficient = await postManualTick(manualRequest(), publicContext())
    const cooldown = await postManualTick(manualRequest(), publicContext())
    const disabled = await postManualTick(manualRequest(), publicContext())

    expect(forbidden.status).toBe(403)
    expect(insufficient.status).toBe(409)
    expect(cooldown.status).toBe(429)
    expect(cooldown.headers.get('Retry-After')).toBe('120')
    expect(disabled.status).toBe(503)
  })

  it('scheduled sync rejects missing or invalid sync secret', async () => {
    const response = await syncGet(syncRequest())

    expect(response.status).toBe(401)
    expect(locationRoomService.runScheduledWorker).not.toHaveBeenCalled()
  })

  it('scheduled sync returns 503 when the feature is disabled', async () => {
    locationRoomServiceMock.runScheduledWorker.mockRejectedValueOnce(new LocationRoomFeatureDisabledError())

    const response = await syncGet(syncRequest('http://localhost/api/sync/eliza-location-rooms?secret=sync-secret'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: 'Eliza location rooms are disabled' })
  })

  it('scheduled sync returns 503 when the official service is not configured', async () => {
    locationRoomServiceMock.runScheduledWorker.mockRejectedValueOnce(new LocationRoomOfficialServiceDisabledError())

    const response = await syncGet(syncRequest('http://localhost/api/sync/eliza-location-rooms?secret=sync-secret'))

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({ success: false, error: 'Official ElizaOS service is not configured' })
  })

  it('scheduled sync can be triggered by bearer auth and returns worker counts', async () => {
    locationRoomServiceMock.runScheduledWorker.mockResolvedValueOnce({
      enabled: true,
      enqueued: 1,
      deduped: 0,
      processed: 1,
      completed: 1,
      skipped: 0,
      failed: 0,
      dead: 0,
      results: [{ tickId: 'tick-1', status: 'completed', selectedTokenId: 1, messageId: 'msg-1' }],
    })

    const response = await syncPost(syncRequest('http://localhost/api/sync/eliza-location-rooms', 'POST', {
      authorization: 'Bearer sync-secret',
    }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      enqueued: 1,
      processed: 1,
      completed: 1,
    })
  })
})
