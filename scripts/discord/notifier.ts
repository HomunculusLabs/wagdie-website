/**
 * Discord Notifier Worker
 * Polls the discord_outbox table and sends notifications to Discord webhooks
 */

import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'
import type {
  DiscordOutboxRow,
  DiscordEventType,
  NotifierConfig,
  WebhookMap,
  EventContext,
  CharacterContext,
  LocationContext,
  TravelPayload,
  BurnPayload,
} from './types'
import { buildWebhookPayload } from './embeds'
import { getExplorerTxUrl } from '../../lib/contracts/chains'
import { getPublicCharacterImageUrl } from '../../lib/utils/image'

// =============================================================================
// Configuration
// =============================================================================

const NOTIFIER_NAME = 'discord-notifier'
const WORKER_ID = `${NOTIFIER_NAME}-${uuidv4().slice(0, 8)}`

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://kong:8000'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof createClient> | null = null

function getAdminClient(): ReturnType<typeof createClient> {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return adminClient
}

// =============================================================================
// Logging
// =============================================================================

function log(message: string): void {
  const timestamp = new Date().toISOString()
  console.log(`[${NOTIFIER_NAME}] [${timestamp}] ${message}`)
}

function logError(message: string, error?: unknown): void {
  const timestamp = new Date().toISOString()
  const errorMsg = error instanceof Error ? error.message : String(error)
  console.error(`[${NOTIFIER_NAME}] [${timestamp}] ERROR: ${message}`, errorMsg)
}

// =============================================================================
// Configuration Loader
// =============================================================================

function loadConfig(): NotifierConfig {
  // Try JSON config first
  const webhooksJson = process.env.DISCORD_WEBHOOKS_JSON
  let webhooks: WebhookMap

  if (webhooksJson) {
    try {
      webhooks = JSON.parse(webhooksJson) as WebhookMap
    } catch (e) {
      throw new Error(`Invalid DISCORD_WEBHOOKS_JSON: ${e}`)
    }
  } else {
    // Fall back to individual env vars
    webhooks = {
      transfer: process.env.DISCORD_WEBHOOK_TRANSFERS || '',
      burn: process.env.DISCORD_WEBHOOK_BURNS || '',
      travel: process.env.DISCORD_WEBHOOK_TRAVEL || '',
      sear: process.env.DISCORD_WEBHOOK_SEARING || '',
      concord_transfer: process.env.DISCORD_WEBHOOK_CONCORD_TRANSFERS || '',
    }
  }

  // Validate at least one webhook is configured
  const hasWebhook = Object.values(webhooks).some((url) => url.length > 0)
  if (!hasWebhook) {
    throw new Error(
      'No Discord webhooks configured. Set DISCORD_WEBHOOKS_JSON or individual DISCORD_WEBHOOK_* env vars.'
    )
  }

  const publicAssetBaseUrl =
    process.env.PUBLIC_ASSET_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || ''

  if (!publicAssetBaseUrl) {
    log('WARNING: PUBLIC_ASSET_BASE_URL not set - character images will not appear in embeds')
  }

  return {
    webhooks,
    webhookUsername: process.env.DISCORD_WEBHOOK_USERNAME || 'WAGDIE Events',
    webhookAvatarUrl: process.env.DISCORD_WEBHOOK_AVATAR_URL,
    pollIntervalMs: parseInt(process.env.DISCORD_OUTBOX_POLL_MS || '2000', 10),
    batchSize: parseInt(process.env.DISCORD_OUTBOX_BATCH_SIZE || '25', 10),
    maxAttempts: parseInt(process.env.DISCORD_OUTBOX_MAX_ATTEMPTS || '8', 10),
    lockTtlMs: parseInt(process.env.DISCORD_OUTBOX_LOCK_TTL_MS || '300000', 10),
    publicAssetBaseUrl,
  }
}

// =============================================================================
// Outbox Operations
// =============================================================================

/**
 * Claim pending events from the outbox
 */
