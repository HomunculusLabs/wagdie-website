// Searing Event Handler
// Processes SearConcords events from the Searing contract

import { decodeEventLog, type Log } from 'viem'
import { enqueueSear } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'
import { batchUpsert } from './utils/batch-upsert'

export interface SearingHandleResult {
  highestBlock: bigint | null
  processed: number
}

// Default context for backwards compatibility
const DEFAULT_CONTEXT: IndexerContext = { source: 'backfill', chainId: 1 }

// Record type for batch upsert
interface SearingRecord extends Record<string, unknown> {
  token_id: number
  concord_id: number
  event_type: 'sear' | 'tame'
  transaction_hash: string
  block_number: number
  log_index: number
  actor_address: string | null
  event_timestamp: string | null
  metadata: Record<string, unknown>
}

// Pending notification for Discord queue
interface PendingNotification {
  tokenId: number
  transactionHash: string
  logIndex: number
  blockNumber: bigint
  concordId: number
  owner: string | null
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

type ConcordSearedAbiArgs = {
  wagdieId: number | bigint
  /** ABI field name from ConcordSeared; domain name is concordId. */
  tokenId: number | bigint
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

function normalizeConcordIdFromAbiTokenId(value: unknown): number | null {
  return normalizeTokenId(value)
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

/**
 * Handle SearConcords events from the Searing contract
 * Uses batch upsert for efficient bulk database writes
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

  // Collect all records for batch upsert
  const records: SearingRecord[] = []
  const notifications: PendingNotification[] = []

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

    const args = decoded.args as ConcordSearedAbiArgs
    const tokenId = normalizeTokenId(args.wagdieId)
    const concordId = normalizeConcordIdFromAbiTokenId(args.tokenId)
    const sender = normalizeAddress(args.owner)

    if (tokenId === null || concordId === null) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    if (!logEntry.transactionHash || logEntry.blockNumber === undefined || blockNumber === null) {
      console.warn('[searing-handler] Skipping log with missing tx data')
      continue
    }

    records.push({
      token_id: tokenId,
      concord_id: concordId,
      event_type: 'sear',
      transaction_hash: logEntry.transactionHash,
      block_number: Number(blockNumber),
      log_index: logIndex,
      actor_address: sender,
      event_timestamp: null,
      metadata: {
        sender,
        wagdieId: tokenId,
        concordId,
        abiTokenId: concordId,
      },
    })

    notifications.push({
      tokenId,
      transactionHash: logEntry.transactionHash,
      logIndex,
      blockNumber,
      concordId,
      owner: sender,
    })

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  // Batch upsert all records
  let processed = 0
  if (records.length > 0) {
    const result = await batchUpsert('searing_events', records, {
      onConflict: 'transaction_hash,log_index',
    })
    processed = result.totalInserted

    // Log summary for backfill
    if (records.length > 10) {
      log(`Processed ${processed} searing events in ${result.batchCount} batches`)
    } else {
      // Detailed logging for small batches / live events
      for (const record of records) {
        log(`Sear: token ${record.token_id} + concord ${record.concord_id} by ${record.actor_address}`)
      }
    }

    // Enqueue Discord notifications after successful insert
    for (const notif of notifications) {
      await enqueueSear(ctx, notif.tokenId, notif.transactionHash, notif.logIndex, notif.blockNumber, {
        concordId: notif.concordId,
        owner: notif.owner,
      })
    }
  }

  return { highestBlock, processed }
}
