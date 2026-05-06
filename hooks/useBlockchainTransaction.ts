'use client'

/**
 * useBlockchainTransaction Hook
 * Generic blockchain transaction execution utility.
 * Handles common transaction lifecycle: pending → confirming → success/error.
 */

import { useState, useCallback, useRef } from 'react'
import type { ContractError, TransactionHash, TransactionStatus } from '@/types/blockchain'
import { ContractErrorType, TransactionStatus as TxStatus } from '@/types/blockchain'

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

export interface TransactionExecutionOutcome<TResult = void> {
  success: boolean
  txId: string
  hash?: TransactionHash
  error?: ContractError
  result?: TResult
  superseded?: boolean
}

export interface TransactionExecutionContext {
  txId: string
  isCurrent: () => boolean
  markSubmitted: (
    hash: TransactionHash,
    update?: { metadata?: Record<string, unknown> }
  ) => void
}

export interface ConfirmableTransactionService {
  waitForTransactionConfirmation: (
    hash: TransactionHash,
    confirmations?: number
  ) => Promise<{ error?: ContractError }>
}

export interface ContractTransactionResult {
  hash?: TransactionHash
  error?: ContractError
}

export interface ConfirmContractTransactionOptions {
  transaction: () => Promise<ContractTransactionResult>
  service: ConfirmableTransactionService
  context: TransactionExecutionContext
  missingHashError: ContractError
  confirmations?: number
}

type TransactionStoreData = {
  status?: TransactionStatus
  hash?: TransactionHash
  error?: string
  confirmations?: number
  metadata?: Record<string, unknown>
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
  addTransaction?: (txId: string, type: string, data: TransactionStoreData) => void

  /** Update transaction in store */
  updateTransaction?: (txId: string, data: TransactionStoreData) => void
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
    executor: (
      params: TParams,
      context: TransactionExecutionContext
    ) => Promise<ExecutorResult<TResult>>
  ) => Promise<TransactionExecutionOutcome<TResult>>

  /** Reset state for next transaction */
  reset: () => void
}

// ============================================================================
// Hook Implementation (T020-T022)
// ============================================================================

let transactionCounter = 0

function stringifyTransactionValue(value: unknown): string {
  try {
    return JSON.stringify(value, (_key, nestedValue) =>
      typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue
    )
  } catch {
    return String(value)
  }
}

function normalizeTransactionMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  try {
    return JSON.parse(stringifyTransactionValue(value)) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function generateTransactionId(type: string, identifier: string): string {
  transactionCounter += 1
  return `${type}-${identifier}-${Date.now()}-${transactionCounter}`
}

export function createContractError(
  type: ContractErrorType,
  message: string,
  originalError?: unknown
): ContractError {
  return {
    type,
    message,
    originalError: originalError instanceof Error ? originalError : undefined,
  }
}

export function walletNotConnectedError(): ContractError {
  return createContractError(ContractErrorType.UNKNOWN, 'Wallet not connected')
}

export function missingTransactionHashError(action: string): ContractError {
  return createContractError(
    ContractErrorType.UNKNOWN,
    `${action} transaction did not return a hash`
  )
}

export async function confirmContractTransaction({
  transaction,
  service,
  context,
  missingHashError,
  confirmations,
}: ConfirmContractTransactionOptions): Promise<ExecutorResult> {
  const result = await transaction()

  if (result.error) return { error: result.error }

  if (!result.hash) {
    return { error: missingHashError }
  }

  context.markSubmitted(result.hash)

  const receipt = await service.waitForTransactionConfirmation(
    result.hash,
    confirmations
  )
  if (receipt.error) return { hash: result.hash, error: receipt.error }

  return { hash: result.hash }
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
      executor: (
        params: TParams,
        context: TransactionExecutionContext
      ) => Promise<ExecutorResult<TResult>>
    ): Promise<TransactionExecutionOutcome<TResult>> => {
      // Generate unique transaction ID
      const identifier = stringifyTransactionValue(params).slice(0, 50)
      const txId = generateTransactionId(transactionType, identifier)
      currentTxIdRef.current = txId

      let submittedHash: TransactionHash | undefined
      let didNotifySubmitted = false

      const isCurrent = () => currentTxIdRef.current === txId
      const markSubmitted: TransactionExecutionContext['markSubmitted'] = (
        hash,
        update
      ) => {
        if (!isCurrent()) return

        submittedHash = hash
        setTxHash(hash)
        setStatus(TxStatus.CONFIRMING)
        updateTransaction?.(txId, {
          hash,
          status: TxStatus.CONFIRMING,
          ...(update?.metadata ? { metadata: normalizeTransactionMetadata(update.metadata) } : {}),
        })

        if (!didNotifySubmitted) {
          didNotifySubmitted = true
          onSubmitted?.(hash)
        }
      }

      // Reset state and begin
      setIsExecuting(true)
      setError(null)
      setTxHash(null)
      setStatus(TxStatus.PENDING)

      // Notify pending
      onPending?.(txId)
      addTransaction?.(txId, transactionType, {
        status: TxStatus.PENDING,
        metadata: normalizeTransactionMetadata(params),
      })

      try {
        // Execute the transaction
        const result = await executor(params, { txId, isCurrent, markSubmitted })

        // Check if this transaction is still current
        if (!isCurrent()) {
          return {
            success: false,
            txId,
            hash: result.hash ?? submittedHash,
            result: result.result,
            superseded: true,
          }
        }

        const finalHash = result.hash ?? submittedHash

        if (finalHash && !submittedHash) {
          markSubmitted(finalHash)
        }

        // Handle error
        if (result.error) {
          setError(result.error)
          setStatus(TxStatus.ERROR)
          updateTransaction?.(txId, {
            ...(finalHash ? { hash: finalHash } : {}),
            status: TxStatus.ERROR,
            error: result.error.message,
          })
          onError?.(result.error)
          setIsExecuting(false)
          return {
            success: false,
            txId,
            hash: finalHash,
            error: result.error,
            result: result.result,
          }
        }

        // Handle success with hash
        if (finalHash) {
          setTxHash(finalHash)
          setStatus(TxStatus.SUCCESS)
          updateTransaction?.(txId, {
            hash: finalHash,
            status: TxStatus.SUCCESS,
          })
          onSuccess?.(finalHash, result.result)
        } else {
          // Success without hash (rare case)
          setStatus(TxStatus.SUCCESS)
          updateTransaction?.(txId, { status: TxStatus.SUCCESS })
        }

        return {
          success: true,
          txId,
          hash: finalHash,
          result: result.result,
        }
      } catch (err) {
        // Check if this transaction is still current
        if (!isCurrent()) {
          return {
            success: false,
            txId,
            hash: submittedHash,
            superseded: true,
          }
        }

        const contractError: ContractError = {
          type: ContractErrorType.UNKNOWN,
          message: err instanceof Error ? err.message : 'Transaction failed',
          originalError: err instanceof Error ? err : undefined,
        }

        setError(contractError)
        setStatus(TxStatus.ERROR)
        updateTransaction?.(txId, {
          ...(submittedHash ? { hash: submittedHash } : {}),
          status: TxStatus.ERROR,
          error: contractError.message,
        })
        onError?.(contractError)

        return {
          success: false,
          txId,
          hash: submittedHash,
          error: contractError,
        }
      } finally {
        if (isCurrent()) {
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
