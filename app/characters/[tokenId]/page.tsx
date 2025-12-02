'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { getLocalImagePath, getCharacterImageFallback } from '@/lib/utils/image'
import { SheetBackgroundStory } from '@/components/characters/SheetBackgroundStory'
import { SheetEquipment } from '@/components/characters/SheetEquipment'
import { NameEditor } from '@/components/characters/NameEditor'
import { CoreStatsEditor } from '@/components/characters/CoreStatsEditor'
import { DerivedStatsEditor } from '@/components/characters/DerivedStatsEditor'
import { LevelExperienceEditor } from '@/components/characters/LevelExperienceEditor'
import { EmptyStatsPrompt } from '@/components/characters/EmptyStatsPrompt'
import { NFTTraitsDisplay } from '@/components/characters/NFTTraitsDisplay'
import { OwnershipVerificationBanner } from '@/components/OwnershipVerificationBanner'
import { TokenBalancesCard } from '@/components/TokenBalancesCard'
import { StakingStatusCard } from '@/components/StakingStatusCard'
import { SearingModal } from '@/components/modals/SearingModal'
import { InfectionModal } from '@/components/modals/InfectionModal'
import { CureModal } from '@/components/modals/CureModal'
import {
  Card,
  CardTitle,
  CardContent,
  CardDescription,
  Button,
  Spinner,
  Separator,
  Badge,
  Tabs,
} from '@/components-new'
import type { TabItem } from '@/components-new'
import type { Character } from '@/types/character'

// Icons
const BackIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

const FireIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
  </svg>
)

const SkullIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const HeartIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
)

