'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Address } from '@/types/blockchain'

/** Default number of blocks to scan for transaction history (used for display) */
export const DEFAULT_LOOKBACK_BLOCKS = 500_000n
/** Maximum number of blocks to scan (used for display) */
export const MAX_LOOKBACK_BLOCKS = 5_000_000n

export type CharacterTxKind = 'infection' | 'cure'

export interface CharacterTxHistoryItem {
  kind: CharacterTxKind
  txHash: `0x${string}`
  blockNumber: bigint
  logIndex: number
  timestampMs?: number
  actor?: Address
  amount?: bigint
  details?: Record<string, unknown>
}

export interface UseCharacterTxHistoryParams {
  tokenId: bigint
  ownerAddress?: Address | string | null
  stakerAddress?: Address | string | null
  lookbackBlocks?: bigint
  enabled?: boolean
}

export interface UseCharacterTxHistoryResult {
  items: CharacterTxHistoryItem[]
  isLoading: boolean
  error?: string
  fromBlock?: bigint
  toBlock?: bigint
  lookbackBlocks: bigint
  refresh: () => Promise<void>
}

interface ApiInfectionEvent {
  id: string
  token_id: number
  event_type: 'infection' | 'cure'
  transaction_hash: string
  block_number: number
  log_index: number
  actor_address: string | null
  amount: number | null
  event_timestamp: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface ApiResponse {
  tokenId: number
  events: ApiInfectionEvent[]
  count: number
}

function mapApiEventToItem(event: ApiInfectionEvent): CharacterTxHistoryItem {
  const item: CharacterTxHistoryItem = {
    kind: event.event_type,
    txHash: event.transaction_hash as `0x${string}`,
    blockNumber: BigInt(event.block_number),
    logIndex: event.log_index,
    details: event.metadata,
  }

  if (event.actor_address) {
    item.actor = event.actor_address as Address
  }

  if (event.amount !== null) {
    item.amount = BigInt(event.amount)
  }

  if (event.event_timestamp) {
    item.timestampMs = new Date(event.event_timestamp).getTime()
  }

  return item
}

export function useCharacterTxHistory(
  params: UseCharacterTxHistoryParams
): UseCharacterTxHistoryResult {
  const { tokenId, enabled = true } = params

  const requestIdRef = useRef(0)

  const [items, setItems] = useState<CharacterTxHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(undefined)

    try {
      const tokenIdNumber = Number(tokenId)
      if (!Number.isSafeInteger(tokenIdNumber) || tokenIdNumber < 0) {
        throw new Error('Invalid token ID')
      }

      const response = await fetch(`/api/characters/${tokenIdNumber}/events?limit=100`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${response.status}`)
      }

      const data: ApiResponse = await response.json()

      const mappedItems = data.events.map(mapApiEventToItem)

      // Sort by block number descending, then log index descending
      mappedItems.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return b.logIndex - a.logIndex
        }
        return a.blockNumber > b.blockNumber ? -1 : 1
      })

      if (requestIdRef.current === requestId) {
        setItems(mappedItems)
      }
    } catch (err) {
      if (requestIdRef.current === requestId) {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [enabled, tokenId])

  useEffect(() => {
    if (!enabled) return
    refresh()
  }, [enabled, refresh])

  return {
    items,
    isLoading,
    error,
    fromBlock: undefined,
    toBlock: undefined,
    lookbackBlocks: DEFAULT_LOOKBACK_BLOCKS,
    refresh,
  }
}
