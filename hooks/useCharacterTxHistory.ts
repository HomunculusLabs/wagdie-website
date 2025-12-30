'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { parseAbiItem } from 'viem'
import type { AbiEvent, PublicClient } from 'viem'
import type { Address } from '@/types/blockchain'
import { spreadABI } from '@/lib/contracts/abis/spread'
import { getContractAddresses, TOKEN_IDS } from '@/lib/contracts/addresses'
import { DEAD_ADDRESS, ZERO_ADDRESS, normalizeAddress, validateAddress } from '@/lib/utils/blockchain'

/** Default number of blocks to scan for transaction history */
export const DEFAULT_LOOKBACK_BLOCKS = 500_000n
/** Maximum number of blocks to scan (prevents excessive RPC calls) */
export const MAX_LOOKBACK_BLOCKS = 5_000_000n
/** Maximum entries in the timestamp cache before cleanup */
const MAX_TIMESTAMP_CACHE_SIZE = 500

const TRANSFER_SINGLE_EVENT = parseAbiItem(
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
)
const TRANSFER_BATCH_EVENT = parseAbiItem(
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
)

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

function resolveLookbackBlocks(value?: bigint): bigint {
  if (!value || value <= 0n) return DEFAULT_LOOKBACK_BLOCKS
  return value > MAX_LOOKBACK_BLOCKS ? MAX_LOOKBACK_BLOCKS : value
}

function normalizeAddressSafe(value?: Address | string | null): Address | undefined {
  if (!value) return undefined
  try {
    return normalizeAddress(value)
  } catch {
    return undefined
  }
}

function resolvePreferredActor(
  ownerAddress?: Address | string | null,
  stakerAddress?: Address | string | null
): Address | undefined {
  const staker = normalizeAddressSafe(stakerAddress)
  if (staker) return staker
  return normalizeAddressSafe(ownerAddress)
}

function isBurnAddressValue(address: string): boolean {
  const normalized = address.toLowerCase()
  return normalized === ZERO_ADDRESS.toLowerCase() || normalized === DEAD_ADDRESS.toLowerCase()
}

function findInfectionEvent(): AbiEvent {
  const infectionEvent = spreadABI.find(
    (item) => item.type === 'event' && item.name === 'InfectionSpread'
  ) as AbiEvent | undefined

  if (!infectionEvent) {
    throw new Error('InfectionSpread event not found in spread ABI')
  }

  return infectionEvent
}

async function fetchMushroomBurnItems(params: {
  publicClient: PublicClient
  contractAddress: Address
  fromBlock: bigint
  toBlock: bigint
  actor?: Address
  mushroomTokenId: bigint
}): Promise<CharacterTxHistoryItem[]> {
  const { publicClient, contractAddress, fromBlock, toBlock, actor, mushroomTokenId } = params

  if (!actor) return []

  const burnAddresses: Address[] = [ZERO_ADDRESS, DEAD_ADDRESS]
  const items: CharacterTxHistoryItem[] = []

  for (const burnAddress of burnAddresses) {
    const [singleLogs, batchLogs] = await Promise.all([
      publicClient.getLogs({
        address: contractAddress,
        event: TRANSFER_SINGLE_EVENT,
        args: { from: actor, to: burnAddress },
        fromBlock,
        toBlock,
      }),
      publicClient.getLogs({
        address: contractAddress,
        event: TRANSFER_BATCH_EVENT,
        args: { from: actor, to: burnAddress },
        fromBlock,
        toBlock,
      }),
    ])

    for (const log of singleLogs) {
      if (!log.transactionHash || log.blockNumber === null) continue
      const args = log.args as {
        operator: Address
        from: Address
        to: Address
        id: bigint
        value: bigint
      }

      if (!isBurnAddressValue(args.to)) continue
      if (args.id !== mushroomTokenId) continue

      items.push({
        kind: 'cure',
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: typeof log.logIndex === 'number' ? log.logIndex : 0,
        actor: args.from,
        amount: args.value,
        details: {
          operator: args.operator,
          to: args.to,
          tokenId: args.id,
        },
      })
    }

    for (const log of batchLogs) {
      if (!log.transactionHash || log.blockNumber === null) continue
      const args = log.args as {
        operator: Address
        from: Address
        to: Address
        ids: readonly bigint[]
        values: readonly bigint[]
      }

      if (!isBurnAddressValue(args.to)) continue

      const ids = args.ids ?? []
      const values = args.values ?? []
      const entryCount = Math.min(ids.length, values.length)
      let amount = 0n

      for (let i = 0; i < entryCount; i += 1) {
        if (ids[i] === mushroomTokenId) {
          amount += values[i]
        }
      }

      if (amount === 0n) continue

      items.push({
        kind: 'cure',
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: typeof log.logIndex === 'number' ? log.logIndex : 0,
        actor: args.from,
        amount,
        details: {
          operator: args.operator,
          to: args.to,
          tokenId: mushroomTokenId,
        },
      })
    }
  }

  return items
}

