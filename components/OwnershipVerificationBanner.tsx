'use client'

import React from 'react';
import { useCharacterOwnership } from '@/hooks/useCharacterOwnership'
import { shortenAddress } from '@/lib/utils/blockchain'
import { useAccount } from 'wagmi'
import { Alert } from '@/components/ui/Alert'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'

interface OwnershipVerificationBannerProps {
  tokenId: bigint
  className?: string
}

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

export function OwnershipVerificationBanner({
  tokenId,
  className = '',
}: OwnershipVerificationBannerProps) {
  const { address } = useAccount()
  const { ownership, isLoading, error } = useCharacterOwnership(tokenId)

  if (!address) {
    return null
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 border border-neutral-800 bg-black/30 p-4 ${className}`}>
        <Spinner size="sm" />
        <span className="text-sm font-display  tracking-wider text-neutral-400">Verifying ownership...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" title="Failed to verify ownership" className={className}>
        {error.message}
      </Alert>
    )
  }

  if (ownership?.isOwned) {
    return (
      <div className={`flex items-center gap-3 border border-emerald-900/50 bg-emerald-950/20 p-4 ${className}`}>
        <div className="text-emerald-500">
          <CheckIcon />
        </div>
        <div>
          <p className="text-lg font-display text-emerald-400">You own this character</p>
          <p className="text-[14px] font-display  tracking-widest text-neutral-500">
            Connected: {shortenAddress(address)}
          </p>
        </div>
      </div>
    )
  }

  if (ownership) {
    return (
      <Alert variant="warning" title="Owned by another wallet" icon={<InfoIcon />} className={className}>
        Owner: <span className="font-mono">{shortenAddress(ownership.owner)}</span>
      </Alert>
    )
  }

  return null
}

export function OwnershipBadge({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount()
  const { ownership, isLoading } = useCharacterOwnership(tokenId)

  if (!address || isLoading) {
    return null
  }

  if (ownership?.isOwned) {
    return (
      <Badge variant="accent" className="bg-emerald-900/30 border-emerald-800/50 text-emerald-400">
        Owned
      </Badge>
    )
  }

  return null
}

export function OwnershipStatusText({ tokenId }: { tokenId: bigint }) {
  const { address } = useAccount()
  const { ownership, isLoading } = useCharacterOwnership(tokenId)

  if (!address) {
    return <span className="text-[10px] font-display  tracking-widest text-neutral-600">Connect wallet to verify</span>
  }

  if (isLoading) {
    return <span className="text-[10px] font-display  tracking-widest text-neutral-500">Checking...</span>
  }

  if (ownership?.isOwned) {
    return <span className="text-[10px] font-display  tracking-widest text-emerald-500">You own this</span>
  }

  if (ownership) {
    return (
      <span className="text-[10px] font-display  tracking-widest text-neutral-500">
        Owner: <span className="font-mono">{shortenAddress(ownership.owner)}</span>
      </span>
    )
  }

  return null
}
