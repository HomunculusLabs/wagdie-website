'use client'

// useSearing Hook
// React hook for character searing operations

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { SearConcordsParams } from '@/types/contracts'
import { SearingService, SearingStatus } from '@/lib/services/blockchain/searing'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore, generateTransactionId } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
  showApprovalRequiredToast,
  showApprovalSuccessToast,
} from '@/lib/utils/toast'

interface UseSearingResult {
  isSearing: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  searConcords: (wagdieId: number, concordId: number) => Promise<void>
  checkApproval: () => Promise<boolean>
  approveForSearing: () => Promise<void>
}

export function useSearing(): UseSearingResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [isSearing, setIsSearing] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>(TransactionStatus.IDLE)

  const { addTransaction, updateTransaction } = useTransactionStore()

  const checkApproval = async (): Promise<boolean> => {
    if (!address || !publicClient) return false

    try {
      const service = new SearingService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.isApprovedForAll(address)
      return result.data ?? false
    } catch (err) {
      logError(err, 'checkApproval')
      return false
    }
  }

  const approveForSearing = async (): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsApproving(true)
    setError(null)

    const txId = generateTransactionId('approve-searing', address)

    try {
      const service = new SearingService({ publicClient, walletClient })
      await service.initialize()

      addTransaction(txId, 'approve-searing', {
        status: TransactionStatus.PENDING,
      })

      showApprovalRequiredToast('Searing Contract')

      const result = await service.approveForSearing(address)

      if (result.error) {
        setError(result.error)
        updateTransaction(txId, {
          status: TransactionStatus.ERROR,
          error: result.error.message,
        })
        showTransactionErrorToast(result.error)
        return
      }

      if (result.hash) {
        setTxHash(result.hash)
        updateTransaction(txId, {
          hash: result.hash,
          status: TransactionStatus.CONFIRMING,
        })

        showTransactionPendingToast(result.hash)

        const receipt = await service['waitForTransaction'](result.hash)

        if (receipt.error) {
          setError(receipt.error)
          updateTransaction(txId, {
            status: TransactionStatus.ERROR,
            error: receipt.error.message,
          })
          showTransactionErrorToast(receipt.error)
        } else {
          updateTransaction(txId, {
            status: TransactionStatus.SUCCESS,
          })
          showApprovalSuccessToast('Searing Contract')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to approve searing',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'approveForSearing')
    } finally {
      setIsApproving(false)
    }
  }

  const searConcords = async (wagdieId: number, concordId: number): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsSearing(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('sear-concords', wagdieId.toString(), concordId.toString())

    try {
      const service = new SearingService({ publicClient, walletClient })
      await service.initialize()

      // Check if approved
      const isApproved = await checkApproval()
      if (!isApproved) {
        const err: ContractError = {
          type: 'contract_error' as any,
          message: 'Please approve the searing contract first',
        }
        setError(err)
        showApprovalRequiredToast('Searing Contract')
        setTxStatus(TransactionStatus.ERROR)
        return
      }

      addTransaction(txId, 'sear-concords', {
        status: TransactionStatus.PENDING,
        metadata: { wagdieId, concordId },
      })

      const params: SearConcordsParams[] = [{ wagdieId, concordId }]
      const result = await service.searConcords(params, address)

      if (result.error) {
        setError(result.error)
        setTxStatus(TransactionStatus.ERROR)
        updateTransaction(txId, {
          status: TransactionStatus.ERROR,
          error: result.error.message,
        })
        showTransactionErrorToast(result.error)
        return
      }

      if (result.hash) {
        setTxHash(result.hash)
        setTxStatus(TransactionStatus.CONFIRMING)
        updateTransaction(txId, {
          hash: result.hash,
          status: TransactionStatus.CONFIRMING,
        })

        showTransactionPendingToast(result.hash)

        const receipt = await service['waitForTransaction'](result.hash)

        if (receipt.error) {
          setError(receipt.error)
          setTxStatus(TransactionStatus.ERROR)
          updateTransaction(txId, {
            status: TransactionStatus.ERROR,
            error: receipt.error.message,
          })
          showTransactionErrorToast(receipt.error)
        } else {
          setTxStatus(TransactionStatus.SUCCESS)
          updateTransaction(txId, {
            status: TransactionStatus.SUCCESS,
          })
          showTransactionSuccessToast(result.hash, 'Character seared successfully!')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to sear concords',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'searConcords')
    } finally {
      setIsSearing(false)
    }
  }

  return {
    isSearing,
    isApproving,
    error,
    txHash,
    txStatus,
    searConcords,
    checkApproval,
    approveForSearing,
  }
}

// Hook for checking searing status
export function useSearingStatus(wagdieId: number | null) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [status, setStatus] = useState<SearingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)

  const fetchStatus = async () => {
    if (!wagdieId || !publicClient) {
      setStatus(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const service = new SearingService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getSearingStatus(wagdieId)

      if (result.error) {
        setError(result.error)
        setStatus(null)
      } else if (result.data) {
        setStatus(result.data)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to fetch searing status',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useSearingStatus')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  }
}
