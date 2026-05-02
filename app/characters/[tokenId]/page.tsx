'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { getCharacterImageCandidates, getCharacterImageFallback } from '@/lib/utils/image'
import { NameEditor } from '@/components/characters/NameEditor'
import { CoreStatsEditor } from '@/components/characters/CoreStatsEditor'
import { DerivedStatsEditor } from '@/components/characters/DerivedStatsEditor'
import { LevelExperienceEditor } from '@/components/characters/LevelExperienceEditor'
import { EmptyStatsPrompt } from '@/components/characters/EmptyStatsPrompt'
import { NFTTraitsDisplay } from '@/components/characters/NFTTraitsDisplay'
import { AIPersonaTab } from '@/components/characters/ai-editor'
import {
  CharacterStoryTab, CharacterEquipmentTab, CharacterWalletTab,
  CharacterHeader, CharacterModals, CharacterActions,
} from '@/components/characters/detail'
import { useCharacterEditor } from '@/hooks/useCharacterEditor'
import { Card, CardTitle, CardContent, CardDescription, Button, Spinner, Separator, Badge, Tabs } from '@/components/ui'
import type { TabItem } from '@/components/ui'
import type { Character } from '@/types/character'
import { isAdmin } from '@/lib/auth/admin'

import { useChatDock } from '@/contexts/ChatDockContext'

