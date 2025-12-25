'use client'

/**
 * CharacterWalletTab Component
 * Displays token balances and staking status.
 * Extracted from page.tsx to reduce complexity.
 */

import { TokenBalancesCard } from '@/components/TokenBalancesCard'
import { StakingStatusCard } from '@/components/StakingStatusCard'

interface CharacterWalletTabProps {
  tokenId: number
}

export function CharacterWalletTab({ tokenId }: CharacterWalletTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TokenBalancesCard />
      <StakingStatusCard tokenId={tokenId} />
    </div>
  )
}
