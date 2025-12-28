'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ContractError, StakingStatus } from '@/types/blockchain'

export interface UseStakingStatusesOptions {
  enabled?: boolean
}

export interface UseStakingStatusesResult {
  statuses: Map<number, StakingStatus>
  isLoading: boolean
  error: ContractError | null
  refetch: () => Promise<void>
}

interface ApiStakingStatus {
  tokenId: number
  isStaked: boolean
  locationId: string | null
}

interface ApiResponse {
  statuses: ApiStakingStatus[]
  error?: string
}

function buildStatusesMap(apiStatuses: ApiStakingStatus[]): Map<number, StakingStatus> {
  const map = new Map<number, StakingStatus>()

  for (const status of apiStatuses) {
    map.set(status.tokenId, {
      tokenId: BigInt(status.tokenId),
      isStaked: status.isStaked,
      // Convert string locationId to bigint if present
      locationId: status.locationId ? BigInt(status.locationId) : undefined,
    })
  }

  return map
}

async function fetchStakingStatusFromApi(
  tokenIds: number[],
  signal: AbortSignal
): Promise<{ statuses: ApiStakingStatus[]; error?: string }> {
  const url = `/api/characters/staking-status?tokenIds=${tokenIds.join(',')}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed')
    throw new Error(text || `Request failed (${response.status})`)
  }

  return (await response.json()) as ApiResponse
}

export function useStakingStatuses(
  wagdieIds: number[],
  options?: UseStakingStatusesOptions
): UseStakingStatusesResult {
  const enabled = options?.enabled ?? true

  const [statuses, setStatuses] = useState<Map<number, StakingStatus>>(
    () => new Map()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // Stabilize wagdieIds reference by content (not by array identity)
  const wagdieIdsKey = Array.isArray(wagdieIds) ? wagdieIds.join(',') : ''
  const stableWagdieIds = useMemo(() => wagdieIds.slice(), [wagdieIdsKey])

  const fetchStatuses = useCallback(async (): Promise<void> => {
    if (!enabled) return

    if (stableWagdieIds.length === 0) {
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
      const result = await fetchStakingStatusFromApi(
        stableWagdieIds,
        controller.signal
      )

      // Ignore if aborted
      if (controller.signal.aborted) return

      if (result.error) {
        setError({
          type: 'unknown' as any,
          message: result.error,
        })
        setStatuses(new Map())
        return
      }

      setStatuses(buildStatusesMap(result.statuses))
    } catch (err) {
      // Ignore abort errors
      if (controller.signal.aborted) return

      const message =
        err instanceof Error ? err.message : 'Failed to fetch staking statuses'

      setError({
        type: 'unknown' as any,
        message,
        originalError: err instanceof Error ? err : undefined,
      })
      setStatuses(new Map())
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [enabled, stableWagdieIds])

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
