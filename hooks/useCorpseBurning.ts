'use client'

// useCorpseBurning Hook
// React hook for corpse burning operations

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { CorpseService } from '@/lib/services/blockchain/corpse'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore, generateTransactionId } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
  showApprovalRequiredToast,
  showApprovalSuccessToast,
} from '@/lib/utils/toast'

interface UseCorpseBurningResult {
  isBurning: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  corpseBalance: bigint | null
  mushroomBalance: bigint | null
  burnCorpse: (amount: bigint) => Promise<void>
  checkApproval: () => Promise<boolean>
  approveForBurning: () => Promise<void>
  fetchBalances: () => Promise<void>
}

export function useCorpseBurning(): UseCorpseBurningResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [isBurning, setIsBurning] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>(TransactionStatus.IDLE)
  const [corpseBalance, setCorpseBalance] = useState<bigint | null>(null)
  const [mushroomBalance, setMushroomBalance] = useState<bigint | null>(null)

  const { addTransaction, updateTransaction } = useTransactionStore()

  const fetchBalances = async (): Promise<void> => {
    if (!address || !publicClient) return

    try {
      const service = new CorpseService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getBothBalances(address)
      if (result.data) {
        setCorpseBalance(result.data.corpse)
        setMushroomBalance(result.data.mushroom)
      }
    } catch (err) {
      logError(err, 'fetchBalances')
    }
  }

  const checkApproval = async (): Promise<boolean> => {
    if (!address || !publicClient) return false

    try {
      const service = new CorpseService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.isCorpseApproved(address)
      return result.data ?? false
    } catch (err) {
      logError(err, 'checkApproval')
      return false
    }
  }

  const approveForBurning = async (): Promise<void> => {
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

    const txId = generateTransactionId('approve-corpse-burning', address)

    try {
      const service = new CorpseService({ publicClient, walletClient })
      await service.initialize()

      addTransaction(txId, 'approve-corpse-burning', {
        status: TransactionStatus.PENDING,
      })

      showApprovalRequiredToast('Mushroom Contract')

      const result = await service.approveCorpseForBurning(address)

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
          showApprovalSuccessToast('Mushroom Contract')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to approve corpse burning',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'approveForBurning')
    } finally {
      setIsApproving(false)
    }
  }

  const burnCorpse = async (amount: bigint): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    if (amount <= 0n) {
      const err: ContractError = {
        type: 'invalid_params' as any,
        message: 'Amount must be greater than 0',
      }
      setError(err)
      return
    }

    setIsBurning(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('burn-corpse', amount.toString())

    try {
      const service = new CorpseService({ publicClient, walletClient })
      await service.initialize()

      // Check if approved
      const isApproved = await checkApproval()
      if (!isApproved) {
        const err: ContractError = {
          type: 'contract_error' as any,
          message: 'Please approve the mushroom contract first',
        }
        setError(err)
        showApprovalRequiredToast('Mushroom Contract')
        setTxStatus(TransactionStatus.ERROR)
        return
      }

      // Check balance
      const balanceResult = await service.getCorpseBalance(address)
      if (balanceResult.error || (balanceResult.data && balanceResult.data < amount)) {
        const err: ContractError = {
          type: 'insufficient_funds' as any,
          message: 'Insufficient corpse token balance',
        }
        setError(err)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(err)
        return
      }

      addTransaction(txId, 'burn-corpse', {
        status: TransactionStatus.PENDING,
        metadata: { amount: amount.toString() },
      })

      const result = await service.burnCorpse(amount, address)

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
            `Burned ${amount} corpse token${amount > 1n ? 's' : ''}!`
          )
          // Refresh balances
          await fetchBalances()
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to burn corpse tokens',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'burnCorpse')
    } finally {
      setIsBurning(false)
    }
  }

  return {
    isBurning,
    isApproving,
    error,
    txHash,
    txStatus,
    corpseBalance,
    mushroomBalance,
    burnCorpse,
    checkApproval,
    approveForBurning,
    fetchBalances,
  }
}
