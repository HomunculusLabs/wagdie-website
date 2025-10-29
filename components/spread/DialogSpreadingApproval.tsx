/**
 * DialogSpreadingApproval Component
 * Modal for ERC1155 approval (corpse contract)
 */

'use client'

import { DialogMask } from '@/components/shared/DialogMask'

interface DialogSpreadingApprovalProps {
  isOpen: boolean
  onClose: () => void
  onApprove: () => void
  contractAddress: string
}

export function DialogSpreadingApproval({
  isOpen,
  onClose,
  onApprove,
  contractAddress
}: DialogSpreadingApprovalProps) {
  return (
    <DialogMask isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-bone mb-4">Approval Required</h2>

        <p className="text-ash mb-4">
          Before burning corpses, you need to approve the spreading contract to access your ERC1155 tokens.
        </p>

        <div className="bg-shadow rounded p-4 mb-6">
          <p className="text-sm text-mist mb-2">Contract Address:</p>
          <p className="text-xs text-bone font-mono break-all">{contractAddress}</p>
        </div>

        <p className="text-sm text-mist mb-6">
          This is a one-time approval. You only need to do this once per contract.
        </p>

        <div className="flex gap-4">
          <button
            onClick={onApprove}
            className="flex-1 px-6 py-3 bg-gold text-abyss font-bold rounded hover:bg-yellow-500 transition-colors"
          >
            Approve Contract
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
