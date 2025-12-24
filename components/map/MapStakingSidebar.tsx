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
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@/components/ui'
import type { Character } from '@/types/character'
import { getLocalImagePath } from '@/lib/utils/image'

export interface SelectedStakingLocation {
  location: Location
  locationId: bigint
}

export type MapSidebarTab = 'details' | 'characters'

export interface MapStakingSidebarProps {
  isOpen: boolean
  activeTab: MapSidebarTab
  onTabChange: (tab: MapSidebarTab) => void
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
  // Primary source: local bundled character art (matches characters page pattern)
  const local = getLocalImagePath(character.token_id)
  if (local && local.trim().length > 0) return local.trim()

  // Fallbacks (kept for resilience if needed)
  const direct = character.image_url?.trim()
  if (direct) return direct

  const meta = character.metadata?.image?.trim()
  if (meta) return meta

  // Final fallback handled in <img onError> (placeholder)
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

function MarkerDetailsPanel({
  marker,
  stakedHere,
  onSwitchToCharacters,
}: {
  marker: MarkerPayload | null
  stakedHere: CharacterWithLocation[]
  onSwitchToCharacters?: () => void
}) {
  if (!marker) {
    return (
      <div className="p-4">
        <div className="rounded-lg border border-neutral-800 bg-black/30 p-4">
          <div className="text-sm text-neutral-200 font-eskapade tracking-wide">
            Click a marker to see details
          </div>
          <div className="text-xs text-neutral-500 font-eskapade mt-1">
            Locations, characters, burns, deaths, and fights will appear here.
          </div>
        </div>
      </div>
    )
  }

  if (marker.type === 'location') {
    const data = marker.data as MapLocationData
    const title = isNonEmptyString(data?.name) ? data.name : marker.name
    const description = isNonEmptyString(data?.description) ? data.description : null

    return (
      <div className="p-4 space-y-4">
        <Card className="bg-black/40 border border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
                {title}
              </div>

              {description && (
                <p className="text-sm text-neutral-400 font-eskapade leading-relaxed">
                  {description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
                <div className="text-xs text-neutral-500 font-eskapade">
                  Coords: {Math.round(marker.x)}, {Math.round(marker.y)}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onSwitchToCharacters}
                >
                  Manage staking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
              Staked Here
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-eskapade tracking-widest">
                CHARACTERS
              </span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {stakedHere.length}
              </span>
            </div>

            {stakedHere.length > 0 ? (
              <div className="mt-3 space-y-2 max-h-72 overflow-auto pr-1">
                {stakedHere.map((row) => (
                  <div
                    key={row.token_id}
                    className="flex items-center gap-3 p-2 rounded bg-white/5 border border-neutral-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-neutral-200 font-eskapade tracking-wide">
                        #{row.token_id}
                      </div>
                      <div className="text-xs text-neutral-500 font-eskapade">
                        {truncateAddress(row.owner_address ?? undefined)}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/characters/${row.token_id}`}
                        className="text-xs text-soul-accent hover:text-soul-accent/80 font-eskapade tracking-widest"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-sm text-neutral-600 font-eskapade">
                No characters staked here.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (marker.type === 'character') {
    const data = marker.data as MapCharacterData
    const tokenId = typeof data?.character_token_id === 'number' ? data.character_token_id : null
    const characterName =
      (isNonEmptyString(data?.character_name) ? data.character_name : null) ??
      (isNonEmptyString(marker.name) ? marker.name : null) ??
      (tokenId !== null ? `Character #${tokenId}` : 'Character')

    const walletAddress = isNonEmptyString(data?.wallet_address) ? data.wallet_address : undefined
    const locationName = isNonEmptyString(data?.location?.name) ? data.location.name : undefined
    const locationId = isNonEmptyString(data?.location?.id) ? data.location.id : undefined

    return (
      <div className="p-4 space-y-4">
        <Card className="bg-black/40 border border-neutral-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
              Character
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-1">
              <div className="text-sm text-neutral-100 font-eskapade tracking-wide">
                {characterName}
              </div>
              {tokenId !== null && (
                <div className="text-xs text-neutral-500 font-eskapade">
                  Token #{tokenId}
                </div>
              )}
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

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-500 font-eskapade tracking-widest">COORDS</span>
                <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                  {Math.round(marker.x)}, {Math.round(marker.y)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              {tokenId !== null && (
                <Link href={`/characters/${tokenId}`} className="w-full">
                  <Button className="w-full" size="sm">
                    View character page
                  </Button>
                </Link>
              )}

              {locationId && (
                <div className="hidden">
                  {locationId}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
          <div className="text-xs text-neutral-500 font-eskapade">
            Note: Only your connected wallet’s character pins are rendered on the map.
          </div>
        </div>
      </div>
    )
  }

  // burn / death / fight
  const eventData = marker.data as MapEventData
  const title =
    (isNonEmptyString(eventData?.title) ? eventData.title : null) ??
    (isNonEmptyString(eventData?.name) ? eventData.name : null) ??
    (isNonEmptyString(marker.name) ? marker.name : null) ??
    'Event'

  const wikiPageId =
    typeof eventData?.wikiPageID === 'number'
      ? eventData.wikiPageID
      : undefined

  return (
    <div className="p-4 space-y-4">
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

          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-neutral-500 font-eskapade tracking-widest">COORDS</span>
              <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                {Math.round(marker.x)}, {Math.round(marker.y)}
              </span>
            </div>

            {wikiPageId !== undefined && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-500 font-eskapade tracking-widest">WIKI</span>
                <span className="text-xs text-neutral-300 font-eskapade tracking-widest">
                  #{wikiPageId}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-neutral-800 bg-black/30 p-3">
            <div className="text-xs text-neutral-500 font-eskapade">
              Additional event fields may be present depending on the dataset.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function MapStakingSidebar({
  isOpen,
  activeTab,
  onTabChange,
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

  const stakingEnabled = isOpen && activeTab === 'characters'

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

  // Only fetch staking statuses for the current page (max 10 calls instead of 100)
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

  // Filter paged characters by staking status
  const stakedCharacters = useMemo(() => {
    return pagedCharacters
      .filter((c) => statuses.get(c.token_id)?.isStaked)
      .sort((a, b) => a.token_id - b.token_id)
  }, [pagedCharacters, statuses])

  const unstakedCharacters = useMemo(() => {
    return pagedCharacters
      .filter((c) => !statuses.get(c.token_id)?.isStaked)
      .sort((a, b) => a.token_id - b.token_id)
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
    // Only check when staking surface is enabled and wagmi has an address available
    if (!stakingEnabled || !isConnected || !address) {
      setApprovalState('idle')
      setApprovalError(null)
      return
    }

    // Prevent duplicate/in-flight checks (can happen due to rerenders)
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

      // If a newer check started (or sidebar closed), ignore this result
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
      // Only clear in-flight flag if we're still the latest check
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

  // Only show approval banner when approval status is not yet confirmed
  const showApprovalBanner = isConnected && approvalState !== 'approved'

  // Data loading errors (API/blockchain reads) - not actual transactions
  const dataLoadingError =
    (charactersError ? `Failed to load characters: ${charactersError.message}` : null) ||
    (statusesError ? `Failed to load staking status: ${statusesError.message}` : null) ||
    null

  // Transaction errors - only from actual approve/stake/unstake operations
  const transactionError = stakingError?.message ?? null

  const headerTitle = getMarkerTitle(selectedMarker)

  if (!visible && !isOpen) return null

  return (
    <div className="absolute inset-0 z-[60] pointer-events-none">
      {/* Mobile scrim (only on small screens; desktop uses pushed layout) */}
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
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="map-sidebar-title"
              className="font-eskapade text-neutral-100 tracking-wider text-sm truncate"
              title={headerTitle}
            >
              {headerTitle}
            </h2>
            <div className="text-[10px] text-neutral-500 font-eskapade tracking-widest">
              {selectedMarker ? selectedMarker.type.toUpperCase() : 'MAP'}
            </div>
          </div>

          {/* Tabs */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTabChange('details')}
              aria-pressed={activeTab === 'details'}
              className={`
                px-3 py-1.5 rounded border text-xs font-eskapade tracking-widest transition-colors
                ${activeTab === 'details'
                  ? 'bg-soul-accent text-black border-soul-accent'
                  : 'bg-black/40 text-neutral-300 border-neutral-700 hover:border-neutral-500'}
              `}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => onTabChange('characters')}
              aria-pressed={activeTab === 'characters'}
              className={`
                px-3 py-1.5 rounded border text-xs font-eskapade tracking-widest transition-colors
                ${activeTab === 'characters'
                  ? 'bg-soul-accent text-black border-soul-accent'
                  : 'bg-black/40 text-neutral-300 border-neutral-700 hover:border-neutral-500'}
              `}
            >
              Characters
            </button>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
            aria-label="Close"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <MarkerDetailsPanel
              marker={selectedMarker}
              stakedHere={stakedHere}
              onSwitchToCharacters={() => onTabChange('characters')}
            />
          ) : (
            <div className="p-4 space-y-4">
              {/* Selected location panel */}
              <Card className="bg-black/40 border border-neutral-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
                    Selected Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {selectedLocation ? (
                    <div className="space-y-1">
                      <div className="text-sm text-neutral-200 font-eskapade tracking-wide">
                        {selectedLocation.location.name}
                      </div>
                      <div className="text-xs text-neutral-500 font-eskapade">
                        Location #{selectedLocation.locationId.toString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-neutral-500 font-eskapade">
                      Select a location marker to stake an unstaked character.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Wallet gate */}
              {!isConnected ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 10-8 0v4m16 0V7a4 4 0 10-8 0v4m-3 0h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-eskapade text-neutral-200 mb-2">
                    Wallet Required
                  </h3>
                  <p className="text-sm text-neutral-500">
                    Connect your wallet to view and stake your characters.
                  </p>
                </div>
              ) : (
                <>
                  {/* Compact approved indicator */}
                  {isConnected && approvalState === 'approved' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-800/30 rounded-lg">
                      <Badge variant="outline" className="border-green-600/50 text-green-500">Approved</Badge>
                      <span className="text-xs text-neutral-400 font-eskapade">
                        Staking contract approved
                      </span>
                    </div>
                  )}

                  {/* Approval banner (shown when not yet approved) */}
                  {showApprovalBanner && (
                    <Card className="bg-black/40 border border-neutral-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-eskapade tracking-widest text-soul-accent">
                          Staking Approval
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            {approvalState === 'checking' && (
                              <div className="flex items-center gap-2 text-sm text-neutral-500">
                                <Spinner size="sm" />
                                <span className="font-eskapade">Checking approval…</span>
                              </div>
                            )}

                            {approvalState === 'not_approved' && (
                              <div className="space-y-2">
                                <div className="text-sm text-neutral-400 font-eskapade">
                                  Approve the staking contract once to enable staking.
                                </div>
                                <div className="text-xs text-neutral-600 font-eskapade">
                                  This uses ERC-721 operator approval (setApprovalForAll).
                                </div>
                              </div>
                            )}

                            {approvalState === 'error' && (
                              <div className="text-sm text-red-400 font-eskapade">
                                {approvalError || 'Failed to check approval.'}
                              </div>
                            )}
                          </div>

                          <div className="shrink-0">
                            <Button
                              size="sm"
                              onClick={handleApprove}
                              disabled={
                                approvalState === 'checking' ||
                                isApproving
                              }
                            >
                              {isApproving ? 'Approving…' : 'Approve'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Loading indicator */}
                  {(isLoadingCharacters || isLoadingStatuses) && (
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Spinner size="sm" />
                      <span className="font-eskapade">Loading…</span>
                    </div>
                  )}

                  {/* Data loading error banner (warning style) */}
                  {dataLoadingError && (
                    <div className="px-4 py-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                      <p className="text-sm text-amber-400 font-eskapade">
                        {dataLoadingError}
                      </p>
                    </div>
                  )}

                  {/* Transaction error banner (only for actual transaction failures) */}
                  {transactionError && (
                    <div className="px-4 py-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                      <p className="text-sm text-red-400 font-eskapade">
                        {transactionError}
                      </p>
                    </div>
                  )}

                  {/* Character list */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {/* REPOMARK:SCOPE: 2 - Replace font-display with font-eskapade for Unstaked/Staked section titles and row name text (UI font contract) */}
                      <h3 className="text-xs font-eskapade tracking-widest text-neutral-300">
                        Unstaked
                      </h3>
                      <Badge variant="default">{unstakedCharacters.length}</Badge>
                    </div>

                    {isLoadingCharacters ? (
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <Spinner size="sm" />
                        <span className="font-eskapade">Loading characters…</span>
                      </div>
                    ) : unstakedCharacters.length === 0 ? (
                      <div className="text-sm text-neutral-600 font-eskapade">
                        No unstaked characters found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unstakedCharacters.map((character) => {
                          const image = getCharacterImage(character)
                          const name = getCharacterName(character)
                          const isRowBusy = activeTokenId === character.token_id
                          const stakeDisabled =
                            !canStakeNow || isRowBusy || isLoadingStatuses

                          return (
                            <div
                              key={`unstaked-${character.token_id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-neutral-800"
                            >
                              <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.currentTarget
                                    img.onerror = null
                                    img.src = '/images/placeholder-character.svg'
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate text-sm text-neutral-200 font-eskapade tracking-wide">
                                    {name}
                                  </div>
                                  <Badge variant="outline">Unstaked</Badge>
                                </div>
                                <div className="text-xs text-neutral-500 font-eskapade">
                                  Token #{character.token_id}
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleStake(character.token_id)}
                                  disabled={stakeDisabled}
                                >
                                  {isRowBusy && isStaking ? 'Staking…' : 'Stake'}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <h3 className="text-xs font-eskapade tracking-widest text-neutral-300">
                        Staked
                      </h3>
                      <Badge variant="default">{stakedCharacters.length}</Badge>
                    </div>

                    {stakedCharacters.length === 0 ? (
                      <div className="text-sm text-neutral-600 font-eskapade">
                        No staked characters found.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stakedCharacters.map((character) => {
                          const image = getCharacterImage(character)
                          const name = getCharacterName(character)
                          const status = statuses.get(character.token_id)
                          const locationId = status?.locationId
                          const isRowBusy = activeTokenId === character.token_id
                          const unstakeDisabled = isRowBusy || isUnstaking || isLoadingStatuses

                          return (
                            <div
                              key={`staked-${character.token_id}`}
                              className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-neutral-800"
                            >
                              <div className="w-10 h-10 rounded bg-neutral-900 border border-neutral-800 overflow-hidden shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={image}
                                  alt={name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.currentTarget
                                    img.onerror = null
                                    img.src = '/images/placeholder-character.svg'
                                  }}
                                />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="truncate text-sm text-neutral-200 font-eskapade tracking-wide">
                                    {name}
                                  </div>
                                  <Badge variant="accent">Staked</Badge>
                                </div>

                                <div className="text-xs text-neutral-500 font-eskapade">
                                  Token #{character.token_id}
                                </div>

                                <div className="text-xs text-neutral-400 font-eskapade mt-1">
                                  {locationId
                                    ? `Staked at Location #${locationId.toString()}`
                                    : 'Staked'}
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleUnstake(character.token_id)}
                                  disabled={unstakeDisabled}
                                >
                                  {isRowBusy && isUnstaking ? 'Unstaking…' : 'Unstake'}
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Pagination controls */}
                    {totalCharacters > perPage && (
                      <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
                        <div className="text-xs text-neutral-500 font-eskapade">
                          Showing {startIndex + 1}-{endIndex} of {totalCharacters}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || isLoadingStatuses}
                          >
                            Prev
                          </Button>
                          <span className="text-xs text-neutral-400 font-eskapade min-w-[60px] text-center">
                            {page + 1} / {totalPages}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || isLoadingStatuses}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer helper */}
        {activeTab === 'characters' && isConnected && (
          <div className="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-600 font-eskapade">
            Stake requires a selected location and staking approval.
          </div>
        )}
      </div>
    </div>
  )
}

export default MapStakingSidebar