/**
 * TransactionStatus component
 * T034 [P] [US3] Create TransactionStatus component
 *
 * Displays blockchain transaction progress and status
 * Shows pending, confirmed, and failed states with clear user feedback
 */

'use client'

import React from 'react'

interface TransactionStatusProps {
  /**
   * Transaction hash
   */
  hash?: `0x${string}`
  /**
   * Transaction status
   */
  status: 'pending' | 'confirmed' | 'failed'
  /**
   * Optional error message
   */
  error?: Error | { code: string; message: string } | null
  /**
   * Optional callback when transaction completes
   */
  onComplete?: () => void
  /**
   * Optional callback to retry transaction
   */
  onRetry?: () => void
  /**
   * Optional className for custom styling
   */
  className?: string
}

export function TransactionStatus({
  hash,
  status,
  error,
  onComplete,
  onRetry,
  className = '',
}: TransactionStatusProps) {
  // Handle status changes
  React.useEffect(() => {
    if (status === 'confirmed' && onComplete) {
      onComplete()
    }
  }, [status, onComplete])

  // Pending state
  if (status === 'pending') {
    return (
      <div
        className={`bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 ${className}`}
        data-testid="transaction-status"
      >
        <div className="flex items-center gap-3">
          {/* Animated spinner */}
          <div className="relative w-6 h-6">
            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full" />
            <div className="absolute inset-0 border-2 border-yellow-400 rounded-full border-t-transparent animate-spin" />
          </div>

          <div className="flex-1">
            <p className="text-yellow-400 font-medium">Traveling...</p>
            <p className="text-sm text-bone/60 mt-1">
              Your character is being staked to the new location. This may take a few moments.
            </p>

            {hash && (
              <a
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-400/80 hover:text-yellow-400 transition-colors mt-2 inline-block"
              >
                View on Etherscan ↗
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Confirmed state
  if (status === 'confirmed') {
    return (
      <div
        className={`bg-green-500/10 border border-green-500/20 rounded-lg p-4 ${className}`}
        data-testid="transaction-status"
      >
        <div className="flex items-center gap-3">
          {/* Check icon */}
          <svg
            className="w-6 h-6 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>

          <div className="flex-1">
            <p className="text-green-400 font-medium">Successfully Staked!</p>
            <p className="text-sm text-bone/60 mt-1">
              Your character has been staked to the new location.
            </p>

            {hash && (
              <a
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-400/80 hover:text-green-400 transition-colors mt-2 inline-block"
              >
                View on Etherscan ↗
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Failed state
  if (status === 'failed' || error) {
    const errorMessage = error
      ? typeof error === 'string'
        ? error
        : error.message || 'Transaction failed'
      : 'Transaction failed'

    return (
      <div
        className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}
        data-testid="transaction-status"
      >
        <div className="flex items-start gap-3">
          {/* Error icon */}
          <svg
            className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          <div className="flex-1">
            <p className="text-red-400 font-medium">Transaction Failed</p>
            <p className="text-sm text-bone/60 mt-1">{errorMessage}</p>

            {hash && (
              <a
                href={`https://etherscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-red-400/80 hover:text-red-400 transition-colors mt-2 inline-block"
              >
                View on Etherscan ↗
              </a>
            )}

            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                data-testid="retry-button"
              >
                Retry Transaction
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}
