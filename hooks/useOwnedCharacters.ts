'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { readApiRaw } from '@/lib/api/client-response'
import type { Character } from '@/types/character'

type SortOrder = 'asc' | 'desc'

type ApiCharactersResponse = {
  characters?: Character[]
  // Newer response shape (per instructions)
  total?: number
  page?: number
  perPage?: number
  totalPages?: number
  // Older/alternate response shape (repo type hints)
  totalCount?: number
  hasMore?: boolean
}

export interface UseOwnedCharactersOptions {
  enabled?: boolean
  perPage?: number
  sort?: SortOrder
  search?: string
}

export interface UseOwnedCharactersResult {
  characters: Character[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

function coerceCharacters(payload: unknown): Character[] {
  if (!payload || typeof payload !== 'object') return []
  const maybe = payload as ApiCharactersResponse
  return Array.isArray(maybe.characters) ? maybe.characters : []
}

function buildCharactersUrl(params: {
  tab: 'owned' | 'staked'
  wallet: string
  perPage: number
  sort: SortOrder
  search?: string
}): string {
  const searchParams = new URLSearchParams()
  searchParams.set('tab', params.tab)
  searchParams.set('wallet', params.wallet)
  searchParams.set('perPage', String(params.perPage))
  searchParams.set('sort', params.sort)
  if (params.search && params.search.trim().length > 0) {
    searchParams.set('search', params.search.trim())
  }
  return `/api/characters?${searchParams.toString()}`
}

async function fetchCharacters(
  url: string,
  signal: AbortSignal
): Promise<Character[]> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
    signal,
    cache: 'no-store',
  })

  const json = await readApiRaw<unknown>(res, `Request failed (${res.status})`)
  return coerceCharacters(json)
}

export function useOwnedCharacters(
  wallet?: string,
  options?: UseOwnedCharactersOptions
): UseOwnedCharactersResult {
  const enabled = options?.enabled ?? true
  const perPage = options?.perPage ?? 100
  const sort = options?.sort ?? 'desc'
  const search = options?.search

  const [characters, setCharacters] = useState<Character[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const doFetch = useCallback(async () => {
    if (!enabled) return
    if (!wallet || wallet.trim().length === 0) {
      setCharacters([])
      setIsLoading(false)
      setError(null)
      return
    }

    // Abort any in-flight request before starting a new one
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      // Fetch only 'owned' tab with wallet - this returns all characters
      // owned by the wallet, including staked ones (owner_address is preserved).
      // The repository now correctly applies wallet filter for all tabs.
      const ownedUrl = buildCharactersUrl({
        tab: 'owned',
        wallet,
        perPage,
        sort,
        search,
      })

      const owned = await fetchCharacters(ownedUrl, controller.signal)

      // Ignore results if we were aborted
      if (controller.signal.aborted) return

      // Defensive filter: ensure all returned characters match the wallet
      // This protects against any backend bugs returning wrong characters
      // Check both owner_address (unstaked) and staker_address (staked)
      const walletLower = wallet.toLowerCase()
      const filtered = owned.filter(c => {
        const ownerMatch = c?.owner_address?.toLowerCase() === walletLower
        const stakerMatch = c?.staker_address?.toLowerCase() === walletLower
        return ownerMatch || stakerMatch
      })

      // Stable ordering for UI
      const sorted = filtered.sort((a, b) => a.token_id - b.token_id)

      setCharacters(sorted)
    } catch (err) {
      // Ignore abort errors (expected during wallet/options changes)
      if (controller.signal.aborted) return

      const e =
        err instanceof Error ? err : new Error('Failed to fetch characters')
      setError(e)
      setCharacters([])
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [enabled, wallet, perPage, sort, search])

  useEffect(() => {
    void doFetch()

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [doFetch])

  return {
    characters,
    isLoading,
    error,
    refetch: doFetch,
  }
}