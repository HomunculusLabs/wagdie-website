/**
 * Discord Notification System Types
 * Shared types for outbox, embeds, and notifier
 */

// =============================================================================
// Event Types
// =============================================================================

export type DiscordEventType =
  | 'transfer'
  | 'burn'
  | 'travel'
  | 'sear'
  | 'concord_transfer'

export type IndexerSource = 'backfill' | 'live'

export type DiscordOutboxStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'failed'
  | 'dead'

// =============================================================================
// Event Payloads (per event type)
// =============================================================================

export interface TransferPayload {
  from: string
  to: string
  isMint: boolean
}

export interface BurnPayload {
  locationId: number
  ownerAddress: string | null
}

export interface TravelPayload {
  oldLocationId: number
  newLocationId: number
  ownerAddress: string | null
}

export interface SearPayload {
  concordId: number
  owner: string | null
}

export interface ConcordTransferPayload {
  from: string
  to: string
  amount: number
  operator: string
  isMint: boolean
  isBurn: boolean
}

export type EventPayload =
  | TransferPayload
  | BurnPayload
  | TravelPayload
  | SearPayload
  | ConcordTransferPayload

// =============================================================================
// Outbox Row
// =============================================================================

export interface DiscordOutboxRow<TPayload = Record<string, unknown>> {
  id: string
  event_type: DiscordEventType
  source: IndexerSource
  chain_id: number
  token_id: number
  transaction_hash: string
  log_index: number
  block_number: number | null
  payload: TPayload
  status: DiscordOutboxStatus
  attempts: number
  next_attempt_at: string
  locked_at: string | null
  locked_by: string | null
  last_error: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}

// =============================================================================
// Webhook Configuration
// =============================================================================

export interface WebhookMap {
  transfer: string
  burn: string
  travel: string
  sear: string
  concord_transfer: string
}

export interface NotifierConfig {
  webhooks: WebhookMap
  webhookUsername?: string
  webhookAvatarUrl?: string
  pollIntervalMs: number
  batchSize: number
  maxAttempts: number
  lockTtlMs: number
  publicAssetBaseUrl: string
}

// =============================================================================
// Discord API Types
// =============================================================================

export interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface DiscordEmbedThumbnail {
  url: string
}

export interface DiscordEmbedFooter {
  text: string
  icon_url?: string
}

export interface DiscordEmbed {
  title: string
  url?: string
  description?: string
  color: number
  thumbnail?: DiscordEmbedThumbnail
  fields?: DiscordEmbedField[]
  footer?: DiscordEmbedFooter
  timestamp?: string
}

export interface DiscordWebhookPayload {
  username?: string
  avatar_url?: string
  content?: string
  embeds: DiscordEmbed[]
}

// =============================================================================
// Context Types (for enriching events)
// =============================================================================

export interface CharacterContext {
  tokenId: number
  name: string | null
  imageUrl: string | null
  ownerAddress: string | null
}

export interface LocationContext {
  id: number
  name: string
}

export interface EventContext {
  character?: CharacterContext
  fromLocation?: LocationContext
  toLocation?: LocationContext
  explorerTxUrl: string
}

// =============================================================================
// Indexer Context (passed from indexers to handlers)
// =============================================================================

export interface IndexerContext {
  source: IndexerSource
  chainId: number
}
