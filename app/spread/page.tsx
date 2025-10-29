/**
 * Spread Page
 * Burn corpses for mushrooms, spread infections, or target specific characters
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { DialogBurnCorpseApproval } from '@/components/spread/DialogBurnCorpseApproval'
import { DialogSpreadingApproval } from '@/components/spread/DialogSpreadingApproval'
import { SpreadInfect } from '@/components/spread/SpreadInfect'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CorpseBurningModal } from '@/components/modals/CorpseBurningModal'
import { useSpread } from '@/hooks/useSpread'
import { useSingleTokenBalance } from '@/hooks/useTokenBalances'
import { useCorpseBurning } from '@/hooks/useCorpseBurning'
import { CONTRACTS } from '@/lib/services/wallet-service'
import { formatEther } from 'viem'

export default function SpreadPage() {
  const { address, isConnected } = useAccount()

  // Blockchain hooks
  const { balance: mushroomBalance, refetch: refetchMushroom } = useSingleTokenBalance('mushroom')
  const { balance: corpseBalance, refetch: refetchCorpse } = useSingleTokenBalance('corpse')
  const { infectionPrice, fetchInfectionPrice } = useSpread()
  const { corpseBalance: corpseBalanceFromHook, fetchBalances } = useCorpseBurning()

  // State
  const [mode, setMode] = useState<'spread' | 'infect'>('spread')
  const [showBurnModal, setShowBurnModal] = useState(false)
  const [showInfectionModal, setShowInfectionModal] = useState(false)

  useEffect(() => {
    if (isConnected) {
      fetchInfectionPrice()
      refetchMushroom()
      refetchCorpse()
      fetchBalances()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected])

  // Handle Touch Corpse (burn)
  const handleTouchCorpse = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    const balance = corpseBalance?.balance ?? 0n
    if (balance === 0n) {
      toast.error('You have no corpses to burn')
      return
    }

    setShowBurnModal(true)
  }

  // Open infection modal for random spread
  const handleSpread = async (amount: number) => {
    setShowInfectionModal(true)
  }

  // Open infection modal for targeted infection
  const handleInfect = async (tokenId: number) => {
    toast.info('Use the character detail page to infect specific characters')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <BannerHeader
          title="Spread Infection"
          subtitle="Burn corpses and spread the plague across the realm"
        />

        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-xl text-ash">Connect your wallet to participate in spreading the infection</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <BannerHeader
        title="Spread Infection"
        subtitle="Burn corpses for mushrooms, then spread the plague"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Step 1: Burn Corpses */}
          <div className="bg-midnight rounded-lg p-6">
            <h2 className="text-2xl font-bold text-bone mb-4">Step 1: Touch Corpse</h2>
            <p className="text-ash mb-4">
              Burn your corpse tokens to receive Strange Mushrooms (Concord #15).
            </p>

            <button
              onClick={handleTouchCorpse}
              disabled={(corpseBalance?.balance ?? 0n) === 0n}
              className="px-8 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Touch Corpse ({corpseBalance?.balance.toString() ?? '0'} available)
            </button>
          </div>

          {/* Step 2: Mode Selection */}
          <div className="bg-midnight rounded-lg p-6">
            <h2 className="text-2xl font-bold text-bone mb-4">Step 2: Choose Your Method</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setMode('spread')}
                className={`flex-1 px-6 py-3 rounded font-bold transition-colors ${
                  mode === 'spread'
                    ? 'bg-purple-600 text-white'
                    : 'bg-shadow text-ash hover:text-bone'
                }`}
              >
                Release Spores (Random)
              </button>
              <button
                onClick={() => setMode('infect')}
                className={`flex-1 px-6 py-3 rounded font-bold transition-colors ${
                  mode === 'infect'
                    ? 'bg-red-600 text-white'
                    : 'bg-shadow text-ash hover:text-bone'
                }`}
              >
                Infect Pilgrim (Targeted)
              </button>
            </div>
          </div>

          {/* Step 3: Execute */}
          <SpreadInfect
            mushroomBalance={Number(mushroomBalance?.balance ?? 0n)}
            corpseBalance={Number(corpseBalance?.balance ?? 0n)}
            mode={mode}
            onSpread={handleSpread}
            onInfect={handleInfect}
            infectionPrice={infectionPrice ? formatEther(infectionPrice) : '0'}
          />
        </div>
      </div>

      {/* Modals */}
      <CorpseBurningModal
        isOpen={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        onSuccess={() => {
          toast.success('Corpses burned successfully!')
          refetchCorpse()
          refetchMushroom()
          fetchBalances()
        }}
      />

      <InfectionModal
        mode="random"
        isOpen={showInfectionModal}
        onClose={() => setShowInfectionModal(false)}
        onSuccess={() => {
          toast.success('Infections spread successfully!')
          refetchMushroom()
          window.location.reload()
        }}
      />
    </div>
  )
}
