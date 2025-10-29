'use client'

// useSpread Hook
// React hook for infection spreading operations

import { useState } from 'react'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { SpreadService } from '@/lib/services/blockchain/spread'
import { logError } from '@/lib/utils/errors'
import { useTransactionStore, generateTransactionId } from '@/lib/store/transactions'
import {
  showTransactionPendingToast,
  showTransactionSuccessToast,
  showTransactionErrorToast,
} from '@/lib/utils/toast'
import { formatEther } from 'viem'

interface UseSpreadResult {
  isSpreading: boolean
  error: ContractError | null
  txHash: TransactionHash | null
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

  const [isSpreading, setIsSpreading] = useState(false)
  const [error, setError] = useState<ContractError | null>(null)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [txStatus, setTxStatus] = useState<TransactionStatus>(TransactionStatus.IDLE)
  const [infectionPrice, setInfectionPrice] = useState<bigint | null>(null)
  const [ethBalance, setEthBalance] = useState<bigint | null>(null)

  const { addTransaction, updateTransaction } = useTransactionStore()

  const fetchInfectionPrice = async (): Promise<void> => {
    if (!publicClient) return

    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getInfectionPrice()
      if (result.data) {
        setInfectionPrice(result.data)
      }
    } catch (err) {
      logError(err, 'fetchInfectionPrice')
    }
  }

  const fetchEthBalance = async (): Promise<void> => {
    if (!address || !publicClient) return

    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()

      const result = await service.getEthBalance(address)
      if (result.data) {
        setEthBalance(result.data)
      }
    } catch (err) {
      logError(err, 'fetchEthBalance')
    }
  }

  const infectWagdie = async (tokenId: bigint): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsSpreading(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('infect-wagdie', tokenId.toString())

    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()

      // Check ETH balance
      const priceResult = await service.getInfectionPrice()
      if (priceResult.error) {
        setError(priceResult.error)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(priceResult.error)
        return
      }

      const price = priceResult.data!
      const balanceResult = await service.getEthBalance(address)

      if (balanceResult.error || (balanceResult.data && balanceResult.data < price)) {
        const err: ContractError = {
          type: 'insufficient_funds' as any,
          message: `Insufficient ETH. Required: ${formatEther(price)} ETH`,
        }
        setError(err)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(err)
        return
      }

      addTransaction(txId, 'infect-wagdie', {
        status: TransactionStatus.PENDING,
        metadata: { tokenId: tokenId.toString(), price: price.toString() },
      })

      const result = await service.infectWagdie(tokenId, address)

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
          showTransactionSuccessToast(result.hash, 'Character infected successfully!')
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to infect WAGDIE',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'infectWagdie')
    } finally {
      setIsSpreading(false)
    }
  }

  const spreadInfections = async (quantity: bigint): Promise<void> => {
    if (!address || !publicClient || !walletClient) {
      const err: ContractError = {
        type: 'unknown' as any,
        message: 'Wallet not connected',
      }
      setError(err)
      return
    }

    setIsSpreading(true)
    setError(null)
    setTxStatus(TransactionStatus.PENDING)

    const txId = generateTransactionId('spread-infections', quantity.toString())

    try {
      const service = new SpreadService({ publicClient, walletClient })
      await service.initialize()

      // Calculate total cost and check balance
      const costResult = await service.calculateTotalCost(quantity)
      if (costResult.error) {
        setError(costResult.error)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(costResult.error)
        return
      }

      const totalCost = costResult.data!
      const balanceResult = await service.getEthBalance(address)

      if (balanceResult.error || (balanceResult.data && balanceResult.data < totalCost)) {
        const err: ContractError = {
          type: 'insufficient_funds' as any,
          message: `Insufficient ETH. Required: ${formatEther(totalCost)} ETH`,
        }
        setError(err)
        setTxStatus(TransactionStatus.ERROR)
        showTransactionErrorToast(err)
        return
      }

      addTransaction(txId, 'spread-infections', {
        status: TransactionStatus.PENDING,
        metadata: { quantity: quantity.toString(), totalCost: totalCost.toString() },
      })

      const result = await service.spreadInfections(quantity, address)

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
          showTransactionSuccessToast(result.hash, `${quantity} infections spread successfully!`)
        }
      }
    } catch (err) {
      const error: ContractError = {
        type: 'unknown' as any,
        message: 'Failed to spread infections',
        originalError: err instanceof Error ? err : undefined,
      }
      setError(error)
      setTxStatus(TransactionStatus.ERROR)
      updateTransaction(txId, {
        status: TransactionStatus.ERROR,
        error: error.message,
      })
      showTransactionErrorToast(error)
      logError(err, 'spreadInfections')
    } finally {
      setIsSpreading(false)
    }
  }

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
