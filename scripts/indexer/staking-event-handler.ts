// Staking Event Handler
// Processes WagdieStaked, WagdieUnstaked, WagdieLocationChanged, WagdieBurned events

import { decodeEventLog, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'
import { enqueueBurn, enqueueTravel } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'

export interface StakingHandleResult {
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

// Event ABIs
// event WagdieStaked(uint16 wagdieId, address owner, uint64 locationId)
const wagdieStakedAbi = {
  type: 'event',
  name: 'WagdieStaked',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'owner', type: 'address' },
    { indexed: false, name: 'locationId', type: 'uint64' },
  ],
  anonymous: false,
} as const

// event WagdieUnstaked(uint16 wagdieId, address owner, uint64 locationId)
const wagdieUnstakedAbi = {
  type: 'event',
  name: 'WagdieUnstaked',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'owner', type: 'address' },
    { indexed: false, name: 'locationId', type: 'uint64' },
  ],
  anonymous: false,
} as const

// event WagdieLocationChanged(uint16 wagdieId, uint64 oldLocationId, uint64 newLocationId)
const wagdieLocationChangedAbi = {
  type: 'event',
  name: 'WagdieLocationChanged',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'oldLocationId', type: 'uint64' },
    { indexed: false, name: 'newLocationId', type: 'uint64' },
  ],
  anonymous: false,
} as const

// event WagdieBurned(uint16 wagdieId, uint64 locationId)
const wagdieBurnedAbi = {
  type: 'event',
  name: 'WagdieBurned',
  inputs: [
    { indexed: false, name: 'wagdieId', type: 'uint16' },
    { indexed: false, name: 'locationId', type: 'uint64' },
  ],
  anonymous: false,
} as const

// Event topic hashes
export const STAKING_TOPICS = {
  WagdieStaked: '0x7ec173ac40e33c742ccc293bb8021b22b91fd6f1f0c4651112cc291b14de97b7',
  WagdieUnstaked: '0x8ac08a13c3d467513ffb6f589d0a1b959fea481810443001b73fadc11ac07760',
  WagdieLocationChanged: '0x41ea78ea5a1b10fca307ec8c32c804862ae65a64f9086e1604a848020cdb55c6',
  WagdieBurned: '0x88973d38ef11719a9b8001fcf05ed7132e124ccded0a3125845b472c044f5d91',
} as const

type StakedArgs = { wagdieId: number; owner: `0x${string}`; locationId: bigint }
type UnstakedArgs = { wagdieId: number; owner: `0x${string}`; locationId: bigint }
type LocationChangedArgs = { wagdieId: number; oldLocationId: bigint; newLocationId: bigint }
type BurnedArgs = { wagdieId: number; locationId: bigint }

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
  console.log(`[${new Date().toISOString()}] [staking-handler] ${message}`)
}

