'use client'

import { useEffect, useState } from 'react'
import { TransactionStatus } from '@/types/blockchain'

export interface TransactionToastProps {
  hash?: `0x${string}`
  status: TransactionStatus
  message?: string
  onClose?: () => void
  autoHideDuration?: number
}

export function TransactionToast({
  hash,
  status,
  message,
  onClose,
  autoHideDuration = 5000,
}: TransactionToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (status === TransactionStatus.SUCCESS || status === TransactionStatus.ERROR) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, autoHideDuration)
      return () => clearTimeout(timer)
    }
  }, [status, autoHideDuration, onClose])

  if (!isVisible) return null

  const getStatusColor = () => {
    switch (status) {
      case TransactionStatus.PENDING:
      case TransactionStatus.CONFIRMING:
        return 'bg-amber-900/90 border-amber-700'
      case TransactionStatus.SUCCESS:
        return 'bg-green-900/90 border-green-700'
      case TransactionStatus.ERROR:
        return 'bg-red-900/90 border-red-700'
      default:
        return 'bg-soul-800/90 border-soul-700'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case TransactionStatus.PENDING:
      case TransactionStatus.CONFIRMING:
        return (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )
      case TransactionStatus.SUCCESS:
        return (
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case TransactionStatus.ERROR:
        return (
          <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case TransactionStatus.PENDING:
        return 'Transaction pending...'
      case TransactionStatus.CONFIRMING:
        return 'Confirming transaction...'
      case TransactionStatus.SUCCESS:
        return 'Transaction confirmed!'
      case TransactionStatus.ERROR:
        return 'Transaction failed'
      default:
        return ''
    }
  }

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg ${getStatusColor()}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getStatusIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{message || getStatusText()}</p>
          {hash && (
            <a
              href={`https://etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-neutral-400 hover:text-white transition-colors mt-1 inline-block"
            >
              View on Etherscan: {truncateHash(hash)}
            </a>
          )}
        </div>
        {onClose && (
          <button
            onClick={() => {
              setIsVisible(false)
              onClose()
            }}
            className="flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
