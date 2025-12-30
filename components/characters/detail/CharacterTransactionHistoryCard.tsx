'use client'

import { useMemo, useState } from 'react'
import { useChainId } from 'wagmi'
import type { Address } from '@/types/blockchain'
import {
  useCharacterTxHistory,
  DEFAULT_LOOKBACK_BLOCKS,
  MAX_LOOKBACK_BLOCKS,
} from '@/hooks/useCharacterTxHistory'
import {
  getTransactionUrl,
  normalizeTokenId,
  shortenAddress,
  shortenTransactionHash,
} from '@/lib/utils/blockchain'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Empty } from '@/components/ui/Empty'

type Props = {
  tokenId: number
  ownerAddress?: string | Address | null
  stakerAddress?: string | Address | null
  className?: string
}

const PAGE_SIZE = 10

export function CharacterTransactionHistoryCard({
  tokenId,
  ownerAddress,
  stakerAddress,
  className = '',
}: Props) {
  const chainId = useChainId()
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [lookbackBlocks, setLookbackBlocks] = useState(DEFAULT_LOOKBACK_BLOCKS)

  const normalizedTokenId = useMemo(() => normalizeTokenId(tokenId), [tokenId])

  const {
    items,
    isLoading,
    error,
    fromBlock,
    toBlock,
    refresh,
  } = useCharacterTxHistory({
    tokenId: normalizedTokenId,
    ownerAddress,
    stakerAddress,
    lookbackBlocks,
  })

  const visibleItems = useMemo(
    () => items.slice(0, visibleCount),
    [items, visibleCount]
  )

  const canSearchOlder = lookbackBlocks < MAX_LOOKBACK_BLOCKS

  const handleRefresh = async () => {
    setVisibleCount(PAGE_SIZE)
    await refresh()
  }

  const handleSearchOlder = () => {
    if (!canSearchOlder) return
    setVisibleCount(PAGE_SIZE)
    setLookbackBlocks((current) => {
      const next = current * 2n
      return next > MAX_LOOKBACK_BLOCKS ? MAX_LOOKBACK_BLOCKS : next
    })
  }

  const handleShowMore = () => {
    setVisibleCount((current) => Math.min(current + PAGE_SIZE, items.length))
  }

  const renderTimestamp = (timestampMs?: number, blockNumber?: bigint) => {
    if (timestampMs) {
      return new Date(timestampMs).toLocaleString()
    }
    if (blockNumber !== undefined) {
      return `Block ${blockNumber.toString()}`
    }
    return 'Unknown'
  }

  const renderRange = () => {
    if (fromBlock === undefined || toBlock === undefined) {
      return 'Scanning blocks --'
    }
    return `Scanning blocks ${fromBlock.toString()} -> ${toBlock.toString()}`
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0 pb-2">
        <div>
          <CardTitle>On-chain History</CardTitle>
          <CardDescription>
            Infections and cures recorded on-chain for this character.
            <span className="block text-[10px] font-display tracking-widest text-neutral-500 mt-1">
              {renderRange()}
            </span>
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8 px-3 text-xs"
          >
            {isLoading ? <Spinner size="sm" /> : 'Refresh'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSearchOlder}
            disabled={isLoading || !canSearchOlder}
            className="h-8 px-3 text-xs"
          >
            Search older
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && !isLoading && (
          <Alert variant="destructive">{error}</Alert>
        )}

        {isLoading && items.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Empty message="No on-chain history found." />
        )}

        {items.length > 0 && (
          <div className="space-y-3">
            {visibleItems.map((item) => {
              const isInfection = item.kind === 'infection'
              const badgeClass = isInfection
                ? 'bg-red-900/60 border-red-700 text-red-300'
                : 'bg-emerald-900/60 border-emerald-700 text-emerald-300'
              const timestampLabel = renderTimestamp(item.timestampMs, item.blockNumber)
              const actorLabel = item.actor ? shortenAddress(item.actor) : 'Unknown'
              const amountLabel =
                item.kind === 'cure' && item.amount !== undefined
                  ? item.amount.toString()
                  : undefined

              return (
                <div
                  key={`${item.txHash}-${item.logIndex}`}
                  className="border border-neutral-800 bg-black/30 p-3 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={badgeClass}>
                        {isInfection ? 'Infection' : 'Cure'}
                      </Badge>
                      <a
                        href={getTransactionUrl(chainId, item.txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {shortenTransactionHash(item.txHash)}
                      </a>
                    </div>
                    <span className="text-[10px] font-display tracking-widest text-neutral-500">
                      {timestampLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-neutral-300">
                    <div>
                      <span className="text-neutral-500">Actor:</span>{' '}
                      <span className="font-mono">{actorLabel}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Block:</span>{' '}
                      <span className="font-mono">{item.blockNumber.toString()}</span>
                    </div>
                    {amountLabel && (
                      <div>
                        <span className="text-neutral-500">Amount:</span>{' '}
                        <span className="font-mono">{amountLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {items.length > visibleCount && (
          <div className="pt-4">
            <Button variant="secondary" onClick={handleShowMore} className="w-full">
              Show more
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
