'use client'

import { createContext, useContext, useCallback, useState, useMemo, ReactNode } from 'react'
import { TransactionStatus, TransactionState, TransactionHash } from '@/types/blockchain'
import { TransactionToast } from '@/components/shared/TransactionToast'

interface Transaction extends TransactionState {
  id: string
  type: string
  message?: string
}

interface TransactionContextValue {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id'>) => string
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  removeTransaction: (id: string) => void
  clearTransactions: () => void
}

const TransactionContext = createContext<TransactionContextValue | null>(null)

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>) => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTx: Transaction = { ...tx, id }
    setTransactions((prev) => [...prev, newTx])
    return id
  }, [])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    )
  }, [])

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id))
  }, [])

  const clearTransactions = useCallback(() => {
    setTransactions([])
  }, [])

  // Get the most recent active transaction for the toast
  const activeTransaction = transactions.find(
    (tx) =>
      tx.status === TransactionStatus.PENDING ||
      tx.status === TransactionStatus.CONFIRMING
  ) || transactions[transactions.length - 1]

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      removeTransaction,
      clearTransactions,
    }),
    [transactions, addTransaction, updateTransaction, removeTransaction, clearTransactions]
  )

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
      {activeTransaction && activeTransaction.status !== TransactionStatus.IDLE && (
        <TransactionToast
          hash={activeTransaction.hash}
          status={activeTransaction.status}
          message={activeTransaction.message}
          onClose={() => removeTransaction(activeTransaction.id)}
        />
      )}
    </TransactionContext.Provider>
  )
}

export function useTransactionContext() {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error('useTransactionContext must be used within a TransactionProvider')
  }
  return context
}

// Convenience hook for managing a single transaction
export function useTransaction() {
  const { addTransaction, updateTransaction, removeTransaction } = useTransactionContext()
  const [currentTxId, setCurrentTxId] = useState<string | null>(null)

  const startTransaction = useCallback(
    (type: string, message?: string) => {
      const id = addTransaction({
        type,
        message,
        status: TransactionStatus.PENDING,
      })
      setCurrentTxId(id)
      return id
    },
    [addTransaction]
  )

  const setHash = useCallback(
    (hash: TransactionHash) => {
      if (currentTxId) {
        updateTransaction(currentTxId, { hash, status: TransactionStatus.CONFIRMING })
      }
    },
    [currentTxId, updateTransaction]
  )

  const setSuccess = useCallback(
    (message?: string) => {
      if (currentTxId) {
        updateTransaction(currentTxId, { status: TransactionStatus.SUCCESS, message })
      }
    },
    [currentTxId, updateTransaction]
  )

  const setError = useCallback(
    (error: string) => {
      if (currentTxId) {
        updateTransaction(currentTxId, { status: TransactionStatus.ERROR, error })
      }
    },
    [currentTxId, updateTransaction]
  )

  const reset = useCallback(() => {
    if (currentTxId) {
      removeTransaction(currentTxId)
      setCurrentTxId(null)
    }
  }, [currentTxId, removeTransaction])

  return {
    startTransaction,
    setHash,
    setSuccess,
    setError,
    reset,
    currentTxId,
  }
}
