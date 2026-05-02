/**
 * Shared staking state sync module (chain truth -> DB cache)
 *
 * Runtime-neutral: can be imported from Next.js route handlers and Node scripts.
 * No Next.js imports.
 *
 * Key behavior (matches existing /api/sync/staking):
 * - If chainLocationId === 0n: write location_id=null, staker_address=null
 * - If staked but no location mapping exists: return success=false and do not write
 * - Normalize staker address: lowercase, null if zero-address
 * - Per-token errors: one token failing should not fail the whole batch
 */

import { createPublicClient, fallback, http, type Address } from 'viem'
import { mainnet, sepolia } from 'viem/chains'
import { wagdieWorldABI } from '../../contracts/abis/wagdie-world'
import { getContractAddresses } from '../../contracts/addresses'
import { CHARACTERS_TABLE } from '../../db/tables'
import { getSupabaseAdmin } from '../../supabase'

export type StakingStateSyncResult = {
  tokenId: number
  success: boolean

  // Chain-derived
  chainLocationId: string
  stakerAddress: string | null

  // DB-derived mapping
  locationId: string | null

  error?: string
}

export type StakingStateSyncResponse = {
  results: StakingStateSyncResult[]
}

const FALLBACK_RPC_URL = 'https://ethereum.publicnode.com'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

type WagdieInfo = {
  locationIdCur: bigint
  owner: Address
  emptySpace: number
}

type LocationRow = {
  id: string
}

type LocationQueryResult = {
  data: LocationRow[] | null
  error: { message: string } | null
}

function uniquePositiveIntegers(values: number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []

  for (const value of values) {
    if (typeof value !== 'number') continue
    if (!Number.isInteger(value)) continue
    if (value <= 0) continue
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }

  return out
}

function validateTokenIds(tokenIds: number[]): { tokenIds: number[]; error?: string } {
  if (!Array.isArray(tokenIds)) {
    return { tokenIds: [], error: 'tokenIds must be an array of positive integers' }
  }

  const deduped = uniquePositiveIntegers(tokenIds)

  if (deduped.length === 0) {
    return { tokenIds: [], error: 'tokenIds must not be empty' }
  }

  return { tokenIds: deduped }
}

function normalizeStakerAddress(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const lower = value.toLowerCase()
  if (lower === ZERO_ADDRESS) return null
  return lower
}

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return typeof err === 'string' ? err : 'Unknown error'
}

function getViemChain(chainId: number) {
  switch (chainId) {
    case 1:
      return mainnet
    case 11155111:
      return sepolia
    default:
      // getContractAddresses() also enforces supported chain IDs.
      // Keeping this explicit makes failures easier to diagnose.
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
}

async function fetchWagdieInfosFromChain(params: {
  tokenIds: number[]
  chainId: number
  rpcUrl: string
}): Promise<Map<number, { info?: WagdieInfo; error?: string }>> {
  const { tokenIds, chainId, rpcUrl } = params

  const chain = getViemChain(chainId)
  const publicClient = createPublicClient({
    chain,
    transport: fallback([
      http(rpcUrl),
      http(FALLBACK_RPC_URL),
      http('https://rpc.flashbots.net'),
    ]),
  })

  const { wagdieWorld } = getContractAddresses(chainId)

  const contracts = tokenIds.map((tokenId) => ({
    address: wagdieWorld as Address,
    abi: wagdieWorldABI,
    functionName: 'wagdieIdToInfo' as const,
    args: [tokenId] as const,
  }))

  const resultsByTokenId = new Map<number, { info?: WagdieInfo; error?: string }>()

  let multicallResults: Array<{ status: 'success' | 'failure'; result?: unknown; error?: unknown }>
  try {
    multicallResults = (await publicClient.multicall({
      contracts,
      allowFailure: true,
    })) as unknown as Array<{ status: 'success' | 'failure'; result?: unknown; error?: unknown }>
  } catch (err) {
    const message = toErrorMessage(err)
    for (const tokenId of tokenIds) {
      resultsByTokenId.set(tokenId, { error: message })
    }
    return resultsByTokenId
  }

  for (let i = 0; i < tokenIds.length; i++) {
    const tokenId = tokenIds[i]
    const row = multicallResults[i]

    if (!row) {
      resultsByTokenId.set(tokenId, { error: 'Missing multicall result' })
      continue
    }

    if (row.status === 'failure') {
      resultsByTokenId.set(tokenId, { error: toErrorMessage(row.error) })
      continue
    }

    try {
      const info = row.result as WagdieInfo
      if (!info || typeof info !== 'object') {
        resultsByTokenId.set(tokenId, { error: 'Invalid wagdieIdToInfo result' })
        continue
      }
      resultsByTokenId.set(tokenId, { info })
    } catch (err) {
      resultsByTokenId.set(tokenId, { error: toErrorMessage(err) })
    }
  }

  return resultsByTokenId
}

async function fetchLocationIdMap(params: {
  adminClient: NonNullable<ReturnType<typeof getSupabaseAdmin>>
  chainLocationIds: string[]
}): Promise<{ map: Map<string, string>; error?: string }> {
  const { adminClient, chainLocationIds } = params

  const unique = Array.from(new Set(chainLocationIds)).filter((id) => typeof id === 'string' && id.length > 0)
  if (unique.length === 0) {
    return { map: new Map() }
  }

  const { data, error } = (await adminClient
    .from('locations')
    .select('id')
    .in('id', unique)) as LocationQueryResult

  if (error) {
    return { map: new Map(), error: error.message }
  }

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (!row || typeof row.id !== 'string') continue
    map.set(row.id, row.id)
  }

  return { map }
}

