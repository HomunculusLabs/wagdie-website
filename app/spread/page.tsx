/**
 * Spread Page
 * Burn corpses for mushrooms, spread infections, or target specific characters
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { BannerHeader } from '@/components/shared/BannerHeader'
import { DialogBurnCorpseApproval } from '@/components/spread/DialogBurnCorpseApproval'
import { DialogSpreadingApproval } from '@/components/spread/DialogSpreadingApproval'
import { SpreadInfect } from '@/components/spread/SpreadInfect'
import { useWallet } from '@/hooks/useWallet'
import { useBurnCorpses, useSpreadInfections } from '@/hooks/useContractWrite'
import { CONTRACTS } from '@/lib/services/wallet-service'

export default function SpreadPage() {
  const { address, isConnected } = useWallet()
  const burnCorpses = useBurnCorpses()
  const spreadInfections = useSpreadInfections()

  // State
  const [mushroomBalance, setMushroomBalance] = useState(0)
  const [corpseBalance, setCorpseBalance] = useState(5) // Mock data
  const [mode, setMode] = useState<'spread' | 'infect'>('spread')
  const [showBurnModal, setShowBurnModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [isApproved, setIsApproved] = useState(false)

  const infectionPrice = '0.0025' // ETH

  // Handle Touch Corpse (burn)
  const handleTouchCorpse = () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (corpseBalance === 0) {
      toast.error('You have no corpses to burn')
      return
    }

    // Check if approved
    if (!isApproved) {
      setShowApprovalModal(true)
      return
    }

    setShowBurnModal(true)
  }

  // Handle Approval
  const handleApprove = async () => {
    try {
      toast.loading('Approving contract...')
      // TODO: Implement actual approval transaction with wagmi
      // await approveContract()

      // Mock success after 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000))

      setIsApproved(true)
      setShowApprovalModal(false)
      toast.dismiss()
      toast.success('Contract approved!')

      // Show burn modal after approval
      setShowBurnModal(true)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Approval failed')
    }
  }

  // Handle Burn
  const handleBurn = async (amount: number) => {
    try {
      setShowBurnModal(false)
      toast.loading('Burning corpses...')

      // Use contract write hook
      await burnCorpses.write([amount])

      // Update balances
      setCorpseBalance(prev => prev - amount)
      setMushroomBalance(prev => prev + amount)

      toast.dismiss()
      toast.success(`Burned ${amount} corpse${amount !== 1 ? 's' : ''}! Received ${amount} mushroom${amount !== 1 ? 's' : ''}`)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Burn failed')
    }
  }

  // Handle Spread (Random)
  const handleSpread = async (amount: number) => {
    try {
      toast.loading('Releasing spores...')

      // Use contract write hook
      await spreadInfections.write([amount])

      // Update balance
      setMushroomBalance(prev => prev - amount)

      toast.dismiss()
      toast.success(`Released ${amount} spore${amount !== 1 ? 's' : ''}! Infection spreading...`)

      // Reload page after success
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Spread failed')
    }
  }

  // Handle Infect (Targeted)
  const handleInfect = async (tokenId: number) => {
    try {
      toast.loading(`Infecting character #${tokenId}...`)

      // TODO: Implement actual infect transaction with wagmi
      // const tx = await infectWagdie(tokenId, { value: parseEther(infectionPrice) })
      // await tx.wait()

      // Mock success after 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Update balance
      setMushroomBalance(prev => prev - 1)

      toast.dismiss()
      toast.success(`Character #${tokenId} infected!`)

      // Reload page after success
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      toast.dismiss()
      toast.error(error.message || 'Infection failed')
    }
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
              disabled={corpseBalance === 0}
              className="px-8 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Touch Corpse ({corpseBalance} available)
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
            mushroomBalance={mushroomBalance}
            corpseBalance={corpseBalance}
            mode={mode}
            onSpread={handleSpread}
            onInfect={handleInfect}
            infectionPrice={infectionPrice}
          />
        </div>
      </div>

      {/* Modals */}
      <DialogBurnCorpseApproval
        isOpen={showBurnModal}
        onClose={() => setShowBurnModal(false)}
        onConfirm={handleBurn}
        availableCorpses={corpseBalance}
      />

      <DialogSpreadingApproval
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onApprove={handleApprove}
        contractAddress={CONTRACTS.CORPSE}
      />
    </div>
  )
}
