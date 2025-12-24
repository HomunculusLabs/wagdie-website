'use client'

// CureModal Component
// Modal for curing infected characters by burning mushroom tokens

import { useEffect } from 'react'
import { useCure } from '@/hooks/useCure'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface CureModalProps {
  characterId: number
  characterName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CureModal({
  characterId,
  characterName,
  isOpen,
  onClose,
  onSuccess,
}: CureModalProps) {
  const { isCuring, error, txHash, txStatus, cureStatus, cureCharacter, fetchCureStatus } =
    useCure()

  useEffect(() => {
    if (isOpen) {
      fetchCureStatus()
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

  const handleCure = async () => {
    await cureCharacter(characterId)
  }

  const canCure = cureStatus?.canCure ?? false
  const hasEnoughMushrooms = cureStatus?.hasEnoughMushrooms ?? false
  const mushroomBalance = cureStatus?.mushroomBalance ?? 0n
  const mushroomsRequired = cureStatus?.mushroomsRequired ?? 1n

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cure Character"
      hideFooter
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
          <p className="text-sm text-neutral-400 font-eskapade">Curing Character</p>
          <p className="text-lg font-eskapade text-neutral-200">
            {characterName} #{characterId}
          </p>
          <p className="mt-1 text-xs text-neutral-500 font-eskapade">
            This character is infected and needs a cure
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
            <p className="text-sm text-neutral-400 font-eskapade">Your Mushrooms</p>
            <p className="text-2xl font-eskapade text-neutral-200">{mushroomBalance.toString()}</p>
          </div>
          <div className="rounded-lg border border-neutral-700 bg-white/5 p-4">
            <p className="text-sm text-neutral-400 font-eskapade">Required</p>
            <p className="text-2xl font-eskapade text-neutral-200">{mushroomsRequired.toString()}</p>
          </div>
        </div>

        {!hasEnoughMushrooms && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">
              ⚠️ Insufficient mushroom tokens. You need {mushroomsRequired.toString()}{' '}
              mushroom{mushroomsRequired > 1n ? 's' : ''} to cure this character.
            </p>
            <p className="mt-2 text-xs text-neutral-400 font-eskapade">
              Burn corpses on the Spread page to get mushrooms.
            </p>
          </div>
        )}

        {cureStatus && !cureStatus.isMintingEnabled && hasEnoughMushrooms && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-400 font-eskapade">
              ⚠️ Mushroom burning is currently disabled. Please try again later.
            </p>
          </div>
        )}

        <Button
          onClick={handleCure}
          disabled={!canCure || isCuring}
          isLoading={isCuring}
          variant="primary"
          className="w-full"
        >
          Cure for {mushroomsRequired} Mushroom{mushroomsRequired > 1n ? 's' : ''}
        </Button>

        {txHash && (
          <TxStatusComponent
            status={txStatus}
            hash={txHash ?? undefined}
            error={error?.message}
          />
        )}

        {error && !txHash && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
          </div>
        )}

        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <p className="text-xs text-green-300 font-eskapade">
            💊 Curing a character will burn {mushroomsRequired.toString()} mushroom token
            {mushroomsRequired > 1n ? 's' : ''} and remove the infection status. This action is
            irreversible.
          </p>
        </div>
      </div>
    </Modal>
  )
}
