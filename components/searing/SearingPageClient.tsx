'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Flame, RefreshCw, Wand2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useAuth } from '@/hooks/useAuth'
import { useOwnedCharacters } from '@/hooks/useOwnedCharacters'
import { useSearing } from '@/hooks/useSearing'
import { useSearingConcords, type OwnedSearableConcord } from '@/hooks/useSearingConcords'
import {
  readSearingSyncResponse,
  SearingApprovalPanel,
  SearingConcordGrid,
  SearingOffchainStatus,
  syncStateFromResponse,
  type SearingSyncState,
} from '@/components/characters/searing'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getAlignmentForAttributes,
  normalizeNftAttributes,
  resolveSearingVariant,
} from '@/lib/domain/searing/searing-layer-resolver'
import { getCharacterImageDisclosure, getCharacterImageFallback, getCharacterImageUrl } from '@/lib/utils/image'
import { TransactionStatus } from '@/types/blockchain'
import type { TransactionHash } from '@/types/blockchain'
import type { Character } from '@/types/character'

function getCharacterName(character: Character): string {
  return character.name || character.metadata?.name || `WAGDIE #${character.token_id}`
}

function isCharacterSeared(character: Character): boolean {
  return Boolean(
    character.metadata?.isSeared ||
    character.metadata?.searImage ||
    character.metadata?.searing_materialization?.seared_image_url
  )
}