export function useCharacterTxHistory(
  params: UseCharacterTxHistoryParams
): UseCharacterTxHistoryResult {
  const {
    tokenId,
    ownerAddress,
    stakerAddress,
    lookbackBlocks,
    enabled = true,
  } = params

  const publicClient = usePublicClient()
  const timestampCacheRef = useRef<Map<bigint, number>>(new Map())
  const requestIdRef = useRef(0)

  const [items, setItems] = useState<CharacterTxHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [fromBlock, setFromBlock] = useState<bigint | undefined>(undefined)
  const [toBlock, setToBlock] = useState<bigint | undefined>(undefined)

  const resolvedLookbackBlocks = useMemo(
    () => resolveLookbackBlocks(lookbackBlocks),
    [lookbackBlocks]
  )

  const getBlockTimestampMs = useCallback(
    async (blockNumber: bigint): Promise<number | undefined> => {
      if (!publicClient) return undefined
      const cache = timestampCacheRef.current
      if (cache.has(blockNumber)) return cache.get(blockNumber)

      const block = await publicClient.getBlock({ blockNumber })
      const timestampMs = Number(block.timestamp * 1000n)

      // Clean up old entries if cache is too large (FIFO eviction)
      if (cache.size >= MAX_TIMESTAMP_CACHE_SIZE) {
        const keysToDelete = Array.from(cache.keys()).slice(0, 100)
        keysToDelete.forEach((k) => cache.delete(k))
      }

      cache.set(blockNumber, timestampMs)
      return timestampMs
    },
    [publicClient]
  )

  const refresh = useCallback(async (): Promise<void> => {
    if (!enabled) return
    if (!publicClient) {
      setError('Blockchain client not available')
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(undefined)

    try {
      const chainId = await publicClient.getChainId()
      const addresses = getContractAddresses(chainId)

      if (!addresses.spread || !validateAddress(addresses.spread)) {
        throw new Error('Spread contract address not configured')
      }

      const latestBlock = await publicClient.getBlockNumber()
      const from = latestBlock > resolvedLookbackBlocks
        ? latestBlock - resolvedLookbackBlocks
        : 0n

      setFromBlock(from)
      setToBlock(latestBlock)

      const infectionEvent = findInfectionEvent()
      const infectionLogs = await publicClient.getLogs({
        address: addresses.spread,
        event: infectionEvent,
        args: { infectedToken: tokenId },
        fromBlock: from,
        toBlock: latestBlock,
      })

      const infectionItems: CharacterTxHistoryItem[] = []
      for (const log of infectionLogs) {
        if (!log.transactionHash || log.blockNumber === null) continue
        const args = log.args as {
          sender: Address
          infectedToken: bigint
          time: bigint
        }

        if (args.infectedToken !== tokenId) continue

        infectionItems.push({
          kind: 'infection',
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: typeof log.logIndex === 'number' ? log.logIndex : 0,
          actor: args.sender,
          details: {
            infectedToken: args.infectedToken,
            time: args.time,
          },
        })
      }

      const preferredActor = resolvePreferredActor(ownerAddress, stakerAddress)
      const cureItems = await fetchMushroomBurnItems({
        publicClient,
        contractAddress: addresses.mushroom,
        fromBlock: from,
        toBlock: latestBlock,
        actor: preferredActor,
        mushroomTokenId: TOKEN_IDS.mushroom,
      })

      const allItems = [...infectionItems, ...cureItems]

      const uniqueBlocks = Array.from(new Set(allItems.map((item) => item.blockNumber)))
      const timestampsByBlock = new Map<bigint, number>()

      await Promise.all(
        uniqueBlocks.map(async (blockNumber) => {
          const timestampMs = await getBlockTimestampMs(blockNumber)
          if (timestampMs !== undefined) {
            timestampsByBlock.set(blockNumber, timestampMs)
          }
        })
      )

      for (const item of allItems) {
        const timestampMs = timestampsByBlock.get(item.blockNumber)
        if (timestampMs !== undefined) {
          item.timestampMs = timestampMs
        }
      }

      allItems.sort((a, b) => {
        if (a.blockNumber === b.blockNumber) {
          return b.logIndex - a.logIndex
        }
        return a.blockNumber > b.blockNumber ? -1 : 1
      })

      if (requestIdRef.current === requestId) {
        setItems(allItems)
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
  }, [
    enabled,
    publicClient,
    tokenId,
    ownerAddress,
    stakerAddress,
    resolvedLookbackBlocks,
    getBlockTimestampMs,
  ])

  useEffect(() => {
    if (!enabled) return
    refresh()
  }, [enabled, refresh])

  return {
    items,
    isLoading,
    error,
    fromBlock,
    toBlock,
    lookbackBlocks: resolvedLookbackBlocks,
    refresh,
  }
}