'use client'

// InfectionModal Component
// Modal for spreading infections to WAGDIE characters

import { useState, useEffect } from 'react'
import { useSpread } from '@/hooks/useSpread'
import { TransactionStatus as TxStatusComponent } from '@/components/TransactionStatus'
import { TransactionStatus } from '@/types/blockchain'
import { formatEther } from 'viem'

interface InfectionModalProps {
  mode: 'specific' | 'random'
  tokenId?: bigint
  tokenName?: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function InfectionModal({
  mode,
  tokenId,
  tokenName,
  isOpen,
  onClose,
  onSuccess,
}: InfectionModalProps) {
  const [quantity, setQuantity] = useState('1')

  const {
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
  } = useSpread()

  useEffect(() => {
    if (isOpen) {
      setQuantity('1')
      fetchInfectionPrice()
      fetchEthBalance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    if (txStatus === TransactionStatus.SUCCESS && onSuccess) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 2000)
    }
  }, [txStatus, onSuccess, onClose])

  const handleInfect = async () => {
    if (mode === 'specific' && tokenId) {
      await infectWagdie(tokenId)
    } else if (mode === 'random') {
      const qty = BigInt(quantity)
      await spreadInfections(qty)
    }
  }

  if (!isOpen) return null

  const quantityNum = parseInt(quantity, 10) || 1
  const totalCost = infectionPrice ? infectionPrice * BigInt(quantityNum) : 0n
  const hasEnoughEth = ethBalance && ethBalance >= totalCost

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && !isSpreading && onClose()}
    >
      <div
        className="w-full max-w-md border border-neutral-800 bg-soul-950 p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="infection-modal-title"
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 id="infection-modal-title" className="text-2xl font-display text-neutral-200">
            {mode === 'specific' ? 'Infect Character' : 'Spread Infection'}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-500 transition-colors hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent"
            disabled={isSpreading}
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Character Info (specific mode) */}
          {mode === 'specific' && tokenId && (
            <div className="border border-neutral-800 bg-black/40 p-4">
              <p className="text-sm text-neutral-500 font-eskapade">Infecting Character</p>
              <p className="text-lg font-display text-neutral-200">
                {tokenName} #{tokenId.toString()}
              </p>
            </div>
          )}

          {/* Quantity Input (random mode) */}
          {mode === 'random' && (
            <div>
              <label htmlFor="infection-quantity" className="mb-2 block text-sm font-eskapade text-neutral-400">
                Number of Infections
              </label>
              <input
                id="infection-quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full border border-neutral-800 bg-black/40 px-4 py-2 text-neutral-200 placeholder-neutral-600 focus:border-soul-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent/50 font-eskapade"
                min="1"
                disabled={isSpreading}
              />
              <p className="mt-1 text-xs text-neutral-500 font-eskapade">
                Randomly infect this many WAGDIE characters
              </p>
            </div>
          )}

          {/* Price Display */}
          <div className="border border-neutral-800 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500 font-eskapade">Infection Price</p>
              <p className="text-lg font-display text-neutral-200">
                {infectionPrice ? formatEther(infectionPrice) : '...'} ETH
              </p>
            </div>
            {mode === 'random' && quantityNum > 1 && (
              <div className="mt-2 flex items-center justify-between border-t border-neutral-800 pt-2">
                <p className="text-sm font-display text-neutral-400">Total Cost</p>
                <p className="text-xl font-display text-neutral-200">
                  {formatEther(totalCost)} ETH
                </p>
              </div>
            )}
          </div>

          {/* Balance Display */}
          <div className="border border-neutral-800 bg-black/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-500 font-eskapade">Your ETH Balance</p>
              <p className="text-lg font-display text-neutral-200">
                {ethBalance ? formatEther(ethBalance) : '...'} ETH
              </p>
            </div>
            {!hasEnoughEth && totalCost > 0n && (
              <p className="mt-2 text-xs text-red-400 font-eskapade">
                Insufficient ETH balance. You need {formatEther(totalCost)} ETH.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleInfect}
            disabled={!hasEnoughEth || isSpreading || !infectionPrice}
            className="w-full bg-red-900 border border-red-800 px-4 py-3 font-display text-red-400 transition-colors hover:bg-red-800 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {isSpreading
              ? 'Spreading...'
              : mode === 'specific'
                ? 'Infect Character'
                : `Spread ${quantityNum} Infection${quantityNum > 1 ? 's' : ''}`}
          </button>

          {/* Transaction Status */}
          {txHash && (
            <TxStatusComponent
              status={txStatus}
              hash={txHash ?? undefined}
              error={error?.message}
            />
          )}

          {/* Error Display */}
          {error && !txHash && (
            <div className="border border-red-900/50 bg-red-950/30 p-4">
              <p className="text-sm text-red-400 font-eskapade">{error.message}</p>
            </div>
          )}

          {/* Info */}
          <div className="border border-red-900/30 bg-red-950/20 p-4">
            <p className="text-xs text-red-400/80 font-eskapade">
              {mode === 'specific'
                ? 'Infecting this character requires payment in ETH. The infection is permanent and changes the character state.'
                : 'Random infections will be applied to random WAGDIE characters in the collection. Each infection costs ETH.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
