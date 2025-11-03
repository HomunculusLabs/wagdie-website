/**
 * CharacterLocationList component
 * T025 [US2] Create CharacterLocationList component (depends on T021-T024)
 *
 * Displays user's characters with their current locations
 * Shows loading, error, empty, and populated states
 */

'use client'

import React, { useState } from 'react'
import { useCharacterLocation } from '@/hooks/map/useCharacterLocation'
import { NoCharactersState } from './NoCharactersState'
import { LocationSelector } from './LocationSelector'

export function CharacterLocationList() {
  const { data: characterLocations, isLoading, error, refetch } = useCharacterLocation()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="character-list-loading">
        <h2 className="text-2xl font-bold mb-4">Your Characters</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-midnight/10 rounded-lg p-4 h-24" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-midnight/10 rounded-lg p-6" data-testid="character-list-error">
        <h2 className="text-2xl font-bold mb-4">Your Characters</h2>
        <div className="text-center py-8">
          <svg
            className="w-16 h-16 mx-auto text-red-500/50 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-red-400 mb-4">Failed to load character locations</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-midnight text-bone rounded-lg hover:bg-midnight/80 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state - no characters
  if (!characterLocations || characterLocations.length === 0) {
    return (
      <div data-testid="character-list-empty">
        <h2 className="text-2xl font-bold mb-4">Your Characters</h2>
        <NoCharactersState />
      </div>
    )
  }

  // Populated state - show characters
  return (
    <div className="space-y-4" data-testid="character-location-list">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Characters</h2>
        <span className="text-sm text-bone/60">
          {characterLocations.length} {characterLocations.length === 1 ? 'character' : 'characters'}
        </span>
      </div>

      <div className="grid gap-3">
        {characterLocations.map((charLocation) => (
          <div
            key={charLocation.character_id}
            className="bg-midnight/10 rounded-lg p-4 hover:bg-midnight/20 transition-colors"
            data-testid="character-item"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-bone">
                    WAGDIE #{charLocation.character_id}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      charLocation.status === 'staked'
                        ? 'bg-green-500/20 text-green-400'
                        : charLocation.status === 'pending'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {charLocation.status}
                  </span>
                </div>

                {charLocation.location && (
                  <div className="flex items-center gap-2 text-bone/70">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      Location: <span className="text-bone font-medium">{charLocation.location.name}</span>
                    </span>
                  </div>
                )}

                {charLocation.transaction_hash && (
                  <div className="mt-2 text-xs text-bone/50">
                    <a
                      href={`https://etherscan.io/tx/${charLocation.transaction_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-bone/70 transition-colors"
                    >
                      View on Etherscan ↗
                    </a>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {charLocation.status === 'staked' && (
                  <>
                    <button
                      className="px-3 py-1 text-xs bg-midnight/30 text-bone rounded"
                      disabled
                    >
                      At {charLocation.location?.name}
                    </button>
                    <button
                      onClick={() => setSelectedCharacterId(charLocation.character_id)}
                      className="px-3 py-1 text-xs bg-gold text-abyss font-medium rounded hover:bg-gold/90 transition-colors"
                    >
                      Move
                    </button>
                  </>
                )}
                {charLocation.status === 'pending' && (
                  <button
                    className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded"
                    disabled
                  >
                    Traveling...
                  </button>
                )}
                {charLocation.status === 'unstaked' && (
                  <button
                    onClick={() => setSelectedCharacterId(charLocation.character_id)}
                    className="px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  >
                    Stake
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Location Selector Modal */}
      {selectedCharacterId && (
        <LocationSelector
          characterId={selectedCharacterId}
          currentLocationId={characterLocations?.find(
            (c) => c.character_id === selectedCharacterId
          )?.location_id}
          isOpen={true}
          onClose={() => {
            setSelectedCharacterId(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
