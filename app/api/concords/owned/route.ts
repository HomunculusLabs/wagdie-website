import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, fallback, http, type Address } from 'viem'
import { mainnet } from 'viem/chains'
import { parseCsvNumberList } from '@/lib/api/params'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { concordABI } from '@/lib/contracts/abis/concord'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const PAGE_SIZE = 1000
const CHAIN_BALANCE_CHUNK_SIZE = 100

type ConcordTransferBalanceRow = {
  token_id: number
  from_address: string
  to_address: string
  amount: number
}

type ConcordBalanceResponse = {
  concordId: number
  tokenId: string
  balance: string
  isOwned: boolean
  contractAddress: string
}

type ConcordSearingMapIdRow = {
  concord_token_id: number
}

function normalizeWallet(value: string | null): string | null {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return null
  return value.toLowerCase()
}

function parseTokenIds(searchParams: URLSearchParams): number[] | undefined {
  const tokenIds = searchParams.get('token_ids') ?? searchParams.get('concord_ids')
  if (!tokenIds) return undefined
  const parsed = [...new Set(parseCsvNumberList(tokenIds, { min: 1 }))]
  return parsed.length > 0 ? parsed : []
}

async function fetchMappedConcordIds(): Promise<number[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('Supabase admin client is not configured')
  }

  const { data, error } = await supabase
    .from('concord_searing_maps')
    .select('concord_token_id')
    .order('concord_token_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  const rows = (data ?? []) as ConcordSearingMapIdRow[]

  return [...new Set(rows
    .map((row) => Number(row.concord_token_id))
    .filter((tokenId) => Number.isInteger(tokenId) && tokenId > 0))]
}

async function fetchWalletTransferRows(
  wallet: string,
  tokenIds?: number[]
): Promise<ConcordTransferBalanceRow[]> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error('Supabase admin client is not configured')
  }

  const rows: ConcordTransferBalanceRow[] = []
  let offset = 0
  let hasMore = true

  while (hasMore) {
    let query = supabase
      .from('concord_transfers')
      .select('token_id, from_address, to_address, amount')
      .or(`from_address.eq.${wallet},to_address.eq.${wallet}`)
      .range(offset, offset + PAGE_SIZE - 1)

    if (tokenIds && tokenIds.length > 0) {
      query = query.in('token_id', tokenIds)
    }

    const { data, error } = await query
    if (error) {
      throw new Error(error.message)
    }

    const page = (data ?? []) as ConcordTransferBalanceRow[]
    rows.push(...page)

    hasMore = page.length === PAGE_SIZE
    offset += PAGE_SIZE
  }

  return rows
}

function buildBalances(
  wallet: string,
  rows: ConcordTransferBalanceRow[]
): ConcordBalanceResponse[] {
  const balances = new Map<number, bigint>()

  for (const row of rows) {
    const concordId = Number(row.token_id)
    const amount = BigInt(row.amount ?? 0)
    if (!Number.isInteger(concordId) || concordId <= 0 || amount <= 0n) continue

    const from = row.from_address?.toLowerCase()
    const to = row.to_address?.toLowerCase()
    const current = balances.get(concordId) ?? 0n
    let next = current

    if (to === wallet && from !== ZERO_ADDRESS) next += amount
    if (to === wallet && from === ZERO_ADDRESS) next += amount
    if (from === wallet && to !== wallet) next -= amount

    balances.set(concordId, next)
  }

  return mapBalancesToResponse(balances)
}

function createServerPublicClient() {
  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY
  const rpcUrl =
    process.env.HTTP_RPC_URL ||
    process.env.RPC_URL ||
    process.env.ETH_RPC_URL ||
    process.env.MAINNET_RPC_URL ||
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ||
    process.env.ALCHEMY_RPC_URL ||
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL ||
    (alchemyKey
      ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
      : 'https://ethereum.publicnode.com')

  return createPublicClient({
    chain: mainnet,
    transport: fallback([
      http(rpcUrl, { batch: true, retryCount: 3 }),
      http('https://ethereum.publicnode.com', { batch: true, retryCount: 2 }),
      http('https://rpc.flashbots.net', { batch: true, retryCount: 2 }),
    ]),
  })
}

async function fetchChainBalances(
  wallet: string,
  tokenIds: number[]
): Promise<ConcordBalanceResponse[]> {
  if (tokenIds.length === 0) return []

  const publicClient = createServerPublicClient()
  const balances = new Map<number, bigint>()
  const contractAddress = getContractAddresses(1).tokensOfConcord

  for (let i = 0; i < tokenIds.length; i += CHAIN_BALANCE_CHUNK_SIZE) {
    const chunk = tokenIds.slice(i, i + CHAIN_BALANCE_CHUNK_SIZE)
    const result = await publicClient.readContract({
      address: contractAddress as Address,
      abi: concordABI,
      functionName: 'balanceOfBatch',
      args: [
        chunk.map(() => wallet as Address),
        chunk.map((tokenId) => BigInt(tokenId)),
      ],
    })

    result.forEach((balance, index) => {
      if (balance > 0n) {
        balances.set(chunk[index], balance)
      }
    })
  }

  return mapBalancesToResponse(balances)
}

function mapBalancesToResponse(balances: Map<number, bigint>): ConcordBalanceResponse[] {
  const contractAddress = getContractAddresses(1).tokensOfConcord

  return [...balances.entries()]
    .filter(([, balance]) => balance > 0n)
    .sort(([a], [b]) => a - b)
    .map(([concordId, balance]) => ({
      concordId,
      tokenId: String(concordId),
      balance: balance.toString(),
      isOwned: true,
      contractAddress,
    }))
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const wallet = normalizeWallet(searchParams.get('wallet'))
  const tokenIds = parseTokenIds(searchParams)

  if (!wallet) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
  }

  if (tokenIds && tokenIds.length === 0) {
    return NextResponse.json({ error: 'Invalid token ID filter' }, { status: 400 })
  }

  try {
    const requestedTokenIds = tokenIds ?? await fetchMappedConcordIds()
    const rows = await fetchWalletTransferRows(wallet, requestedTokenIds)
    const indexedBalances = buildBalances(wallet, rows)
    const balances = indexedBalances.length > 0
      ? indexedBalances
      : await fetchChainBalances(wallet, requestedTokenIds)

    return NextResponse.json({
      balances,
      count: balances.length,
    })
  } catch (error) {
    console.error('Failed to fetch owned Concord balances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch owned Concord balances' },
      { status: 500 }
    )
  }
}
