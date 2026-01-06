// Infection Event Handler
// Processes InfectionSpread events and Mushroom burn events

import { decodeEventLog, parseAbiItem, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'
import { batchUpsert } from './utils/batch-upsert'

export interface InfectionHandleResult {
  highestBlock: bigint | null
  processed: number
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead'

// Supabase client - still needed for character status updates
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

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

// Record type for batch upsert
interface InfectionRecord extends Record<string, unknown> {
  token_id: number
  event_type: 'infection' | 'cure'
  transaction_hash: string
  block_number: number
  log_index: number
  actor_address: string | null
  amount: number | null
  event_timestamp: string | null
  metadata: Record<string, unknown>
}

// InfectionSpread event ABI
const infectionSpreadEventAbi = {
  type: 'event',
  name: 'InfectionSpread',
  inputs: [
    { indexed: true, name: 'sender', type: 'address' },
    { indexed: true, name: 'infectedToken', type: 'uint256' },
    { indexed: false, name: 'time', type: 'uint256' },
  ],
  anonymous: false,
} as const

// ERC1155 TransferSingle event
const transferSingleEventAbi = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
)

// ERC1155 TransferBatch event
const transferBatchEventAbi = parseAbiItem(
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
)

type InfectionSpreadArgs = {
  sender: string
  infectedToken: bigint
  time: bigint
}

type TransferSingleArgs = {
  operator: string
  from: string
  to: string
  id: bigint
  value: bigint
}

type TransferBatchArgs = {
  operator: string
  from: string
  to: string
  ids: readonly bigint[]
  values: readonly bigint[]
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

function isBurnAddress(address: string): boolean {
  const normalized = address.toLowerCase()
  return normalized === ZERO_ADDRESS || normalized === DEAD_ADDRESS
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [infection-handler] ${message}`)
}

/**
 * Batch update character infection status
 */
async function batchUpdateCharacterInfectionStatus(
  updates: Array<{ tokenId: number; status: 'infected' | 'cured' }>
): Promise<{ success: number; failed: number }> {
  if (updates.length === 0) {
    return { success: 0, failed: 0 }
  }

  const client = getAdminClient()
  let success = 0
  let failed = 0

  // Process updates in batches of 100 using Promise.all
  const batchSize = 100
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)

    const promises = batch.map(async ({ tokenId, status }) => {
      const { error } = await client
        .from('wagdie_characters')
        .update({ infection_status: status })
        .eq('token_id', tokenId)

      if (error) {
        console.error(`Failed to update token ${tokenId} infection status:`, error.message)
        return false
      }
      return true
    })

    const results = await Promise.all(promises)
    success += results.filter(Boolean).length
    failed += results.length - results.filter(Boolean).length
  }

  return { success, failed }
}

async function updateCharacterInfectionStatus(
  tokenId: number,
  status: 'infected' | 'cured'
): Promise<boolean> {
  const client = getAdminClient()

  const { error } = await client
    .from('wagdie_characters')
    .update({ infection_status: status })
    .eq('token_id', tokenId)

  if (error) {
    log(`Failed to update character ${tokenId} infection status: ${JSON.stringify(error)}`)
    return false
  }

  return true
}

/**
 * Handle InfectionSpread events from the Spread contract
 * Uses batch upsert for efficient bulk database writes
 */
export async function handleInfectionSpreadLogs(logs: Log[]): Promise<InfectionHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null

  // Collect all records for batch upsert
  const records: InfectionRecord[] = []
  const statusUpdates: Array<{ tokenId: number; status: 'infected' | 'cured' }> = []

  for (const logEntry of ordered) {
    let decoded: { eventName: string; args: unknown }
    try {
      decoded = decodeEventLog({
        abi: [infectionSpreadEventAbi],
        data: logEntry.data,
        topics: logEntry.topics,
      })
    } catch {
      continue
    }

    if (decoded.eventName !== 'InfectionSpread') continue

    const args = decoded.args as InfectionSpreadArgs
    const tokenId = normalizeTokenId(args.infectedToken)
    const sender = normalizeAddress(args.sender)
    const time = args.time

    if (tokenId === null) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    if (!logEntry.transactionHash || logEntry.blockNumber === undefined || blockNumber === null) {
      console.warn('[infection-handler] Skipping log with missing tx data')
      continue
    }

    // Calculate event timestamp from the 'time' field (Unix timestamp)
    const eventTimestamp = time ? new Date(Number(time) * 1000).toISOString() : null

    records.push({
      token_id: tokenId,
      event_type: 'infection',
      transaction_hash: logEntry.transactionHash,
      block_number: Number(blockNumber),
      log_index: logIndex,
      actor_address: sender,
      amount: null,
      event_timestamp: eventTimestamp,
      metadata: {
        sender,
        infectedToken: tokenId,
        time: time.toString(),
      },
    })

    // Queue status update
    statusUpdates.push({ tokenId, status: 'infected' })

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  // Batch upsert all records
  let processed = 0
  if (records.length > 0) {
    const result = await batchUpsert('infection_events', records, {
      onConflict: 'transaction_hash,log_index',
    })
    processed = result.totalInserted

    // Batch update character infection statuses
    await batchUpdateCharacterInfectionStatus(statusUpdates)

    // Log summary for backfill
    if (records.length > 10) {
      log(`Processed ${processed} infection events in ${result.batchCount} batches`)
    } else {
      // Detailed logging for small batches / live events
      for (const record of records) {
        log(`Infection: token ${record.token_id} by ${record.actor_address}`)
      }
    }
  }

  return { highestBlock, processed }
}

/**
 * Handle Mushroom ERC1155 burn events (TransferSingle to zero/dead address)
 * These are treated as cure attempts. We record them but don't auto-update
 * the character status since a burn doesn't guarantee the cure was applied
 * to a specific character.
 * Uses batch upsert for efficient bulk database writes
 */
export async function handleMushroomBurnLogs(
  logs: Log[],
  mushroomTokenId: bigint
): Promise<InfectionHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null

  // Collect all records for batch upsert
  const records: InfectionRecord[] = []

  for (const logEntry of ordered) {
    // Try to decode as TransferSingle first
    let decoded: { eventName: string; args: unknown } | null = null

    try {
      decoded = decodeEventLog({
        abi: [transferSingleEventAbi],
        data: logEntry.data,
        topics: logEntry.topics,
      })
    } catch {
      // Try TransferBatch
      try {
        decoded = decodeEventLog({
          abi: [transferBatchEventAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
      } catch {
        continue
      }
    }

    if (!decoded) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    if (!logEntry.transactionHash || logEntry.blockNumber === undefined || blockNumber === null) {
      console.warn('[infection-handler] Skipping log with missing tx data')
      continue
    }

    if (decoded.eventName === 'TransferSingle') {
      const args = decoded.args as TransferSingleArgs
      const to = normalizeAddress(args.to)
      const from = normalizeAddress(args.from)
      const id = args.id
      const value = args.value

      // Only process burns of mushroom tokens
      if (!to || !isBurnAddress(to)) continue
      if (id !== mushroomTokenId) continue

      records.push({
        token_id: 0, // Cure burns aren't tied to a specific character
        event_type: 'cure',
        transaction_hash: logEntry.transactionHash,
        block_number: Number(blockNumber),
        log_index: logIndex,
        actor_address: from,
        amount: Number(value),
        event_timestamp: null,
        metadata: {
          operator: normalizeAddress(args.operator),
          from,
          to,
          mushroomId: id.toString(),
          amount: value.toString(),
        },
      })
    } else if (decoded.eventName === 'TransferBatch') {
      const args = decoded.args as TransferBatchArgs
      const to = normalizeAddress(args.to)
      const from = normalizeAddress(args.from)

      // Only process burns
      if (!to || !isBurnAddress(to)) continue

      // Sum up mushroom burns in this batch
      let totalMushroomsBurned = 0n
      for (let i = 0; i < args.ids.length; i++) {
        if (args.ids[i] === mushroomTokenId) {
          totalMushroomsBurned += args.values[i]
        }
      }

      if (totalMushroomsBurned === 0n) continue

      records.push({
        token_id: 0,
        event_type: 'cure',
        transaction_hash: logEntry.transactionHash,
        block_number: Number(blockNumber),
        log_index: logIndex,
        actor_address: from,
        amount: Number(totalMushroomsBurned),
        event_timestamp: null,
        metadata: {
          operator: normalizeAddress(args.operator),
          from,
          to,
          mushroomId: mushroomTokenId.toString(),
          amount: totalMushroomsBurned.toString(),
          batchIds: args.ids.map((id) => id.toString()),
          batchValues: args.values.map((v) => v.toString()),
        },
      })
    }

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  // Batch upsert all records
  let processed = 0
  if (records.length > 0) {
    const result = await batchUpsert('infection_events', records, {
      onConflict: 'transaction_hash,log_index',
    })
    processed = result.totalInserted

    // Log summary for backfill
    if (records.length > 10) {
      log(`Processed ${processed} cure burn events in ${result.batchCount} batches`)
    } else {
      // Detailed logging for small batches / live events
      for (const record of records) {
        log(`Cure burn: ${record.amount} mushrooms by ${record.actor_address}`)
      }
    }
  }

  return { highestBlock, processed }
}
