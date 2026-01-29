/**
 * CharacterCard Component
 * Single character card with image, status badges, and click handler
 * Memoized to prevent unnecessary re-renders in lists
 */

'use client'

import React, { useState, useCallback, memo } from 'react';
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent, Badge } from '@/components/ui'
import type { Character } from '@/types/character'
import { OwnershipBadge } from '@/components/OwnershipVerificationBanner'
import { getLocalImagePath, getCharacterImageFallback } from '@/lib/utils/image'

interface CharacterCardProps {
  character: Character
  onClick?: (tokenId: number) => void
  className?: string
}

// Extract motion variants to module scope to prevent recreation
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
} as const

const cardTransition = { duration: 0.5, ease: 'easeOut' } as const

function CharacterCardComponent({ character, onClick, className = '' }: CharacterCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [useLocalImage, setUseLocalImage] = useState(true)

  // Extract data from metadata if available, otherwise use direct fields
  const name = character.metadata?.name || character.name || `character #${character.token_id}`

  // Use local image first, fallback to IPFS if local fails
  const localImageUrl = getLocalImagePath(character.token_id)
  const fallbackImageUrl = getCharacterImageFallback(character.metadata?.image, character.image_url)
  const imageUrl = useLocalImage ? localImageUrl : fallbackImageUrl

  const level = character.metadata?.level || character.level
  const characterClass = character.class
  const infectionStatus = character.infection_status ?? (character.infected ? 'infected' : 'healthy')

  const handleImageError = useCallback(() => {
    if (useLocalImage) {
      // Local image failed, try IPFS fallback
      setUseLocalImage(false)
    }
  }, [useLocalImage])

  const handleImageLoad = useCallback(() => {
    setIsLoading(false)
  }, [])

  const handleClick = useCallback(() => {
    onClick?.(character.token_id)
  }, [onClick, character.token_id])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(character.token_id)
    }
  }, [onClick, character.token_id])

  return (
    <motion.div
      variants={cardVariants}
      transition={cardTransition}
    >
      <Card
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={onClick ? `View ${name}` : undefined}
        className={`group overflow-hidden cursor-pointer transition-all duration-500 hover:border-soul-accent/40 hover:shadow-[0_0_20px_rgba(200,170,110,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-soul-accent focus-visible:ring-offset-2 focus-visible:ring-offset-soul-950 ${className}`}
      >
      {/* Character Image */}
      <div className="relative w-full aspect-square overflow-hidden bg-neutral-900">
        {/* Loading skeleton */}
        {isLoading ? (
          <div className="absolute inset-0 bg-midnight animate-pulse" />
        ) : null}
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
          className={`object-cover [image-rendering:pixelated] grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          unoptimized
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Solid overlay */}
        <div className="absolute inset-0 bg-black/20" />

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <OwnershipBadge tokenId={BigInt(character.token_id)} />
          {/* Dead badge for burned+staked characters */}
          {character.burned && character.location_id ? (
            <span className="px-2 py-0.5 bg-red-950/80 border border-red-800/50 text-red-300 text-caption font-display tracking-widest">
              Dead
            </span>
          ) : null}
          {/* Fallen badge for burned but not staked */}
          {character.burned && !character.location_id ? (
            <span className="px-2 py-0.5 bg-neutral-900/80 border border-neutral-700/50 text-neutral-400 text-caption font-display tracking-widest">
              Fallen
            </span>
          ) : null}
          {infectionStatus === 'infected' ? (
            <span className="px-2 py-0.5 bg-red-950/80 border border-red-900/50 text-red-400 text-caption font-display tracking-widest">
              Infected
            </span>
          ) : null}
          {infectionStatus === 'cured' ? (
            <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-900/50 text-emerald-400 text-caption font-display tracking-widest">
              Cured
            </span>
          ) : null}
          {/* Staked badge only for non-burned staked characters */}
          {character.staking_status === 'staked' && !character.burned ? (
            <span
              className="px-2 py-0.5 bg-blue-950/80 border border-blue-900/50 text-blue-400 text-caption font-display tracking-widest"
              role="status"
              aria-label="Character is currently staked"
            >
              Staked
            </span>
          ) : null}
        </div>

        {/* Token ID Badge */}
        <div className="absolute bottom-2 left-2">
          <Badge variant="accent">#{character.token_id}</Badge>
        </div>
      </div>

      {/* Character Info */}
      <CardContent className="p-4">
        <h3 className="text-h4 font-display text-bone group-hover:text-soul-accent transition-colors duration-300 truncate lowercase">
          {name.toLowerCase()}
        </h3>
        {(characterClass || level) ? (
          <p className="text-body-sm text-mist font-eskapade mt-1 lowercase">
            {characterClass ? `${characterClass.toLowerCase()}` : null}
            {characterClass && level ? ' · ' : null}
            {level ? `level ${level}` : null}
          </p>
        ) : null}
      </CardContent>
      </Card>
    </motion.div>
  )
}

// Memoize with custom comparison for list rendering performance
export const CharacterCard = memo(CharacterCardComponent, (prevProps, nextProps) => {
  // Only re-render if character data or onClick reference changes
  return (
    prevProps.character.token_id === nextProps.character.token_id &&
    prevProps.character.name === nextProps.character.name &&
    prevProps.character.infection_status === nextProps.character.infection_status &&
    prevProps.character.staking_status === nextProps.character.staking_status &&
    prevProps.character.burned === nextProps.character.burned &&
    prevProps.character.location_id === nextProps.character.location_id &&
    prevProps.className === nextProps.className &&
    prevProps.onClick === nextProps.onClick
  )
})
