'use client'

/**
 * useSpread Hook
 * React hook for infection spreading operations.
 * Refactored to use useBlockchainTransaction for common transaction logic.
 */

import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionStatus } from '@/types/blockchain'
import { SpreadService } from '@/lib/services/blockchain/spread'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
} from '@/lib/utils/toast'
import { formatEther } from 'viem'
import { useBlockchainTransaction } from './useBlockchainTransaction'

interface UseSpreadResult {
  isSpreading: boolean
  error: ContractError | null
  txHash: `0x${string}` | null
  txStatus: TransactionStatus
  infectionPrice: bigint | null
  ethBalance: bigint | null
  infectWagdie: (tokenId: bigint) => Promise<void>
  spreadInfections: (quantity: bigint) => Promise<void>
  fetchInfectionPrice: () => Promise<void>
  fetchEthBalance: () => Promise<void>
}

export function useSpread(): UseSpreadResult {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [infectionPrice, setInfectionPrice] = useState<bigint | null>(null)
  const [ethBalance, setEthBalance] = useState<bigint | null>(null)

  const { addTransaction, updateTransaction } = useTransactionStore()

  // Infect transaction using shared utility
  const infectTx = useBlockchainTransaction({
    transactionType: 'infect-wagdie',
    onPending: (txId) => {
      addTransaction(txId, 'infect-wagdie', { status: TransactionStatus.PENDING })
    },
    onSuccess: (hash) => {
      showTransactionSuccessToast(hash, 'Character infected successfully!')
    },
    onError: (error) => {
      showTransactionErrorToast(error)
      logError(error, 'infectWagdie')
    },
    addTransaction,
    updateTransaction,
  })

  // Spread transaction using shared utility
  const spreadTx = useBlockchainTransaction({
    transactionType: 'spread-infections',
    onPending: (txId) => {
      addTransaction(txId, 'spread-infections', { status: TransactionStatus.PENDING })
    },
    onSuccess: (hash, result) => {
      showTransactionSuccessToast(hash, `Infections spread successfully!`)
    },
    onError: (error) => {
      showTransactionErrorToast(error)
      logError(error, 'spreadInfections')
    },
    addTransaction,
    updateTransaction,
  })

  const fetchInfectionPrice = useCallback(async (): Promise<void> => {
    if (!publicClient) return
    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()
      const result = await service.getInfectionPrice()
      if (result.data) setInfectionPrice(result.data)
    } catch (err) {
      logError(err, 'fetchInfectionPrice')
    }
  }, [publicClient, walletClient])

  const fetchEthBalance = useCallback(async (): Promise<void> => {
    if (!address || !publicClient) return
    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()
      const result = await service.getEthBalance(address)
      if (result.data) setEthBalance(result.data)
    } catch (err) {
      logError(err, 'fetchEthBalance')
    }
  }, [address, publicClient, walletClient])

  const infectWagdie = useCallback(
    async (tokenId: bigint): Promise<void> => {
      if (!address || !publicClient || !walletClient) {
        showTransactionErrorToast({ type: 'unknown' as any, message: 'Wallet not connected' })
        return
      }

      await infectTx.execute({ tokenId }, async ({ tokenId }) => {
        const service = new SpreadService({ publicClient, walletClient })
        await service.initialize()

        // Check price and balance
        const priceResult = await service.getInfectionPrice()
        if (priceResult.error) return { error: priceResult.error }

        const price = priceResult.data!
        const balanceResult = await service.getEthBalance(address)

        if (balanceResult.error || (balanceResult.data && balanceResult.data < price)) {
          return {
            error: {
              type: 'insufficient_funds' as any,
              message: `Insufficient ETH. Required: ${formatEther(price)} ETH`,
            },
          }
        }

        // Execute infection
        const result = await service.infectWagdie(tokenId, address)
        if (result.error) return { error: result.error }

        if (result.hash) {
          showTransactionPendingToast(result.hash)
          // Wait for confirmation
          const receipt = await service['waitForTransaction'](result.hash)
          if (receipt.error) return { error: receipt.error }
          return { hash: result.hash }
        }

        return {}
      })
    },
    [address, publicClient, walletClient, infectTx]
  )

  const spreadInfections = useCallback(
    async (quantity: bigint): Promise<void> => {
      if (!address || !publicClient || !walletClient) {
        showTransactionErrorToast({ type: 'unknown' as any, message: 'Wallet not connected' })
        return
      }

      await spreadTx.execute({ quantity }, async ({ quantity }) => {
        const service = new SpreadService({ publicClient, walletClient })
        await service.initialize()

        // Calculate cost and check balance
        const costResult = await service.calculateTotalCost(quantity)
        if (costResult.error) return { error: costResult.error }

        const totalCost = costResult.data!
        const balanceResult = await service.getEthBalance(address)

        if (balanceResult.error || (balanceResult.data && balanceResult.data < totalCost)) {
          return {
            error: {
              type: 'insufficient_funds' as any,
              message: `Insufficient ETH. Required: ${formatEther(totalCost)} ETH`,
            },
          }
        }

        // Execute spread
        const result = await service.spreadInfections(quantity, address)
        if (result.error) return { error: result.error }

        if (result.hash) {
          showTransactionPendingToast(result.hash)
          // Wait for confirmation
          const receipt = await service['waitForTransaction'](result.hash)
          if (receipt.error) return { error: receipt.error }
          return { hash: result.hash }
        }

        return {}
      })
    },
    [address, publicClient, walletClient, spreadTx]
  )

  // Combine states - use infect transaction state unless spread is active
  const isSpreading = infectTx.isExecuting || spreadTx.isExecuting
  const error = infectTx.error || spreadTx.error
  const txHash = infectTx.txHash || spreadTx.txHash
  const txStatus = spreadTx.isExecuting ? spreadTx.status : infectTx.status

  return {
    isSpreading,
    error,
    txHash,
    txStatus,
    infectionPrice,
    ethBalance,
    infectWagdie,
    spreadInfections,
    fetchInfectionPrice,
    fetchEthBalance,
  }
}
