/**
 * CharacterCard Component
 * Single character card with image, status badges, and click handler
 */

'use client'

import React from 'react';
import Image from 'next/image'
import { Card, CardContent, Badge } from '@/components-new'
import type { Character } from '@/types/character'
import { OwnershipBadge } from '@/components/OwnershipVerificationBanner'

interface CharacterCardProps {
  character: Character
  onClick?: (tokenId: number) => void
  className?: string
}

export function CharacterCard({ character, onClick, className = '' }: CharacterCardProps) {
  // Extract data from metadata if available, otherwise use direct fields
  const name = character.metadata?.name || character.name || `Character #${character.token_id}`
  const imageUrl = character.metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || character.image_url || '/images/placeholder-character.png'
  const level = character.metadata?.level || character.level
  const characterClass = character.class

  return (
    <Card
      onClick={() => onClick?.(character.token_id)}
      className={`group overflow-hidden cursor-pointer transition-all duration-500 hover:border-soul-accent/40 hover:shadow-[0_0_20px_rgba(200,170,110,0.1)] ${className}`}
    >
      {/* Character Image */}
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <OwnershipBadge tokenId={BigInt(character.token_id)} />
          {character.infection_status === 'infected' && (
            <span className="px-2 py-0.5 bg-red-950/80 border border-red-900/50 text-red-400 text-[10px] font-display uppercase tracking-widest">
              Infected
            </span>
          )}
          {character.infection_status === 'cured' && (
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 text-[10px] font-display uppercase tracking-widest">
              Cured
            </span>
          )}
          {character.staking_status === 'staked' && (
            <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-900/50 text-blue-400 text-[10px] font-display uppercase tracking-widest">
              Staked
            </span>
          )}
        </div>

        {/* Token ID Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="accent">#{character.token_id}</Badge>
        </div>
      </div>

      {/* Character Info */}
      <CardContent className="p-4">
        <h3 className="text-base font-display uppercase tracking-wider text-neutral-200 group-hover:text-soul-accent transition-colors duration-300 truncate">
          {name}
        </h3>
        {(characterClass || level) && (
          <p className="text-sm text-neutral-500 font-serif mt-1">
            {characterClass && `${characterClass}`}
            {characterClass && level && ' · '}
            {level && `Level ${level}`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

