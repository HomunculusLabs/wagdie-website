/**
 * NFT Traits Utility
 * Extracts and categorizes NFT traits from character metadata for display purposes
 */

import type { CharacterMetadata, NFTAttribute } from '@/types/character'

/**
 * Represents an extracted NFT trait for display
 */
export interface NFTTrait {
  /** The trait category/name (e.g., "Body", "Alignment", "Head") */
  type: string
  /** The trait value as a string */
  value: string
  /** Category for display grouping */
  category: 'identity' | 'cosmetic' | 'equipment'
}

/** Traits that define character identity - displayed prominently */
const IDENTITY_TRAITS = ['Body', 'Alignment']

/** Traits related to equipment - handled by SheetEquipment component */
const EQUIPMENT_TRAITS = ['Weapon', 'Armor', 'Back', 'Mask']

/**
 * Categorizes a trait type into identity, equipment, or cosmetic
 * @param traitType - The trait_type from NFT metadata
 * @returns The category for the trait
 */
function categorize(traitType: string): NFTTrait['category'] {
  if (IDENTITY_TRAITS.includes(traitType)) return 'identity'
  if (EQUIPMENT_TRAITS.includes(traitType)) return 'equipment'
  return 'cosmetic'
}

/**
 * Extracts NFT traits from character metadata and categorizes them for display
 * @param metadata - The character's NFT metadata containing attributes array
 * @returns Array of categorized NFT traits
 */
export function extractNFTTraits(metadata: CharacterMetadata | null | undefined): NFTTrait[] {
  if (!metadata?.attributes) {
    return []
  }

  // Handle both array and object format for attributes
  if (!Array.isArray(metadata.attributes)) {
    return []
  }

  return metadata.attributes
    .filter((attr: NFTAttribute) => attr.trait_type && attr.value != null && attr.value !== '')
    .map((attr: NFTAttribute) => ({
      type: attr.trait_type,
      value: String(attr.value),
      category: categorize(attr.trait_type),
    }))
}

/**
 * Gets only identity traits (Body, Alignment) for prominent display
 * @param metadata - The character's NFT metadata
 * @returns Array of identity traits only
 */
export function getIdentityTraits(metadata: CharacterMetadata | null | undefined): NFTTrait[] {
  return extractNFTTraits(metadata).filter(trait => trait.category === 'identity')
}

/**
 * Gets only cosmetic traits (excluding identity and equipment) for secondary display
 * @param metadata - The character's NFT metadata
 * @returns Array of cosmetic traits only
 */
export function getCosmeticTraits(metadata: CharacterMetadata | null | undefined): NFTTrait[] {
  return extractNFTTraits(metadata).filter(trait => trait.category === 'cosmetic')
}
