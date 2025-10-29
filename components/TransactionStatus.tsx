'use client'

// TransactionStatus Component
// Displays blockchain transaction status with progress indicator

import { TransactionStatus as TxStatus, TransactionHash } from '@/types/blockchain'
import { getTransactionUrl } from '@/lib/utils/blockchain'
import { useChainId } from 'wagmi'

interface TransactionStatusProps {
  status: TxStatus
  hash?: TransactionHash
  error?: string
  confirmations?: number
  requiredConfirmations?: number
  className?: string
}

export function TransactionStatus({
  status,
  hash,
  error,
  confirmations = 0,
  requiredConfirmations = 1,
  className = '',
}: TransactionStatusProps) {
  const chainId = useChainId()

  const getStatusDisplay = () => {
    switch (status) {
      case TxStatus.IDLE:
        return {
          icon: '⚪',
          label: 'Ready',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
        }
      case TxStatus.PENDING:
        return {
          icon: '🔄',
          label: 'Pending',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
        }
      case TxStatus.CONFIRMING:
        return {
          icon: '⏳',
          label: `Confirming (${confirmations}/${requiredConfirmations})`,
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
        }
      case TxStatus.SUCCESS:
        return {
          icon: '✅',
          label: 'Success',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
        }
      case TxStatus.ERROR:
        return {
          icon: '❌',
          label: 'Failed',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className={`rounded-lg border border-white/10 ${statusDisplay.bgColor} p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{statusDisplay.icon}</span>
          <span className={`text-sm font-medium ${statusDisplay.color}`}>
            {statusDisplay.label}
          </span>
        </div>

        {hash && (
          <a
            href={getTransactionUrl(chainId, hash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
          >
            View on Etherscan →
          </a>
        )}
      </div>

      {error && (
        <div className="mt-2 rounded bg-red-500/10 p-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {status === TxStatus.CONFIRMING && (
        <div className="mt-2">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${Math.min((confirmations / requiredConfirmations) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Compact version for inline display
export function TransactionStatusInline({
  status,
  hash,
  className = '',
}: Pick<TransactionStatusProps, 'status' | 'hash' | 'className'>) {
  const chainId = useChainId()

  const getStatusIcon = () => {
    switch (status) {
      case TxStatus.IDLE:
        return '⚪'
      case TxStatus.PENDING:
        return '🔄'
      case TxStatus.CONFIRMING:
        return '⏳'
      case TxStatus.SUCCESS:
        return '✅'
      case TxStatus.ERROR:
        return '❌'
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <span>{getStatusIcon()}</span>
      {hash && (
        <a
          href={getTransactionUrl(chainId, hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
        >
          {hash.slice(0, 10)}...
        </a>
      )}
    </div>
  )
}

// Loading spinner for pending transactions
export function TransactionPendingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-white/10 border-t-blue-500`}
      />
    </div>
  )
}
