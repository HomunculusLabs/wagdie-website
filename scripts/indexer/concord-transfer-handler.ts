// Concord Transfer Handler
// Processes ERC1155 TransferSingle and TransferBatch events from TokensOfConcord

import { decodeEventLog, type Log } from 'viem'
import { enqueueConcordTransfer } from '../discord/outbox'
import type { IndexerContext } from '../discord/types'
import { batchUpsert } from './utils/batch-upsert'

export interface ConcordHandleResult {
  highestBlock: bigint | null
  processed: number
}

// Default context for backwards compatibility
const DEFAULT_CONTEXT: IndexerContext = { source: 'backfill', chainId: 1 }

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'


// ERC1155 Event ABIs
// event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)
const transferSingleAbi = {
  type: 'event',
  name: 'TransferSingle',
  inputs: [
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'id', type: 'uint256' },
    { indexed: false, name: 'value', type: 'uint256' },
  ],
  anonymous: false,
} as const

// event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)
const transferBatchAbi = {
  type: 'event',
  name: 'TransferBatch',
  inputs: [
    { indexed: true, name: 'operator', type: 'address' },
    { indexed: true, name: 'from', type: 'address' },
    { indexed: true, name: 'to', type: 'address' },
    { indexed: false, name: 'ids', type: 'uint256[]' },
    { indexed: false, name: 'values', type: 'uint256[]' },
  ],
  anonymous: false,
} as const

// Event topic hashes
export const CONCORD_TOPICS = {
  TransferSingle: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
  TransferBatch: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
} as const

type TransferSingleArgs = {
  operator: `0x${string}`
  from: `0x${string}`
  to: `0x${string}`
  id: bigint
  value: bigint
}

type TransferBatchArgs = {
  operator: `0x${string}`
  from: `0x${string}`
  to: `0x${string}`
  ids: readonly bigint[]
  values: readonly bigint[]
}

// Record type for batch upsert
interface TransferRecord extends Record<string, unknown> {
  token_id: number
  from_address: string
  to_address: string
  amount: number
  operator_address: string
  transaction_hash: string
  block_number: number
  log_index: number
  batch_index: number
  metadata: Record<string, unknown>
}

function normalizeAddress(address: string | undefined): string | null {
  if (!address) return null
  const normalized = address.toLowerCase()
  if (!/^0x[a-f0-9]{40}$/i.test(normalized)) {
    console.warn(`[concord-handler] Invalid address format: ${address}`)
    return null
  }
  return normalized
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
  console.log(`[${new Date().toISOString()}] [concord-handler] ${message}`)
}

// Data structure for Discord notification queue
interface PendingNotification {
  tokenId: number
  transactionHash: string
  logIndex: number
  blockNumber: bigint
  from: string
  to: string
  amount: number
  operator: string
  isMint: boolean
  isBurn: boolean
}

/**
 * Handle ERC1155 transfer events from TokensOfConcord contract
 * Uses batch upsert for efficient bulk database writes
 */
export async function handleConcordTransferLogs(
  logs: Log[],
  ctx: IndexerContext = DEFAULT_CONTEXT
): Promise<ConcordHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null

  // Collect all records for batch upsert
  const records: TransferRecord[] = []
  const notifications: PendingNotification[] = []

  for (const logEntry of ordered) {
    const topic0 = logEntry.topics[0]
    if (!topic0) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

    if (!logEntry.transactionHash || logEntry.blockNumber === undefined || blockNumber === null) {
      console.warn('[concord-handler] Skipping log with missing tx data')
      continue
    }

    try {
      if (topic0 === CONCORD_TOPICS.TransferSingle) {
        const decoded = decodeEventLog({
          abi: [transferSingleAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as TransferSingleArgs

        const tokenId = Number(args.id)
        const amount = Number(args.value)
        const from = normalizeAddress(args.from)
        const to = normalizeAddress(args.to)
        const operator = normalizeAddress(args.operator)

        if (!from || !to || !operator) {
          continue
        }

        const isMint = from === ZERO_ADDRESS
        const isBurn = to === ZERO_ADDRESS

        records.push({
          token_id: tokenId,
          from_address: from,
          to_address: to,
          amount,
          operator_address: operator,
          transaction_hash: logEntry.transactionHash,
          block_number: Number(blockNumber),
          log_index: logIndex,
          batch_index: 0, // TransferSingle is always batch_index 0
          metadata: { tokenId, amount, from, to, operator },
        })

        notifications.push({
          tokenId,
          transactionHash: logEntry.transactionHash,
          logIndex,
          blockNumber,
          from,
          to,
          amount,
          operator,
          isMint,
          isBurn,
        })
      } else if (topic0 === CONCORD_TOPICS.TransferBatch) {
        const decoded = decodeEventLog({
          abi: [transferBatchAbi],
          data: logEntry.data,
          topics: logEntry.topics,
        })
        const args = decoded.args as unknown as TransferBatchArgs

        const from = normalizeAddress(args.from)
        const to = normalizeAddress(args.to)
        const operator = normalizeAddress(args.operator)

        if (!from || !to || !operator) {
          continue
        }

        const isMint = from === ZERO_ADDRESS
        const isBurn = to === ZERO_ADDRESS

        // Process each token in the batch
        for (let i = 0; i < args.ids.length; i++) {
          const tokenId = Number(args.ids[i])
          const amount = Number(args.values[i])
          const batchIndex = i

          records.push({
            token_id: tokenId,
            from_address: from,
            to_address: to,
            amount,
            operator_address: operator,
            transaction_hash: logEntry.transactionHash,
            block_number: Number(blockNumber),
            log_index: logIndex, // Real log_index - same for all items in batch
            batch_index: batchIndex, // Position within the batch for uniqueness
            metadata: { tokenId, amount, from, to, operator, batchIndex },
          })

          notifications.push({
            tokenId,
            transactionHash: logEntry.transactionHash,
            logIndex,
            blockNumber,
            from,
            to,
            amount,
            operator,
            isMint,
            isBurn,
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
    const result = await batchUpsert('concord_transfers', records, {
      onConflict: 'transaction_hash,log_index,batch_index,token_id',
    })
    processed = result.totalInserted

    // Log summary for backfill
    if (records.length > 10) {
      log(`Processed ${processed} transfers in ${result.batchCount} batches`)
    } else {
      // Detailed logging for small batches / live events
      for (const record of records) {
        const isMint = record.from_address === ZERO_ADDRESS
        const isBurn = record.to_address === ZERO_ADDRESS
        const action = isMint ? 'Mint' : isBurn ? 'Burn' : 'Transfer'
        const batchNote = record.batch_index > 0 ? ' (batch)' : ''
        log(`${action}${batchNote}: token ${record.token_id} x${record.amount}`)
      }
    }

    // Enqueue Discord notifications after successful insert
    for (const notif of notifications) {
      await enqueueConcordTransfer(ctx, notif.tokenId, notif.transactionHash, notif.logIndex, notif.blockNumber, {
        from: notif.from,
        to: notif.to,
        amount: notif.amount,
        operator: notif.operator,
        isMint: notif.isMint,
        isBurn: notif.isBurn,
      })
    }
  }

  return { highestBlock, processed }
}