async function bulkUpdateCharacterStakingState(params: {
  adminClient: NonNullable<ReturnType<typeof getSupabaseAdmin>>
  updates: Array<{ tokenId: number; locationId: string | null; stakerAddress: string | null }>
}): Promise<{
  updated: number
  failed: number
  errors: Array<{ tokenId: number; error: string }>
}> {
  const { adminClient, updates } = params

  if (!updates || updates.length === 0) {
    return { updated: 0, failed: 0, errors: [] }
  }

  const errors: Array<{ tokenId: number; error: string }> = []
  let updated = 0
  let failed = 0

  // Keep concurrency reasonable to avoid overwhelming DB.
  const batchSize = 50
  const nowIso = new Date().toISOString()

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize)

    const results = await Promise.allSettled(
      batch.map(async (u) => {
        // IMPORTANT: Create a fresh query builder for each update
        // Supabase query builders are not reusable
        // Cast required: Supabase generated types may not allow partial updates on this table
        const query = adminClient.from(CHARACTERS_TABLE) as unknown as {
          update: (values: Record<string, unknown>) => {
            eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>
          }
        }
        const { error } = await query
          .update({
            location_id: u.locationId,
            staker_address: u.stakerAddress,
            updated_at: nowIso,
          })
          .eq('token_id', u.tokenId)

        if (error) {
          throw new Error(error.message)
        }

        return u.tokenId
      })
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      const tokenId = batch[j]?.tokenId

      if (result.status === 'fulfilled') {
        updated += 1
      } else {
        failed += 1
        errors.push({
          tokenId,
          error: toErrorMessage(result.reason),
        })
      }
    }
  }

  return { updated, failed, errors }
}

