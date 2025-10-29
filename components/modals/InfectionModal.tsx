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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-lg border border-white/20 bg-black p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {mode === 'specific' ? 'Infect Character' : 'Spread Infection'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-white"
            disabled={isSpreading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Character Info (specific mode) */}
          {mode === 'specific' && tokenId && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-gray-400">Infecting Character</p>
              <p className="text-lg font-bold text-white">
                {tokenName} #{tokenId.toString()}
              </p>
            </div>
          )}

          {/* Quantity Input (random mode) */}
          {mode === 'random' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Number of Infections
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                min="1"
                disabled={isSpreading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Randomly infect this many WAGDIE characters
              </p>
            </div>
          )}

          {/* Price Display */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Infection Price</p>
              <p className="text-lg font-bold text-white">
                {infectionPrice ? formatEther(infectionPrice) : '...'} ETH
              </p>
            </div>
            {mode === 'random' && quantityNum > 1 && (
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                <p className="text-sm font-medium text-gray-300">Total Cost</p>
                <p className="text-xl font-bold text-white">
                  {formatEther(totalCost)} ETH
                </p>
              </div>
            )}
          </div>

          {/* Balance Display */}
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Your ETH Balance</p>
              <p className="text-lg font-bold text-white">
                {ethBalance ? formatEther(ethBalance) : '...'} ETH
              </p>
            </div>
            {!hasEnoughEth && totalCost > 0n && (
              <p className="mt-2 text-xs text-red-400">
                Insufficient ETH balance. You need {formatEther(totalCost)} ETH.
              </p>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleInfect}
            disabled={!hasEnoughEth || isSpreading || !infectionPrice}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <p className="text-xs text-red-300">
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
