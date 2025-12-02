'use client'

import React from 'react'
import { Badge } from '@/components-new'
import { extractNFTTraits, type NFTTrait } from '@/lib/utils/nft-traits'
import type { CharacterMetadata } from '@/types/character'

interface NFTTraitsDisplayProps {
  /** Character metadata containing NFT attributes */
  metadata: CharacterMetadata | null | undefined
  /** When true, only show identity traits (Body, Alignment) */
  showIdentityOnly?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * NFTTraitsDisplay Component
 * Displays NFT trait attributes as badges
 *
 * Usage:
 * - showIdentityOnly=true: Display only Body/Alignment for prominent placement near name
 * - showIdentityOnly=false (default): Display all non-equipment traits (cosmetic + identity)
 */
export function NFTTraitsDisplay({
  metadata,
  showIdentityOnly = false,
  className = '',
}: NFTTraitsDisplayProps) {
  const allTraits = extractNFTTraits(metadata)

  // Filter traits based on showIdentityOnly prop
  const displayTraits = showIdentityOnly
    ? allTraits.filter((t: NFTTrait) => t.category === 'identity')
    : allTraits.filter((t: NFTTrait) => t.category !== 'equipment')

  // Don't render anything if no traits to display
  if (displayTraits.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayTraits.map((trait: NFTTrait) => (
        <Badge
          key={trait.type}
          variant={trait.category === 'identity' ? 'accent' : 'default'}
        >
          {trait.type}: {trait.value}
        </Badge>
      ))}
    </div>
  )
}
