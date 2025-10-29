'use client'

// TokenBalancesCard Component
// Displays user's ERC1155 token balances

import { useTokenBalances } from '@/hooks/useTokenBalances'
import { formatBalanceWithSymbol, getTokenInfo, hasAnyBalance } from '@/lib/utils/balances'
import { useAccount } from 'wagmi'

interface TokenBalancesCardProps {
  className?: string
}

export function TokenBalancesCard({ className = '' }: TokenBalancesCardProps) {
  const { address } = useAccount()
  const { balances, isLoading, error, refetch } = useTokenBalances()

  if (!address) {
    return (
      <div className={`rounded-lg border border-white/10 bg-white/5 p-6 ${className}`}>
        <h3 className="mb-4 text-xl font-bold text-white">Token Balances</h3>
        <p className="text-sm text-gray-400">Connect your wallet to view token balances</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 p-6 ${className}`}>
      {/* Header with Refresh Button */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Token Balances</h3>
        <button
          onClick={refetch}
          disabled={isLoading}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/20 disabled:opacity-50"
        >
          {isLoading ? '↻' : '↻ Refresh'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      {/* Balances Display */}
      {!isLoading && !error && (
        <div className="space-y-3">
          {/* Concord Balance */}
          <TokenBalanceRow
            tokenType="concord"
            balance={balances.concord?.balance ?? 0n}
          />

          {/* Corpse Balance */}
          <TokenBalanceRow
            tokenType="corpse"
            balance={balances.corpse?.balance ?? 0n}
          />

          {/* Mushroom Balance */}
          <TokenBalanceRow
            tokenType="mushroom"
            balance={balances.mushroom?.balance ?? 0n}
          />

          {/* No balances message */}
          {!hasAnyBalance(balances) && (
            <p className="pt-2 text-center text-sm text-gray-500">
              You don't have any tokens yet
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Individual token balance row
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
    <div className="flex items-center justify-between rounded-lg bg-white/5 p-3">
      <div className="flex items-center gap-3">
        {/* Token Icon Placeholder */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
          style={{ backgroundColor: `${info.color}20`, color: info.color }}
        >
          {info.symbol[0]}
        </div>

        {/* Token Info */}
        <div>
          <p className="text-sm font-medium text-white">{info.name}</p>
          <p className="text-xs text-gray-400">{info.symbol}</p>
        </div>
      </div>

      {/* Balance */}
      <div className="text-right">
        <p className={`text-lg font-bold ${isZero ? 'text-gray-500' : 'text-white'}`}>
          {balance.toString()}
        </p>
      </div>
    </div>
  )
}

// Compact version for inline display
export function TokenBalancesInline({ className = '' }: { className?: string }) {
  const { address } = useAccount()
  const { balances, isLoading } = useTokenBalances()

  if (!address || isLoading) {
    return null
  }

  return (
    <div className={`flex items-center gap-3 text-sm ${className}`}>
      <span className="text-gray-400">Balances:</span>
      <span className="text-white">
        {formatBalanceWithSymbol('concord', balances.concord?.balance ?? 0n)}
      </span>
      <span className="text-gray-500">•</span>
      <span className="text-white">
        {formatBalanceWithSymbol('corpse', balances.corpse?.balance ?? 0n)}
      </span>
      <span className="text-gray-500">•</span>
      <span className="text-white">
        {formatBalanceWithSymbol('mushroom', balances.mushroom?.balance ?? 0n)}
      </span>
    </div>
  )
}
