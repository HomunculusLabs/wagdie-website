/**
 * Discord Outbox Helper
 * Enqueues events to the discord_outbox table for notification processing
 */

import { createClient } from '@supabase/supabase-js'
import type {
  DiscordEventType,
  IndexerSource,
  EventPayload,
} from './types'

// =============================================================================
// Configuration
// =============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://kong:8000'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof createClient> | null = null

function getAdminClient(): ReturnType<typeof createClient> {
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for discord outbox')
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
  console.log(`[discord-outbox] [${timestamp}] ${message}`)
}

// =============================================================================
// Enqueue Parameters
// =============================================================================

export interface EnqueueParams<TPayload extends EventPayload = EventPayload> {
  type: DiscordEventType
  source: IndexerSource
  chainId: number
  tokenId: number
  txHash: string
  logIndex: number
  blockNumber?: bigint | number | null
  payload: TPayload
}

// =============================================================================
// Main Enqueue Function
// =============================================================================

/**
 * Enqueue a Discord notification event
 * Only enqueues live events - backfill events are skipped
 */
export async function enqueueDiscordEvent<TPayload extends EventPayload>(
  params: EnqueueParams<TPayload>
): Promise<boolean> {
  // Skip backfill events - we only notify on live events
  if (params.source !== 'live') {
    return false
  }

  const client = getAdminClient()

  const blockNumber =
    params.blockNumber != null
      ? typeof params.blockNumber === 'bigint'
        ? Number(params.blockNumber)
        : params.blockNumber
      : null

  const { error } = await client.from('discord_outbox').upsert(
    {
      event_type: params.type,
      source: params.source,
      chain_id: params.chainId,
      token_id: params.tokenId,
      transaction_hash: params.txHash,
      log_index: params.logIndex,
      block_number: blockNumber,
      payload: params.payload,
      status: 'pending',
      attempts: 0,
      next_attempt_at: new Date().toISOString(),
    },
    {
      onConflict: 'event_type,transaction_hash,log_index,token_id',
      ignoreDuplicates: true,
    }
  )

  if (error) {
    // Log but don't throw - we don't want to break the indexer
    log(`Failed to enqueue ${params.type} event: ${error.message}`)
    return false
  }

  log(
    `Enqueued ${params.type} event for token ${params.tokenId} (tx: ${params.txHash.slice(0, 10)}...)`
  )
  return true
}

// =============================================================================
// Type-Safe Enqueue Helpers
// =============================================================================

import type {
  TransferPayload,
  BurnPayload,
  TravelPayload,
  SearPayload,
  ConcordTransferPayload,
  IndexerContext,
} from './types'

/**
 * Enqueue a transfer event
 */
export async function enqueueTransfer(
  ctx: IndexerContext,
  tokenId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint | null,
  payload: TransferPayload
): Promise<boolean> {
  return enqueueDiscordEvent({
    type: 'transfer',
    source: ctx.source,
    chainId: ctx.chainId,
    tokenId,
    txHash,
    logIndex,
    blockNumber,
    payload,
  })
}

/**
 * Enqueue a burn event
 */
export async function enqueueBurn(
  ctx: IndexerContext,
  tokenId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint | null,
  payload: BurnPayload
): Promise<boolean> {
  return enqueueDiscordEvent({
    type: 'burn',
    source: ctx.source,
    chainId: ctx.chainId,
    tokenId,
    txHash,
    logIndex,
    blockNumber,
    payload,
  })
}

/**
 * Enqueue a travel/location change event
 */
export async function enqueueTravel(
  ctx: IndexerContext,
  tokenId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint | null,
  payload: TravelPayload
): Promise<boolean> {
  return enqueueDiscordEvent({
    type: 'travel',
    source: ctx.source,
    chainId: ctx.chainId,
    tokenId,
    txHash,
    logIndex,
    blockNumber,
    payload,
  })
}

/**
 * Enqueue a searing event
 */
export async function enqueueSear(
  ctx: IndexerContext,
  tokenId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint | null,
  payload: SearPayload
): Promise<boolean> {
  return enqueueDiscordEvent({
    type: 'sear',
    source: ctx.source,
    chainId: ctx.chainId,
    tokenId,
    txHash,
    logIndex,
    blockNumber,
    payload,
  })
}

/**
 * Enqueue a concord transfer event
 */
export async function enqueueConcordTransfer(
  ctx: IndexerContext,
  tokenId: number,
  txHash: string,
  logIndex: number,
  blockNumber: bigint | null,
  payload: ConcordTransferPayload
): Promise<boolean> {
  return enqueueDiscordEvent({
    type: 'concord_transfer',
    source: ctx.source,
    chainId: ctx.chainId,
    tokenId,
    txHash,
    logIndex,
    blockNumber,
    payload,
  })
}
