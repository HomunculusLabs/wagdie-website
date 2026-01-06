// Searing Event Handler
// Processes SearConcords events from the Searing contract

import { decodeEventLog, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'
import { enqueueSear } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'

export interface SearingHandleResult {
  highestBlock: bigint | null
  processed: number
}

// Default context for backwards compatibility
const DEFAULT_CONTEXT: IndexerContext = { source: 'backfill', chainId: 1 }

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://kong:8000'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof createClient> | null = null

function getAdminClient(): ReturnType<typeof createClient> {
  if (!adminClient) {
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }
    log(`Connecting to Supabase: ${supabaseUrl}`)
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return adminClient
}

// ConcordSeared event ABI
// All parameters are in the data field (not indexed)
// event ConcordSeared(uint16 wagdieId, uint16 tokenId, address owner)
const concordSearedEventAbi = {
  type: 'event',
  name: 'ConcordSeared',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'tokenId', type: 'uint16' },
    { indexed: false, name: 'owner', type: 'address' },
  ],
  anonymous: false,
} as const

type ConcordSearedArgs = {
  wagdieId: number
  tokenId: number
  owner: `0x${string}`
}

function normalizeAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.toLowerCase()
}

function normalizeTokenId(value: unknown): number | null {
  if (typeof value === 'bigint') {
    const num = Number(value)
    return Number.isSafeInteger(num) ? num : null
  }
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) ? value : null
  }
  return null
}

function getBlockNumber(log: Log): bigint | null {
  return typeof log.blockNumber === 'bigint' ? log.blockNumber : null
}

function getLogIndex(log: Log): number {
  return typeof log.logIndex === 'number' ? log.logIndex : 0
}

function compareLogs(a: Log, b: Log): number {
  const aBlock = getBlockNumber(a) ?? 0n
  const bBlock = getBlockNumber(b) ?? 0n
  if (aBlock < bBlock) return -1
  if (aBlock > bBlock) return 1
  return getLogIndex(a) - getLogIndex(b)
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [searing-handler] ${message}`)
}

async function insertSearingEvent(params: {
  tokenId: number
  concordId: number
  eventType: 'sear' | 'tame'
  transactionHash: string
  blockNumber: bigint
  logIndex: number
  actorAddress: string | null
  eventTimestamp?: Date
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

  const { error } = await client.from('searing_events').upsert(
    {
      token_id: params.tokenId,
      concord_id: params.concordId,
      event_type: params.eventType,
      transaction_hash: params.transactionHash,
      block_number: Number(params.blockNumber),
      log_index: params.logIndex,
      actor_address: params.actorAddress,
      event_timestamp: params.eventTimestamp?.toISOString() ?? null,
      metadata: params.metadata ?? {},
    },
    { onConflict: 'transaction_hash,log_index' }
  )

  if (error) {
    log(`Failed to insert event: ${JSON.stringify(error)}`)
    return false
  }

  return true
}

/**
 * Handle SearConcords events from the Searing contract
 */
export async function handleSearConcordsLogs(
  logs: Log[],
  ctx: IndexerContext = DEFAULT_CONTEXT
): Promise<SearingHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null
  let processed = 0

  for (const logEntry of ordered) {
    let decoded: { eventName: string; args: unknown }
    try {
      decoded = decodeEventLog({
        abi: [concordSearedEventAbi],
        data: logEntry.data,
        topics: logEntry.topics,
      })
    } catch {
      continue
    }

    if (decoded.eventName !== 'ConcordSeared') continue

    const args = decoded.args as ConcordSearedArgs
    const tokenId = normalizeTokenId(args.wagdieId)
    const concordId = normalizeTokenId(args.tokenId)
    const sender = normalizeAddress(args.owner)

    if (tokenId === null || concordId === null) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    const inserted = await insertSearingEvent({
      tokenId,
      concordId,
      eventType: 'sear',
      transactionHash: logEntry.transactionHash!,
      blockNumber: blockNumber!,
      logIndex,
      actorAddress: sender,
      metadata: {
        sender,
        wagdieId: tokenId,
        concordId,
      },
    })

    if (!inserted) continue

    processed += 1
    log(`Sear: token ${tokenId} + concord ${concordId} by ${sender} at block ${blockNumber}`)

    // Enqueue Discord notification for searing
    if (logEntry.transactionHash) {
      await enqueueSear(ctx, tokenId, logEntry.transactionHash, logIndex, blockNumber, {
        concordId,
        owner: sender,
      })
    }

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  return { highestBlock, processed }
}
