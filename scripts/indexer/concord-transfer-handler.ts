// Concord Transfer Handler
// Processes ERC1155 TransferSingle and TransferBatch events from TokensOfConcord

import { decodeEventLog, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'

export interface ConcordHandleResult {
  highestBlock: bigint | null
  processed: number
}

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

function normalizeAddress(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.toLowerCase()
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

async function insertTransfer(params: {
  tokenId: number
  fromAddress: string
  toAddress: string
  amount: number
  operatorAddress: string
  transactionHash: string
  blockNumber: bigint
  logIndex: number
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

  const { error } = await client.from('concord_transfers').upsert(
    {
      token_id: params.tokenId,
      from_address: params.fromAddress,
      to_address: params.toAddress,
      amount: params.amount,
      operator_address: params.operatorAddress,
      transaction_hash: params.transactionHash,
      block_number: Number(params.blockNumber),
      log_index: params.logIndex,
      metadata: params.metadata ?? {},
    },
    { onConflict: 'transaction_hash,log_index,token_id' }
  )

  if (error) {
    log(`Failed to insert transfer: ${JSON.stringify(error)}`)
    return false
  }

  return true
}

/**
 * Handle ERC1155 transfer events from TokensOfConcord contract
 */
export async function handleConcordTransferLogs(logs: Log[]): Promise<ConcordHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null
  let processed = 0

  for (const logEntry of ordered) {
    const topic0 = logEntry.topics[0]
    if (!topic0) continue

    const blockNumber = getBlockNumber(logEntry)
    const logIndex = getLogIndex(logEntry)

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

        const inserted = await insertTransfer({
          tokenId,
          fromAddress: from,
          toAddress: to,
          amount,
          operatorAddress: operator,
          transactionHash: logEntry.transactionHash!,
          blockNumber: blockNumber!,
          logIndex,
          metadata: { tokenId, amount, from, to, operator },
        })

        if (inserted) {
          const action = from === '0x0000000000000000000000000000000000000000' ? 'Mint' :
                         to === '0x0000000000000000000000000000000000000000' ? 'Burn' : 'Transfer'
          log(`${action}: token ${tokenId} x${amount} ${from.slice(0, 10)}...→${to.slice(0, 10)}...`)
          processed += 1
        }
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

        // Process each token in the batch
        for (let i = 0; i < args.ids.length; i++) {
          const tokenId = Number(args.ids[i])
          const amount = Number(args.values[i])

          const inserted = await insertTransfer({
            tokenId,
            fromAddress: from,
            toAddress: to,
            amount,
            operatorAddress: operator,
            transactionHash: logEntry.transactionHash!,
            blockNumber: blockNumber!,
            logIndex: logIndex + i, // Unique log index per token in batch
            metadata: { tokenId, amount, from, to, operator, batchIndex: i },
          })

          if (inserted) {
            const action = from === '0x0000000000000000000000000000000000000000' ? 'Mint' :
                           to === '0x0000000000000000000000000000000000000000' ? 'Burn' : 'Transfer'
            log(`${action} (batch): token ${tokenId} x${amount}`)
            processed += 1
          }
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

  return { highestBlock, processed }
}
