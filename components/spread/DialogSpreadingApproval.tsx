/**
 * DialogSpreadingApproval Component
 * Modal for ERC1155 approval (corpse contract)
 */

'use client'

import { DialogMask } from '@/components/shared/DialogMask'
import { Button } from '@/components/ui'

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
    <DialogMask
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledby="approval-dialog-title"
    >
      <div className="p-6">
        <h2 id="approval-dialog-title" className="text-h3 font-display text-neutral-200 mb-4">
          Approval Required
        </h2>

        <p className="text-body text-neutral-400 font-eskapade mb-4">
          Before burning corpses, you need to approve the spreading contract to access your ERC1155 tokens.
        </p>

        <div className="bg-black/40 border border-neutral-800 p-4 mb-6">
          <p className="text-sm text-neutral-500 font-eskapade mb-2">Contract Address:</p>
          <p className="text-xs text-neutral-300 font-mono break-all">{contractAddress}</p>
        </div>

        <p className="text-sm text-neutral-500 font-eskapade mb-6">
          This is a one-time approval. You only need to do this once per contract.
        </p>

        <div className="flex gap-4">
          <Button onClick={onApprove} className="flex-1">
            Approve Contract
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </DialogMask>
  )
}
