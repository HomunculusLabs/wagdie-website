'use client'

// CorpseBurningModal Component
// Modal for burning corpse tokens to get mushrooms

import { useState, useEffect } from 'react'
import { useCorpseBurning } from '@/hooks/useCorpseBurning'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'

interface CorpseBurningModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CorpseBurningModal({ isOpen, onClose, onSuccess }: CorpseBurningModalProps) {
  const [amount, setAmount] = useState('')
  const [step, setStep] = useState<'input' | 'approval' | 'burning'>('input')

  const {
    isBurning,
    isApproving,
    error,
    txHash,
    txStatus,
    corpseBalance,
    mushroomBalance,
    burnCorpse,
    checkApproval,
    approveForBurning,
    fetchBalances,
  } = useCorpseBurning()

  useEffect(() => {
    if (isOpen) {
      setAmount('')
      setStep('input')
      fetchBalances()
      checkIfApproved()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (txStatus === TransactionStatus.SUCCESS && onSuccess) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    }
  }, [txStatus, onSuccess, onClose])

  const checkIfApproved = async () => {
    const approved = await checkApproval()
    if (!approved) {
      setStep('approval')
    }
  }

  const handleApprove = async () => {
    await approveForBurning()
    const approved = await checkApproval()
    if (approved) {
      setStep('input')
    }
  }

  const handleBurn = async () => {
    const amountBigInt = BigInt(amount)
    if (amountBigInt <= 0n) {
      return
    }

    setStep('burning')
    await burnCorpse(amountBigInt)
  }

  const handleMaxClick = () => {
    if (corpseBalance) {
      setAmount(corpseBalance.toString())
    }
  }

  if (!isOpen) return null

  const amountNum = parseInt(amount, 10) || 0
  const hasEnoughBalance = corpseBalance && BigInt(amountNum) <= corpseBalance

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-black p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Touch Corpse</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            disabled={isBurning || isApproving}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Corpse Tokens</p>
              <p className="text-2xl font-bold text-white">
                {corpseBalance?.toString() ?? '0'}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Mushrooms</p>
              <p className="text-2xl font-bold text-white">
                {mushroomBalance?.toString() ?? '0'}
              </p>
            </div>
          </div>

          {/* Approval Step */}
          {step === 'approval' && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="mb-3 text-sm text-yellow-400">
                Before burning corpses, you need to approve the Mushroom contract to handle your
                Corpse tokens.
              </p>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="w-full rounded-lg bg-yellow-500 px-4 py-2 font-medium text-black transition-colors hover:bg-yellow-400 disabled:opacity-50"
              >
                {isApproving ? 'Approving...' : 'Approve Contract'}
              </button>
            </div>
          )}

          {/* Input Step */}
          {step === 'input' && (
            <>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-300">
                    Amount to Burn
                  </label>
                  <button
                    onClick={handleMaxClick}
                    className="text-xs text-blue-400 hover:text-blue-300"
                    disabled={!corpseBalance || corpseBalance === 0n}
                  >
                    Max: {corpseBalance?.toString() ?? '0'}
                  </button>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  min="1"
                  disabled={isBurning}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Burn corpses to receive mushrooms (1:1 ratio)
                </p>
              </div>

              {!hasEnoughBalance && amountNum > 0 && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <p className="text-sm text-red-400">Insufficient corpse token balance</p>
                </div>
              )}

              <button
                onClick={handleBurn}
                disabled={
                  !hasEnoughBalance ||
                  !amount ||
                  amountNum <= 0 ||
                  isBurning ||
                  !corpseBalance ||
                  corpseBalance === 0n
                }
                className="w-full rounded-lg bg-gold px-4 py-3 font-bold text-black transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBurning ? 'Burning...' : 'Touch Corpse'}
              </button>
            </>
          )}

          {/* Transaction Status */}
          {(step === 'burning' || txHash) && (
            <TxStatusComponent
              status={txStatus}
              hash={txHash ?? undefined}
              error={error?.message}
            />
          )}

          {/* Error Display */}
          {error && step !== 'burning' && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs text-blue-300">
              Burning Corpse tokens will mint an equal amount of Strange Mushroom tokens. This
              action is irreversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
