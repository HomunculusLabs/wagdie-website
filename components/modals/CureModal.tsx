'use client'

// CureModal Component
// Modal for curing infected characters by burning mushroom tokens

import { useEffect } from 'react'
import { useCure } from '@/hooks/useCure'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'

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

  const handleCure = async () => {
    await cureCharacter(characterId)
  }

  if (!isOpen) return null

  const canCure = cureStatus?.canCure ?? false
  const hasEnoughMushrooms = cureStatus?.hasEnoughMushrooms ?? false
  const mushroomBalance = cureStatus?.mushroomBalance ?? 0n
  const mushroomsRequired = cureStatus?.mushroomsRequired ?? 1n

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-black p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-display text-white">Cure Character</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            disabled={isCuring}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Character Info */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-gray-400">Curing Character</p>
            <p className="text-lg font-display text-white">
              {characterName} #{characterId}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              This character is infected and needs a cure
            </p>
          </div>

          {/* Mushroom Balance & Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Your Mushrooms</p>
              <p className="text-2xl font-display text-white">{mushroomBalance.toString()}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Required</p>
              <p className="text-2xl font-display text-white">{mushroomsRequired.toString()}</p>
            </div>
          </div>

          {/* Warning if insufficient mushrooms */}
          {!hasEnoughMushrooms && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">
                ⚠️ Insufficient mushroom tokens. You need {mushroomsRequired.toString()}{' '}
                mushroom{mushroomsRequired > 1n ? 's' : ''} to cure this character.
              </p>
              <p className="mt-2 text-xs text-gray-400">
                Burn corpses on the Spread page to get mushrooms.
              </p>
            </div>
          )}

          {/* Disabled warning */}
          {cureStatus && !cureStatus.isMintingEnabled && hasEnoughMushrooms && (
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
              <p className="text-sm text-yellow-400">
                ⚠️ Mushroom burning is currently disabled. Please try again later.
              </p>
            </div>
          )}

          {/* Cure Button */}
          <button
            onClick={handleCure}
            disabled={!canCure || isCuring}
            className="w-full rounded-lg bg-green-600 px-4 py-3 font-display text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCuring ? 'Curing...' : `Cure for ${mushroomsRequired} Mushroom${mushroomsRequired > 1n ? 's' : ''}`}
          </button>

          {/* Transaction Status */}
          {txHash && (
            <TxStatusComponent
              status={txStatus}
              hash={txHash ?? undefined}
              error={error?.message}
            />
          )}

          {/* Error Display */}
          {error && !txHash && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs text-green-300">
              💊 Curing a character will burn {mushroomsRequired.toString()} mushroom token
              {mushroomsRequired > 1n ? 's' : ''} and remove the infection status. This action is
              irreversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
