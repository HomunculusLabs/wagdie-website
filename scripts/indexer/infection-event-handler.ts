// Infection Event Handler
// Processes InfectionSpread events and Mushroom burn events

import { decodeEventLog, parseAbiItem, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'

export interface InfectionHandleResult {
  highestBlock: bigint | null
  processed: number
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead'

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wagdie-api.runiverse.ai'
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

async function insertInfectionEvent(params: {
  tokenId: number
  eventType: 'infection' | 'cure'
  transactionHash: string
  blockNumber: bigint
  logIndex: number
  actorAddress: string | null
  amount?: bigint
  eventTimestamp?: Date
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

  const { error } = await client.from('infection_events').upsert(
    {
      token_id: params.tokenId,
      event_type: params.eventType,
      transaction_hash: params.transactionHash,
      block_number: Number(params.blockNumber),
      log_index: params.logIndex,
      actor_address: params.actorAddress,
      amount: params.amount ? Number(params.amount) : null,
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

async function updateCharacterInfectionStatus(
  tokenId: number,
  status: 'infected' | 'cured'
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

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
 */
export async function handleInfectionSpreadLogs(logs: Log[]): Promise<InfectionHandleResult> {
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

    // Calculate event timestamp from the 'time' field (Unix timestamp)
    const eventTimestamp = time ? new Date(Number(time) * 1000) : undefined

    const inserted = await insertInfectionEvent({
      tokenId,
      eventType: 'infection',
      transactionHash: logEntry.transactionHash!,
      blockNumber: blockNumber!,
      logIndex,
      actorAddress: sender,
      eventTimestamp,
      metadata: {
        sender,
        infectedToken: tokenId,
        time: time.toString(),
      },
    })

    if (!inserted) continue

    // Update character's infection status
    await updateCharacterInfectionStatus(tokenId, 'infected')

    processed += 1
    log(`Infection: token ${tokenId} by ${sender} at block ${blockNumber}`)

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  return { highestBlock, processed }
}

/**
 * Handle Mushroom ERC1155 burn events (TransferSingle to zero/dead address)
 * These are treated as cure attempts. We record them but don't auto-update
 * the character status since a burn doesn't guarantee the cure was applied
 * to a specific character.
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
  let processed = 0

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

    if (decoded.eventName === 'TransferSingle') {
      const args = decoded.args as TransferSingleArgs
      const to = normalizeAddress(args.to)
      const from = normalizeAddress(args.from)
      const id = args.id
      const value = args.value

      // Only process burns of mushroom tokens
      if (!to || !isBurnAddress(to)) continue
      if (id !== mushroomTokenId) continue

      const inserted = await insertInfectionEvent({
        tokenId: 0, // Cure burns aren't tied to a specific character
        eventType: 'cure',
        transactionHash: logEntry.transactionHash!,
        blockNumber: blockNumber!,
        logIndex,
        actorAddress: from,
        amount: value,
        metadata: {
          operator: normalizeAddress(args.operator),
          from,
          to,
          mushroomId: id.toString(),
          amount: value.toString(),
        },
      })

      if (!inserted) continue

      processed += 1
      log(`Cure burn: ${value} mushrooms by ${from} at block ${blockNumber}`)
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

      const inserted = await insertInfectionEvent({
        tokenId: 0,
        eventType: 'cure',
        transactionHash: logEntry.transactionHash!,
        blockNumber: blockNumber!,
        logIndex,
        actorAddress: from,
        amount: totalMushroomsBurned,
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

      if (!inserted) continue

      processed += 1
      log(`Cure burn (batch): ${totalMushroomsBurned} mushrooms by ${from} at block ${blockNumber}`)
    }

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  return { highestBlock, processed }
}