function CharacterTile({
  character,
  selected,
  disabled,
  optimisticSearedImageUrl,
  onSelect,
}: {
  character: Character
  selected: boolean
  disabled?: boolean
  optimisticSearedImageUrl?: string
  onSelect: (character: Character) => void
}) {
  const name = getCharacterName(character)
  const disclosure = getCharacterImageDisclosure(
    character.token_id,
    character.metadata,
    character.image_url,
    {
      infectionStatus: character.infection_status,
      isInfected: character.infected,
    }
  )
  const imageUrl = optimisticSearedImageUrl && !disclosure.isCurrentlyInfected
    ? optimisticSearedImageUrl
    : disclosure.primaryUrl
  const seared = isCharacterSeared(character) || Boolean(optimisticSearedImageUrl)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(character)}
      className={`group overflow-hidden border bg-black/30 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? 'border-soul-accent bg-soul-accent/10 shadow-soul-glow'
          : 'border-neutral-800 hover:border-soul-accent/60'
      }`}
    >
      <div className="aspect-square overflow-hidden bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover [image-rendering:pixelated]"
          onError={(event) => {
            event.currentTarget.src = getCharacterImageFallback()
          }}
        />
      </div>
      <div className="min-w-0 p-3">
        <p className="truncate text-sm text-neutral-100 font-eskapade" title={name}>{name}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-500 font-eskapade">#{character.token_id}</span>
          {seared && (
            <span title={disclosure.isSearedImageHiddenByInfection ? 'Seared art generated; infected art remains primary' : undefined}>
              <Badge variant="outline">seared</Badge>
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ResultPreview({
  character,
  concord,
  syncState,
}: {
  character: Character | null
  concord: OwnedSearableConcord | null
  syncState: SearingSyncState
}) {
  const characterName = character ? getCharacterName(character) : 'Select a WAGDIE'
  const sourceImageUrl = character
    ? getCharacterImageUrl(character.token_id, character.metadata, character.image_url, {
      infectionStatus: character.infection_status,
      isInfected: character.infected,
    })
    : getCharacterImageFallback()
  const isMaterializedResult = syncState.status === 'completed'
  const hasSearingPreview = Boolean(character && concord && !isMaterializedResult)
  const searingPreviewUrl = character && concord
    ? `/api/characters/${character.token_id}/searing/preview?concordId=${concord.concordId}`
    : null
  const previewImageUrl = isMaterializedResult
    ? syncState.imageUrl
    : searingPreviewUrl || sourceImageUrl
  const resolvedVariant = character && concord
    ? resolveSearingVariant(concord.map, getAlignmentForAttributes(normalizeNftAttributes(character.metadata)))
    : null
  const imageLabel = isMaterializedResult
    ? 'Materialized seared result'
    : hasSearingPreview
      ? 'Preview only — confirm the transaction to make this permanent'
      : 'Current source art — select a Concord to preview searing'

  return (
    <section className="border border-neutral-800 bg-soul-950/70">
      <div className="border-b border-neutral-800 p-4">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-soul-accent" />
          <h2 className="font-display text-lg text-neutral-100">Result</h2>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-[180px_1fr]">
        <div className="space-y-2">
          <div className={`aspect-square overflow-hidden border bg-black/40 ${isMaterializedResult || hasSearingPreview ? 'border-soul-accent/60' : 'border-neutral-800'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewImageUrl}
            alt={characterName}
            className="h-full w-full object-cover [image-rendering:pixelated]"
            onError={(event) => {
              if (event.currentTarget.src !== sourceImageUrl) {
                event.currentTarget.src = sourceImageUrl
                return
              }

              event.currentTarget.src = getCharacterImageFallback()
            }}
          />
          </div>
          <p className={`text-xs font-eskapade ${isMaterializedResult || hasSearingPreview ? 'text-soul-accent' : 'text-neutral-500'}`}>
            {imageLabel}
          </p>
        </div>
        <div className="min-w-0 space-y-4">
          <div>
            <p className="text-xs uppercase text-neutral-500 font-eskapade">WAGDIE</p>
            <p className="truncate text-xl text-neutral-100 font-eskapade" title={characterName}>
              {characterName}{character ? ` #${character.token_id}` : ''}
            </p>
          </div>

          {concord ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase text-neutral-500 font-eskapade">Concord burned</p>
                <p className="text-base text-soul-accent font-eskapade">{concord.name} #{concord.concordId}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(resolvedVariant?.location || concord.location) && (
                  <Badge variant="outline">{resolvedVariant?.location || concord.location}</Badge>
                )}
                {(resolvedVariant?.newTrait || concord.newTrait) && (
                  <Badge variant="accent">{resolvedVariant?.newTrait || concord.newTrait}</Badge>
                )}
                {(resolvedVariant?.makesBald || concord.makesBald) && <Badge variant="default">balding</Badge>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500 font-eskapade">Select a Concord to see the searing trait.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export function SearingPageClient() {
  const { address, isConnected } = useAccount()
  const { connect, isAuthenticating } = useAuth()
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null)
  const [selectedConcord, setSelectedConcord] = useState<OwnedSearableConcord | null>(null)
  const [syncState, setSyncState] = useState<SearingSyncState>({ status: 'idle' })
  const [lastSearingHash, setLastSearingHash] = useState<TransactionHash | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [optimisticSearedImagesByTokenId, setOptimisticSearedImagesByTokenId] = useState<Record<number, string>>({})

  const {
    isSearing,
    isApproving,
    error,
    txHash,
    txStatus,
    approvalStatus,
    searConcords,
    checkApprovalStatus,
    approveForSearing,
  } = useSearing()

  const {
    characters,
    isLoading: isLoadingCharacters,
    error: charactersError,
    refetch: refetchCharacters,
  } = useOwnedCharacters(address, {
    enabled: Boolean(address),
    perPage: 200,
    sort: 'asc',
  })

  const {
    concords,
    isLoading: isLoadingConcords,
    error: concordsError,
    refetch: refetchConcords,
  } = useSearingConcords({
    enabled: Boolean(address),
    walletAddress: address,
  })

  const checkApprovalStatusRef = useRef(checkApprovalStatus)

  useEffect(() => {
    checkApprovalStatusRef.current = checkApprovalStatus
  }, [checkApprovalStatus])

  useEffect(() => {
    if (!address) return
    void checkApprovalStatusRef.current()
  }, [address])

  useEffect(() => {
    if (characters.length === 0) {
      setSelectedCharacterId(null)
      return
    }

    setSelectedCharacterId((current) => {
      if (current && characters.some((character) => character.token_id === current)) return current
      return characters[0].token_id
    })
  }, [characters])

  useEffect(() => {
    if (concords.length === 0) {
      setSelectedConcord(null)
      return
    }

    setSelectedConcord((current) => {
      if (current && concords.some((concord) => concord.concordId === current.concordId)) return current
      return concords[0]
    })
  }, [concords])

  const selectedCharacter = useMemo(
    () => characters.find((character) => character.token_id === selectedCharacterId) ?? null,
    [characters, selectedCharacterId]
  )
  const selectedCharacterDisclosure = useMemo(
    () => selectedCharacter
      ? getCharacterImageDisclosure(selectedCharacter.token_id, selectedCharacter.metadata, selectedCharacter.image_url, {
        infectionStatus: selectedCharacter.infection_status,
        isInfected: selectedCharacter.infected,
      })
      : null,
    [selectedCharacter]
  )
  const isCompletedImageHiddenByInfection = Boolean(
    syncState.status === 'completed' &&
    selectedCharacterDisclosure?.isCurrentlyInfected &&
    selectedCharacterDisclosure.primaryUrl !== syncState.imageUrl
  )

  const activeTxHash = txHash ?? lastSearingHash ?? undefined
  const canSear = Boolean(
    selectedCharacter &&
    selectedConcord &&
    approvalStatus?.isFullyApproved &&
    !isSearing &&
    !isApproving &&
    !isSyncing
  )

  const handleSelectCharacter = (character: Character) => {
    setSelectedCharacterId(character.token_id)
    setSyncState({ status: 'idle' })
    setLastSearingHash(null)
  }

  const handleSelectConcord = (concord: OwnedSearableConcord) => {
    setSelectedConcord(concord)
    setSyncState({ status: 'idle' })
    setLastSearingHash(null)
  }

  const handleApprove = async () => {
    await approveForSearing()
    await checkApprovalStatus()
  }

  const syncSearingMaterialization = useCallback(async (hash: TransactionHash) => {
    if (!selectedCharacter) return

    setIsSyncing(true)
    setSyncState({
      status: 'syncing',
      message: 'The chain transaction succeeded. Syncing seared artwork and metadata now.',
    })

    try {
      const response = await fetch(`/api/characters/${selectedCharacter.token_id}/searing/sync`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionHash: hash, retryFailed: true, repairCompleted: true }),
      })
      const payload = await readSearingSyncResponse(response)
      const nextState = syncStateFromResponse({
        ...payload,
        error: response.ok ? payload.error : payload.error || 'Failed to sync searing materialization',
      }, { responseOk: response.ok })

      setSyncState(nextState)
      if (nextState.status === 'completed') {
        setOptimisticSearedImagesByTokenId((current) => ({
          ...current,
          [selectedCharacter.token_id]: nextState.imageUrl,
        }))
      }
      await Promise.all([refetchConcords(), refetchCharacters()])
    } catch (err) {
      setSyncState({
        status: 'failed',
        message: err instanceof Error ? err.message : 'Failed to sync searing materialization',
      })
      await Promise.all([refetchConcords(), refetchCharacters()])
    } finally {
      setIsSyncing(false)
    }
  }, [refetchCharacters, refetchConcords, selectedCharacter])

  const handleSear = async () => {
    if (!selectedCharacter || !selectedConcord || !approvalStatus?.isFullyApproved) return

    setSyncState({ status: 'idle' })
    const result = await searConcords(selectedCharacter.token_id, selectedConcord.concordId)
    if (!result.success) return

    if (!result.hash) {
      setSyncState({
        status: 'pending',
        message: 'The searing transaction succeeded but no hash was returned for off-chain sync.',
      })
      return
    }

    setLastSearingHash(result.hash)
    await syncSearingMaterialization(result.hash)
  }

  const handleRetrySync = async () => {
    const hash = lastSearingHash ?? txHash
    if (!hash) {
      setSyncState({
        status: 'pending',
        message: 'No transaction hash is available for retrying off-chain sync yet.',
      })
      return
    }

    await syncSearingMaterialization(hash)
  }

  return (
    <main className="min-h-screen bg-abyss text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 border-b border-neutral-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl text-soul-accent sm:text-4xl">Searing</h1>
            <p className="mt-2 max-w-2xl text-sm text-neutral-400 font-eskapade">
              Burn a searable Concord to permanently transform one of your WAGDIE tokens.
            </p>
          </div>
          {!isConnected && (
            <Button type="button" onClick={connect} isLoading={isAuthenticating}>
              Connect Wallet
            </Button>
          )}
        </div>

        {!isConnected ? (
          <section className="border border-neutral-800 bg-soul-950/70 p-8 text-center">
            <Flame className="mx-auto h-8 w-8 text-soul-accent" />
            <p className="mt-4 text-lg text-neutral-200 font-eskapade">Connect a wallet to load WAGDIE and Concord balances.</p>
          </section>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <section className="border border-neutral-800 bg-soul-950/70">
                <div className="flex items-center justify-between gap-3 border-b border-neutral-800 p-4">
                  <div>
                    <h2 className="font-display text-lg text-neutral-100">Your WAGDIE Tokens</h2>
                    <p className="text-xs text-neutral-500 font-eskapade">{characters.length} available</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void refetchCharacters()}>
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
                <div className="p-4">
                  {charactersError && (
                    <div className="mb-4 border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 font-eskapade">
                      {charactersError.message}
                    </div>
                  )}
                  {isLoadingCharacters ? (
                    <div className="border border-neutral-800 bg-black/20 p-4 text-sm text-neutral-400 font-eskapade">
                      Loading your WAGDIE tokens...
                    </div>
                  ) : characters.length === 0 ? (
                    <div className="border border-neutral-800 bg-black/20 p-8 text-center text-sm text-neutral-500 font-eskapade">
                      No owned or staked WAGDIE tokens found for this wallet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {characters.map((character) => (
                        <CharacterTile
                          key={character.token_id}
                          character={character}
                          selected={character.token_id === selectedCharacterId}
                          disabled={isSearing || isSyncing}
                          optimisticSearedImageUrl={optimisticSearedImagesByTokenId[character.token_id]}
                          onSelect={handleSelectCharacter}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              <section className="border border-neutral-800 bg-soul-950/70">
                <div className="border-b border-neutral-800 p-4">
                  <h2 className="font-display text-lg text-neutral-100">Your Concord Tokens</h2>
                </div>
                <div className="p-4">
                  {concordsError && (
                    <div className="mb-4 border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 font-eskapade">
                      {concordsError.message}
                    </div>
                  )}
                  <SearingConcordGrid
                    concords={concords}
                    selectedConcordId={selectedConcord?.concordId ?? null}
                    isLoading={isLoadingConcords}
                    disabled={isSearing || isSyncing}
                    onSelect={handleSelectConcord}
                  />
                </div>
              </section>
            </div>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
              <ResultPreview
                character={selectedCharacter}
                concord={selectedConcord}
                syncState={syncState}
              />

              <SearingApprovalPanel
                approvalStatus={approvalStatus}
                isApproving={isApproving}
                onApprove={handleApprove}
              />

              <Button
                type="button"
                onClick={handleSear}
                disabled={!canSear}
                isLoading={isSearing || isSyncing}
                variant="primary"
                className="w-full"
              >
                <Flame className="h-4 w-4" />
                {isSyncing ? 'Syncing Result' : 'Sear Selected Tokens'}
              </Button>

              {(txStatus !== TransactionStatus.IDLE || activeTxHash) && (
                <TxStatusComponent
                  status={txStatus}
                  hash={activeTxHash}
                  error={error?.message}
                />
              )}

              <SearingOffchainStatus
                state={syncState}
                onRetry={handleRetrySync}
                isRetrying={isSyncing}
                isSearedImageHiddenByInfection={isCompletedImageHiddenByInfection}
              />

              {error && txStatus !== TransactionStatus.ERROR && (
                <div className="border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
                </div>
              )}

              <div className="border border-soul-accent/20 bg-soul-accent/5 p-4">
                <p className="text-xs text-soul-accent font-eskapade">
                  Searing consumes the selected Concord token and permanently changes the selected WAGDIE.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}
