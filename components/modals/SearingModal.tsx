'use client'

// SearingModal Component
// Modal for searing Concords to transform WAGDIE characters

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useSearing } from '@/hooks/useSearing'
import {
  useSearingConcords,
  type OwnedSearableConcord,
} from '@/hooks/useSearingConcords'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'
import type { TransactionHash } from '@/types/blockchain'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  SearingApprovalPanel,
  SearingConcordGrid,
  SearingOffchainStatus,
  SearingPreview,
  readSearingSyncResponse,
  syncStateFromResponse,
  type SearingSyncState,
} from '@/components/characters/searing'

interface SearingModalProps {
  wagdieId: number
  wagdieName: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void | Promise<void>
  initialSyncState?: SearingSyncState
}

const DEFAULT_SYNC_STATE: SearingSyncState = { status: 'idle' }

export function SearingModal({
  wagdieId,
  wagdieName,
  isOpen,
  onClose,
  onSuccess,
  initialSyncState = DEFAULT_SYNC_STATE,
}: SearingModalProps) {
  const { address } = useAccount()
  const [selectedConcord, setSelectedConcord] = useState<OwnedSearableConcord | null>(null)
  const [syncState, setSyncState] = useState<SearingSyncState>(initialSyncState)
  const [lastSearingHash, setLastSearingHash] = useState<TransactionHash | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

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
    getConcordBalances,
  } = useSearing()

  const {
    concords,
    isLoading: isLoadingConcords,
    error: concordsError,
    refetch: refetchConcords,
  } = useSearingConcords({
    enabled: isOpen,
    walletAddress: address,
    getConcordBalances,
  })

  const checkApprovalStatusRef = useRef(checkApprovalStatus)

  useEffect(() => {
    checkApprovalStatusRef.current = checkApprovalStatus
  }, [checkApprovalStatus])

  useEffect(() => {
    if (!isOpen) return

    setSelectedConcord(null)
    setSyncState(initialSyncState)
    setLastSearingHash(null)
    void checkApprovalStatusRef.current()
  }, [initialSyncState, isOpen])

  useEffect(() => {
    if (!isOpen) return

    if (concords.length === 0) {
      setSelectedConcord(null)
      return
    }

    setSelectedConcord((current) => {
      if (current && concords.some((concord) => concord.concordId === current.concordId)) {
        return current
      }
      return concords[0]
    })
  }, [concords, isOpen])

  const syncSearingMaterialization = useCallback(async (hash: TransactionHash) => {
    setIsSyncing(true)
    setSyncState({
      status: 'syncing',
      message: 'The chain transaction succeeded. Syncing seared artwork and metadata now.',
    })

    try {
      const response = await fetch(`/api/characters/${wagdieId}/searing/sync`, {
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
      await refetchConcords()

      if (nextState.status === 'completed') {
        await onSuccess?.()
        window.setTimeout(onClose, 1200)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sync searing materialization'
      setSyncState({
        status: 'failed',
        message,
      })
      await refetchConcords()
    } finally {
      setIsSyncing(false)
    }
  }, [onClose, onSuccess, refetchConcords, wagdieId])

  const handleApprove = async () => {
    await approveForSearing()
    await checkApprovalStatus()
  }

  const handleSear = async () => {
    if (!selectedConcord || !approvalStatus?.isFullyApproved) {
      return
    }

    setSyncState({ status: 'idle' })
    const result = await searConcords(wagdieId, selectedConcord.concordId)

    if (!result.success) {
      return
    }

    if (!result.hash) {
      setSyncState({
        status: 'pending',
        message: 'The searing transaction succeeded but no hash was returned for off-chain sync. Refresh or retry sync from the character page.',
      })
      return
    }

    // useSearing().searConcords returns success only after the receipt is confirmed.
    setLastSearingHash(result.hash)
    await refetchConcords()
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

  const selectedConcordId = selectedConcord?.concordId ?? null
  const canSear = Boolean(
    selectedConcord &&
    approvalStatus?.isFullyApproved &&
    !isSearing &&
    !isApproving &&
    !isSyncing
  )
  const activeTxHash = txHash ?? lastSearingHash ?? undefined

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sear Concords"
      hideFooter
    >
      <div className="space-y-4">
        <SearingPreview
          wagdieId={wagdieId}
          wagdieName={wagdieName}
          concord={selectedConcord}
        />

        <SearingApprovalPanel
          approvalStatus={approvalStatus}
          isApproving={isApproving}
          onApprove={handleApprove}
        />

        {concordsError && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">{concordsError.message}</p>
          </div>
        )}

        <SearingConcordGrid
          concords={concords}
          selectedConcordId={selectedConcordId}
          isLoading={isLoadingConcords}
          disabled={isSearing || isSyncing}
          onSelect={setSelectedConcord}
        />

        <Button
          onClick={handleSear}
          disabled={!canSear}
          isLoading={isSearing || isSyncing}
          variant="primary"
          className="w-full"
        >
          {isSyncing ? 'Syncing seared artwork…' : 'Sear Selected Concord'}
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
        />

        {error && txStatus !== TransactionStatus.ERROR && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
          </div>
        )}

        <div className="rounded-lg border border-soul-accent/20 bg-soul-accent/5 p-4">
          <p className="text-xs text-soul-accent font-eskapade">
            Searing burns a Concord token to permanently transform your WAGDIE character. This
            action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  )
}