async function claimPendingEvents(
  config: NotifierConfig
): Promise<DiscordOutboxRow[]> {
  const client = getAdminClient()
  const now = new Date().toISOString()

  // First, release stale locks
  const staleTime = new Date(Date.now() - config.lockTtlMs).toISOString()
  await client
    .from('discord_outbox')
    .update({
      status: 'pending',
      locked_at: null,
      locked_by: null,
    })
    .eq('status', 'processing')
    .lt('locked_at', staleTime)

  // Claim pending events
  const { data: events, error } = await client
    .from('discord_outbox')
    .update({
      status: 'processing',
      locked_at: now,
      locked_by: WORKER_ID,
      attempts: client.sql`attempts + 1`,
    })
    .eq('status', 'pending')
    .lte('next_attempt_at', now)
    .lt('attempts', config.maxAttempts)
    .order('created_at', { ascending: true })
    .limit(config.batchSize)
    .select()

  if (error) {
    logError('Failed to claim events', error)
    return []
  }

  return (events || []) as DiscordOutboxRow[]
}

/**
 * Mark an event as sent
 */
async function markSent(eventId: string): Promise<void> {
  const client = getAdminClient()
  const { error } = await client
    .from('discord_outbox')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
    })
    .eq('id', eventId)

  if (error) {
    logError(`Failed to mark event ${eventId} as sent`, error)
  }
}

/**
 * Mark an event as failed with backoff
 */
async function markFailed(
  eventId: string,
  error: string,
  attempts: number,
  config: NotifierConfig
): Promise<void> {
  const client = getAdminClient()

  // Exponential backoff: 2^attempts * 1000ms, capped at 15 minutes
  const backoffMs = Math.min(Math.pow(2, attempts) * 1000, 15 * 60 * 1000)
  const nextAttemptAt = new Date(Date.now() + backoffMs).toISOString()

  const status = attempts >= config.maxAttempts ? 'dead' : 'failed'

  const { error: updateError } = await client
    .from('discord_outbox')
    .update({
      status,
      last_error: error.slice(0, 1000),
      next_attempt_at: nextAttemptAt,
      locked_at: null,
      locked_by: null,
    })
    .eq('id', eventId)

  if (updateError) {
    logError(`Failed to mark event ${eventId} as failed`, updateError)
  }
}

// =============================================================================
// Context Resolution
// =============================================================================

/**
 * Fetch character context for an event
 */
async function fetchCharacterContext(
  tokenId: number,
  publicAssetBaseUrl: string
): Promise<CharacterContext | undefined> {
  const client = getAdminClient()

  const { data, error } = await client
    .from('wagdie_characters')
    .select('token_id, name, owner_address')
    .eq('token_id', tokenId)
    .single()

  if (error || !data) {
    return undefined
  }

  const imageUrl = getPublicCharacterImageUrl(tokenId, publicAssetBaseUrl)

  return {
    tokenId: data.token_id,
    name: data.name,
    imageUrl,
    ownerAddress: data.owner_address,
  }
}

/**
 * Fetch location context by chain location ID
 */
async function fetchLocationContext(
  locationId: number
): Promise<LocationContext | undefined> {
  const client = getAdminClient()

  // Try to find location by chain_location_id in metadata
  const { data, error } = await client
    .from('locations')
    .select('id, name, metadata')
    .or(`metadata->>chain_location_id.eq.${locationId},id.eq.${locationId}`)
    .limit(1)
    .single()

  if (error || !data) {
    return {
      id: locationId,
      name: `Location #${locationId}`,
    }
  }

  return {
    id: locationId,
    name: data.name || `Location #${locationId}`,
  }
}

/**
 * Build full event context
 */
async function resolveEventContext(
  event: DiscordOutboxRow,
  config: NotifierConfig
): Promise<EventContext> {
  const explorerTxUrl = getExplorerTxUrl(event.chain_id, event.transaction_hash)

  const context: EventContext = {
    explorerTxUrl,
  }

  // Fetch character for character-related events
  if (['transfer', 'burn', 'travel', 'sear'].includes(event.event_type)) {
    context.character = await fetchCharacterContext(
      event.token_id,
      config.publicAssetBaseUrl
    )
  }

  // Fetch locations for travel events
  if (event.event_type === 'travel') {
    const payload = event.payload as TravelPayload
    context.fromLocation = await fetchLocationContext(payload.oldLocationId)
    context.toLocation = await fetchLocationContext(payload.newLocationId)
  }

  // Fetch location for burn events
  if (event.event_type === 'burn') {
    const payload = event.payload as BurnPayload
    context.toLocation = await fetchLocationContext(payload.locationId)
  }

  return context
}

