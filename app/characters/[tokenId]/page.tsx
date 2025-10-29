/**
 * Character Detail Page
 * Display character sheet with stats, story, equipment
 * Allow owners to edit and perform blockchain actions
 * Uses clean architecture: presentation layer only
 */

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { SheetMenuBar } from '@/components/characters/SheetMenuBar'
import { SheetTitleAndAttributes } from '@/components/characters/SheetTitleAndAttributes'
import { SheetBackgroundStory } from '@/components/characters/SheetBackgroundStory'
import { SheetEquipment } from '@/components/characters/SheetEquipment'
import { useCharacterDetail, useUpdateCharacter } from '@/hooks/useCharacterDetail'
import { useWallet } from '@/hooks/useWallet'
import type { Character } from '@/types/character'

export default function CharacterDetailPage() {
  const params = useParams()
  const { address } = useWallet()
  const tokenId = parseInt(params.tokenId as string, 10)

  const [isEditMode, setIsEditMode] = useState(false)
  const [editedStory, setEditedStory] = useState('')

  // Fetch character data using custom hook
  const { data: character, isLoading, refetch } = useCharacterDetail(tokenId)

  // Update character mutation
  const updateCharacter = useUpdateCharacter()

  // Initialize edited story when character loads
  useEffect(() => {
    if (character) {
      setEditedStory(character.background_story || '')
    }
  }, [character])

  // Check if user owns this character
  const isOwner = character && address
    ? character.owner_address?.toLowerCase() === address.toLowerCase()
    : false

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel editing - reset story
      setEditedStory(character?.background_story || '')
    }
    setIsEditMode(!isEditMode)
  }

  // Save changes
  const handleSave = async () => {
    if (!character) return

    try {
      await updateCharacter.mutateAsync({
        tokenId,
        updates: {
          background_story: editedStory,
        },
      })

      setIsEditMode(false)
      toast.success('Character updated successfully!')
    } catch (error: any) {
      console.error('Error saving character:', error)
      toast.error(error.message || 'Failed to save changes')
    }
  }

  // Roll new character stats (client-side randomization)
  const handleRollNew = () => {
    if (!character) return

    const confirmed = window.confirm(
      'This will generate new random stats for your character. Continue?'
    )

    if (!confirmed) return

    // Generate random D&D-style stats (3d6 for each attribute)
    const rollStat = () => {
      const dice = [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      return dice.reduce((sum, die) => sum + die, 0)
    }

    const newStats = {
      str: rollStat(),
      dex: rollStat(),
      con: rollStat(),
      int: rollStat(),
      wis: rollStat(),
      cha: rollStat(),
    }

    // Note: This would normally call an API to persist stats
    // For now, we'll just show a toast
    toast.success(`New stats rolled! STR:${newStats.str} DEX:${newStats.dex} CON:${newStats.con}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-ash">Loading character...</p>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-bone mb-2">Character not found</p>
          <p className="text-sm text-mist">Token ID #{tokenId}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <SheetMenuBar
        tokenId={tokenId}
        isOwner={isOwner}
        isEditMode={isEditMode}
        onEditToggle={handleEditToggle}
        onSave={handleSave}
        onRollNew={handleRollNew}
        isSaving={updateCharacter.isPending}
      />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Character Image and Attributes */}
        <SheetTitleAndAttributes character={character} isEditMode={isEditMode} />

        {/* Background Story */}
        <SheetBackgroundStory
          story={editedStory}
          isEditMode={isEditMode}
          isOwner={isOwner}
          onChange={setEditedStory}
        />

        {/* Equipment */}
        <SheetEquipment equipment={character.equipment} isEditMode={isEditMode} />

        {/* Blockchain Actions (for owners) */}
        {isOwner && character.infection_status === 'infected' && (
          <div className="bg-midnight rounded-lg p-6">
            <h3 className="text-2xl font-bold text-bone mb-4">Actions</h3>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 transition-colors"
                onClick={() => toast('Cure action would trigger blockchain transaction')}
              >
                Cure Character
              </button>
              <button
                className="px-6 py-3 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition-colors"
                onClick={() => toast('Sear action would trigger blockchain transaction')}
              >
                Sear Concord
              </button>
            </div>
            <p className="text-sm text-mist mt-4">
              * These actions require wallet transactions and will be implemented with wagmi hooks
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
