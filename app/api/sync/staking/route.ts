import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { wagdieWorldABI } from '@/lib/contracts/abis/wagdie-world'
import { getContractAddresses } from '@/lib/contracts/addresses'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import { getSupabaseAdmin } from '@/lib/supabase'

const MAX_TOKEN_IDS = 50
const FALLBACK_RPC_URL = 'https://cloudflare-eth.com'

type SyncResult = {
  tokenId: number
  success: boolean
  locationId: string | null
  chainLocationId: string
  error?: string
}

type LocationRow = {
  id: string
}

type LocationQueryResult = {
  data: LocationRow | null
  error: { message: string } | null
}

function parseTokenIds(input: unknown): number[] | null {
  if (!Array.isArray(input)) return null

  const parsed: number[] = []
  for (const value of input) {
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      return null
    }
    parsed.push(value)
  }

  return parsed
}

function uniqueNumbers(values: number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { results: [], error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const tokenIds = parseTokenIds((body as { tokenIds?: unknown })?.tokenIds)
  if (!tokenIds) {
    return NextResponse.json(
      { results: [], error: 'tokenIds must be an array of positive integers' },
      { status: 400 }
    )
  }

  if (tokenIds.length === 0) {
    return NextResponse.json(
      { results: [], error: 'tokenIds must not be empty' },
      { status: 400 }
    )
  }

  if (tokenIds.length > MAX_TOKEN_IDS) {
    return NextResponse.json(
      { results: [], error: `Maximum ${MAX_TOKEN_IDS} tokenIds per request` },
      { status: 400 }
    )
  }

  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    return NextResponse.json(
      { results: [], error: 'Supabase admin client not configured' },
      { status: 500 }
    )
  }

  const characterUpdateQuery = adminClient.from(CHARACTERS_TABLE) as unknown as {
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>
    }
  }

  const rpcUrl = process.env.HTTP_RPC_URL || FALLBACK_RPC_URL
  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(rpcUrl),
  })
  const { wagdieWorld } = getContractAddresses(1)

  const uniqueTokenIds = uniqueNumbers(tokenIds)
  const results: SyncResult[] = []

  for (const tokenId of uniqueTokenIds) {
    let chainLocationIdString = ''

    try {
      // Get wagdie info from chain (returns struct with locationIdCur)
      const wagdieInfo = (await publicClient.readContract({
        address: wagdieWorld,
        abi: wagdieWorldABI,
        functionName: 'wagdieIdToInfo',
        args: [tokenId],
      })) as { locationIdCur: bigint; owner: `0x${string}`; emptySpace: number }

      const chainLocationId = wagdieInfo.locationIdCur
      const stakerAddress = wagdieInfo.owner
      chainLocationIdString = chainLocationId.toString()

      // Normalize staker address (lowercase, null if zero address)
      const normalizedStaker =
        stakerAddress && stakerAddress !== '0x0000000000000000000000000000000000000000'
          ? stakerAddress.toLowerCase()
          : null

      if (chainLocationId === 0n) {
        // Character is unstaked - clear location and staker
        const { error: updateError } = await characterUpdateQuery
          .update({
            location_id: null,
            staker_address: null,
            updated_at: new Date().toISOString(),
          })
          .eq('token_id', tokenId)

        if (updateError) {
          results.push({
            tokenId,
            success: false,
            locationId: null,
            chainLocationId: chainLocationIdString,
            error: updateError.message,
          })
        } else {
          results.push({
            tokenId,
            success: true,
            locationId: null,
            chainLocationId: chainLocationIdString,
          })
        }
        continue
      }

      const { data: locationRow, error: locationError } = (await adminClient
        .from('locations')
        .select('id')
        .eq('id', chainLocationIdString)
        .maybeSingle()) as LocationQueryResult

      if (locationError) {
        results.push({
          tokenId,
          success: false,
          locationId: null,
          chainLocationId: chainLocationIdString,
          error: locationError.message,
        })
        continue
      }

      const locationId =
        locationRow && typeof locationRow.id === 'string' ? locationRow.id : null

      if (!locationId) {
        results.push({
          tokenId,
          success: false,
          locationId: null,
          chainLocationId: chainLocationIdString,
          error: 'No location mapping for chain_location_id',
        })
        continue
      }

      // Character is staked - update location and staker
      const { error: updateError } = await characterUpdateQuery
        .update({
          location_id: locationId,
          staker_address: normalizedStaker,
          updated_at: new Date().toISOString(),
        })
        .eq('token_id', tokenId)

      if (updateError) {
        results.push({
          tokenId,
          success: false,
          locationId,
          chainLocationId: chainLocationIdString,
          error: updateError.message,
        })
        continue
      }

      results.push({
        tokenId,
        success: true,
        locationId,
        chainLocationId: chainLocationIdString,
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to sync staking status'
      results.push({
        tokenId,
        success: false,
        locationId: null,
        chainLocationId: chainLocationIdString,
        error: message,
      })
    }
  }

  return NextResponse.json({ results })
}
