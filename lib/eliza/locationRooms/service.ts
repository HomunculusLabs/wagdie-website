import { randomUUID } from 'crypto'
import { elizaConfig } from '@/lib/eliza/config'
import type {
  EnqueueScheduledTicksResult,
  LocationRoomMessage,
  LocationRoomParticipant,
  LocationRoomTick,
  LocationRoomWorkerResult,
  ProcessLocationRoomTickResult,
  PublicLocationRoomMessage,
  PublicLocationRoomParticipant,
  PublicLocationRoomRead,
  RequestLocationRoomTickInput,
  RequestLocationRoomTickResult,
} from './types'
import {
  locationRoomRepository,
  type LocationRoomRepository,
} from './repository'
import {
  locationRoomMembershipRepository,
  participantBelongsToWallet,
  type LocationRoomMembershipRepository,
} from './membership'
import {
  officialLocationRoomTurnGenerator,
  normalizeLocationRoomGeneratedContent,
  type OfficialLocationRoomTurnGenerator,
} from './officialTurnGenerator'

const MIN_ELIGIBLE_PARTICIPANTS = 2
const MAX_TICK_ATTEMPTS = 3
const MAX_STORED_ERROR_LENGTH = 1000
const OWNER_MANUAL_TICK_COOLDOWN_MS = 5 * 60_000

export class LocationRoomNotFoundError extends Error {
  constructor(locationId: string) {
    super(`Location not found: ${locationId}`)
    this.name = 'LocationRoomNotFoundError'
  }
}

export class LocationRoomFeatureDisabledError extends Error {
  constructor() {
    super('Eliza location rooms are disabled')
    this.name = 'LocationRoomFeatureDisabledError'
  }
}

export class LocationRoomOfficialServiceDisabledError extends Error {
  constructor() {
    super('Official ElizaOS service is not configured')
    this.name = 'LocationRoomOfficialServiceDisabledError'
  }
}

export class LocationRoomForbiddenError extends Error {
  constructor() {
    super('Wallet does not own an eligible participant at this location')
    this.name = 'LocationRoomForbiddenError'
  }
}

export class LocationRoomInsufficientParticipantsError extends Error {
  constructor() {
    super('At least two eligible participants are required')
    this.name = 'LocationRoomInsufficientParticipantsError'
  }
}

export class LocationRoomManualCooldownError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Location room manual trigger is cooling down')
    this.name = 'LocationRoomManualCooldownError'
  }
}

export class LocationRoomTickDisabledError extends Error {
  constructor() {
    super('Location room ticks are disabled')
    this.name = 'LocationRoomTickDisabledError'
  }
}

