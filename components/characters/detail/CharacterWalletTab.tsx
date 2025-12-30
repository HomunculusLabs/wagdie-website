'use client'

/**
 * CharacterWalletTab Component
 * Displays token balances and staking status.
 * Extracted from page.tsx to reduce complexity.
 */

import { TokenBalancesCard } from '@/components/TokenBalancesCard'
import { StakingStatusCard } from '@/components/StakingStatusCard'
import { CharacterTransactionHistoryCard } from '@/components/characters/detail/CharacterTransactionHistoryCard'

interface CharacterWalletTabProps {
  tokenId: number
  ownerAddress?: string | null
  stakerAddress?: string | null
}

export function CharacterWalletTab({
  tokenId,
  ownerAddress,
  stakerAddress,
}: CharacterWalletTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TokenBalancesCard />
      <StakingStatusCard tokenId={tokenId} />
      <CharacterTransactionHistoryCard
        tokenId={tokenId}
        ownerAddress={ownerAddress}
        stakerAddress={stakerAddress}
        className="md:col-span-2"
      />
    </div>
  )
}