export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const tokenId = parseInt(params.tokenId as string, 10)

  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedStory, setEditedStory] = useState('')
  const [editedName, setEditedName] = useState('')
  const [editedCoreStats, setEditedCoreStats] = useState({
    str: null as number | null,
    dex: null as number | null,
    con: null as number | null,
    int: null as number | null,
    wis: null as number | null,
    cha: null as number | null,
  })
  const [editedDerivedStats, setEditedDerivedStats] = useState({
    hp: null as number | null,
    max_hp: null as number | null,
    ac: null as number | null,
    speed: null as number | null,
  })
  const [editedLevelExp, setEditedLevelExp] = useState({
    level: null as number | null,
    experience: null as number | null,
  })
  const [isSearingModalOpen, setIsSearingModalOpen] = useState(false)
  const [isInfectionModalOpen, setIsInfectionModalOpen] = useState(false)
  const [isCureModalOpen, setIsCureModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('story')
  const [useLocalImage, setUseLocalImage] = useState(true)

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/characters/${tokenId}`)
        if (!response.ok) throw new Error('Failed to fetch character')
        const data = await response.json()
        setCharacter(data)
        const story = data.metadata?.background_story || data.background_story || ''
        setEditedStory(story)
        const characterName = data.name || data.metadata?.name || ''
        setEditedName(characterName)
        // Initialize core stats
        setEditedCoreStats({
          str: data.str ?? null,
          dex: data.dex ?? null,
          con: data.con ?? null,
          int: data.int ?? null,
          wis: data.wis ?? null,
          cha: data.cha ?? null,
        })
        // Initialize derived stats
        setEditedDerivedStats({
          hp: data.hp ?? null,
          max_hp: data.max_hp ?? null,
          ac: data.ac ?? null,
          speed: data.speed ?? null,
        })
        // Initialize level/experience
        setEditedLevelExp({
          level: data.level ?? null,
          experience: data.experience ?? null,
        })
      } catch (error) {
        console.error('Error fetching character:', error)
        toast.error('Failed to load character')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCharacter()
  }, [tokenId])

  // Track if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!character || !isEditMode) return false

    const originalName = character.name || character.metadata?.name || ''
    if (editedName !== originalName) return true

    const originalStory = character.metadata?.background_story || character.background_story || ''
    if (editedStory !== originalStory) return true

    const coreStatKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
    for (const key of coreStatKeys) {
      if (editedCoreStats[key] !== (character[key] ?? null)) return true
    }

    const derivedStatKeys = ['hp', 'max_hp', 'ac', 'speed'] as const
    for (const key of derivedStatKeys) {
      if (editedDerivedStats[key] !== (character[key] ?? null)) return true
    }

    if (editedLevelExp.level !== (character.level ?? null)) return true
    if (editedLevelExp.experience !== (character.experience ?? null)) return true

    return false
  }, [character, isEditMode, editedName, editedStory, editedCoreStats, editedDerivedStats, editedLevelExp])

  const isOwner = character && address
    ? character.owner_address?.toLowerCase() === address.toLowerCase()
    : false

  // Reset all edited values to original character data
  const resetEditedValues = useCallback(() => {
    const story = character?.metadata?.background_story || character?.background_story || ''
    setEditedStory(story)
    const characterName = character?.name || character?.metadata?.name || ''
    setEditedName(characterName)
    setEditedCoreStats({
      str: character?.str ?? null,
      dex: character?.dex ?? null,
      con: character?.con ?? null,
      int: character?.int ?? null,
      wis: character?.wis ?? null,
      cha: character?.cha ?? null,
    })
    setEditedDerivedStats({
      hp: character?.hp ?? null,
      max_hp: character?.max_hp ?? null,
      ac: character?.ac ?? null,
      speed: character?.speed ?? null,
    })
    setEditedLevelExp({
      level: character?.level ?? null,
      experience: character?.experience ?? null,
    })
  }, [character])

  const handleEditToggle = useCallback(() => {
    if (isEditMode) {
      resetEditedValues()
    }
    setIsEditMode(!isEditMode)
  }, [isEditMode, resetEditedValues])

  // Escape key handler to cancel edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        if (hasUnsavedChanges()) {
          const confirmCancel = window.confirm('You have unsaved changes. Are you sure you want to cancel?')
          if (!confirmCancel) return
        }
        handleEditToggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode, hasUnsavedChanges, handleEditToggle])

  // Unsaved changes warning when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleSave = async () => {
    if (!character) return
    try {
      setIsSaving(true)

      // Build update payload with name, story, and stats
      const updates: Record<string, unknown> = {}

      // Include name if changed
      const originalName = character.name || character.metadata?.name || ''
      console.log('[handleSave] Original name:', originalName)
      console.log('[handleSave] Edited name:', editedName)
      if (editedName !== originalName) {
        updates.name = editedName
        console.log('[handleSave] Name changed, adding to updates')
      }

      // Include story if changed
      const originalStory = character.metadata?.background_story || character.background_story || ''
      if (editedStory !== originalStory) {
        updates.background_story = editedStory
      }

      // Include core stats if changed
      const coreStatKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const
      for (const key of coreStatKeys) {
        const originalValue = character[key] ?? null
        const editedValue = editedCoreStats[key]
        if (editedValue !== originalValue) {
          updates[key] = editedValue
        }
      }

      // Include derived stats if changed
      const derivedStatKeys = ['hp', 'max_hp', 'ac', 'speed'] as const
      for (const key of derivedStatKeys) {
        const originalValue = character[key] ?? null
        const editedValue = editedDerivedStats[key]
        if (editedValue !== originalValue) {
          updates[key] = editedValue
        }
      }

      // Include level/experience if changed
      if (editedLevelExp.level !== (character.level ?? null)) {
        updates.level = editedLevelExp.level
      }
      if (editedLevelExp.experience !== (character.experience ?? null)) {
        updates.experience = editedLevelExp.experience
      }

      // Only send request if there are changes
      if (Object.keys(updates).length === 0) {
        setIsEditMode(false)
        toast.success('No changes to save')
        return
      }

      console.log('[handleSave] Final updates payload:', JSON.stringify(updates, null, 2))
      console.log('[handleSave] Sending PATCH to:', `/api/characters/${tokenId}`)

      const response = await fetch(`/api/characters/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      console.log('[handleSave] Response status:', response.status)
      console.log('[handleSave] Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[handleSave] Error response:', JSON.stringify(errorData, null, 2))
        throw new Error(errorData.error || 'Failed to update character')
      }
      const updated = await response.json()
      console.log('[handleSave] Success! Updated character:', updated)

      // Optimistic update - update state immediately
      setCharacter(updated)
      setEditedName(updated.name || '')
      setEditedCoreStats({
        str: updated.str ?? null,
        dex: updated.dex ?? null,
        con: updated.con ?? null,
        int: updated.int ?? null,
        wis: updated.wis ?? null,
        cha: updated.cha ?? null,
      })
      setEditedDerivedStats({
        hp: updated.hp ?? null,
        max_hp: updated.max_hp ?? null,
        ac: updated.ac ?? null,
        speed: updated.speed ?? null,
      })
      setEditedLevelExp({
        level: updated.level ?? null,
        experience: updated.experience ?? null,
      })
      setIsEditMode(false)
      toast.success('Character updated successfully!')
    } catch (error: any) {
      console.error('Error saving character:', error)
      toast.error(error.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Extract character data - prioritize the name column over metadata.name
  const name = character?.name || character?.metadata?.name || `Character #${tokenId}`

  // Use local image first, fallback to IPFS if local fails
  const localImageUrl = getLocalImagePath(tokenId)
  const fallbackImageUrl = getCharacterImageFallback(character?.metadata?.image, character?.image_url)
  const imageUrl = useLocalImage ? localImageUrl : fallbackImageUrl
  const level = character?.metadata?.level || character?.level || 1

  // Extract attributes
  let attrs = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  if (character?.metadata?.attributes) {
    if (!Array.isArray(character.metadata.attributes)) {
      const metaAttrs = character.metadata.attributes
      attrs = {
        str: metaAttrs.strength || character?.str || 0,
        dex: metaAttrs.dexterity || character?.dex || 0,
        con: metaAttrs.constitution || character?.con || 0,
        int: metaAttrs.intelligence || character?.int || 0,
        wis: metaAttrs.wisdom || character?.wis || 0,
        cha: metaAttrs.charisma || character?.cha || 0,
      }
    }
  } else if (character) {
    attrs = {
      str: character.str || 0,
      dex: character.dex || 0,
      con: character.con || 0,
      int: character.int || 0,
      wis: character.wis || 0,
      cha: character.cha || 0,
    }
  }

  // T010-T014: Check if character has any core stats (all 6 abilities)
  const hasAnyCoreStats = attrs.str > 0 || attrs.dex > 0 || attrs.con > 0 ||
    attrs.int > 0 || attrs.wis > 0 || attrs.cha > 0
  const hasCharacterSheet = hasAnyCoreStats

  // Check if character has any stats (for empty stats prompt)
  const hasAnyStats = character && (
    character.str != null && character.str > 0 ||
    character.dex != null && character.dex > 0 ||
    character.con != null && character.con > 0 ||
    character.int != null && character.int > 0 ||
    character.wis != null && character.wis > 0 ||
    character.cha != null && character.cha > 0 ||
    character.hp != null && character.hp > 0 ||
    character.level != null && character.level > 1
  )

  // Handler to assign default stats and enter edit mode
  const handleAssignStats = () => {
    // Pre-populate with sensible defaults
    setEditedCoreStats({
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    })
    setEditedDerivedStats({
      hp: 10, max_hp: 10, ac: 10, speed: 30,
    })
    setEditedLevelExp({
      level: 1, experience: 0,
    })
    setIsEditMode(true)
  }

  // Tabs configuration
  const tabs: TabItem[] = [
    { id: 'story', label: 'Story' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'wallet', label: 'Wallet' },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-soul-950">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-neutral-500 font-display  tracking-widest text-sm">
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
            <Button variant="secondary" onClick={() => router.push('/characters')} className="mt-6">
              Back to Characters
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-soul-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => router.push('/characters')} className="gap-2">
              <BackIcon />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <h1 className="text-lg font-display text-neutral-400">
              Character #{tokenId}
            </h1>

            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  {isEditMode ? (
                    <>
                      <Button variant="primary" onClick={handleSave} isLoading={isSaving}>Save</Button>
                      <Button variant="secondary" onClick={handleEditToggle}>Cancel</Button>
                    </>
                  ) : (
                    <Button variant="secondary" onClick={handleEditToggle}>Edit</Button>
                  )}
                </>
              )}
              <Button variant="secondary" onClick={() => router.push(`/characters/${tokenId}/animated`)}>
                Animated
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Ownership Banner */}
        <OwnershipVerificationBanner tokenId={BigInt(tokenId)} className="mb-8" />

        {/* Hero Section - Character Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Character Image */}
          <div className="lg:col-span-5">
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                  priority
                  onError={() => useLocalImage && setUseLocalImage(false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Status badges */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {character.infection_status === 'infected' && (
                    <Badge className="bg-red-900/80 border-red-700 text-red-400">Infected</Badge>
                  )}
                  {character.infection_status === 'cured' && (
                    <Badge className="bg-emerald-900/80 border-emerald-700 text-emerald-400">Cured</Badge>
                  )}
                  {character.staking_status === 'staked' && (
                    <Badge variant="accent">Staked</Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Character Info */}
          <div className="lg:col-span-5">
            <div className="h-full flex flex-col">
              {/* Name and Level */}
              <div className="mb-6">
                <NameEditor
                  name={isEditMode ? editedName : name}
                  isOwner={isOwner}
                  isEditMode={isEditMode}
                  onChange={setEditedName}
                  className="mb-2"
                />
                <LevelExperienceEditor
                  stats={isEditMode ? editedLevelExp : { level, experience: character.experience ?? null }}
                  characterClass={character.class}
                  isOwner={isOwner}
                  isEditMode={isEditMode}
                  onChange={setEditedLevelExp}
                />
                {/* T023-T024: Identity traits (Body, Alignment) displayed prominently below name */}
                <NFTTraitsDisplay
                  metadata={character.metadata}
                  showIdentityOnly
                  className="mt-3"
                />
              </div>

              {/* Quick Stats - Derived Stats */}
              <div className="mb-6">
                <DerivedStatsEditor
                  stats={isEditMode ? editedDerivedStats : {
                    hp: character.hp ?? null,
                    max_hp: character.max_hp ?? null,
                    ac: character.ac ?? null,
                    speed: character.speed ?? null,
                  }}
                  isOwner={isOwner}
                  isEditMode={isEditMode}
                  onChange={setEditedDerivedStats}
                />
                {/* Token ID display (always show, not editable) */}
                {!isEditMode && (
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Card className="bg-black/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-[20px] font-display  tracking-widest text-neutral-500 mb-1">Token</p>
                        <p className="text-2xl font-display text-neutral-200">#{tokenId}</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Character Attributes - Core Stats */}
              {(hasCharacterSheet || (isOwner && isEditMode)) && (
                <CoreStatsEditor
                  stats={isEditMode ? editedCoreStats : {
                    str: attrs.str,
                    dex: attrs.dex,
                    con: attrs.con,
                    int: attrs.int,
                    wis: attrs.wis,
                    cha: attrs.cha,
                  }}
                  isOwner={isOwner}
                  isEditMode={isEditMode}
                  onChange={setEditedCoreStats}
                  className="h-full"
                />
              )}

              {/* Empty Stats Prompt - Show when owner has no stats and not in edit mode */}
              {isOwner && !hasAnyStats && !isEditMode && (
                <EmptyStatsPrompt onAssignStats={handleAssignStats} />
              )}

              {/* Owner Actions */}
              {isOwner && (
                <Card className="mt-auto">
                  <CardContent className="p-4">
                    <p className="text-[16px] font-display  tracking-widest text-neutral-500 mb-3">Blockchain Actions</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={() => setIsSearingModalOpen(true)} className="gap-2">
                        <FireIcon /> Sear Concords
                      </Button>
                      <Button variant="danger" onClick={() => setIsInfectionModalOpen(true)} className="gap-2">
                        <SkullIcon /> Infect
                      </Button>
                      {character.infection_status === 'infected' && (
                        <Button
                          variant="secondary"
                          onClick={() => setIsCureModalOpen(true)}
                          className="gap-2 border-emerald-900/50 text-emerald-500 hover:border-emerald-700"
                        >
                          <HeartIcon /> Cure
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* T025: Full NFT Traits Section (cosmetic traits) */}
        <NFTTraitsDisplay
          metadata={character.metadata}
          className="mb-8"
        />

        <Separator className="mb-8" />

        {/* Tabbed Content */}
        <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />

        <div className="mt-6">
          {activeTab === 'story' && (
            <SheetBackgroundStory
              story={editedStory}
              isEditMode={isEditMode}
              isOwner={isOwner}
              onChange={setEditedStory}
            />
          )}

          {activeTab === 'equipment' && (
            <SheetEquipment
              equipment={character.equipment}
              metadataEquipment={character.metadata?.equipment}
              isEditMode={isEditMode}
            />
          )}

          {activeTab === 'wallet' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TokenBalancesCard />
              <StakingStatusCard tokenId={tokenId} />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {character && (
        <>
          <SearingModal
            wagdieId={tokenId}
            wagdieName={name}
            isOpen={isSearingModalOpen}
            onClose={() => setIsSearingModalOpen(false)}
            onSuccess={() => {
              toast.success('Character seared successfully!')
              window.location.reload()
            }}
          />
          <InfectionModal
            mode="specific"
            tokenId={BigInt(tokenId)}
            tokenName={name}
            isOpen={isInfectionModalOpen}
            onClose={() => setIsInfectionModalOpen(false)}
            onSuccess={() => {
              toast.success('Character infected successfully!')
              window.location.reload()
            }}
          />
          <CureModal
            characterId={tokenId}
            characterName={name}
            isOpen={isCureModalOpen}
            onClose={() => setIsCureModalOpen(false)}
            onSuccess={() => {
              toast.success('Character cured successfully!')
              window.location.reload()
            }}
          />
        </>
      )}
    </div>
  )
}