async function insertStakingEvent(params: {
  tokenId: number
  eventType: 'stake' | 'unstake' | 'location_change' | 'burn'
  locationId?: bigint | null
  oldLocationId?: bigint | null
  newLocationId?: bigint | null
  ownerAddress?: string | null
  transactionHash: string
  blockNumber: bigint
  logIndex: number
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

  const { error } = await client.from('staking_events').upsert(
    {
      token_id: params.tokenId,
      event_type: params.eventType,
      location_id: params.locationId !== null && params.locationId !== undefined
        ? Number(params.locationId) : null,
      old_location_id: params.oldLocationId !== null && params.oldLocationId !== undefined
        ? Number(params.oldLocationId) : null,
      new_location_id: params.newLocationId !== null && params.newLocationId !== undefined
        ? Number(params.newLocationId) : null,
      owner_address: params.ownerAddress,
      transaction_hash: params.transactionHash,
      block_number: Number(params.blockNumber),
      log_index: params.logIndex,
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
 * Handle staking events from WagdieWorld contract
 */
export async function handleStakingLogs(
  logs: Log[],
  ctx: IndexerContext = DEFAULT_CONTEXT
): Promise<StakingHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null
  let processed = 0

  for (const logEntry of ordered) {
    const topic0 = logEntry.topics[0]
    if (!topic0) continue

    let inserted = false
    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    try {
      if (topic0 === STAKING_TOPICS.WagdieStaked) {
        const decoded = decodeEventLog({
          abi: [wagdieStakedAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as StakedArgs
        const tokenId = normalizeTokenId(args.wagdieId)
        const owner = normalizeAddress(args.owner)

        if (tokenId !== null) {
          inserted = await insertStakingEvent({
            tokenId,
            eventType: 'stake',
            locationId: args.locationId,
            ownerAddress: owner,
            transactionHash: logEntry.transactionHash!,
            blockNumber: blockNumber!,
            logIndex,
            metadata: { wagdieId: tokenId, owner, locationId: Number(args.locationId) },
          })
          if (inserted) {
            log(`Stake: token ${tokenId} at location ${args.locationId} by ${owner}`)
          }
        }
      } else if (topic0 === STAKING_TOPICS.WagdieUnstaked) {
        const decoded = decodeEventLog({
          abi: [wagdieUnstakedAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as UnstakedArgs
        const tokenId = normalizeTokenId(args.wagdieId)
        const owner = normalizeAddress(args.owner)

        if (tokenId !== null) {
          inserted = await insertStakingEvent({
            tokenId,
            eventType: 'unstake',
            locationId: args.locationId,
            ownerAddress: owner,
            transactionHash: logEntry.transactionHash!,
            blockNumber: blockNumber!,
            logIndex,
            metadata: { wagdieId: tokenId, owner, locationId: Number(args.locationId) },
          })
          if (inserted) {
            log(`Unstake: token ${tokenId} from location ${args.locationId} by ${owner}`)
          }
        }
      } else if (topic0 === STAKING_TOPICS.WagdieLocationChanged) {
        const decoded = decodeEventLog({
          abi: [wagdieLocationChangedAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as LocationChangedArgs
        const tokenId = normalizeTokenId(args.wagdieId)

        if (tokenId !== null) {
          inserted = await insertStakingEvent({
            tokenId,
            eventType: 'location_change',
            oldLocationId: args.oldLocationId,
            newLocationId: args.newLocationId,
            transactionHash: logEntry.transactionHash!,
            blockNumber: blockNumber!,
            logIndex,
            metadata: {
              wagdieId: tokenId,
              oldLocationId: Number(args.oldLocationId),
              newLocationId: Number(args.newLocationId),
            },
          })
          if (inserted) {
            log(`Location change: token ${tokenId} from ${args.oldLocationId} to ${args.newLocationId}`)
            // Enqueue Discord notification for travel
            if (logEntry.transactionHash) {
              await enqueueTravel(ctx, tokenId, logEntry.transactionHash, logIndex, blockNumber, {
                oldLocationId: Number(args.oldLocationId),
                newLocationId: Number(args.newLocationId),
                ownerAddress: null, // Owner not available in this event
              })
            }
          }
        }
      } else if (topic0 === STAKING_TOPICS.WagdieBurned) {
        const decoded = decodeEventLog({
          abi: [wagdieBurnedAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as BurnedArgs
        const tokenId = normalizeTokenId(args.wagdieId)

        if (tokenId !== null) {
          inserted = await insertStakingEvent({
            tokenId,
            eventType: 'burn',
            locationId: args.locationId,
            transactionHash: logEntry.transactionHash!,
            blockNumber: blockNumber!,
            logIndex,
            metadata: { wagdieId: tokenId, locationId: Number(args.locationId) },
          })
          if (inserted) {
            log(`Burn: token ${tokenId} at location ${args.locationId}`)
            // Enqueue Discord notification for burn
            if (logEntry.transactionHash) {
              await enqueueBurn(ctx, tokenId, logEntry.transactionHash, logIndex, blockNumber, {
                locationId: Number(args.locationId),
                ownerAddress: null, // Owner not available in burn event
              })
            }
          }
        }
      }
    } catch {
      // Skip events that can't be decoded
      continue
    }

    if (inserted) {
      processed += 1
      if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
        highestBlock = blockNumber
      }
    }
  }

  return { highestBlock, processed }
}
