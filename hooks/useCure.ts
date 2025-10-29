'use client'

// useCure Hook
// React hook for curing infected characters

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { CureService, CureStatus } from '@/lib/services/blockchain/cure'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore, generateTransactionId } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
} from '@/lib/utils/toast'

interface UseCureResult {
  isCuring: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  cureStatus: CureStatus | null
  cureCharacter: (characterId: number) => Promise<void>
  fetchCureStatus: () => Promise<void>
}

export function useCure(): UseCureResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [isCuring, setIsCuring] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>(TransactionStatus.IDLE)
  const [cureStatus, setCureStatus] = useState<CureStatus | null>(null)

  const { addTransaction, updateTransaction } = useTransactionStore()

  const fetchCureStatus = async (): Promise<void> => {
    if (!address || !publicClient) {
      setCureStatus(null)
      return
    }

    try {
      const service = new CureService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getCureStatus(address)
      if (result.data) {
        setCureStatus(result.data)
      }
    } catch (err) {
      logError(err, 'fetchCureStatus')
    }
  }

  useEffect(() => {
    fetchCureStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, publicClient])

  const cureCharacter = async (characterId: number): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsCuring(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('cure-character', characterId.toString())

    try {
      const service = new CureService({ publicClient, walletClient })
      await service.initialize()

      // Check cure status
      const statusResult = await service.getCureStatus(address)
      if (statusResult.error) {
        setError(statusResult.error)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(statusResult.error)
        return
      }

      const status = statusResult.data!

      if (!status.isMintingEnabled) {
        const err: ContractError = {
          type: 'contract_error' as any,
          message: 'Mushroom burning is currently disabled',
        }
        setError(err)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(err)
        return
      }

      if (!status.hasEnoughMushrooms) {
        const err: ContractError = {
          type: 'insufficient_funds' as any,
          message: `Insufficient mushroom tokens. You need ${status.mushroomsRequired} mushrooms to cure.`,
        }
        setError(err)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(err)
        return
      }

      addTransaction(txId, 'cure-character', {
        status: TransactionStatus.PENDING,
        metadata: { characterId, mushroomsBurned: status.mushroomsRequired.toString() },
      })

      const result = await service.burnMushroomsForCure(status.mushroomsRequired, address)

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
          showTransactionSuccessToast(
            result.hash,
            `Character cured! Burned ${status.mushroomsRequired} mushroom token${status.mushroomsRequired > 1n ? 's' : ''}.`
          )
          // Refresh cure status
          await fetchCureStatus()
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to cure character',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'cureCharacter')
    } finally {
      setIsCuring(false)
    }
  }

  return {
    isCuring,
    error,
    txHash,
    txStatus,
    cureStatus,
    cureCharacter,
    fetchCureStatus,
  }
}
