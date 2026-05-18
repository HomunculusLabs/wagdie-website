/**
 * AIPersonaTab Component
 * Container for AI persona editing within character detail page
 * Refactored to use full Eliza SDK fields with 4-tab interface
 */

'use client'

import { useState, useCallback, useRef, memo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import toast from 'react-hot-toast'
import { TabNavigation, type Tab } from './shared'
import { IdentityTab } from './tabs/IdentityTab'
import { BehaviorTab } from './tabs/BehaviorTab'
import { ExamplesTab } from './tabs/ExamplesTab'
import { AdvancedTab } from './tabs/AdvancedTab'
import { PersonaAssistantPanel } from './assistant'
import { useAICharacter } from '@/hooks/useAICharacter'
import { useAIPersonaEditor } from '@/hooks/useAIPersonaEditor'
import { useKnowledgeUpload } from '@/hooks/useKnowledgeUpload'
import { Card, CardContent, Button, Spinner } from '@/components/ui'
import type { ElizaCharacterExport } from '@/types/eliza'

interface AIPersonaTabProps {
  tokenId: string
  isOwner: boolean
  characterName?: string
  characterBackstory?: string
}

type TabId = 'identity' | 'behavior' | 'examples' | 'advanced'

const TABS: Tab[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'behavior', label: 'Behavior' },
  { id: 'examples', label: 'Examples' },
  { id: 'advanced', label: 'Advanced' },
]

