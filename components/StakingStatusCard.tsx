'use client'

// StakingStatusCard Component
// Displays character staking status

import { useStakingStatus } from '@/hooks/useStaking'
import { shortenAddress } from '@/lib/utils/blockchain'

interface StakingStatusCardProps {
  tokenId: number
  className?: string
}

export function StakingStatusCard({ tokenId, className = '' }: StakingStatusCardProps) {
  const { status, isLoading, error } = useStakingStatus(tokenId)

  return (
    <div className={`rounded-lg border border-white/10 bg-white/5 p-6 ${className}`}>
      <h3 className="mb-4 text-xl font-bold text-white">Staking Status</h3>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-sm text-red-400">{error.message}</p>
        </div>
      )}

      {/* Status Display */}
      {!isLoading && !error && status && (
        <div className="space-y-3">
          {status.isStaked ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏛️</span>
                <div>
                  <p className="text-sm font-medium text-green-400">Staked</p>
                  <p className="text-xs text-gray-400">Character is currently staked</p>
                </div>
              </div>

              {status.locationName && (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="font-medium text-white">{status.locationName}</p>
                  {status.locationId && (
                    <p className="text-xs text-gray-500">ID: {status.locationId.toString()}</p>
                  )}
                </div>
              )}

              {status.locationOwner && (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-gray-400">Location Owner</p>
                  <p className="font-mono text-sm text-white">
                    {shortenAddress(status.locationOwner)}
                  </p>
                </div>
              )}

              {status.nftsLocked && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <p className="text-xs text-yellow-400">
                    ⚠️ NFTs are locked at this location
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏠</span>
              <div>
                <p className="text-sm font-medium text-gray-400">Not Staked</p>
                <p className="text-xs text-gray-500">Character is in your wallet</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
