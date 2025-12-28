'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import type { MarkerPayload, MapLocationData, MapCharacterData, MapEventData } from '@/game/EventBus'
import type { Location } from '@/lib/types/map'
import type { CharacterWithLocation } from '@/lib/repositories/character-repository'
import { useOwnedCharacters } from '@/hooks/useOwnedCharacters'
import { useStakingStatuses } from '@/hooks/useStakingStatuses'
import { useStaking } from '@/hooks/useStaking'
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner, Alert, Badge } from '@/components/ui'
import type { Character } from '@/types/character'
import { getLocalImagePath } from '@/lib/utils/image'

export interface SelectedStakingLocation {
  location: Location
  locationId: bigint
}

export interface MapStakingSidebarProps {
  isOpen: boolean
  onClose: () => void
  selectedMarker: MarkerPayload | null
  stakedHere: CharacterWithLocation[]
  selectedLocation: SelectedStakingLocation | null
  walletAddress?: string
  onStakingChanged?: () => void
}

type ApprovalState = 'idle' | 'checking' | 'approved' | 'not_approved' | 'error'

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function truncateAddress(address?: string, left = 6, right = 4): string {
  if (!address) return '—'
  if (address.length <= left + right) return address
  return `${address.slice(0, left)}...${address.slice(-right)}`
}

function getMarkerTitle(marker: MarkerPayload | null): string {
  if (!marker) return 'Map'
  if (isNonEmptyString(marker.name)) return marker.name
  return 'Marker Details'
}

function getCharacterName(character: Character): string {
  const byName = character.name?.trim()
  if (byName) return byName

  const byMetadata = character.metadata?.name?.trim()
  if (byMetadata) return byMetadata

  return `#${character.token_id}`
}

function getCharacterImage(character: Character): string {
  const local = getLocalImagePath(character.token_id)
  if (local && local.trim().length > 0) return local.trim()

  const direct = character.image_url?.trim()
  if (direct) return direct

  const meta = character.metadata?.image?.trim()
  if (meta) return meta

  return '/images/placeholder-character.svg'
}

