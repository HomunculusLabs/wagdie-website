'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { getLocalImagePath, getCharacterImageFallback } from '@/lib/utils/image'
import { SheetBackgroundStory } from '@/components/characters/SheetBackgroundStory'
import { SheetEquipment } from '@/components/characters/SheetEquipment'
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
  ProgressBar,
} from '@/components-new'
import type { TabItem } from '@/components-new'
import type { Character, Equipment } from '@/types/character'

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
      } catch (error) {
        console.error('Error fetching character:', error)
        toast.error('Failed to load character')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCharacter()
  }, [tokenId])

  const isOwner = character && address
    ? character.owner_address?.toLowerCase() === address.toLowerCase()
    : false

  const handleEditToggle = () => {
    if (isEditMode) {
      const story = character?.metadata?.background_story || character?.background_story || ''
      setEditedStory(story)
    }
    setIsEditMode(!isEditMode)
  }

  const handleSave = async () => {
    if (!character) return
    try {
      setIsSaving(true)
      const response = await fetch(`/api/characters/${tokenId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ background_story: editedStory }),
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

  // Extract character data
  const name = character?.metadata?.name || character?.name || `Character #${tokenId}`

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

  const attributes = [
    { label: 'STR', value: attrs.str },
    { label: 'DEX', value: attrs.dex },
    { label: 'CON', value: attrs.con },
    { label: 'INT', value: attrs.int },
    { label: 'WIS', value: attrs.wis },
    { label: 'CHA', value: attrs.cha },
  ]

  const hasCharacterSheet = attrs.str > 0 || attrs.dex > 0 || attrs.con > 0

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

            <h1 className="text-sm font-display uppercase tracking-widest text-neutral-400">
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
                <h2 className="text-3xl md:text-4xl font-display uppercase tracking-wider text-neutral-100 mb-2">
                  {name}
                </h2>
                <p className="text-sm font-display uppercase tracking-widest text-soul-accent">
                  {character.class ? `${character.class} • ` : ''}Level {level}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {character.hp !== undefined && (
                  <Card className="bg-black/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-1">HP</p>
                      <p className="text-xl font-display text-soul-accent">
                        {character.hp}{character.max_hp ? <span className="text-neutral-500 text-xs">/{character.max_hp}</span> : ''}
                      </p>
                    </CardContent>
                  </Card>
                )}
                {character.ac !== undefined && (
                  <Card className="bg-black/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-1">AC</p>
                      <p className="text-xl font-display text-neutral-200">{character.ac}</p>
                    </CardContent>
                  </Card>
                )}
                {character.speed !== undefined && (
                  <Card className="bg-black/30">
                    <CardContent className="p-3 text-center">
                      <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-1">Speed</p>
                      <p className="text-xl font-display text-neutral-200">{character.speed}<span className="text-xs text-neutral-500"> ft</span></p>
                    </CardContent>
                  </Card>
                )}
                <Card className="bg-black/30">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-1">Token</p>
                    <p className="text-xl font-display text-neutral-200">#{tokenId}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Character Attributes */}
              {hasCharacterSheet && (
                <div className="h-full">
                  <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-3">Attributes</p>
                  <div className="grid grid-cols-3 gap-2">
                    {attributes.map((attr) => (
                      <div
                        key={attr.label}
                        className="bg-black/40 border border-neutral-800 p-3 text-center"
                      >
                        <p className="text-[10px] font-display uppercase tracking-widest text-neutral-600 mb-1">{attr.label}</p>
                        <p className="text-xl font-display text-neutral-200 mb-2">{attr.value}</p>
                        <ProgressBar value={attr.value} max={20} showValue={false} variant="souls" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <Card className="mt-auto">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-display uppercase tracking-widest text-neutral-500 mb-3">Blockchain Actions</p>
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
              equipment={(character.equipment || character.metadata?.equipment) as Equipment | null}
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
