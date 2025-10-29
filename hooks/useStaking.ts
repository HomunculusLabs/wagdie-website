'use client'

// useStaking Hook
// React hook for character staking operations

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionHash, TransactionStatus, StakingStatus } from '@/types/blockchain'
import { StakeWagdiesParams, UnstakeWagdiesParams } from '@/types/contracts'
import { StakingService } from '@/lib/services/blockchain/staking'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore, generateTransactionId } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
  showApprovalRequiredToast,
  showApprovalSuccessToast,
} from '@/lib/utils/toast'

interface UseStakingResult {
  isStaking: boolean
  isUnstaking: boolean
  isApproving: boolean
  error: ContractError | null
  txHash: TransactionHash | null
  txStatus: TransactionStatus
  stakeWagdie: (wagdieId: number, locationId: bigint) => Promise<void>
  unstakeWagdie: (wagdieId: number) => Promise<void>
  checkApproval: (tokenId?: bigint) => Promise<boolean>
  approveForStaking: (tokenId?: bigint) => Promise<void>
}

export function useStaking(): UseStakingResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>(TransactionStatus.IDLE)

  const { addTransaction, updateTransaction } = useTransactionStore()

  const checkApproval = async (tokenId?: bigint): Promise<boolean> => {
    if (!address || !publicClient) return false

    try {
      const service = new StakingService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.isApprovedForStaking(address, tokenId)
      return result.data ?? false
    } catch (err) {
      logError(err, 'checkApproval')
      return false
    }
  }

  const approveForStaking = async (tokenId?: bigint): Promise<void> => {
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

    const txId = generateTransactionId(
      'approve-staking',
      address,
      tokenId?.toString() ?? 'all'
    )

    try {
      const service = new StakingService({ publicClient, walletClient })
      await service.initialize()

      addTransaction(txId, 'approve-staking', {
        status: TransactionStatus.PENDING,
      })

      showApprovalRequiredToast('Staking Contract')

      const result = await service.approveForStaking(address, tokenId)

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
          showApprovalSuccessToast('Staking Contract')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to approve staking',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'approveForStaking')
    } finally {
      setIsApproving(false)
    }
  }

  const stakeWagdie = async (wagdieId: number, locationId: bigint): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsStaking(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('stake-wagdie', wagdieId.toString())

    try {
      const service = new StakingService({ publicClient, walletClient })
      await service.initialize()

      // Check if approved
      const isApproved = await checkApproval(BigInt(wagdieId))
      if (!isApproved) {
        const err: ContractError = {
          type: 'contract_error' as any,
          message: 'Please approve the staking contract first',
        }
        setError(err)
        showApprovalRequiredToast('Staking Contract')
        setTxStatus(TransactionStatus.ERROR)
        return
      }

      addTransaction(txId, 'stake-wagdie', {
        status: TransactionStatus.PENDING,
        metadata: { wagdieId, locationId: locationId.toString() },
      })

      const params: StakeWagdiesParams[] = [{ locationId, wagdieId }]
      const result = await service.stakeWagdies(params, address)

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
          showTransactionSuccessToast(result.hash, 'Character staked successfully!')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to stake character',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'stakeWagdie')
    } finally {
      setIsStaking(false)
    }
  }

  const unstakeWagdie = async (wagdieId: number): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsUnstaking(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('unstake-wagdie', wagdieId.toString())

    try {
      const service = new StakingService({ publicClient, walletClient })
      await service.initialize()

      addTransaction(txId, 'unstake-wagdie', {
        status: TransactionStatus.PENDING,
        metadata: { wagdieId },
      })

      const params: UnstakeWagdiesParams[] = [{ wagdieId }]
      const result = await service.unstakeWagdies(params, address)

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
          showTransactionSuccessToast(result.hash, 'Character unstaked successfully!')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to unstake character',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'unstakeWagdie')
    } finally {
      setIsUnstaking(false)
    }
  }

  return {
    isStaking,
    isUnstaking,
    isApproving,
    error,
    txHash,
    txStatus,
    stakeWagdie,
    unstakeWagdie,
    checkApproval,
    approveForStaking,
  }
}

// Hook for checking staking status
export function useStakingStatus(wagdieId: number | null) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [status, setStatus] = useState<StakingStatus | null>(null)
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
      const service = new StakingService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getStakingStatus(wagdieId)

      if (result.error) {
        setError(result.error)
        setStatus(null)
      } else if (result.data) {
        setStatus(result.data)
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to fetch staking status',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      logError(err, 'useStakingStatus')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wagdieId, publicClient])

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
  }
}