// =============================================================================
// Webhook Posting
// =============================================================================

interface WebhookResult {
  success: boolean
  error?: string
  retryAfter?: number
}

/**
 * Post a message to a Discord webhook
 */
async function postToWebhook(
  webhookUrl: string,
  payload: unknown
): Promise<WebhookResult> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok || response.status === 204) {
      return { success: true }
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get('Retry-After') || '5',
        10
      )
      return {
        success: false,
        error: 'Rate limited',
        retryAfter: retryAfter * 1000,
      }
    }

    const text = await response.text()
    return {
      success: false,
      error: `HTTP ${response.status}: ${text.slice(0, 200)}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// =============================================================================
// Event Processing
// =============================================================================

/**
 * Process a single event
 */
async function processEvent(
  event: DiscordOutboxRow,
  config: NotifierConfig
): Promise<void> {
  // Get the webhook URL for this event type
  const webhookUrl = config.webhooks[event.event_type as DiscordEventType]

  if (!webhookUrl) {
    log(`No webhook configured for ${event.event_type}, skipping event ${event.id}`)
    await markSent(event.id) // Mark as sent to avoid reprocessing
    return
  }

  try {
    // Resolve context
    const context = await resolveEventContext(event, config)

    // Build webhook payload
    const payload = buildWebhookPayload(event, context, config)

    // Post to Discord
    const result = await postToWebhook(webhookUrl, payload)

    if (result.success) {
      log(
        `Sent ${event.event_type} notification for token ${event.token_id} (tx: ${event.transaction_hash.slice(0, 10)}...)`
      )
      await markSent(event.id)
    } else {
      logError(
        `Failed to send ${event.event_type} for token ${event.token_id}`,
        result.error
      )
      await markFailed(event.id, result.error || 'Unknown error', event.attempts, config)
    }
  } catch (error) {
    logError(`Error processing event ${event.id}`, error)
    await markFailed(
      event.id,
      error instanceof Error ? error.message : String(error),
      event.attempts,
      config
    )
  }
}

// =============================================================================
// Main Loop
// =============================================================================

let shuttingDown = false

async function runLoop(config: NotifierConfig): Promise<void> {
  while (!shuttingDown) {
    try {
      const events = await claimPendingEvents(config)

      if (events.length > 0) {
        log(`Processing ${events.length} events`)

        for (const event of events) {
          if (shuttingDown) break
          await processEvent(event, config)
        }
      }
    } catch (error) {
      logError('Error in main loop', error)
    }

    // Wait before next poll
    if (!shuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, config.pollIntervalMs))
    }
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return
  shuttingDown = true

  log(`Received ${signal}, shutting down...`)

  // Give time for in-progress work to complete
  await new Promise((resolve) => setTimeout(resolve, 1000))

  log('Shutdown complete')
  process.exit(0)
}

async function main(): Promise<void> {
  log(`Starting ${NOTIFIER_NAME} (worker: ${WORKER_ID})`)

  // Load configuration
  const config = loadConfig()

  log(`Config: poll=${config.pollIntervalMs}ms, batch=${config.batchSize}, maxAttempts=${config.maxAttempts}`)

  // Log configured webhooks
  for (const [eventType, url] of Object.entries(config.webhooks)) {
    if (url) {
      log(`Webhook configured for ${eventType}: ${url.slice(0, 50)}...`)
    } else {
      log(`No webhook for ${eventType}`)
    }
  }

  // Setup signal handlers
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))

  // Start the main loop
  await runLoop(config)
}

// Run if executed directly
main().catch((error) => {
  logError('Fatal error', error)
  process.exit(1)
})