export async function syncStakingState(params: {
  tokenIds: number[]
  chainId?: number
  rpcUrl?: string
}): Promise<StakingStateSyncResponse> {
  const chainId = params.chainId ?? 1
  const rpcUrl =
    params.rpcUrl ??
    process.env.HTTP_RPC_URL ??
    process.env.RPC_URL ??
    process.env.ETH_RPC_URL ??
    process.env.MAINNET_RPC_URL ??
    process.env.NEXT_PUBLIC_MAINNET_RPC_URL ??
    FALLBACK_RPC_URL

  const validation = validateTokenIds(params.tokenIds)
  if (validation.error) {
    const results = uniquePositiveIntegers(params.tokenIds ?? []).map((tokenId) => ({
      tokenId,
      success: false,
      chainLocationId: '',
      stakerAddress: null,
      locationId: null,
      error: validation.error,
    })) as StakingStateSyncResult[]

    return { results }
  }

  const tokenIds = validation.tokenIds

  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    return {
      results: tokenIds.map((tokenId) => ({
        tokenId,
        success: false,
        chainLocationId: '',
        stakerAddress: null,
        locationId: null,
        error: 'Supabase admin client not configured',
      })),
    }
  }

  let chainResults: Map<number, { info?: WagdieInfo; error?: string }>
  try {
    chainResults = await fetchWagdieInfosFromChain({
      tokenIds,
      chainId,
      rpcUrl,
    })
  } catch (err) {
    const message = toErrorMessage(err)
    return {
      results: tokenIds.map((tokenId) => ({
        tokenId,
        success: false,
        chainLocationId: '',
        stakerAddress: null,
        locationId: null,
        error: message,
      })),
    }
  }

  // Prepare preliminary results and compute which location IDs we need to map.
  const preliminaryResults = new Map<number, StakingStateSyncResult>()
  const chainLocationIdsNeedingMap: string[] = []

  for (const tokenId of tokenIds) {
    const chainRow = chainResults.get(tokenId)

    if (!chainRow) {
      preliminaryResults.set(tokenId, {
        tokenId,
        success: false,
        chainLocationId: '',
        stakerAddress: null,
        locationId: null,
        error: 'Missing chain result',
      })
      continue
    }

    if (chainRow.error || !chainRow.info) {
      preliminaryResults.set(tokenId, {
        tokenId,
        success: false,
        chainLocationId: '',
        stakerAddress: null,
        locationId: null,
        error: chainRow.error ?? 'Failed to read staking status from chain',
      })
      continue
    }

    const chainLocationId = chainRow.info.locationIdCur
    const chainLocationIdString = chainLocationId.toString()
    const stakerAddress = normalizeStakerAddress(chainRow.info.owner)

    if (chainLocationId > 0n) {
      chainLocationIdsNeedingMap.push(chainLocationIdString)
    }

    preliminaryResults.set(tokenId, {
      tokenId,
      success: true, // tentative; may be flipped if mapping/update fails
      chainLocationId: chainLocationIdString,
      stakerAddress,
      locationId: null,
    })
  }

  // Fetch location mapping in one query.
  const locationLookup = await fetchLocationIdMap({
    adminClient,
    chainLocationIds: chainLocationIdsNeedingMap,
  })

  if (locationLookup.error) {
    // If mapping query failed, we can still clear unstaked characters,
    // but we should not write staked ones (since we can't validate mapping).
    for (const tokenId of tokenIds) {
      const existing = preliminaryResults.get(tokenId)
      if (!existing) continue
      const isStaked = existing.chainLocationId !== '' && existing.chainLocationId !== '0'
      if (isStaked) {
        preliminaryResults.set(tokenId, {
          ...existing,
          success: false,
          locationId: null,
          error: locationLookup.error,
        })
      }
    }
  } else {
    // Apply mapping to preliminary results (do not write yet).
    for (const tokenId of tokenIds) {
      const existing = preliminaryResults.get(tokenId)
      if (!existing) continue
      if (!existing.success) continue

      if (existing.chainLocationId === '0') {
        // Unstaked: locationId remains null.
        preliminaryResults.set(tokenId, { ...existing, locationId: null })
        continue
      }

      const mapped = locationLookup.map.get(existing.chainLocationId) ?? null
      if (!mapped) {
        preliminaryResults.set(tokenId, {
          ...existing,
          success: false,
          locationId: null,
          error: 'No location mapping for chain_location_id',
        })
        continue
      }

      preliminaryResults.set(tokenId, { ...existing, locationId: mapped })
    }
  }

  // Build DB updates (only those that should be written).
  const updates: Array<{ tokenId: number; locationId: string | null; stakerAddress: string | null }> = []

  for (const tokenId of tokenIds) {
    const r = preliminaryResults.get(tokenId)
    if (!r) continue

    // Skip anything already failed (chain read error, mapping error, etc.)
    if (!r.success) continue

    // Unstaked: write clear.
    if (r.chainLocationId === '0') {
      updates.push({
        tokenId,
        locationId: null,
        stakerAddress: null,
      })
      continue
    }

    // Staked: must have a mapped locationId to write.
    if (!r.locationId) {
      preliminaryResults.set(tokenId, {
        ...r,
        success: false,
        error: r.error ?? 'No location mapping for chain_location_id',
      })
      continue
    }

    updates.push({
      tokenId,
      locationId: r.locationId,
      stakerAddress: r.stakerAddress,
    })
  }

  const updateResult = await bulkUpdateCharacterStakingState({
    adminClient,
    updates,
  })

  if (updateResult.failed > 0) {
    const errorsByToken = new Map(updateResult.errors.map((e) => [e.tokenId, e.error]))
    for (const tokenId of tokenIds) {
      const err = errorsByToken.get(tokenId)
      if (!err) continue
      const existing = preliminaryResults.get(tokenId)
      if (!existing) continue
      preliminaryResults.set(tokenId, { ...existing, success: false, error: err })
    }
  }

  // Return results in the same order as the input deduped list.
  const results: StakingStateSyncResult[] = tokenIds.map((tokenId) => {
    const r = preliminaryResults.get(tokenId)
    if (r) return r

    return {
      tokenId,
      success: false,
      chainLocationId: '',
      stakerAddress: null,
      locationId: null,
      error: 'Missing result',
    }
  })

  return { results }
}