function normalizePage(value: string | null): number {
  const page = value ? Number(value) : 1
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function normalizePageSize(value: string | null): number {
  const pageSize = value ? Number(value) : 20
  if (!Number.isInteger(pageSize)) return 20
  return Math.min(50, Math.max(1, pageSize))
}

function routeSafeError(error: unknown): string {
  const message = error instanceof Error && error.message.trim()
    ? error.message.trim()
    : 'Location room tick failed'
  return message.slice(0, MAX_STORED_ERROR_LENGTH)
}

function nextRetryAt(attempts: number, now: Date): string {
  const delayMinutes = Math.min(60, 5 * 2 ** Math.max(0, attempts - 1))
  return new Date(now.getTime() + delayMinutes * 60_000).toISOString()
}

function toPublicParticipant(participant: LocationRoomParticipant): PublicLocationRoomParticipant {
  return {
    tokenId: participant.tokenId,
    name: participant.name,
    imageUrl: participant.imageUrl,
  }
}

function toPublicMessage(message: LocationRoomMessage): PublicLocationRoomMessage {
  return {
    id: message.id,
    sequence: message.sequence,
    authorKind: message.authorKind,
    tokenId: message.tokenId,
    authorName: message.authorName,
    content: message.content,
    createdAt: message.createdAt,
  }
}

export function selectLocationRoomSpeaker(
  participants: LocationRoomParticipant[],
  recentMessages: LocationRoomMessage[]
): LocationRoomParticipant {
  if (participants.length === 0) {
    throw new Error('Cannot select a room speaker without participants')
  }

  const stats = new Map<number, { count: number; lastSequence: number }>()
  for (const participant of participants) {
    stats.set(participant.tokenId, { count: 0, lastSequence: -1 })
  }

  for (const message of recentMessages) {
    if (message.authorKind !== 'agent' || message.tokenId == null) continue
    const participantStats = stats.get(message.tokenId)
    if (!participantStats) continue
    participantStats.count += 1
    participantStats.lastSequence = Math.max(participantStats.lastSequence, message.sequence)
  }

  return [...participants].sort((a, b) => {
    const aStats = stats.get(a.tokenId) ?? { count: 0, lastSequence: -1 }
    const bStats = stats.get(b.tokenId) ?? { count: 0, lastSequence: -1 }

    if (aStats.count !== bStats.count) return aStats.count - bStats.count
    if (aStats.lastSequence !== bStats.lastSequence) return aStats.lastSequence - bStats.lastSequence
    return a.tokenId - b.tokenId
  })[0]
}

function normalizeWallet(value: string): string {
  return value.trim().toLowerCase()
}

function ensureLocationRoomFeatureEnabled(): void {
  if (!elizaConfig.locationRooms.enabled) {
    throw new LocationRoomFeatureDisabledError()
  }

  if (!elizaConfig.official.baseUrl) {
    throw new LocationRoomOfficialServiceDisabledError()
  }
}

export class LocationRoomService {
  constructor(
    private readonly repository: LocationRoomRepository = locationRoomRepository,
    private readonly membership: LocationRoomMembershipRepository = locationRoomMembershipRepository,
    private readonly turnGenerator: OfficialLocationRoomTurnGenerator = officialLocationRoomTurnGenerator
  ) {}

  async getPublicRoom(locationId: string, params: { page?: string | null; pageSize?: string | null } = {}): Promise<PublicLocationRoomRead> {
    const location = await this.repository.getLocation(locationId)
    if (!location) {
      throw new LocationRoomNotFoundError(locationId)
    }

    const room = await this.repository.ensureRoomForLocation(locationId)
    const participants = await this.membership.listEligibleParticipantsByLocation(locationId)
    const page = normalizePage(params.page ?? null)
    const pageSize = normalizePageSize(params.pageSize ?? null)
    const messages = await this.repository.listPublicMessages({ roomId: room.id, page, pageSize })

    return {
      room: {
        id: room.id,
        locationId: room.locationId,
        locationName: location.name,
        tickEnabled: room.tickEnabled,
        lastTickAt: room.lastTickAt,
        nextTickAt: room.nextTickAt,
        tickCount: room.tickCount,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
      participants: participants.map(toPublicParticipant),
      messages: messages.messages.map(toPublicMessage),
      pagination: {
        page: messages.page,
        pageSize: messages.pageSize,
        total: messages.total,
        hasMore: messages.hasMore,
      },
    }
  }

  async requestTick(locationId: string, input: RequestLocationRoomTickInput): Promise<RequestLocationRoomTickResult> {
    ensureLocationRoomFeatureEnabled()

    const location = await this.repository.getLocation(locationId)
    if (!location) {
      throw new LocationRoomNotFoundError(locationId)
    }

    const room = await this.repository.ensureRoomForLocation(locationId)
    if (!room.tickEnabled) {
      throw new LocationRoomTickDisabledError()
    }

    const participants = await this.membership.listEligibleParticipantsByLocation(locationId)
    if (participants.length < MIN_ELIGIBLE_PARTICIPANTS) {
      throw new LocationRoomInsufficientParticipantsError()
    }

    const normalizedWallet = normalizeWallet(input.walletAddress)
    const ownedParticipant = participants.find((participant) =>
      participantBelongsToWallet(participant, normalizedWallet)
    )

    if (input.actor === 'owner' && !ownedParticipant) {
      throw new LocationRoomForbiddenError()
    }

    if (input.actor === 'owner') {
      const now = input.now ?? new Date()
      const since = new Date(now.getTime() - OWNER_MANUAL_TICK_COOLDOWN_MS)
      const recentTick = await this.repository.findRecentCompletedOwnerTick({
        roomId: room.id,
        walletAddress: normalizedWallet,
        since,
      })

      if (recentTick) {
        const elapsedMs = now.getTime() - new Date(recentTick.createdAt).getTime()
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((OWNER_MANUAL_TICK_COOLDOWN_MS - elapsedMs) / 1000)
        )
        throw new LocationRoomManualCooldownError(retryAfterSeconds)
      }
    }

    const triggerType = input.actor === 'admin' ? 'admin' : 'owner'
    const requestedByTokenId = input.actor === 'owner'
      ? ownedParticipant?.tokenId ?? null
      : null
    const result = await this.repository.enqueueTick({
      room,
      triggerType,
      requestedByWallet: normalizedWallet,
      requestedByTokenId,
    })

    return {
      roomId: room.id,
      locationId: room.locationId,
      tickId: result.tick?.id ?? null,
      triggerType,
      deduped: result.deduped,
      requestedByTokenId,
      participantCount: participants.length,
    }
  }

  async enqueueDueScheduledTicks(now = new Date()): Promise<EnqueueScheduledTicksResult> {
    ensureLocationRoomFeatureEnabled()

    const activeLocationIds = await this.membership.listEligibleLocationIds(MIN_ELIGIBLE_PARTICIPANTS)
    for (const locationId of activeLocationIds) {
      const location = await this.repository.getLocation(locationId)
      if (location) {
        await this.repository.ensureRoomForLocation(locationId)
      }
    }

    const dueRooms = await this.repository.listDueRooms(
      now,
      Math.max(elizaConfig.locationRooms.maxTicksPerRun, activeLocationIds.length, 1)
    )

    let enqueued = 0
    let deduped = 0
    for (const room of dueRooms) {
      const result = await this.repository.enqueueTick({ room, triggerType: 'scheduled' })
      if (result.deduped) deduped += 1
      else enqueued += 1
    }

    return {
      roomsChecked: dueRooms.length,
      enqueued,
      deduped,
    }
  }

  async processDueTicks(limit = elizaConfig.locationRooms.maxTicksPerRun, now = new Date()): Promise<ProcessLocationRoomTickResult[]> {
    ensureLocationRoomFeatureEnabled()

    const workerId = `location-room-worker-${randomUUID()}`
    const ticks = await this.repository.claimDueTicks(limit, workerId, now)
    const results: ProcessLocationRoomTickResult[] = []

    for (const tick of ticks) {
      results.push(await this.processClaimedTick(tick, now))
    }

    return results
  }

  async runScheduledWorker(now = new Date()): Promise<LocationRoomWorkerResult> {
    ensureLocationRoomFeatureEnabled()

    const enqueueResult = await this.enqueueDueScheduledTicks(now)
    const results = await this.processDueTicks(elizaConfig.locationRooms.maxTicksPerRun, now)

    return {
      enabled: true,
      enqueued: enqueueResult.enqueued,
      deduped: enqueueResult.deduped,
      processed: results.length,
      completed: results.filter((result) => result.status === 'completed').length,
      skipped: results.filter((result) => result.status === 'skipped').length,
      failed: results.filter((result) => result.status === 'failed').length,
      dead: results.filter((result) => result.status === 'dead').length,
      results,
    }
  }

  private async processClaimedTick(tick: LocationRoomTick, now: Date): Promise<ProcessLocationRoomTickResult> {
    try {
      return await this.processClaimedTickUnsafe(tick, now)
    } catch (error) {
      const storedError = routeSafeError(error)
      const selectedTokenId = tick.selectedTokenId

      if (tick.attempts >= MAX_TICK_ATTEMPTS) {
        await this.repository.markTickDead(tick.id, storedError).catch(() => null)
        return {
          tickId: tick.id,
          status: 'dead',
          selectedTokenId,
          reason: 'attempts_exhausted',
        }
      }

      await this.repository.markTickFailed(tick.id, storedError, nextRetryAt(tick.attempts, now)).catch(() => null)
      return {
        tickId: tick.id,
        status: 'failed',
        selectedTokenId,
        reason: 'retry_scheduled',
      }
    }
  }

  private async processClaimedTickUnsafe(tick: LocationRoomTick, now: Date): Promise<ProcessLocationRoomTickResult> {
    const room = await this.repository.findRoomById(tick.roomId)
    if (!room) {
      await this.repository.markTickDead(tick.id, 'Location room no longer exists')
      return {
        tickId: tick.id,
        status: 'dead',
        selectedTokenId: null,
        reason: 'room_missing',
      }
    }

    const participants = await this.membership.listEligibleParticipantsByLocation(room.locationId)
    if (participants.length < MIN_ELIGIBLE_PARTICIPANTS) {
      await this.repository.markTickSkipped(tick.id, 'Fewer than two eligible participants')
      await this.repository.updateRoomAfterProcessedTick(room, {
        tickIntervalMinutes: elizaConfig.locationRooms.tickIntervalMinutes,
        now,
      })
      return {
        tickId: tick.id,
        status: 'skipped',
        selectedTokenId: null,
        reason: 'insufficient_participants',
      }
    }

    const recentMessages = await this.repository.listRecentPublicMessages(
      room.id,
      elizaConfig.locationRooms.transcriptWindow
    )
    const speaker = selectLocationRoomSpeaker(participants, recentMessages)
    await this.repository.markTickSelected(tick.id, speaker.tokenId)

    let appendedMessageId: string | null = null

    try {
      const generated = await this.turnGenerator.generateTurn({
        room,
        speaker,
        participants,
        recentMessages,
      })
      const content = normalizeLocationRoomGeneratedContent(generated.content)

      if (!content) {
        const error = 'Official ElizaOS generated an empty location-room turn'
        await this.repository.markTickDead(tick.id, error)
        await this.repository.recordRoomError(room.id, error)
        return {
          tickId: tick.id,
          status: 'dead',
          selectedTokenId: speaker.tokenId,
          reason: 'empty_generation',
        }
      }

      const message = await this.repository.appendMessage({
        roomId: room.id,
        locationId: room.locationId,
        tickId: tick.id,
        authorKind: 'agent',
        tokenId: speaker.tokenId,
        officialAgentId: generated.officialAgentId,
        authorName: speaker.name,
        content,
        visibility: 'public',
        metadata: {
          source: 'scheduled-location-room-tick',
          triggerType: tick.triggerType,
        },
      })
      appendedMessageId = message.id
      await this.repository.markTickCompleted(tick.id)
      await this.repository.updateRoomAfterProcessedTick(room, {
        tickIntervalMinutes: elizaConfig.locationRooms.tickIntervalMinutes,
        now,
      })

      return {
        tickId: tick.id,
        status: 'completed',
        selectedTokenId: speaker.tokenId,
        messageId: message.id,
      }
    } catch (error) {
      const storedError = routeSafeError(error)
      await this.repository.recordRoomError(room.id, storedError).catch(() => null)

      if (appendedMessageId) {
        await this.repository.markTickCompleted(tick.id).catch(() => null)
        await this.repository.updateRoomAfterProcessedTick(room, {
          tickIntervalMinutes: elizaConfig.locationRooms.tickIntervalMinutes,
          now,
        }).catch(() => null)
        return {
          tickId: tick.id,
          status: 'completed',
          selectedTokenId: speaker.tokenId,
          messageId: appendedMessageId,
          reason: 'message_appended_before_completion_error',
        }
      }

      if (tick.attempts >= MAX_TICK_ATTEMPTS) {
        await this.repository.markTickDead(tick.id, storedError)
        return {
          tickId: tick.id,
          status: 'dead',
          selectedTokenId: speaker.tokenId,
          reason: 'attempts_exhausted',
        }
      }

      await this.repository.markTickFailed(tick.id, storedError, nextRetryAt(tick.attempts, now))
      return {
        tickId: tick.id,
        status: 'failed',
        selectedTokenId: speaker.tokenId,
        reason: 'retry_scheduled',
      }
    }
  }
}

export const locationRoomService = new LocationRoomService()
