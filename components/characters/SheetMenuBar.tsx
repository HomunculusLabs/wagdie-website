/**
 * SheetMenuBar Component
 * Character sheet header with actions (Edit, Save, Roll New, Back)
 */

'use client'

import { useRouter } from 'next/navigation'

interface SheetMenuBarProps {
  tokenId: number
  isOwner: boolean
  isEditMode: boolean
  onEditToggle: () => void
  onSave: () => void
  onRollNew: () => void
  isSaving?: boolean
}

export function SheetMenuBar({
  tokenId,
  isOwner,
  isEditMode,
  onEditToggle,
  onSave,
  onRollNew,
  isSaving = false
}: SheetMenuBarProps) {
  const router = useRouter()

  return (
    <div className="bg-midnight border-b border-shadow p-4">
      <div className="container mx-auto flex items-center justify-between">
        {/* Left: Back Button */}
        <button
          onClick={() => router.push('/characters')}
          className="flex items-center gap-2 text-ash hover:text-bone transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        {/* Center: Title */}
        <h2 className="text-xl font-bold text-bone">
          Character #{tokenId}
        </h2>

        {/* Right: Owner Actions */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              {isEditMode ? (
                <>
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gold text-abyss font-medium rounded hover:bg-yellow-500 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={onEditToggle}
                    className="px-4 py-2 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onEditToggle}
                    className="px-4 py-2 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={onRollNew}
                    className="px-4 py-2 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
                    title="Roll new character stats"
                  >
                    Roll New
                  </button>
                </>
              )}
            </>
          )}

          {/* Animated View Link */}
          <a
            href={`/characters/${tokenId}/animated`}
            className="px-4 py-2 bg-midnight text-ash border border-shadow rounded hover:text-bone transition-colors"
            title="View animated character"
          >
            Animated
          </a>
        </div>
      </div>
    </div>
  )
}
