'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { SheetMenuBar } from '@/components/characters/SheetMenuBar'
import { SheetTitleAndAttributes } from '@/components/characters/SheetTitleAndAttributes'
import { SheetBackgroundStory } from '@/components/characters/SheetBackgroundStory'
import { SheetEquipment } from '@/components/characters/SheetEquipment'
import { OwnershipVerificationBanner } from '@/components/OwnershipVerificationBanner'
import { TokenBalancesCard } from '@/components/TokenBalancesCard'
import { StakingStatusCard } from '@/components/StakingStatusCard'
import { SearingModal } from '@/components/modals/SearingModal'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CureModal } from '@/components/modals/CureModal'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Spinner, Separator } from '@/components-new'
import type { Character, Equipment } from '@/types/character'

export default function CharacterDetailPage() {
  const params = useParams()
  const { address } = useAccount()
  const tokenId = parseInt(params.tokenId as string, 10)

  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedStory, setEditedStory] = useState('')
  const [isSearingModalOpen, setIsSearingModalOpen] = useState(false)
  const [isInfectionModalOpen, setIsInfectionModalOpen] = useState(false)
  const [isCureModalOpen, setIsCureModalOpen] = useState(false)

  // Fetch character data
  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/characters/${tokenId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch character')
        }

        const data = await response.json()
        setCharacter(data)
        // Extract background story from metadata or direct field
        const story = data.metadata?.background_story || data.background_story || ''
        setEditedStory(story)
      } catch (error) {
        console.error('Error fetching character:', error)
        toast.error('Failed to load character')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCharacter()
  }, [tokenId])


  // Check if user owns this character
  const isOwner = character && address
    ? character.owner_address?.toLowerCase() === address.toLowerCase()
    : false

  // Toggle edit mode
  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel editing - reset story
      const story = character?.metadata?.background_story || character?.background_story || ''
      setEditedStory(story)
    }
    setIsEditMode(!isEditMode)
  }

  // Save changes
  const handleSave = async () => {
    if (!character) return

    try {
      setIsSaving(true)

      const response = await fetch(`/api/characters/${tokenId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          background_story: editedStory,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save')
      }

      const updated = await response.json()
      setCharacter(updated)
      setIsEditMode(false)
      toast.success('Character updated successfully!')
    } catch (error: any) {
      console.error('Error saving character:', error)
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
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

    // Update character with new stats (this would normally call an API)
    setCharacter({
      ...character,
      ...newStats,
    })

    toast.success('New stats rolled!')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soul-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-500 font-display uppercase tracking-widest text-sm">
            Loading Character
          </p>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soul-950">
        <Card className="max-w-md text-center">
          <CardContent className="py-12">
            <div className="text-6xl mb-4 opacity-30">☠</div>
            <CardTitle className="mb-2">Character Not Found</CardTitle>
            <CardDescription>Token ID #{tokenId} does not exist or has been lost to the void.</CardDescription>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soul-950">
      <SheetMenuBar
        tokenId={tokenId}
        isOwner={isOwner}
        isEditMode={isEditMode}
        onEditToggle={handleEditToggle}
        onSave={handleSave}
        onRollNew={handleRollNew}
        isSaving={isSaving}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Ownership Verification Banner */}
        <OwnershipVerificationBanner tokenId={BigInt(tokenId)} className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <SheetTitleAndAttributes character={character} isEditMode={isEditMode} />
            <SheetBackgroundStory
              story={editedStory}
              isEditMode={isEditMode}
              isOwner={isOwner}
              onChange={setEditedStory}
            />
            <SheetEquipment equipment={(character.equipment || character.metadata?.equipment) as Equipment | null} isEditMode={isEditMode} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <TokenBalancesCard />
            <StakingStatusCard tokenId={tokenId} />
          </div>
        </div>

        {/* Blockchain Actions (for owners) */}
        {isOwner && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Blockchain Actions</CardTitle>
              <CardDescription>
                These actions interact with smart contracts and require wallet transactions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Separator className="mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  variant="primary"
                  onClick={() => setIsSearingModalOpen(true)}
                  className="w-full"
                >
                  Sear Concords
                </Button>

                <Button
                  variant="danger"
                  onClick={() => setIsInfectionModalOpen(true)}
                  className="w-full"
                >
                  Infect Character
                </Button>

                {character.infection_status === 'infected' && (
                  <Button
                    variant="secondary"
                    onClick={() => setIsCureModalOpen(true)}
                    className="w-full border-emerald-900/50 text-emerald-500 hover:border-emerald-700"
                  >
                    Cure Character
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {character && (
        <>
          <SearingModal
            wagdieId={tokenId}
            wagdieName={character.metadata?.name || character.name || `Character #${tokenId}`}
            isOpen={isSearingModalOpen}
            onClose={() => setIsSearingModalOpen(false)}
            onSuccess={() => {
              toast.success('Character seared successfully!')
              // Refresh character data
              window.location.reload()
            }}
          />

          <InfectionModal
            mode="specific"
            tokenId={BigInt(tokenId)}
            tokenName={character.metadata?.name || character.name || `Character #${tokenId}`}
            isOpen={isInfectionModalOpen}
            onClose={() => setIsInfectionModalOpen(false)}
            onSuccess={() => {
              toast.success('Character infected successfully!')
              // Refresh character data
              window.location.reload()
            }}
          />

          <CureModal
            characterId={tokenId}
            characterName={character.metadata?.name || character.name || `Character #${tokenId}`}
            isOpen={isCureModalOpen}
            onClose={() => setIsCureModalOpen(false)}
            onSuccess={() => {
              toast.success('Character cured successfully!')
              // Refresh character data
              window.location.reload()
            }}
          />
        </>
      )}
    </div>
  )
}
