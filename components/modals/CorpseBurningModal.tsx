'use client'

// CorpseBurningModal Component
// Modal for burning corpse tokens to get mushrooms

import { useState, useEffect } from 'react'
import { useCorpseBurning } from '@/hooks/useCorpseBurning'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

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

  const amountNum = parseInt(amount, 10) || 0
  const hasEnoughBalance = corpseBalance && BigInt(amountNum) <= corpseBalance

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Touch Corpse"
      hideFooter
    >
      <div className="space-y-4">
        <Spinner size="md" />

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
            <p className="text-sm text-neutral-400">Corpse Tokens</p>
            <p className="text-2xl font-eskapade text-neutral-200">
              {corpseBalance?.toString() ?? '0'}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
            <p className="text-sm text-neutral-400">Mushrooms</p>
            <p className="text-2xl font-eskapade text-neutral-200">
              {mushroomBalance?.toString() ?? '0'}
            </p>
          </div>
        </div>

        {step === 'approval' && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="mb-3 text-sm text-yellow-400 font-eskapade">
              Before burning corpses, you need to approve the Mushroom contract to handle your
              Corpse tokens.
            </p>
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              isLoading={isApproving}
              variant="danger"
              className="w-full"
            >
              Approve Contract
            </Button>
          </div>
        )}

        {step === 'input' && (
          <>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-eskapade text-neutral-300">
                  Amount to Burn
                </label>
                <button
                  onClick={handleMaxClick}
                  className="text-xs text-soul-accent hover:text-soul-accent/80"
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
                className="w-full rounded-lg border border-neutral-700 bg-white/10 px-4 py-2 text-neutral-200 placeholder-neutral-500 focus:border-soul-accent focus:outline-none font-eskapade"
                min="1"
                disabled={isBurning}
              />
              <p className="mt-1 text-xs text-neutral-400 font-eskapade">
                Burn corpses to receive mushrooms (1:1 ratio)
              </p>
            </div>

            {!hasEnoughBalance && amountNum > 0 && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-sm text-red-400 font-eskapade">Insufficient corpse token balance</p>
              </div>
            )}

            <Button
              onClick={handleBurn}
              disabled={
                !hasEnoughBalance ||
                !amount ||
                amountNum <= 0 ||
                isBurning ||
                !corpseBalance ||
                corpseBalance === 0n
              }
              isLoading={isBurning}
              variant="primary"
              className="w-full"
            >
              Touch Corpse
            </Button>
          </>
        )}

        {(step === 'burning' || txHash) && (
          <TxStatusComponent
            status={txStatus}
            hash={txHash ?? undefined}
            error={error?.message}
          />
        )}

        {error && step !== 'burning' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
          </div>
        )}

        <div className="rounded-lg border border-soul-accent/20 bg-soul-accent/5 p-4">
          <p className="text-xs text-soul-accent font-eskapade">
            Burning Corpse tokens will mint an equal amount of Strange Mushroom tokens. This
            action is irreversible.
          </p>
        </div>
      </div>
    </Modal>
  )
}