export default function CharacterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { address } = useAccount()
  const { openChat } = useChatDock()
  const tokenId = parseInt(params.tokenId as string, 10)

  const [character, setCharacter] = useState<Character | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSearingModalOpen, setIsSearingModalOpen] = useState(false)
  const [isInfectionModalOpen, setIsInfectionModalOpen] = useState(false)
  const [isCureModalOpen, setIsCureModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('story')
  const [imageUrl, setImageUrl] = useState(getCharacterImageFallback())

  const editor = useCharacterEditor({ character, isLoading })

  const fetchCharacter = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/characters/${tokenId}`)
      if (!response.ok) throw new Error('Failed to fetch character')
      setCharacter(await response.json())
    } catch (error) {
      console.error('Error fetching character:', error)
      toast.error('Failed to load character')
    } finally {
      setIsLoading(false)
    }
  }, [tokenId])

  useEffect(() => {
    fetchCharacter()
  }, [fetchCharacter])

  const userIsAdmin = isAdmin(address)
  // Include staker_address check for staked characters (user is the staker)
  const isOwner = character && address
    ? (character.owner_address?.toLowerCase() === address.toLowerCase()) ||
      (character.staker_address?.toLowerCase() === address.toLowerCase()) ||
      userIsAdmin
    : false

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const shouldOpenSearing = query.get('sear') === 'true' || query.get('searing') === 'true'
    if (shouldOpenSearing && isOwner) {
      setIsSearingModalOpen(true)
    }
  }, [isOwner])

  const handleEditToggle = useCallback(() => {
    if (isEditMode) editor.reset()
    setIsEditMode(!isEditMode)
  }, [isEditMode, editor])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditMode) {
        if (editor.hasUnsavedChanges && !window.confirm('You have unsaved changes. Cancel?')) return
        handleEditToggle()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditMode, editor.hasUnsavedChanges, handleEditToggle])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (editor.hasUnsavedChanges && isEditMode) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Leave?'
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editor.hasUnsavedChanges, isEditMode])

  const handleSave = async () => {
    if (!character) return
    try {
      setIsSaving(true)
      const updates: Record<string, unknown> = {}
      const origName = character.name || character.metadata?.name || ''
      if (editor.state.name !== origName) updates.name = editor.state.name
      // Prefer DB column over metadata for comparison (column is the source of truth after saves)
      const origStory = character.background_story ?? character.metadata?.background_story ?? ''
      if (editor.state.story !== origStory) updates.background_story = editor.state.story

      for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
        if (editor.state.coreStats[key] !== (character[key] ?? null)) updates[key] = editor.state.coreStats[key]
      }
      for (const key of ['hp', 'max_hp', 'ac', 'speed'] as const) {
        if (editor.state.derivedStats[key] !== (character[key] ?? null)) updates[key] = editor.state.derivedStats[key]
      }
      if (editor.state.levelExp.level !== (character.level ?? null)) updates.level = editor.state.levelExp.level
      if (editor.state.levelExp.experience !== (character.experience ?? null)) updates.experience = editor.state.levelExp.experience

      if (!Object.keys(updates).length) { setIsEditMode(false); toast.success('No changes'); return }

      const response = await fetch(`/api/characters/${tokenId}`, {
        method: 'PATCH',
        credentials: 'include', // Ensure session cookie is sent
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Surface validation details if present
        if (errorData.details && Array.isArray(errorData.details)) {
          throw new Error(`${errorData.error}: ${errorData.details.join(', ')}`)
        }
        throw new Error(errorData.error || 'Failed to update')
      }

      setCharacter(await response.json())
      setIsEditMode(false)
      toast.success('Character updated!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAssignStats = () => { editor.assignDefaultStats(); setIsEditMode(true) }

  const name = character?.name || character?.metadata?.name || `Character #${tokenId}`
  const imageCandidates = useMemo(
    () => getCharacterImageCandidates(tokenId, character?.metadata, character?.image_url, {
      infectionStatus: character?.infection_status,
      isInfected: character?.infected,
    }),
    [tokenId, character?.metadata, character?.image_url, character?.infection_status, character?.infected]
  )

  useEffect(() => {
    setImageUrl(imageCandidates[0] || getCharacterImageFallback())
  }, [imageCandidates])

  const handleImageError = useCallback(() => {
    setImageUrl((current) => {
      const currentIndex = imageCandidates.indexOf(current)
      return imageCandidates[currentIndex + 1] || current || getCharacterImageFallback()
    })
  }, [imageCandidates])
  // Prefer DB column over metadata (column is source of truth after saves)
  const level = character?.level ?? character?.metadata?.level ?? 1
  const attrs = character
    ? { str: character.str || 0, dex: character.dex || 0, con: character.con || 0, int: character.int || 0, wis: character.wis || 0, cha: character.cha || 0 }
    : { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  const hasCharacterSheet = attrs.str > 0 || attrs.dex > 0 || attrs.con > 0 || attrs.int > 0 || attrs.wis > 0 || attrs.cha > 0
  const hasAnyStats = character && ((character.str ?? 0) > 0 || (character.dex ?? 0) > 0 || (character.hp ?? 0) > 0 || (character.level ?? 1) > 1)
  const tabs: TabItem[] = [{ id: 'story', label: 'story' }, { id: 'ai-persona', label: 'ai persona' }, { id: 'equipment', label: 'equipment' }, { id: 'wallet', label: 'wallet' }]

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-soul-950">
      <div className="flex flex-col items-center gap-4"><Spinner size="lg" /><p className="text-neutral-500 font-display tracking-widest text-sm">Loading Character</p></div>
    </div>
  )

  if (!character) return (
    <div className="min-h-screen flex items-center justify-center bg-soul-950">
      <Card className="max-w-md text-center">
        <CardContent className="py-12">
          <div className="text-6xl mb-4 opacity-30">☠</div>
          <CardTitle className="mb-2">Character Not Found</CardTitle>
          <CardDescription>Token ID #{tokenId} does not exist.</CardDescription>
          <Button variant="secondary" onClick={() => router.push('/characters')} className="mt-6">Back to Characters</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-soul-950">
      <CharacterHeader tokenId={tokenId} isOwner={isOwner} isEditMode={isEditMode} isSaving={isSaving}
        onBack={() => router.push('/characters')} onEdit={handleEditToggle} onSave={handleSave}
        onCancel={handleEditToggle} onChat={() => openChat({ tokenId: String(tokenId), characterName: name })} onAnimated={() => router.push(`/characters/${tokenId}/animated`)} />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-5">
            <Card className="overflow-hidden">
              <div className="relative aspect-square">
                <Image src={imageUrl} alt={name} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover [image-rendering:pixelated]" priority unoptimized onError={handleImageError} />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                  {character.infection_status === 'infected' && <Badge className="bg-red-900/80 border-red-700 text-red-400">Infected</Badge>}
                  {character.infection_status === 'cured' && <Badge className="bg-emerald-900/80 border-emerald-700 text-emerald-400">Cured</Badge>}
                  {character.staking_status === 'staked' && <Badge variant="accent">Staked</Badge>}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5">
            <div className="h-full flex flex-col">
              <div className="mb-6">
                <NameEditor name={isEditMode ? editor.state.name : name} isOwner={isOwner} isEditMode={isEditMode} onChange={editor.setName} className="mb-2" />
                <LevelExperienceEditor stats={isEditMode ? editor.state.levelExp : { level, experience: character.experience ?? null }} characterClass={character.class} isOwner={isOwner} isEditMode={isEditMode} onChange={editor.setLevelExp} />
                <NFTTraitsDisplay metadata={character.metadata} showIdentityOnly className="mt-3" />
              </div>

              <div className="mb-6">
                <DerivedStatsEditor stats={isEditMode ? editor.state.derivedStats : { hp: character.hp ?? null, max_hp: character.max_hp ?? null, ac: character.ac ?? null, speed: character.speed ?? null }} isOwner={isOwner} isEditMode={isEditMode} onChange={editor.setDerivedStats} />
                {!isEditMode && <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3"><Card className="bg-midnight/50"><CardContent className="p-3 text-center"><p className="text-[20px] font-display tracking-widest text-mist mb-1 lowercase">token</p><p className="text-2xl font-display text-bone">#{tokenId}</p></CardContent></Card></div>}
              </div>

              {(hasCharacterSheet || (isOwner && isEditMode)) && <CoreStatsEditor stats={isEditMode ? editor.state.coreStats : attrs} isOwner={isOwner} isEditMode={isEditMode} onChange={editor.setCoreStats} className="h-full" />}
              {isOwner && !hasAnyStats && !isEditMode && <EmptyStatsPrompt onAssignStats={handleAssignStats} />}
              {isOwner && <CharacterActions isInfected={character.infection_status === 'infected'} onSear={() => setIsSearingModalOpen(true)} onInfect={() => setIsInfectionModalOpen(true)} onCure={() => setIsCureModalOpen(true)} />}
            </div>
          </div>
        </div>

        <NFTTraitsDisplay metadata={character.metadata} className="mb-8" />
        <Separator className="mb-8" />
        <Tabs items={tabs} activeId={activeTab} onChange={setActiveTab} />
        <div className="mt-6">
          {activeTab === 'story' && <CharacterStoryTab story={editor.state.story} isEditMode={isEditMode} isOwner={isOwner} onChange={editor.setStory} />}
          {activeTab === 'ai-persona' && <AIPersonaTab tokenId={String(tokenId)} isOwner={isOwner} characterName={name} characterBackstory={editor.state.story} />}
          {activeTab === 'equipment' && <CharacterEquipmentTab equipment={character.equipment ?? null} metadataEquipment={character.metadata?.equipment} isEditMode={isEditMode} />}
          {activeTab === 'wallet' && (
            <CharacterWalletTab
              tokenId={tokenId}
              ownerAddress={character?.owner_address ?? null}
              stakerAddress={character?.staker_address ?? null}
            />
          )}
        </div>
      </div>

      <CharacterModals tokenId={tokenId} name={name} isSearingModalOpen={isSearingModalOpen} isInfectionModalOpen={isInfectionModalOpen} isCureModalOpen={isCureModalOpen} onCloseSearing={() => setIsSearingModalOpen(false)} onCloseInfection={() => setIsInfectionModalOpen(false)} onCloseCure={() => setIsCureModalOpen(false)} onSearingSuccess={fetchCharacter} />
    </div>
  )
}
