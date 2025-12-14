'use client'

/**
 * MapEditorContainer Component
 * Main orchestrator for the map editor
 */

import dynamic from 'next/dynamic'
import { useState, useRef, useCallback } from 'react'
import { useMapEditor } from '@/hooks/map/useMapEditor'
import { EditorControls } from './EditorControls'
import { LocationForm } from './LocationForm'
import { DeleteConfirmation } from './DeleteConfirmation'
import { useLocationApi } from '@/hooks/map/useLocationApi'
import { Spinner } from '@/components-new'
import type { IRefPhaserGame } from '@/game/PhaserGame'
import type { CreateLocationInput, UpdateLocationInput } from '@/lib/types/map'

// Dynamically import PhaserGame to avoid SSR issues
const PhaserGame = dynamic(() => import('@/game/PhaserGame'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-abyss">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-soul-mist font-display tracking-widest text-sm">
          Loading Map Editor
        </p>
      </div>
    </div>
  ),
})

export function MapEditorContainer() {
  const phaserRef = useRef<IRefPhaserGame>(null)
  const [mapReady, setMapReady] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [stakedCount, setStakedCount] = useState(0)

  const editor = useMapEditor()
  const locationApi = useLocationApi()

  // Handle scene ready
  const handleSceneReady = useCallback(() => {
    setMapReady(true)
  }, [])

  // Handle save for create/edit
  const handleSave = async (data: CreateLocationInput | UpdateLocationInput) => {
    try {
      if (editor.mode === 'create' && 'coordinates' in data) {
        await editor.createLocation(data as CreateLocationInput)
      } else if (editor.mode === 'edit' && editor.selectedLocation) {
        await editor.updateLocation(editor.selectedLocation.id, data as UpdateLocationInput)
      }
    } catch {
      // Error is already stored in editor.error
    }
  }

  // Handle cancel
  const handleCancel = () => {
    editor.setPendingCoordinates(null)
    editor.selectLocation(null)
    editor.setMode('view')
  }

  // Handle delete click
  const handleDeleteClick = async () => {
    if (!editor.selectedLocation) return

    try {
      const count = await locationApi.checkStakedCharacters(editor.selectedLocation.id)
      setStakedCount(count)
      setShowDeleteModal(true)
    } catch {
      setStakedCount(0)
      setShowDeleteModal(true)
    }
  }

  // Handle delete confirm
  const handleDeleteConfirm = async () => {
    if (!editor.selectedLocation) return

    try {
      await editor.deleteLocation(editor.selectedLocation.id)
      setShowDeleteModal(false)
    } catch {
      // Error is already stored in editor.error
    }
  }

  // Get current coordinates for form
  const getCurrentCoordinates = () => {
    if (editor.pendingCoordinates) {
      return editor.pendingCoordinates
    }

    if (editor.selectedLocation?.metadata?.coordinates) {
      return editor.selectedLocation.metadata.coordinates
    }

    return { x: 0, y: 0 }
  }

  // Show form when in create mode with pending coordinates, or in edit mode with selected location
  const showForm =
    (editor.mode === 'create' && editor.pendingCoordinates) ||
    (editor.mode === 'edit' && editor.selectedLocation)

  return (
    <div className="flex h-[calc(100vh-64px)] bg-abyss">
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Controls */}
        <EditorControls
          mode={editor.mode}
          onModeChange={editor.setMode}
          disabled={editor.isLoading || editor.isSaving}
        />

        {/* Map container */}
        <div className="flex-1 relative">
          {/* Loading overlay */}
          {editor.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-abyss/80 z-20">
              <div className="flex flex-col items-center gap-4">
                <Spinner size="lg" />
                <p className="text-soul-mist font-display">Loading locations...</p>
              </div>
            </div>
          )}

          {/* Error display */}
          {editor.error && (
            <div className="absolute top-4 left-4 right-4 z-30">
              <div className="bg-soul-ember/20 border border-soul-ember rounded p-4 flex justify-between items-center">
                <p className="text-soul-ember">{editor.error}</p>
                <button
                  onClick={editor.clearError}
                  className="text-soul-ember hover:text-soul-bone transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Phaser Canvas */}
          <PhaserGame
            ref={phaserRef}
            onSceneReady={handleSceneReady}
          />

          {/* Instructions */}
          {mapReady && !showForm && (
            <div className="absolute bottom-4 left-4 z-10">
              <p className="text-xs text-soul-mist/60 font-display">
                {editor.mode === 'create'
                  ? 'Click on the map to place a new location pin'
                  : 'Click on a pin to edit it'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar for form */}
      {showForm && (
        <div className="w-80 flex-shrink-0">
          <LocationForm
            mode={editor.mode === 'create' ? 'create' : 'edit'}
            location={editor.selectedLocation ?? undefined}
            coordinates={getCurrentCoordinates()}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={editor.mode === 'edit' ? handleDeleteClick : undefined}
            isSubmitting={editor.isSaving}
          />
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && editor.selectedLocation && (
        <DeleteConfirmation
          location={editor.selectedLocation}
          stakedCount={stakedCount}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={editor.isSaving}
        />
      )}
    </div>
  )
}
