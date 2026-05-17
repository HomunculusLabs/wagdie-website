'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { readApiRaw } from '@/lib/api/client-response'
import { parseChainLocationId } from '@/lib/utils/chainIds'
import { ContractErrorType, type ContractError, type StakingStatus } from '@/types/blockchain'

export interface UseStakingStatusesOptions {
  enabled?: boolean
  source?: 'db' | 'chain'
}

export interface UseStakingStatusesRefetchOptions {
  source?: 'db' | 'chain'
  tokenIds?: number[]
}

export interface UseStakingStatusesResult {
  statuses: Map<number, StakingStatus>
  isLoading: boolean
  error: ContractError | null
  refetch: (options?: UseStakingStatusesRefetchOptions) => Promise<void>
}

interface ApiStakingStatus {
  tokenId: number
  isStaked: boolean
  source?: 'db' | 'chain'
  dbLocationId?: string | null
  chainLocationId?: string | null
  locationId?: string | null
  syncSuccess?: boolean
  syncError?: string
}

interface ApiResponse {
  statuses: ApiStakingStatus[]
  error?: string
}

function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function buildStakingStatus(
  status: ApiStakingStatus,
  requestedSource: 'db' | 'chain'
): StakingStatus {
  const explicitChainLocationId = parseChainLocationId(status.chainLocationId)
  const legacyLocationId = status.locationId ?? null
  const effectiveSource = status.source ?? requestedSource
  const legacyChainLocationId =
    effectiveSource === 'chain' ? parseChainLocationId(legacyLocationId) : null
  const chainLocationId =
    explicitChainLocationId ?? legacyChainLocationId ?? undefined

  const dbLocationId =
    normalizeOptionalString(status.dbLocationId) ??
    (effectiveSource === 'db'
      ? normalizeOptionalString(legacyLocationId)
      : undefined)

  return {
    tokenId: BigInt(status.tokenId),
    isStaked: status.isStaked,
    ...(chainLocationId !== undefined
      ? { locationId: chainLocationId, chainLocationId }
      : {}),
    ...(dbLocationId ? { dbLocationId } : {}),
    ...(typeof status.syncSuccess === 'boolean'
      ? { syncSuccess: status.syncSuccess }
      : {}),
    ...(status.syncError ? { syncError: status.syncError } : {}),
  }
}

function buildStatusesMap(
  apiStatuses: ApiStakingStatus[],
  requestedSource: 'db' | 'chain'
): Map<number, StakingStatus> {
  const map = new Map<number, StakingStatus>()

  for (const status of apiStatuses) {
    map.set(status.tokenId, buildStakingStatus(status, requestedSource))
  }

  return map
}

function uniqueTokenIds(tokenIds: number[]): number[] {
  return Array.from(new Set(tokenIds.filter((id) => Number.isFinite(id))))
}

async function fetchStakingStatusFromApi(
  tokenIds: number[],
  source: 'db' | 'chain',
  signal: AbortSignal
): Promise<{ statuses: ApiStakingStatus[]; error?: string }> {
  const url = `/api/characters/staking-status?tokenIds=${tokenIds.join(',')}&source=${source}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
    cache: 'no-store',
  })

  return readApiRaw<ApiResponse>(response, `Request failed (${response.status})`)
}

export function useStakingStatuses(
  wagdieIds: number[],
  options?: UseStakingStatusesOptions
): UseStakingStatusesResult {
  const enabled = options?.enabled ?? true
  const source: 'db' | 'chain' = options?.source ?? 'db'

  const [statuses, setStatuses] = useState<Map<number, StakingStatus>>(
    () => new Map()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // Stabilize wagdieIds reference by content (not by array identity)
  const wagdieIdsKey = Array.isArray(wagdieIds) ? wagdieIds.join(',') : ''
  const stableWagdieIds = useMemo(() => wagdieIds.slice(), [wagdieIdsKey])

  const fetchStatuses = useCallback(async (
    refetchOptions?: UseStakingStatusesRefetchOptions
  ): Promise<void> => {
    const overrideTokenIds = uniqueTokenIds(refetchOptions?.tokenIds ?? [])
    const requestedTokenIds = overrideTokenIds.length > 0
      ? overrideTokenIds
      : stableWagdieIds

    if (!enabled && overrideTokenIds.length === 0) return

    if (requestedTokenIds.length === 0) {
      setStatuses(new Map())
      setIsLoading(false)
      setError(null)
      return
    }

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const requestedSource = refetchOptions?.source ?? source
      const result = await fetchStakingStatusFromApi(
        requestedTokenIds,
        requestedSource,
        controller.signal
      )

      // Ignore if aborted
      if (controller.signal.aborted) return

      if (result.error) {
        setError({
          type: ContractErrorType.UNKNOWN,
          message: result.error,
        })
        setStatuses(new Map())
        return
      }

      const nextStatuses = buildStatusesMap(result.statuses, requestedSource)
      setStatuses((prev) => {
        if (overrideTokenIds.length === 0) return nextStatuses

        const merged = new Map(prev)
        for (const [tokenId, status] of nextStatuses) {
          merged.set(tokenId, status)
        }
        return merged
      })
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return

      const message =
        err instanceof Error ? err.message : 'Failed to fetch staking statuses'

      setError({
        type: ContractErrorType.UNKNOWN,
        message,
        originalError: err instanceof Error ? err : undefined,
      })
      setStatuses(new Map())
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [enabled, stableWagdieIds, source])

  useEffect(() => {
    if (!enabled) return
    if (stableWagdieIds.length === 0) return

    void fetchStatuses()

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [enabled, stableWagdieIds, fetchStatuses])

  return {
    statuses,
    isLoading,
    error,
    refetch: fetchStatuses,
  }
}
