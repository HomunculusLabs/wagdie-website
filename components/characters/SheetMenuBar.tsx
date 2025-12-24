'use client'

import React from 'react';
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

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
    <div className="bg-black/80 border-b border-neutral-800 py-4 px-6 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => router.push('/characters')}
          className="gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>

        <h2 className="text-lg font-eskapade  tracking-widest text-neutral-200">
          Character #{tokenId}
        </h2>

        <div className="flex items-center gap-3">
          {isOwner && (
            <>
              {isEditMode ? (
                <>
                  <Button
                    variant="primary"
                    onClick={onSave}
                    isLoading={isSaving}
                  >
                    Save
                  </Button>
                  <Button variant="secondary" onClick={onEditToggle}>
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="secondary" onClick={onEditToggle}>
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={onRollNew}
                    title="Roll new character stats"
                  >
                    Roll New
                  </Button>
                </>
              )}
            </>
          )}

          <Button
            variant="secondary"
            onClick={() => router.push(`/characters/${tokenId}/animated`)}
            title="View animated character"
          >
            Animated
          </Button>
        </div>
      </div>
    </div>
  )
}