function uniqueNumberList(items: number[]): number[] {
  const seen = new Set<number>()
  const out: number[] = []
  for (const item of items) {
    if (typeof item !== 'number') continue
    if (Number.isNaN(item)) continue
    if (seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

/** Renders non-location marker details (character, burn, death, fight) */
function NonLocationMarkerDetails({ marker }: { marker: MarkerPayload }) {
  if (marker.type === 'character') {
    const data = marker.data as MapCharacterData
    const tokenId = typeof data?.character_token_id === 'number' ? data.character_token_id : null
    const characterName =
      (isNonEmptyString(data?.character_name) ? data.character_name : null) ??
      (isNonEmptyString(marker.name) ? marker.name : null) ??
      (tokenId !== null ? `Character #${tokenId}` : 'Character')

    const walletAddress = isNonEmptyString(data?.wallet_address) ? data.wallet_address : undefined
    const locationName = isNonEmptyString(data?.location?.name) ? data.location.name : undefined

    return (
      <Card className="bg-black/40 border border-neutral-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
            Character
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
            {characterName}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500 font-eskapade tracking-widest">OWNER</span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {truncateAddress(walletAddress)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500 font-eskapade tracking-widest">LOCATION</span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {locationName ?? '—'}
              </span>
            </div>
          </div>

          {tokenId !== null && (
            <div className="pt-2 border-t border-neutral-800">
              <Link href={`/characters/${tokenId}`} className="w-full">
                <Button className="w-full" size="sm">
                  View character page
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // burn / death / fight
  const eventData = marker.data as MapEventData
  const title =
    (isNonEmptyString(eventData?.title) ? eventData.title : null) ??
    (isNonEmptyString(eventData?.name) ? eventData.name : null) ??
    (isNonEmptyString(marker.name) ? marker.name : null) ??
    'Event'

  return (
    <Card className="bg-black/40 border border-neutral-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
          {marker.type.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
          {title}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500 font-eskapade tracking-widest">COORDS</span>
          <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
            {Math.round(marker.x)}, {Math.round(marker.y)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export function MapStakingSidebar({
  isOpen,
  onClose,
  selectedMarker,
  stakedHere,
  selectedLocation,
  walletAddress,
  onStakingChanged,
}: MapStakingSidebarProps) {
  const { isConnected, address } = useAccount()
  const effectiveWallet = walletAddress ?? address

  const panelRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('your-characters')

  const [approvalState, setApprovalState] = useState<ApprovalState>('idle')
  const [approvalError, setApprovalError] = useState<string | null>(null)

  const [activeTokenId, setActiveTokenId] = useState<number | null>(null)

  // Pagination state
  const [page, setPage] = useState(0)
  const perPage = 10

  const {
    isStaking,
    isUnstaking,
    isApproving,
    error: stakingError,
    checkApproval,
    approveForStaking,
    stakeWagdie,
    unstakeWagdie,
  } = useStaking()

  const approvalCheckInFlightRef = useRef(false)
  const approvalCheckNonceRef = useRef(0)
  const checkApprovalRef = useRef(checkApproval)
  const isOpenRef = useRef(isOpen)

  // Always enable staking surface when sidebar is open
  const stakingEnabled = isOpen

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    checkApprovalRef.current = checkApproval
  }, [checkApproval])

  const charactersEnabled = stakingEnabled && isConnected && !!effectiveWallet
  const {
    characters,
    isLoading: isLoadingCharacters,
    error: charactersError,
    refetch: refetchCharacters,
  } = useOwnedCharacters(effectiveWallet, { enabled: charactersEnabled })

  // Pagination calculations
  const totalCharacters = characters.length
  const totalPages = Math.ceil(totalCharacters / perPage)
  const startIndex = page * perPage
  const endIndex = Math.min(startIndex + perPage, totalCharacters)

  // Get characters for current page only
  const pagedCharacters = useMemo(() => {
    return characters.slice(startIndex, endIndex)
  }, [characters, startIndex, endIndex])

  // Only fetch staking statuses for the current page
  const wagdieIds = useMemo(() => {
    const ids = pagedCharacters.map(c => c.token_id)
    return uniqueNumberList(ids)
  }, [pagedCharacters])

  const statusesEnabled = stakingEnabled && isConnected && wagdieIds.length > 0
  const {
    statuses,
    isLoading: isLoadingStatuses,
    error: statusesError,
    refetch: refetchStatuses,
  } = useStakingStatuses(wagdieIds, { enabled: statusesEnabled })

  // Merge characters into single list, sorted by staking status then token_id
  const allCharacters = useMemo(() => {
    return pagedCharacters
      .map(c => ({
        ...c,
        isStaked: statuses.get(c.token_id)?.isStaked ?? false,
        locationId: statuses.get(c.token_id)?.locationId,
      }))
      .sort((a, b) => {
        // Unstaked first, then staked
        if (a.isStaked !== b.isStaked) return a.isStaked ? 1 : -1
        return a.token_id - b.token_id
      })
  }, [pagedCharacters, statuses])

  // Reset page when wallet changes
  useEffect(() => {
    setPage(0)
  }, [effectiveWallet])

  useEffect(() => {
    if (isOpen) {
      setVisible(true)
      return
    }
    const timer = window.setTimeout(() => setVisible(false), 300)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isOpen) return
      e.preventDefault()
      onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const runApprovalCheck = useCallback(async () => {
    if (!stakingEnabled || !isConnected || !address) {
      setApprovalState('idle')
      setApprovalError(null)
      return
    }

    if (approvalCheckInFlightRef.current) return
    approvalCheckInFlightRef.current = true

    const currentNonce = ++approvalCheckNonceRef.current

    setApprovalState('checking')
    setApprovalError(null)

    const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('Approval check timed out'))
        }, timeoutMs)

        promise
          .then((value) => {
            window.clearTimeout(timeoutId)
            resolve(value)
          })
          .catch((err) => {
            window.clearTimeout(timeoutId)
            reject(err)
          })
      })
    }

    try {
      const approved = await withTimeout(
        Promise.resolve(checkApprovalRef.current()),
        10_000
      )

      if (approvalCheckNonceRef.current !== currentNonce) return
      if (!isOpenRef.current) return

      setApprovalState(approved ? 'approved' : 'not_approved')
    } catch (err) {
      if (approvalCheckNonceRef.current !== currentNonce) return
      if (!isOpenRef.current) return

      const message =
        err instanceof Error
          ? err.message
          : 'Failed to check approval'

      setApprovalState('error')
      setApprovalError(message)
    } finally {
      if (approvalCheckNonceRef.current === currentNonce) {
        approvalCheckInFlightRef.current = false
      }
    }
  }, [isConnected, stakingEnabled, address])

  useEffect(() => {
    void runApprovalCheck()
  }, [runApprovalCheck])

  const handleApprove = useCallback(async () => {
    setApprovalError(null)
    await approveForStaking()
    await runApprovalCheck()
  }, [approveForStaking, runApprovalCheck])

  const handleStake = useCallback(
    async (tokenId: number) => {
      if (!selectedLocation) return
      setActiveTokenId(tokenId)

      try {
        await stakeWagdie(tokenId, selectedLocation.locationId)
        await Promise.all([refetchStatuses(), refetchCharacters()])
        if (onStakingChanged) onStakingChanged()
      } finally {
        setActiveTokenId(null)
      }
    },
    [selectedLocation, stakeWagdie, refetchStatuses, refetchCharacters, onStakingChanged]
  )

  const handleUnstake = useCallback(
    async (tokenId: number) => {
      setActiveTokenId(tokenId)

      try {
        await unstakeWagdie(tokenId)
        await Promise.all([refetchStatuses(), refetchCharacters()])
        if (onStakingChanged) onStakingChanged()
      } finally {
        setActiveTokenId(null)
      }
    },
    [unstakeWagdie, refetchStatuses, refetchCharacters, onStakingChanged]
  )

  const canStakeNow =
    isConnected &&
    !!selectedLocation &&
    approvalState === 'approved' &&
    !isStaking &&
    !isApproving

  const showApprovalBanner = isConnected && approvalState !== 'approved'

  const dataLoadingError =
    (charactersError ? `Failed to load characters: ${charactersError.message}` : null) ||
    (statusesError ? `Failed to load staking status: ${statusesError.message}` : null) ||
    null

  const transactionError = stakingError?.message ?? null

  const headerTitle = getMarkerTitle(selectedMarker)
  const isLocationMarker = selectedMarker?.type === 'location'
  const locationData = isLocationMarker ? (selectedMarker.data as MapLocationData) : null

  if (!visible && !isOpen) return null

  return (
    <div className="absolute inset-0 z-[60] pointer-events-none">
      {/* Mobile scrim */}
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={`
          absolute inset-0 md:hidden
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          pointer-events-auto
          ${isOpen ? 'opacity-100' : 'opacity-0'}
        `}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-labelledby="map-sidebar-title"
        className={`
          pointer-events-auto
          absolute top-0 right-0 h-full
          w-full md:w-[460px]
          bg-soul-950 border-l border-neutral-800
          flex flex-col shadow-2xl md:rounded-l-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800/80 bg-gradient-to-b from-soul-950 to-transparent flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2
                id="map-sidebar-title"
                className="font-eskapade text-neutral-100 tracking-wide text-lg truncate"
                title={headerTitle}
              >
                {headerTitle}
              </h2>
              {selectedMarker && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 shrink-0">
                  {selectedMarker.type.toUpperCase()}
                </Badge>
              )}
            </div>
            {isLocationMarker && locationData?.description && (
              <p className="text-sm text-neutral-500 font-eskapade mt-1 line-clamp-1">
                {locationData.description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700 transition-all"
            aria-label="Close"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Single scrollable view */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* No marker selected state */}
          {!selectedMarker && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800/50 flex items-center justify-center mb-4 shadow-xl">
                <svg className="w-7 h-7 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-lg text-neutral-300 font-eskapade mb-1">Select a marker</h3>
              <p className="text-sm text-neutral-600 font-eskapade max-w-[220px]">
                Click any location, character, or event on the map to view details
              </p>
            </div>
          )}

          {/* Non-location marker details */}
          {selectedMarker && !isLocationMarker && (
            <NonLocationMarkerDetails marker={selectedMarker} />
          )}

          {/* Tab buttons (only for location markers) */}
          {isLocationMarker && (
            <div className="flex gap-1 p-1 bg-neutral-900/50 rounded-lg border border-neutral-800/50">
              <button
                type="button"
                onClick={() => setActiveTab('staked-here')}
                className={`
                  flex-1 px-4 py-2.5 rounded-md font-eskapade text-sm tracking-wide transition-all
                  ${activeTab === 'staked-here'
                    ? 'bg-soul-accent/10 text-soul-accent border border-soul-accent/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
                  }
                `}
              >
                Staked Here
                <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">
                  {stakedHere.length}
                </Badge>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('your-characters')}
                className={`
                  flex-1 px-4 py-2.5 rounded-md font-eskapade text-sm tracking-wide transition-all
                  ${activeTab === 'your-characters'
                    ? 'bg-soul-accent/10 text-soul-accent border border-soul-accent/30'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 border border-transparent'
                  }
                `}
              >
                Your Characters
                {isConnected && (
                  <Badge variant="outline" className="ml-2 text-xs px-1.5 py-0">
                    {totalCharacters}
                  </Badge>
                )}
              </button>
            </div>
          )}

          {/* Staked Here List (only for location markers, when tab active) */}
          {isLocationMarker && activeTab === 'staked-here' && (
            <div className="space-y-2">
              {stakedHere.length > 0 ? (
                <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                  {stakedHere.map((row) => {
                    const image = getCharacterImage(row)
                    const name = getCharacterName(row)
                    return (
                      <div
                        key={row.token_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-900/30 border border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/50 transition-all duration-200"
                      >
                        <Link
                          href={`/characters/${row.token_id}`}
                          className="w-11 h-11 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800 hover:border-soul-accent/50 transition-all group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const img = e.currentTarget
                              img.onerror = null
                              img.src = '/images/placeholder-character.svg'
                            }}
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base text-neutral-200 font-eskapade">
                            {name}
                          </div>
                        </div>

                        <Link href={`/characters/${row.token_id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-900/50 border border-neutral-800/50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-base text-neutral-500 font-eskapade">No characters staked</p>
                  <p className="text-sm text-neutral-600 font-eskapade mt-1">Be the first to claim this location</p>
                </div>
              )}
            </div>
          )}

          {/* YOUR CHARACTERS Section (show when tab active OR when not a location marker) */}
          {(activeTab === 'your-characters' || !isLocationMarker) && (
          <div className="space-y-3">

            {/* Wallet gate */}
            {!isConnected ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800/50 flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                  </svg>
                </div>
                <p className="text-base text-neutral-400 font-eskapade mb-1">Wallet not connected</p>
                <p className="text-sm text-neutral-600 font-eskapade">Connect to view and stake your characters</p>
              </div>
            ) : (
              <>
                {/* Approval status banner */}
                {isConnected && approvalState === 'approved' && (
                  <div className="rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20 p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-300 font-eskapade">Ready to stake</p>
                    </div>
                  </div>
                )}
                {showApprovalBanner && (
                  <div className="rounded-lg bg-gradient-to-r from-soul-accent/5 to-transparent border border-soul-accent/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-soul-accent/10 border border-soul-accent/30 flex items-center justify-center shrink-0">
                        {(approvalState === 'idle' || approvalState === 'checking') ? (
                          <Spinner size="sm" />
                        ) : approvalState === 'error' ? (
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-soul-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {(approvalState === 'idle' || approvalState === 'checking') && (
                          <>
                            <p className="text-base text-neutral-300 font-eskapade">Checking approval...</p>
                            <p className="text-sm text-neutral-500 font-eskapade mt-0.5">Verifying contract permissions</p>
                          </>
                        )}
                        {approvalState === 'not_approved' && (
                          <>
                            <p className="text-base text-neutral-200 font-eskapade">Contract approval required</p>
                            <p className="text-sm text-neutral-500 font-eskapade mt-0.5">Approve once to enable staking</p>
                          </>
                        )}
                        {approvalState === 'error' && (
                          <>
                            <p className="text-base text-red-300 font-eskapade">Approval check failed</p>
                            <p className="text-sm text-neutral-500 font-eskapade mt-0.5">{approvalError || 'Please try again'}</p>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={handleApprove}
                        disabled={approvalState === 'idle' || approvalState === 'checking' || isApproving}
                        className="shrink-0"
                      >
                        {isApproving ? 'Approving…' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {(isLoadingCharacters || isLoadingStatuses) && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <Spinner size="sm" />
                    <span className="text-base text-neutral-500 font-eskapade">Loading characters…</span>
                  </div>
                )}

                {/* Error states - using Alert component */}
                {dataLoadingError && (
                  <Alert variant="default" className="bg-neutral-900/30 border-neutral-800">
                    {dataLoadingError}
                  </Alert>
                )}
                {transactionError && (
                  <Alert variant="destructive">
                    {transactionError}
                  </Alert>
                )}

                {/* Character list - unified, no section headers */}
                {!isLoadingCharacters && allCharacters.length === 0 && (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-14 h-14 rounded-full bg-neutral-900/50 border border-neutral-800/50 flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-base text-neutral-400 font-eskapade mb-1">No characters found</p>
                    <p className="text-sm text-neutral-600 font-eskapade">Your WAGDIE NFTs will appear here</p>
                  </div>
                )}

                {allCharacters.length > 0 && (
                  <div className="space-y-2">
                    {allCharacters.map((character) => {
                      const image = getCharacterImage(character)
                      const name = getCharacterName(character)
                      const isRowBusy = activeTokenId === character.token_id
                      const isStaked = character.isStaked

                      return (
                        <div
                          key={character.token_id}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200
                            ${isStaked
                              ? 'bg-gradient-to-r from-soul-accent/8 to-transparent border border-soul-accent/25 shadow-[inset_0_1px_0_rgba(200,170,110,0.1)]'
                              : 'bg-neutral-900/30 border border-neutral-800/60 hover:border-neutral-700 hover:bg-neutral-900/50'
                            }
                          `}
                        >
                          <Link
                            href={`/characters/${character.token_id}`}
                            className="w-11 h-11 rounded-lg bg-neutral-900 overflow-hidden shrink-0 border border-neutral-800 hover:border-soul-accent/50 transition-all group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={image}
                              alt={name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const img = e.currentTarget
                                img.onerror = null
                                img.src = '/images/placeholder-character.svg'
                              }}
                            />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base text-neutral-200 font-eskapade">
                              {name}
                            </div>
                            {isStaked && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-soul-accent animate-pulse" />
                                <span className="text-xs text-soul-accent/70 font-eskapade tracking-wider">STAKED</span>
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            {isStaked ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleUnstake(character.token_id)}
                                disabled={isRowBusy || isUnstaking || isLoadingStatuses}
                                isLoading={isRowBusy && isUnstaking}
                              >
                                Unstake
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleStake(character.token_id)}
                                disabled={!canStakeNow || isRowBusy || isLoadingStatuses}
                                isLoading={isRowBusy && isStaking}
                              >
                                Stake
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Pagination */}
                {totalCharacters > perPage && (
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-800/50">
                    <span className="text-sm text-neutral-500 font-eskapade">
                      Showing <span className="text-neutral-400">{startIndex + 1}-{endIndex}</span> of <span className="text-neutral-400">{totalCharacters}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0 || isLoadingStatuses}
                        className="px-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </Button>
                      <span className="text-sm text-neutral-500 font-eskapade px-2">
                        {page + 1} / {totalPages}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1 || isLoadingStatuses}
                        className="px-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>

        {/* Footer hint */}
        {isConnected && !canStakeNow && selectedLocation && approvalState === 'approved' && (
          <div className="px-5 py-3 border-t border-neutral-800/60 bg-gradient-to-t from-soul-950 to-transparent">
            <div className="flex items-center gap-2 text-sm text-neutral-500 font-eskapade">
              <svg className="w-4 h-4 text-soul-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Select an unstaked character to stake at <span className="text-neutral-400">{selectedLocation.location.name}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MapStakingSidebar
