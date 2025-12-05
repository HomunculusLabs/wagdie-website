/**
 * Spread Page
 * Burn corpses for mushrooms, spread infections, or target specific characters
 */

'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { SpreadInfect } from '@/components/spread/SpreadInfect'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CorpseBurningModal } from '@/components/modals/CorpseBurningModal'
import { Card, CardHeader, CardTitle, CardContent, Button, Empty } from '@/components/ui'
import { useSpread } from '@/hooks/useSpread'
import { useSingleTokenBalance } from '@/hooks/useTokenBalances'
import { useCorpseBurning } from '@/hooks/useCorpseBurning'
import { formatEther } from 'viem'

export default function SpreadPage() {
  const { isConnected } = useAccount()

  // Blockchain hooks
  const { balance: mushroomBalance, refetch: refetchMushroom } = useSingleTokenBalance('mushroom')
  const { balance: corpseBalance, refetch: refetchCorpse } = useSingleTokenBalance('corpse')
  const { infectionPrice, fetchInfectionPrice } = useSpread()
  const { fetchBalances } = useCorpseBurning()

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
  const handleSpread = async (_amount: number) => {
    setShowInfectionModal(true)
  }

  // Open infection modal for targeted infection
  const handleInfect = async (_tokenId: number) => {
    toast('Use the character detail page to infect specific characters')
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <BannerHeader
          title="Spread Infection"
          subtitle="Burn corpses and spread the plague across the realm"
        />

        <div className="container mx-auto px-4 py-20 max-w-4xl">
          <Empty
            message="Connect your wallet to spread the infection"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            }
          />
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Step 1: Burn Corpses */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Touch Corpse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 font-eskapade mb-6">
                Burn your corpse tokens to receive Strange Mushrooms (Concord #15).
              </p>

              <Button
                variant="primary"
                onClick={handleTouchCorpse}
                disabled={(corpseBalance?.balance ?? 0n) === 0n}
              >
                Touch Corpse ({corpseBalance?.balance.toString() ?? '0'} available)
              </Button>
            </CardContent>
          </Card>

          {/* Step 2: Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Choose Your Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setMode('spread')}
                  className={`flex-1 px-6 py-4 border font-display  tracking-wider text-sm transition-all duration-300 ${
                    mode === 'spread'
                      ? 'bg-arcane/20 border-arcane text-arcane shadow-[0_0_15px_rgba(106,76,147,0.3)]'
                      : 'bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  Release Spores (Random)
                </button>
                <button
                  onClick={() => setMode('infect')}
                  className={`flex-1 px-6 py-4 border font-display  tracking-wider text-sm transition-all duration-300 ${
                    mode === 'infect'
                      ? 'bg-red-950/30 border-red-900 text-red-500 shadow-[0_0_15px_rgba(153,27,27,0.3)]'
                      : 'bg-transparent border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                  }`}
                >
                  Infect Pilgrim (Targeted)
                </button>
              </div>
            </CardContent>
          </Card>

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
