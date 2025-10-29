/**
 * DialogBurnCorpseApproval Component
 * Modal for confirming corpse burn transaction
 */

'use client'

import { DialogMask } from '@/components/shared/DialogMask'

interface DialogBurnCorpseApprovalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  availableCorpses: number
}

export function DialogBurnCorpseApproval({
  isOpen,
  onClose,
  onConfirm,
  availableCorpses
}: DialogBurnCorpseApprovalProps) {
  const handleConfirm = () => {
    onConfirm(availableCorpses)
  }

  return (
    <DialogMask isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-bone mb-4">Burn Corpses</h2>

        <p className="text-ash mb-4">
          You are about to burn <span className="text-gold font-bold">{availableCorpses}</span> corpse
          {availableCorpses !== 1 ? 's' : ''} to receive Strange Mushrooms (Concord #15).
        </p>

        <div className="bg-shadow rounded p-4 mb-6">
          <p className="text-sm text-mist">
            This action requires a blockchain transaction. You will receive mushrooms that can be used
            to spread infections or target specific characters.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors"
          >
            Confirm Burn
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </DialogMask>
  )
}
