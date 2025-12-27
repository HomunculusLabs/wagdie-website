import { decodeEventLog, type Log } from 'viem'
import { createClient } from '@supabase/supabase-js'

export interface TransferHandleResult {
  highestBlock: bigint | null
  processed: number
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// Create admin Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wagdie-api.runiverse.ai'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let adminClient: ReturnType<typeof createClient> | null = null

function getAdminClient(): ReturnType<typeof createClient> {
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

async function updateOwnership(tokenId: number, ownerAddress: string | null): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = getAdminClient() as any

  const { error } = await client
    .from('wagdie_characters')
    .update({ owner_address: ownerAddress })
    .eq('token_id', tokenId)

  if (error) {
    console.error(`Failed to update token ${tokenId}:`, error.message)
    return false
  }

  return true
}

export async function handleTransferLogs(logs: Log[]): Promise<TransferHandleResult> {
  if (!Array.isArray(logs) || logs.length === 0) {
    return { highestBlock: null, processed: 0 }
  }

  const ordered = [...logs].sort(compareLogs)
  let highestBlock: bigint | null = null
  let processed = 0

  for (const log of ordered) {
    let decoded: { eventName: string; args: unknown }
    try {
      decoded = decodeEventLog({
        abi: [transferEventAbi],
        data: log.data,
        topics: log.topics,
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
    const updated = await updateOwnership(tokenId, ownerAddress)

    if (!updated) continue

    processed += 1

    const blockNumber = getBlockNumber(log)
    if (blockNumber !== null && (highestBlock === null || blockNumber > highestBlock)) {
      highestBlock = blockNumber
    }
  }

  return { highestBlock, processed }
}
