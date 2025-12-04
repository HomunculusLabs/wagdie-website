'use client'

/**
 * DeleteConfirmation Component
 * Modal for confirming location deletion with staked character check
 */

import type { Location } from '@/lib/types/map'

interface DeleteConfirmationProps {
  location: Location
  stakedCount: number
  onConfirm: () => Promise<void>
  onCancel: () => void
  isDeleting: boolean
}

export function DeleteConfirmation({
  location,
  stakedCount,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmationProps) {
  const canDelete = stakedCount === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="bg-soul-shadow border border-soul-accent/40 rounded-lg p-6 max-w-md w-full mx-4">
        <h2
          id="delete-modal-title"
          className="font-wagdie text-xl text-soul-accent mb-4"
        >
          Delete Location
        </h2>

        <p className="text-soul-bone mb-4">
          Are you sure you want to delete &quot;{location.name}&quot;?
        </p>

        {!canDelete && (
          <div className="bg-soul-ember/20 border border-soul-ember/40 rounded p-3 mb-4">
            <p className="text-soul-ember flex items-center gap-2">
              <span>⚠️</span>
              <span>
                This location cannot be deleted because {stakedCount}{' '}
                {stakedCount === 1 ? 'character is' : 'characters are'} staked here.
              </span>
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="
              px-4 py-2 bg-abyss text-soul-bone font-wagdie rounded
              border border-soul-accent/60 hover:bg-soul-accent/20 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!canDelete || isDeleting}
            className={`
              px-4 py-2 font-wagdie rounded transition-colors
              ${canDelete
                ? 'bg-soul-ember text-white hover:bg-soul-ember/80'
                : 'bg-soul-mist/20 text-soul-mist cursor-not-allowed'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
