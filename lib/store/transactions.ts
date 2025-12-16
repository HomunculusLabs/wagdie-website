// Transaction State Store
// Zustand store for managing blockchain transaction state

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TransactionState, TransactionStatus } from '@/types/blockchain'

export interface TransactionRecord extends TransactionState {
  id: string
  operationType: string
  createdAt: number
}

interface TransactionStore {
  transactions: Record<string, TransactionRecord>
  addTransaction: (
    id: string,
    operationType: string,
    initialState?: Partial<TransactionState>
  ) => void
  updateTransaction: (id: string, updates: Partial<TransactionState>) => void
  removeTransaction: (id: string) => void
  clearOldTransactions: (maxAgeMs: number) => void
  getTransaction: (id: string) => TransactionRecord | undefined
  getTransactionsByStatus: (status: TransactionStatus) => TransactionRecord[]
  getPendingTransactions: () => TransactionRecord[]
}

const STORAGE_KEY = 'wagdie-transactions'
const MAX_TRANSACTION_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

export const useTransactionStore = create<TransactionStore>()(
  persist(
    (set, get) => ({
      transactions: {},

      addTransaction: (id, operationType, initialState = {}) => {
        set((state) => ({
          transactions: {
            ...state.transactions,
            [id]: {
              id,
              operationType,
              status: TransactionStatus.IDLE,
              createdAt: Date.now(),
              ...initialState,
            },
          },
        }))
      },

      updateTransaction: (id, updates) => {
        set((state) => {
          const existing = state.transactions[id]
          if (!existing) return state

          return {
            transactions: {
              ...state.transactions,
              [id]: {
                ...existing,
                ...updates,
              },
            },
          }
        })
      },

      removeTransaction: (id) => {
        set((state) => {
          const { [id]: _removed, ...rest } = state.transactions
          return { transactions: rest }
        })
      },

      clearOldTransactions: (maxAgeMs = MAX_TRANSACTION_AGE) => {
        const now = Date.now()
        set((state) => {
          const filtered = Object.entries(state.transactions).reduce(
            (acc, [id, tx]) => {
              if (now - tx.createdAt < maxAgeMs) {
                acc[id] = tx
              }
              return acc
            },
            {} as Record<string, TransactionRecord>
          )
          return { transactions: filtered }
        })
      },

      getTransaction: (id) => {
        return get().transactions[id]
      },

      getTransactionsByStatus: (status) => {
        return Object.values(get().transactions).filter((tx) => tx.status === status)
      },

      getPendingTransactions: () => {
        return Object.values(get().transactions).filter(
          (tx) =>
            tx.status === TransactionStatus.PENDING || tx.status === TransactionStatus.CONFIRMING
        )
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist necessary data, exclude functions
      partialize: (state) => ({ transactions: state.transactions }),
    }
  )
)

// Helper function to generate transaction ID
export function generateTransactionId(operationType: string, ...params: string[]): string {
  const timestamp = Date.now()
  const paramStr = params.join('-')
  return `${operationType}-${paramStr}-${timestamp}`
}

// Helper to clean up old transactions on app load
if (typeof window !== 'undefined') {
  useTransactionStore.getState().clearOldTransactions(7 * 24 * 60 * 60 * 1000)
}
