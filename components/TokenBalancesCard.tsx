'use client'

import React from 'react';
import { useTokenBalances } from '@/hooks/useTokenBalances'
import { formatBalanceWithSymbol, getTokenInfo, hasAnyBalance } from '@/lib/utils/balances'
import { useAccount } from 'wagmi'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components-new/Card'
import { Button } from '@/components-new/Button'
import { Spinner } from '@/components-new/Spinner'
import { Alert } from '@/components-new/Alert'
import { Empty } from '@/components-new/Empty'

interface TokenBalancesCardProps {
  className?: string
}

export function TokenBalancesCard({ className = '' }: TokenBalancesCardProps) {
  const { address } = useAccount()
  const { balances, isLoading, error, refetch } = useTokenBalances()

  if (!address) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Connect your wallet to view token balances</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Token Balances</CardTitle>
        <Button
          variant="secondary"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 px-3 text-xs"
        >
          {isLoading ? <Spinner size="sm" /> : 'Refresh'}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive">{error.message}</Alert>
        )}

        {!isLoading && !error && (
          <div className="space-y-2">
            <TokenBalanceRow tokenType="concord" balance={balances.concord?.balance ?? 0n} />
            <TokenBalanceRow tokenType="corpse" balance={balances.corpse?.balance ?? 0n} />
            <TokenBalanceRow tokenType="mushroom" balance={balances.mushroom?.balance ?? 0n} />

            {!hasAnyBalance(balances) && (
              <Empty message="No tokens yet" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TokenBalanceRow({
  tokenType,
  balance,
}: {
  tokenType: 'concord' | 'corpse' | 'mushroom'
  balance: bigint
}) {
  const info = getTokenInfo(tokenType)
  const isZero = balance === 0n

  return (
    <div className="flex items-center justify-between bg-black/30 border border-neutral-800 p-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 items-center justify-center text-sm font-display uppercase"
          style={{ backgroundColor: `${info.color}15`, color: info.color, border: `1px solid ${info.color}40` }}
        >
          {info.symbol[0]}
        </div>
        <div>
          <p className="text-sm font-display uppercase tracking-wider text-neutral-200">{info.name}</p>
          <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500">{info.symbol}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-lg font-display ${isZero ? 'text-neutral-600' : 'text-soul-accent'}`}>
          {balance.toString()}
        </p>
      </div>
    </div>
  )
}

export function TokenBalancesInline({ className = '' }: { className?: string }) {
  const { address } = useAccount()
  const { balances, isLoading } = useTokenBalances()

  if (!address || isLoading) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 text-sm font-display uppercase tracking-wider ${className}`}>
      <span className="text-neutral-500">Balances:</span>
      <span className="text-neutral-200">
        {formatBalanceWithSymbol('concord', balances.concord?.balance ?? 0n)}
      </span>
      <span className="text-neutral-700">•</span>
      <span className="text-neutral-200">
        {formatBalanceWithSymbol('corpse', balances.corpse?.balance ?? 0n)}
      </span>
      <span className="text-neutral-700">•</span>
      <span className="text-neutral-200">
        {formatBalanceWithSymbol('mushroom', balances.mushroom?.balance ?? 0n)}
      </span>
    </div>
  )
}
