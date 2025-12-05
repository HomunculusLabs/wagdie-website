'use client'

/**
 * useBlockchainTransaction Hook
 * Generic blockchain transaction execution utility.
 * Handles common transaction lifecycle: pending → confirming → success/error.
 */

import { useState, useCallback, useRef } from 'react'
import type { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { TransactionStatus as TxStatus } from '@/types/blockchain'

// ============================================================================
// Type Definitions (T008)
// ============================================================================

export interface TransactionState<TResult = void> {
  status: TransactionStatus
  hash: TransactionHash | null
  error: ContractError | null
  result: TResult | null
}

export interface ExecutorResult<TResult = void> {
  hash?: TransactionHash
  error?: ContractError
  result?: TResult
}

export interface UseBlockchainTransactionOptions<TResult = void> {
  /** Transaction type identifier */
  transactionType: string

  /** Called when transaction is initiated */
  onPending?: (txId: string) => void

  /** Called when transaction hash is received */
  onSubmitted?: (hash: TransactionHash) => void

  /** Called when transaction succeeds */
  onSuccess?: (hash: TransactionHash, result?: TResult) => void

  /** Called when transaction fails */
  onError?: (error: ContractError) => void

  /** Add transaction to store */
  addTransaction?: (txId: string, type: string, data: any) => void

  /** Update transaction in store */
  updateTransaction?: (txId: string, data: any) => void
}

export interface UseBlockchainTransactionReturn<TResult = void> {
  /** Whether a transaction is currently executing */
  isExecuting: boolean

  /** Current transaction status */
  status: TransactionStatus

  /** Transaction hash (after submission) */
  txHash: TransactionHash | null

  /** Error details (if failed) */
  error: ContractError | null

  /** Execute a transaction */
  execute: <TParams>(
    params: TParams,
    executor: (params: TParams) => Promise<ExecutorResult<TResult>>
  ) => Promise<void>

  /** Reset state for next transaction */
  reset: () => void
}

// ============================================================================
// Hook Implementation (T020-T022)
// ============================================================================

let transactionCounter = 0

export function generateTransactionId(type: string, identifier: string): string {
  transactionCounter += 1
  return `${type}-${identifier}-${Date.now()}-${transactionCounter}`
}

export function useBlockchainTransaction<TResult = void>(
  options: UseBlockchainTransactionOptions<TResult>
): UseBlockchainTransactionReturn<TResult> {
  const {
    transactionType,
    onPending,
    onSubmitted,
    onSuccess,
    onError,
    addTransaction,
    updateTransaction,
  } = options

  const [isExecuting, setIsExecuting] = useState(false)
  const [status, setStatus] = useState<TransactionStatus>(TxStatus.IDLE)
  const [txHash, setTxHash] = useState<TransactionHash | null>(null)
  const [error, setError] = useState<ContractError | null>(null)

  // Track current transaction ID to prevent race conditions
  const currentTxIdRef = useRef<string | null>(null)

  const reset = useCallback(() => {
    setIsExecuting(false)
    setStatus(TxStatus.IDLE)
    setTxHash(null)
    setError(null)
    currentTxIdRef.current = null
  }, [])

  const execute = useCallback(
    async <TParams>(
      params: TParams,
      executor: (params: TParams) => Promise<ExecutorResult<TResult>>
    ): Promise<void> => {
      // Generate unique transaction ID
      const txId = generateTransactionId(transactionType, JSON.stringify(params).slice(0, 50))
      currentTxIdRef.current = txId

      // Reset state and begin
      setIsExecuting(true)
      setError(null)
      setTxHash(null)
      setStatus(TxStatus.PENDING)

      // Notify pending
      onPending?.(txId)
      addTransaction?.(txId, transactionType, {
        status: TxStatus.PENDING,
        metadata: params,
      })

      try {
        // Execute the transaction
        const result = await executor(params)

        // Check if this transaction is still current
        if (currentTxIdRef.current !== txId) {
          return // Superseded by another transaction
        }

        // Handle error
        if (result.error) {
          setError(result.error)
          setStatus(TxStatus.ERROR)
          updateTransaction?.(txId, {
            status: TxStatus.ERROR,
            error: result.error.message,
          })
          onError?.(result.error)
          setIsExecuting(false)
          return
        }

        // Handle success with hash
        if (result.hash) {
          setTxHash(result.hash)
          setStatus(TxStatus.SUCCESS)
          updateTransaction?.(txId, {
            hash: result.hash,
            status: TxStatus.SUCCESS,
          })
          onSubmitted?.(result.hash)
          onSuccess?.(result.hash, result.result)
        } else {
          // Success without hash (rare case)
          setStatus(TxStatus.SUCCESS)
          updateTransaction?.(txId, { status: TxStatus.SUCCESS })
        }
      } catch (err) {
        // Check if this transaction is still current
        if (currentTxIdRef.current !== txId) {
          return
        }

        const contractError: ContractError = {
          type: 'unknown' as any,
          message: err instanceof Error ? err.message : 'Transaction failed',
          originalError: err instanceof Error ? err : undefined,
        }

        setError(contractError)
        setStatus(TxStatus.ERROR)
        updateTransaction?.(txId, {
          status: TxStatus.ERROR,
          error: contractError.message,
        })
        onError?.(contractError)
      } finally {
        if (currentTxIdRef.current === txId) {
          setIsExecuting(false)
        }
      }
    },
    [transactionType, onPending, onSubmitted, onSuccess, onError, addTransaction, updateTransaction]
  )

  return {
    isExecuting,
    status,
    txHash,
    error,
    execute,
    reset,
  }
}
