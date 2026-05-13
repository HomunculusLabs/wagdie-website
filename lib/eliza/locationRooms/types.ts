export type LocationRoomTriggerType = 'scheduled' | 'owner' | 'admin'
export type LocationRoomTickStatus = 'pending' | 'processing' | 'completed' | 'skipped' | 'failed' | 'dead'
export type LocationRoomMessageVisibility = 'public' | 'internal'
export type LocationRoomAuthorKind = 'agent' | 'system' | 'wallet' | 'admin' | 'scheduler'

export type LocationRoom = {
  id: string
  locationId: string
  officialRoomId: string
  officialWorldId: string
  officialUserId: string
  channelId: string
  tickEnabled: boolean
  lastTickAt: string | null
  nextTickAt: string | null
  tickCount: number
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type LocationRoomMessage = {
  id: string
  roomId: string
  locationId: string
  tickId: string | null
  sequence: number
  visibility: LocationRoomMessageVisibility
  authorKind: LocationRoomAuthorKind
  tokenId: number | null
  officialAgentId: string | null
  authorName: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type LocationRoomTick = {
  id: string
  roomId: string
  locationId: string
  triggerType: LocationRoomTriggerType
  requestedByWallet: string | null
  requestedByTokenId: number | null
  status: LocationRoomTickStatus
  attempts: number
  nextAttemptAt: string
  lockedAt: string | null
  lockedBy: string | null
  selectedTokenId: number | null
  startedAt: string | null
  completedAt: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type LocationRoomLocation = {
  id: string
  name: string
}

export type LocationRoomParticipant = {
  tokenId: number
  name: string
  imageUrl: string | null
  backgroundStory: string | null
  ownerAddress: string | null
  stakerAddress: string | null
  locationId: string
}

export type PublicLocationRoomParticipant = {
  tokenId: number
  name: string
  imageUrl: string | null
}

export type PublicLocationRoomMessage = {
  id: string
  sequence: number
  authorKind: LocationRoomAuthorKind
  tokenId: number | null
  authorName: string
  content: string
  createdAt: string
}

export type PublicLocationRoomSummary = {
  id: string
  locationId: string
  locationName: string
  tickEnabled: boolean
  lastTickAt: string | null
  nextTickAt: string | null
  tickCount: number
  createdAt: string
  updatedAt: string
}

export type PublicLocationRoomRead = {
  room: PublicLocationRoomSummary
  participants: PublicLocationRoomParticipant[]
  messages: PublicLocationRoomMessage[]
  pagination: {
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
}

export type PaginatedLocationRoomMessages = {
  messages: LocationRoomMessage[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type EnqueueScheduledTicksResult = {
  roomsChecked: number
  enqueued: number
  deduped: number
}

export type ProcessLocationRoomTickResult = {
  tickId: string
  status: Extract<LocationRoomTickStatus, 'completed' | 'skipped' | 'failed' | 'dead'>
  selectedTokenId: number | null
  messageId?: string
  reason?: string
}

export type LocationRoomWorkerResult = {
  enabled: boolean
  enqueued: number
  deduped: number
  processed: number
  completed: number
  skipped: number
  failed: number
  dead: number
  results: ProcessLocationRoomTickResult[]
}

export type RequestLocationRoomTickActor = 'owner' | 'admin'

export type RequestLocationRoomTickInput = {
  actor: RequestLocationRoomTickActor
  walletAddress: string
  now?: Date
}

export type RequestLocationRoomTickResult = {
  roomId: string
  locationId: string
  tickId: string | null
  triggerType: Extract<LocationRoomTriggerType, 'owner' | 'admin'>
  deduped: boolean
  requestedByTokenId: number | null
  participantCount: number
}

export type GenerateOfficialLocationRoomTurnInput = {
  room: LocationRoom
  speaker: LocationRoomParticipant
  participants: LocationRoomParticipant[]
  recentMessages: LocationRoomMessage[]
}

export type GenerateOfficialLocationRoomTurnResult = {
  officialAgentId: string
  content: string
}
