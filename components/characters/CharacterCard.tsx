/**
 * CharacterCard Component
 * Single character card with image, status badges, and click handler
 */

'use client'

import Image from 'next/image'
import type { Character } from '@/types/character'
import { OwnershipBadge } from '@/components/OwnershipVerificationBanner'

interface CharacterCardProps {
  character: Character
  onClick?: (tokenId: number) => void
  className?: string
}

export function CharacterCard({ character, onClick, className = '' }: CharacterCardProps) {
  return (
    <div
      onClick={() => onClick?.(character.token_id)}
      className={`group relative bg-midnight rounded-lg overflow-hidden border border-shadow hover:border-gold transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Character Image */}
      <div className="relative w-full aspect-square">
        <Image
          src={character.image_url || '/images/placeholder-character.png'}
          alt={character.name || `Character #${character.token_id}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <OwnershipBadge tokenId={BigInt(character.token_id)} />
          {character.infection_status === 'infected' && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">
              INFECTED
            </span>
          )}
          {character.infection_status === 'cured' && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">
              CURED
            </span>
          )}
          {character.staking_status === 'staked' && (
            <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded">
              STAKED
            </span>
          )}
        </div>

        {/* Token ID Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="px-3 py-1 bg-black bg-opacity-75 text-gold text-sm font-bold rounded">
            #{character.token_id}
          </span>
        </div>
      </div>

      {/* Character Info */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-bone group-hover:text-gold transition-colors truncate">
          {character.name || `Character #${character.token_id}`}
        </h3>
        {character.class && (
          <p className="text-sm text-ash mt-1">
            {character.class} • Level {character.level || 1}
          </p>
        )}
      </div>
    </div>
  )
}
