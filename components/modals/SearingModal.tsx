'use client'

// SearingModal Component
// Modal for searing Concords to transform WAGDIE characters

import { useState, useEffect } from 'react'
import { useSearing } from '@/hooks/useSearing'
import { useSingleTokenBalance } from '@/hooks/useTokenBalances'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'

interface SearingModalProps {
  wagdieId: number
  wagdieName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SearingModal({
  wagdieId,
  wagdieName,
  isOpen,
  onClose,
  onSuccess,
}: SearingModalProps) {
  const [concordId, setConcordId] = useState('')
  const [step, setStep] = useState<'input' | 'approval' | 'searing'>('input')

  const { balance: concordBalance, refetch: refetchBalance } = useSingleTokenBalance('concord')
  const {
    isSearing,
    isApproving,
    error,
    txHash,
    txStatus,
    searConcords,
    checkApproval,
    approveForSearing,
  } = useSearing()

  useEffect(() => {
    if (isOpen) {
      // Reset state when modal opens
      setConcordId('')
      setStep('input')
      refetchBalance()
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
    await approveForSearing()
    const approved = await checkApproval()
    if (approved) {
      setStep('input')
    }
  }

  const handleSear = async () => {
    const concordIdNum = parseInt(concordId, 10)
    if (isNaN(concordIdNum) || concordIdNum <= 0) {
      return
    }

    setStep('searing')
    await searConcords(wagdieId, concordIdNum)
  }

  if (!isOpen) return null

  const hasEnoughBalance = concordBalance && concordBalance.balance > 0n

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-black p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Sear Concords</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            disabled={isSearing || isApproving}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Character Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">Searing Character</p>
            <p className="text-lg font-bold text-white">
              {wagdieName} #{wagdieId}
            </p>
          </div>

          {/* Balance Display */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">Your Concord Balance</p>
            <p className="text-2xl font-bold text-white">
              {concordBalance?.balance.toString() ?? '0'}
            </p>
            {!hasEnoughBalance && (
              <p className="mt-2 text-xs text-red-400">
                You need at least 1 Concord token to sear
              </p>
            )}
          </div>

          {/* Approval Step */}
          {step === 'approval' && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="mb-3 text-sm text-yellow-400">
                Before searing, you need to approve the Searing contract to use your Concord tokens.
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
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Concord Token ID
                </label>
                <input
                  type="number"
                  value={concordId}
                  onChange={(e) => setConcordId(e.target.value)}
                  placeholder="Enter Concord ID"
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  min="1"
                  disabled={isSearing}
                />
                <p className="mt-1 text-xs text-gray-400">
                  The Concord token that will be burned in the searing process
                </p>
              </div>

              <button
                onClick={handleSear}
                disabled={!hasEnoughBalance || !concordId || isSearing}
                className="w-full rounded-lg bg-purple-600 px-4 py-3 font-bold text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearing ? 'Searing...' : 'Sear Concords'}
              </button>
            </>
          )}

          {/* Transaction Status */}
          {(step === 'searing' || txHash) && (
            <TxStatusComponent
              status={txStatus}
              hash={txHash ?? undefined}
              error={error?.message}
            />
          )}

          {/* Error Display */}
          {error && step !== 'searing' && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs text-blue-300">
              Searing burns a Concord token to permanently transform your WAGDIE character. This
              action cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
