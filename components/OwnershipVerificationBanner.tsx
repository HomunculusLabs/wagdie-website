'use client'

// OwnershipVerificationBanner Component
// Displays ownership verification status for a character

import { useCharacterOwnership } from '@/hooks/useCharacterOwnership'
import { shortenAddress } from '@/lib/utils/blockchain'
import { useAccount } from 'wagmi'

interface OwnershipVerificationBannerProps {
  tokenId: bigint
  className?: string
}

export function OwnershipVerificationBanner({
  tokenId,
  className = '',
}: OwnershipVerificationBannerProps) {
  const { address } = useAccount()
  const { ownership, isLoading, error } = useCharacterOwnership(tokenId)

  // Don't show banner if not connected
  if (!address) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded-lg border border-white/10 bg-white/5 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />
          <span className="text-sm text-gray-300">Verifying ownership...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`rounded-lg border border-red-500/20 bg-red-500/5 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-400">Failed to verify ownership</p>
            <p className="text-xs text-gray-400">{error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // Owned by connected wallet
  if (ownership?.isOwned) {
    return (
      <div className={`rounded-lg border border-green-500/20 bg-green-500/5 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">✅</span>
          <div>
            <p className="text-sm font-medium text-green-400">You own this character</p>
            <p className="text-xs text-gray-400">
              Connected wallet: {shortenAddress(address)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Owned by different wallet
  if (ownership) {
    return (
      <div className={`rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <span className="text-lg">ℹ️</span>
          <div>
            <p className="text-sm font-medium text-yellow-400">Owned by another wallet</p>
            <p className="text-xs text-gray-400">
              Owner: {shortenAddress(ownership.owner)}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// Compact ownership badge for character cards
export function OwnershipBadge({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount()
  const { ownership, isLoading } = useCharacterOwnership(tokenId)

  if (!address || isLoading) {
    return null
  }

  if (ownership?.isOwned) {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
        <span>✅</span>
        <span>Owned</span>
      </div>
    )
  }

  return null
}

// Inline ownership status text
export function OwnershipStatusText({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount()
  const { ownership, isLoading } = useCharacterOwnership(tokenId)

  if (!address) {
    return <span className="text-xs text-gray-500">Connect wallet to verify ownership</span>
  }

  if (isLoading) {
    return <span className="text-xs text-gray-400">Checking ownership...</span>
  }

  if (ownership?.isOwned) {
    return <span className="text-xs text-green-400">You own this character</span>
  }

  if (ownership) {
    return (
      <span className="text-xs text-gray-400">
        Owned by {shortenAddress(ownership.owner)}
      </span>
    )
  }

  return null
}
