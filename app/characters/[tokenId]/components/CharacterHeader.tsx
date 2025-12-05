'use client'

/**
 * CharacterHeader Component
 * Sticky header with navigation and edit controls.
 */

import { Button } from '@/components-new'

const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

interface CharacterHeaderProps {
  tokenId: number
  isOwner: boolean
  isEditMode: boolean
  isSaving: boolean
  onBack: () => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onChat: () => void
  onAnimated: () => void
}

export function CharacterHeader({
  tokenId,
  isOwner,
  isEditMode,
  isSaving,
  onBack,
  onEdit,
  onSave,
  onCancel,
  onChat,
  onAnimated,
}: CharacterHeaderProps) {
  return (
    <div className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <Button variant="secondary" onClick={onBack} className="gap-2">
            <BackIcon /><span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-lg font-display text-neutral-400">Character #{tokenId}</h1>
          <div className="flex items-center gap-2">
            {isOwner && (
              <>
                {isEditMode ? (
                  <>
                    <Button variant="primary" onClick={onSave} isLoading={isSaving}>Save</Button>
                    <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={onEdit}>Edit</Button>
                )}
              </>
            )}
            <Button variant="secondary" onClick={onChat} className="gap-2">
              <ChatIcon /><span className="hidden sm:inline">Chat</span>
            </Button>
            <Button variant="secondary" onClick={onAnimated}>Animated</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
