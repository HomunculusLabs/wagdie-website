/**
 * SpreadInfect Component
 * Interface for spreading infections or targeting specific characters
 */

'use client'

import { useState } from 'react'

interface SpreadInfectProps {
  mushroomBalance: number
  corpseBalance: number
  mode: 'spread' | 'infect'
  onSpread: (amount: number) => void
  onInfect: (tokenId: number) => void
  infectionPrice: string
}

export function SpreadInfect({
  mushroomBalance,
  corpseBalance,
  mode,
  onSpread,
  onInfect,
  infectionPrice
}: SpreadInfectProps) {
  const [targetTokenId, setTargetTokenId] = useState('')
  const [spreadAmount, setSpreadAmount] = useState(1)

  const handleInfect = () => {
    const tokenId = parseInt(targetTokenId, 10)

    if (isNaN(tokenId) || tokenId < 1 || tokenId > 6666) {
      alert('Invalid token ID. Must be between 1 and 6666.')
      return
    }

    onInfect(tokenId)
  }

  return (
    <div className="bg-midnight rounded-lg p-6">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-shadow rounded p-4 text-center">
          <p className="text-sm text-mist mb-1">Corpses</p>
          <p className="text-3xl font-display text-bone">{corpseBalance}</p>
        </div>
        <div className="bg-shadow rounded p-4 text-center">
          <p className="text-sm text-mist mb-1">Mushrooms</p>
          <p className="text-3xl font-display text-gold">{mushroomBalance}</p>
        </div>
      </div>

      {/* Mode: Spread (Random) */}
      {mode === 'spread' && (
        <div>
          <h3 className="text-xl font-display text-bone mb-4">Release Spores (Random)</h3>
          <p className="text-ash mb-4 font-body">
            Use your mushrooms to spread the infection randomly across the collection.
          </p>

          <div className="mb-4">
            <label className="block text-sm text-mist mb-2">
              Number of mushrooms to use:
            </label>
            <input
              type="number"
              min="1"
              max={mushroomBalance}
              value={spreadAmount}
              onChange={(e) => setSpreadAmount(parseInt(e.target.value, 10) || 1)}
              className="w-full bg-shadow text-bone border border-shadow rounded px-4 py-2 focus:border-gold focus:outline-none"
              disabled={mushroomBalance === 0}
            />
          </div>

          <button
            onClick={() => onSpread(spreadAmount)}
            disabled={mushroomBalance === 0 || spreadAmount > mushroomBalance}
            className="w-full px-6 py-3 bg-purple-600 text-white font-display rounded hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Release Spores
          </button>
        </div>
      )}

      {/* Mode: Infect (Targeted) */}
      {mode === 'infect' && (
        <div>
          <h3 className="text-xl font-display text-bone mb-4">Infect Pilgrim (Targeted)</h3>
          <p className="text-ash mb-4 font-body">
            Target a specific character to infect. Requires 1 mushroom + {infectionPrice} ETH.
          </p>

          <div className="mb-4">
            <label className="block text-sm text-mist mb-2">
              Target Token ID (1-6666):
            </label>
            <input
              type="number"
              min="1"
              max="6666"
              value={targetTokenId}
              onChange={(e) => setTargetTokenId(e.target.value)}
              placeholder="Enter token ID..."
              className="w-full bg-shadow text-bone border border-shadow rounded px-4 py-2 focus:border-gold focus:outline-none"
              disabled={mushroomBalance === 0}
            />
          </div>

          <div className="bg-shadow rounded p-4 mb-4">
            <p className="text-sm text-mist">
              Cost: <span className="text-gold font-display">1 mushroom + {infectionPrice} ETH</span>
            </p>
          </div>

          <button
            onClick={handleInfect}
            disabled={mushroomBalance === 0 || !targetTokenId}
            className="w-full px-6 py-3 bg-red-600 text-white font-display rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Infect Character
          </button>
        </div>
      )}
    </div>
  )
}
