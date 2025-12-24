'use client'

// SearingModal Component
// Modal for searing Concords to transform WAGDIE characters

import { useState, useEffect } from 'react'
import { useSearing } from '@/hooks/useSearing'
import { useSingleTokenBalance } from '@/hooks/useTokenBalances'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

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
      setConcordId('')
      setStep('input')
      refetchBalance()
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

  const hasEnoughBalance = concordBalance && concordBalance.balance > 0n

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sear Concords"
      hideFooter
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
          <p className="text-sm text-neutral-400 font-eskapade">Searing Character</p>
          <p className="text-lg font-eskapade text-neutral-200">
            {wagdieName} #{wagdieId}
          </p>
        </div>

        <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
          <p className="text-sm text-neutral-400 font-eskapade">Your Concord Balance</p>
          <p className="text-2xl font-eskapade text-neutral-200">
            {concordBalance?.balance.toString() ?? '0'}
          </p>
          {!hasEnoughBalance && (
            <p className="mt-2 text-xs text-red-400 font-eskapade">
              You need at least 1 Concord token to sear
            </p>
          )}
        </div>

        {step === 'approval' && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="mb-3 text-sm text-yellow-400 font-eskapade">
              Before searing, you need to approve the Searing contract to use your Concord tokens.
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
              <label className="mb-2 block text-sm font-eskapade text-neutral-300">
                Concord Token ID
              </label>
              <input
                type="number"
                value={concordId}
                onChange={(e) => setConcordId(e.target.value)}
                placeholder="Enter Concord ID"
                className="w-full rounded-lg border border-neutral-700 bg-white/10 px-4 py-2 text-neutral-200 placeholder-neutral-500 focus:border-soul-accent focus:outline-none font-eskapade"
                min="1"
                disabled={isSearing}
              />
              <p className="mt-1 text-xs text-neutral-400 font-eskapade">
                The Concord token that will be burned in the searing process
              </p>
            </div>

            <Button
              onClick={handleSear}
              disabled={!hasEnoughBalance || !concordId || isSearing}
              isLoading={isSearing}
              variant="primary"
              className="w-full"
            >
              Sear Concords
            </Button>
          </>
        )}

        {(step === 'searing' || txHash) && (
          <TxStatusComponent
            status={txStatus}
            hash={txHash ?? undefined}
            error={error?.message}
          />
        )}

        {error && step !== 'searing' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
          </div>
        )}

        <div className="rounded-lg border border-soul-accent/20 bg-soul-accent/5 p-4">
          <p className="text-xs text-soul-accent font-eskapade">
            Searing burns a Concord token to permanently transform your WAGDIE character. This
            action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  )
}