function AIPersonaTabComponent({
  tokenId,
  isOwner,
}: AIPersonaTabProps) {
  const { isConnected } = useAccount()
  const {
    aiCharacter,
    isLoading,
    isSaving,
    isImporting,
    error,
    saveAICharacter,
    exportCharacter,
    importCharacter,
    clearError,
  } = useAICharacter(tokenId)

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Editor state management
  const editor = useAIPersonaEditor(tokenId, aiCharacter, isLoading)

  // Knowledge document management
  const knowledge = useKnowledgeUpload(tokenId)

  // Active tab state
  const [activeTab, setActiveTab] = useState<TabId>('identity')

  // Initialize knowledge documents from AI character
  useEffect(() => {
    if (aiCharacter?.knowledge) {
      knowledge.setDocuments(aiCharacter.knowledge)
    }
  }, [aiCharacter?.knowledge, knowledge])

  // Save handler
  const handleSave = useCallback(async () => {
    const updateData = editor.getUpdateInput()

    const success = await saveAICharacter(updateData)

    if (success) {
      editor.clearDraft()
      toast.success('AI persona saved successfully!')
    } else {
      toast.error('Failed to save AI persona')
    }
  }, [editor, saveAICharacter])

  // Discard changes
  const handleDiscard = useCallback(() => {
    editor.discardDraft()
    toast.success('Changes discarded')
  }, [editor])

  // Knowledge upload handler
  const handleKnowledgeUpload = useCallback(
    async (file: File) => {
      await knowledge.uploadDocument(file)
    },
    [knowledge]
  )

  // Knowledge remove handler
  const handleKnowledgeRemove = useCallback(
    (documentId: string) => {
      knowledge.deleteDocument(documentId)
    },
    [knowledge]
  )

  // Export handler
  const handleExport = useCallback(async () => {
    try {
      await exportCharacter()
      toast.success('Character exported successfully!')
    } catch {
      toast.error('Failed to export character')
    }
  }, [exportCharacter])

  // Import file selection
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Import file handler
  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Reset input for re-selection
      event.target.value = ''

      try {
        const text = await file.text()
        const data = JSON.parse(text) as ElizaCharacterExport

        const result = await importCharacter(data)

        if (result) {
          if (result.success) {
            const importedFields = result.imported.join(', ')
            toast.success(`Imported: ${importedFields}`)

            if (result.warnings.length > 0) {
              result.warnings.forEach((warning) => {
                toast(warning, { icon: '⚠️', duration: 5000 })
              })
            }

            if (result.skipped.length > 0) {
              toast(`Skipped: ${result.skipped.join(', ')}`, { icon: 'ℹ️' })
            }

            // Reload editor state from refreshed character
            editor.discardDraft()
          }
        }
      } catch (err) {
        if (err instanceof SyntaxError) {
          toast.error('Invalid JSON file')
        } else {
          toast.error('Failed to import character')
        }
      }
    },
    [importCharacter, editor]
  )

  const readOnly = !isOwner

  // Determine which tabs have errors or changes
  const tabsWithState = TABS.map((tab) => ({
    ...tab,
    hasChanges: editor.hasUnsavedChanges,
  }))

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

  return (
    <Card>
      <CardContent className="p-0">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleImportFile}
          className="hidden"
          aria-hidden="true"
        />

        {/* Header with import/export buttons */}
        {isOwner && aiCharacter && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <h3 className="text-sm font-medium text-neutral-300">AI Persona Configuration</h3>
            <div className="flex gap-2">
              <button
                onClick={handleImportClick}
                disabled={isImporting || isSaving}
                title="Import from JSON file"
                className="flex items-center px-3 py-1.5 text-xs font-display border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <Spinner size="sm" className="mr-1" />
                    Importing...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Import
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                disabled={isImporting || isSaving}
                title="Export to JSON file"
                className="flex items-center px-3 py-1.5 text-xs font-display border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="m-4 mb-0 p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-400">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Warnings */}
        <div className="px-4 pt-4 space-y-2">
          {/* Unsaved changes warning */}
          {editor.hasUnsavedChanges && isOwner && (
            <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
              <p className="text-md text-amber-400">
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
        </div>

        {/* Owner-facing persona assistant */}
        {isOwner && (
          <div className="px-4 pt-4">
            <PersonaAssistantPanel
              tokenId={tokenId}
              isOwner={isOwner}
              isConnected={isConnected}
              disabled={isSaving || isImporting}
              getAssistantSnapshot={editor.getAssistantSnapshot}
              applyAssistantDraft={editor.applyAssistantDraft}
            />
          </div>
        )}

        {/* Tab navigation */}
        <div className="px-4">
          <TabNavigation tabs={tabsWithState} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)} />
        </div>

        {/* Tab content */}
        <div className="px-4 pb-4">
          {activeTab === 'identity' && (
            <IdentityTab
              username={editor.state.username}
              backstory={editor.state.backstory}
              bio={editor.state.bio}
              lore={editor.state.lore}
              onUsernameChange={editor.setUsername}
              onBackstoryChange={editor.setBackstory}
              onBioChange={editor.setBio}
              onLoreChange={editor.setLore}
              disabled={isSaving}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'behavior' && (
            <BehaviorTab
              topics={editor.state.topics}
              adjectives={editor.state.adjectives}
              style={editor.state.style}
              onTopicsChange={editor.setTopics}
              onAdjectivesChange={editor.setAdjectives}
              onStyleChange={editor.setStyle}
              disabled={isSaving}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'examples' && (
            <ExamplesTab
              exampleMessages={editor.state.exampleMessages}
              postExamples={editor.state.postExamples}
              onExampleMessagesChange={editor.setExampleMessages}
              onPostExamplesChange={editor.setPostExamples}
              disabled={isSaving}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'advanced' && (
            <AdvancedTab
              systemPrompt={editor.state.systemPrompt}
              templates={editor.state.templates}
              settings={editor.state.settings}
              knowledgeDocuments={knowledge.documents}
              isUploadingKnowledge={knowledge.isUploading}
              onSystemPromptChange={editor.setSystemPrompt}
              onTemplatesChange={editor.setTemplates}
              onSettingsChange={editor.setSettings}
              onKnowledgeUpload={handleKnowledgeUpload}
              onKnowledgeRemove={handleKnowledgeRemove}
              disabled={isSaving}
              readOnly={readOnly}
              knowledgeError={knowledge.error}
            />
          )}
        </div>

        {/* Action buttons for owners */}
        {isOwner && (
          <div className="flex justify-end gap-3 px-4 py-4 border-t border-neutral-800">
            {editor.hasUnsavedChanges && (
              <Button variant="secondary" onClick={handleDiscard} disabled={isSaving}>
                Discard Changes
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!editor.hasUnsavedChanges || !isConnected}
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
