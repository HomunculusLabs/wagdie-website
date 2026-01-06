// Staking Event Handler
// Processes WagdieStaked, WagdieUnstaked, WagdieLocationChanged, WagdieBurned events

import { decodeEventLog, type Log } from 'viem'
import { enqueueBurn, enqueueTravel } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'
import { batchUpsert } from './utils/batch-upsert'

export interface StakingHandleResult {
  highestBlock: bigint | null
  processed: number
}

// Default context for backwards compatibility
const DEFAULT_CONTEXT: IndexerContext = { source: 'backfill', chainId: 1 }

// Record type for batch upsert
interface StakingRecord extends Record<string, unknown> {
  token_id: number
  event_type: 'stake' | 'unstake' | 'location_change' | 'burn'
  location_id: number | null
  old_location_id: number | null
  new_location_id: number | null
  owner_address: string | null
  transaction_hash: string
  block_number: number
  log_index: number
  metadata: Record<string, unknown>
}

// Pending notification for Discord queue
interface PendingNotification {
  type: 'travel' | 'burn'
  tokenId: number
  transactionHash: string
  logIndex: number
  blockNumber: bigint
  data: {
    oldLocationId?: number
    newLocationId?: number
    locationId?: number
    ownerAddress: string | null
  }
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

/**
 * Handle staking events from WagdieWorld contract
 * Uses batch upsert for efficient bulk database writes
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

  // Collect all records for batch upsert
  const records: StakingRecord[] = []
  const notifications: PendingNotification[] = []

  for (const logEntry of ordered) {
    const topic0 = logEntry.topics[0]
    if (!topic0) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    if (!logEntry.transactionHash || logEntry.blockNumber === undefined || blockNumber === null) {
      console.warn('[staking-handler] Skipping log with missing tx data')
      continue
    }

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
          records.push({
            token_id: tokenId,
            event_type: 'stake',
            location_id: Number(args.locationId),
            old_location_id: null,
            new_location_id: null,
            owner_address: owner,
            transaction_hash: logEntry.transactionHash,
            block_number: Number(blockNumber),
            log_index: logIndex,
            metadata: { wagdieId: tokenId, owner, locationId: Number(args.locationId) },
          })
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
          records.push({
            token_id: tokenId,
            event_type: 'unstake',
            location_id: Number(args.locationId),
            old_location_id: null,
            new_location_id: null,
            owner_address: owner,
            transaction_hash: logEntry.transactionHash,
            block_number: Number(blockNumber),
            log_index: logIndex,
            metadata: { wagdieId: tokenId, owner, locationId: Number(args.locationId) },
          })
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
          records.push({
            token_id: tokenId,
            event_type: 'location_change',
            location_id: null,
            old_location_id: Number(args.oldLocationId),
            new_location_id: Number(args.newLocationId),
            owner_address: null,
            transaction_hash: logEntry.transactionHash,
            block_number: Number(blockNumber),
            log_index: logIndex,
            metadata: {
              wagdieId: tokenId,
              oldLocationId: Number(args.oldLocationId),
              newLocationId: Number(args.newLocationId),
            },
          })

          // Queue Discord notification for travel
          notifications.push({
            type: 'travel',
            tokenId,
            transactionHash: logEntry.transactionHash,
            logIndex,
            blockNumber,
            data: {
              oldLocationId: Number(args.oldLocationId),
              newLocationId: Number(args.newLocationId),
              ownerAddress: null,
            },
          })
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
          records.push({
            token_id: tokenId,
            event_type: 'burn',
            location_id: Number(args.locationId),
            old_location_id: null,
            new_location_id: null,
            owner_address: null,
            transaction_hash: logEntry.transactionHash,
            block_number: Number(blockNumber),
            log_index: logIndex,
            metadata: { wagdieId: tokenId, locationId: Number(args.locationId) },
          })

          // Queue Discord notification for burn
          notifications.push({
            type: 'burn',
            tokenId,
            transactionHash: logEntry.transactionHash,
            logIndex,
            blockNumber,
            data: {
              locationId: Number(args.locationId),
              ownerAddress: null,
            },
          })
        }
      }
    } catch {
      // Skip events that can't be decoded
      continue
    }

    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  // Batch upsert all records
  let processed = 0
  if (records.length > 0) {
    const result = await batchUpsert('staking_events', records, {
      onConflict: 'transaction_hash,log_index',
    })
    processed = result.totalInserted

    // Log summary for backfill
    if (records.length > 10) {
      log(`Processed ${processed} staking events in ${result.batchCount} batches`)
    } else {
      // Detailed logging for small batches / live events
      for (const record of records) {
        const action = record.event_type === 'stake' ? 'Stake' :
                       record.event_type === 'unstake' ? 'Unstake' :
                       record.event_type === 'location_change' ? 'Location change' : 'Burn'
        if (record.event_type === 'location_change') {
          log(`${action}: token ${record.token_id} from ${record.old_location_id} to ${record.new_location_id}`)
        } else {
          log(`${action}: token ${record.token_id} at location ${record.location_id}`)
        }
      }
    }

    // Enqueue Discord notifications after successful insert
    for (const notif of notifications) {
      if (notif.type === 'travel') {
        await enqueueTravel(ctx, notif.tokenId, notif.transactionHash, notif.logIndex, notif.blockNumber, {
          oldLocationId: notif.data.oldLocationId!,
          newLocationId: notif.data.newLocationId!,
          ownerAddress: notif.data.ownerAddress,
        })
      } else if (notif.type === 'burn') {
        await enqueueBurn(ctx, notif.tokenId, notif.transactionHash, notif.logIndex, notif.blockNumber, {
          locationId: notif.data.locationId!,
          ownerAddress: notif.data.ownerAddress,
        })
      }
    }
  }

  return { highestBlock, processed }
}
