/**
 * AIPersonaTab Component
 * Container for AI persona editing within character detail page
 */

'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import { PersonalityEditor } from './PersonalityEditor'
import { SystemPromptEditor } from './SystemPromptEditor'
import { ExampleMessagesEditor } from './ExampleMessagesEditor'
import { useAICharacter } from '@/hooks/useAICharacter'
import { Card, CardContent, Button, Spinner } from '@/components-new'
import type { ExampleMessage, DraftAIPersona, UpdateAICharacterInput } from '@/types/eliza'

interface AIPersonaTabProps {
  tokenId: string
  isOwner: boolean
  characterName?: string
  characterBackstory?: string
}

// Local storage key for drafts
const getDraftKey = (tokenId: string) => `wagdie-ai-draft-${tokenId}`

function AIPersonaTabComponent({
  tokenId,
  isOwner,
  characterName = '',
  characterBackstory = '',
}: AIPersonaTabProps) {
  const { isConnected } = useAccount()
  const { aiCharacter, isLoading, isSaving, error, saveAICharacter, clearError } = useAICharacter(tokenId)

  // Local state for editing
  const [personality, setPersonality] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [exampleMessages, setExampleMessages] = useState<ExampleMessage[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load data from AI character or draft
  useEffect(() => {
    if (isLoading) return

    // Try to load draft first
    const draftKey = getDraftKey(tokenId)
    const savedDraft = localStorage.getItem(draftKey)

    if (savedDraft) {
      try {
        const draft: DraftAIPersona = JSON.parse(savedDraft)
        setPersonality(draft.personality || '')
        setSystemPrompt(draft.systemPrompt || '')
        setExampleMessages(draft.exampleMessages || [])
        setHasUnsavedChanges(true)
        return
      } catch {
        // Invalid draft, remove it
        localStorage.removeItem(draftKey)
      }
    }

    // Load from AI character
    if (aiCharacter) {
      setPersonality(aiCharacter.personality || '')
      setSystemPrompt(aiCharacter.systemPrompt || '')
      setExampleMessages(aiCharacter.exampleMessages || [])
    } else {
      // Empty state - use character backstory as starting point
      setPersonality('')
      setSystemPrompt('')
      setExampleMessages([])
    }
    setHasUnsavedChanges(false)
  }, [aiCharacter, isLoading, tokenId])

  // Save draft to local storage when changes are made
  useEffect(() => {
    if (!hasUnsavedChanges || !isOwner) return

    const draft: DraftAIPersona = {
      tokenId,
      personality,
      systemPrompt,
      exampleMessages,
      savedAt: new Date().toISOString(),
    }

    localStorage.setItem(getDraftKey(tokenId), JSON.stringify(draft))
  }, [personality, systemPrompt, exampleMessages, hasUnsavedChanges, tokenId, isOwner])

  // Track changes
  const handlePersonalityChange = useCallback((value: string) => {
    setPersonality(value)
    setHasUnsavedChanges(true)
  }, [])

  const handleSystemPromptChange = useCallback((value: string) => {
    setSystemPrompt(value)
    setHasUnsavedChanges(true)
  }, [])

  const handleExampleMessagesChange = useCallback((value: ExampleMessage[]) => {
    setExampleMessages(value)
    setHasUnsavedChanges(true)
  }, [])

  // Save handler
  const handleSave = useCallback(async () => {
    const data: UpdateAICharacterInput = {
      name: characterName || undefined,
      personality: personality || undefined,
      backstory: characterBackstory || undefined,
      systemPrompt: systemPrompt || undefined,
      exampleMessages: exampleMessages.length > 0 ? exampleMessages : undefined,
    }

    const success = await saveAICharacter(data)

    if (success) {
      // Clear draft
      localStorage.removeItem(getDraftKey(tokenId))
      setHasUnsavedChanges(false)
      toast.success('AI persona saved successfully!')
    } else {
      toast.error('Failed to save AI persona')
    }
  }, [personality, systemPrompt, exampleMessages, characterName, characterBackstory, tokenId, saveAICharacter])

  // Discard changes
  const handleDiscard = useCallback(() => {
    localStorage.removeItem(getDraftKey(tokenId))

    if (aiCharacter) {
      setPersonality(aiCharacter.personality || '')
      setSystemPrompt(aiCharacter.systemPrompt || '')
      setExampleMessages(aiCharacter.exampleMessages || [])
    } else {
      setPersonality('')
      setSystemPrompt('')
      setExampleMessages([])
    }

    setHasUnsavedChanges(false)
    toast.success('Changes discarded')
  }, [aiCharacter, tokenId])

  const readOnly = !isOwner

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex flex-col items-center justify-center">
          <Spinner size="lg" />
          <p className="mt-4 text-sm text-neutral-500">Loading AI persona...</p>
        </CardContent>
      </Card>
    )
  }

  // Empty state for non-owners
  if (!aiCharacter && !isOwner) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4 opacity-30">🤖</div>
          <h3 className="text-lg font-display text-neutral-200 mb-2">
            No AI Persona Configured
          </h3>
          <p className="text-sm text-neutral-500">
            The owner of this character hasn&apos;t configured an AI persona yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Empty state for owners - prompt to configure
  if (!aiCharacter && isOwner) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-4xl mb-4 opacity-50">🤖</div>
          <h3 className="text-lg font-display text-neutral-200 mb-2">
            Configure AI Persona
          </h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
            Give your character a personality! Configure how they speak and behave
            in chat conversations.
          </p>
          <div className="space-y-6 text-left max-w-2xl mx-auto">
            <PersonalityEditor
              value={personality}
              onChange={handlePersonalityChange}
              disabled={isSaving}
            />
            <SystemPromptEditor
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              disabled={isSaving}
            />
            <ExampleMessagesEditor
              value={exampleMessages}
              onChange={handleExampleMessagesChange}
              disabled={isSaving}
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={!personality.trim()}
              >
                Create AI Persona
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        {/* Error display */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Unsaved changes warning */}
        {hasUnsavedChanges && isOwner && (
          <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
            <p className="text-sm text-amber-400">
              You have unsaved changes. They&apos;re saved locally as a draft.
            </p>
          </div>
        )}

        {/* Wallet not connected warning for owners */}
        {isOwner && !isConnected && (
          <div className="p-3 bg-soul-900/20 border border-soul-800/50 rounded-lg">
            <p className="text-sm text-soul-400">
              Connect your wallet to save changes to your AI persona.
            </p>
          </div>
        )}

        <PersonalityEditor
          value={personality}
          onChange={handlePersonalityChange}
          disabled={isSaving}
          readOnly={readOnly}
        />

        <SystemPromptEditor
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          disabled={isSaving}
          readOnly={readOnly}
        />

        <ExampleMessagesEditor
          value={exampleMessages}
          onChange={handleExampleMessagesChange}
          disabled={isSaving}
          readOnly={readOnly}
        />

        {/* Action buttons for owners */}
        {isOwner && (
          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            {hasUnsavedChanges && (
              <Button
                variant="secondary"
                onClick={handleDiscard}
                disabled={isSaving}
              >
                Discard Changes
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!hasUnsavedChanges || !isConnected}
            >
              Save AI Persona
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const AIPersonaTab = memo(AIPersonaTabComponent)
