import { decodeEventLog, type Log } from 'viem'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { enqueueTransfer } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'

export interface TransferHandleResult {
  highestBlock: bigint | null
  processed: number
}

// Default context for backwards compatibility
const DEFAULT_CONTEXT: IndexerContext = { source: 'backfill', chainId: 1 }

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Create admin Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wagdie-api.runiverse.ai'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (!adminClient) {
    if (!serviceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
    }
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return adminClient
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [event-handler] ${message}`)
}

// Minimal Transfer event ABI for decoding
const transferEventAbi = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: true, name: 'tokenId', type: 'uint256' },
  ],
  anonymous: false,
} as const

type TransferArgs = {
  from: string
  to: string
  tokenId: bigint
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

// Pending notification for Discord queue
interface PendingNotification {
  tokenId: number
  transactionHash: string
  logIndex: number
  blockNumber: bigint | null
  from: string
  to: string
  isMint: boolean
}

/**
 * Batch update ownership for multiple tokens
 * Uses a single query per batch for efficiency
 */
async function batchUpdateOwnership(
  updates: Map<number, string | null>
): Promise<{ success: number; failed: number }> {
  if (updates.size === 0) {
    return { success: 0, failed: 0 }
  }

  const client = getAdminClient()
  let success = 0
  let failed = 0

  // Process updates in batches of 100
  const entries = Array.from(updates.entries())
  const batchSize = 100

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize)
    const startTime = Date.now()

    // Use individual updates for now since Supabase doesn't support
    // batch update with different values per row easily
    // This is still faster than waiting for each one serially
    const promises = batch.map(async ([tokenId, ownerAddress]) => {
      const { error } = await client
        .from('wagdie_characters')
        .update({ owner_address: ownerAddress })
        .eq('token_id', tokenId)

      if (error) {
        console.error(`Failed to update token ${tokenId}:`, error.message)
        return false
      }
      return true
    })

    const results = await Promise.all(promises)
    const batchSuccess = results.filter(Boolean).length
    const batchFailed = results.length - batchSuccess
    success += batchSuccess
    failed += batchFailed

    const duration = Date.now() - startTime
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(entries.length / batchSize)
    log(`Batch ${batchNum}/${totalBatches}: ${batchSuccess} updates in ${duration}ms`)
  }

  return { success, failed }
}

export async function handleTransferLogs(
  logs: Log[],
  ctx: IndexerContext = DEFAULT_CONTEXT
): Promise<TransferHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null

  // Collect final ownership state per token (last transfer wins)
  const ownershipUpdates = new Map<number, string | null>()
  const notifications: PendingNotification[] = []

  for (const logEntry of ordered) {
    let decoded: { eventName: string; args: unknown }
    try {
      decoded = decodeEventLog({
        abi: [transferEventAbi],
        data: logEntry.data,
        topics: logEntry.topics,
      })
    } catch {
      continue
    }

    if (decoded.eventName !== 'Transfer') continue

    const args = decoded.args as TransferArgs
    const tokenId = normalizeTokenId(args.tokenId)
    const from = normalizeAddress(args.from)
    const to = normalizeAddress(args.to)

    if (tokenId === null || !from || !to) continue

    const ownerAddress = to === ZERO_ADDRESS ? null : to

    // Store final ownership (last transfer for each token)
    ownershipUpdates.set(tokenId, ownerAddress)

    const blockNumber = getBlockNumber(logEntry)
    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }

    // Collect notification for non-burn transfers
    if (to !== ZERO_ADDRESS && logEntry.transactionHash) {
      notifications.push({
        tokenId,
        transactionHash: logEntry.transactionHash,
        logIndex: getLogIndex(logEntry),
        blockNumber,
        from,
        to,
        isMint: from === ZERO_ADDRESS,
      })
    }
  }

  // Batch update all ownership changes
  const { success: processed } = await batchUpdateOwnership(ownershipUpdates)

  // Log summary for backfill
  if (ownershipUpdates.size > 10) {
    log(`Processed ${processed} ownership updates`)
  }

  // Enqueue Discord notifications after successful updates
  for (const notif of notifications) {
    await enqueueTransfer(ctx, notif.tokenId, notif.transactionHash, notif.logIndex, notif.blockNumber, {
      from: notif.from,
      to: notif.to,
      isMint: notif.isMint,
    })
  }

  return { highestBlock, processed }
}
