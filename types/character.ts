/**
 * Character entity types
 * Represents WAGDIE NFT characters with game attributes and metadata
 */

export type InfectionStatus = 'healthy' | 'infected' | 'cured'
export type StakingStatus = 'unstaked' | 'staked'
export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue' | 'Cleric'

export interface Character {
  token_id: number
  contract_address?: string
  owner_address?: string
  metadata?: CharacterMetadata | null
  name?: string | null
  class?: CharacterClass | null
  level?: number
  experience?: number
  str?: number
  dex?: number
  con?: number
  int?: number
  wis?: number
  cha?: number
  hp?: number
  max_hp?: number
  ac?: number
  speed?: number
  background_story?: string | null
  equipment?: Equipment | null
  location_id?: string | null
  infection_status?: InfectionStatus
  staking_status?: StakingStatus
  image_url?: string
  burned?: boolean
  infected?: boolean
  created_at?: string
  updated_at?: string
}

// NFT Metadata structure (from metadata JSONB field)
export interface CharacterMetadata {
  name?: string
  image?: string
  tokenId?: string
  description?: string
  // Character sheet data (if available)
  level?: number
  hit_points?: number
  experience_points?: number
  origin?: string
  location?: string
  equipment?: {
    armor?: string
    back?: string
    mask?: string
  }
  attributes?: NFTAttribute[] | CharacterAttributes
  background_story?: string
  tokenIdInt?: number
}

// NFT-style attributes (array format)
export interface NFTAttribute {
  trait_type: string
  value: string | number
}

// Character sheet attributes (object format)
export interface CharacterAttributes {
  strength?: number
  dexterity?: number
  constitution?: number
  intelligence?: number
  wisdom?: number
  charisma?: number
}


export interface Equipment {
  weapons?: string[]
  armor?: string[]
  items?: string[]
  gold?: number
}

export interface CharacterConcord {
  id: string
  token_id: number
  concord_id: number
  quantity: number
  is_seared: boolean
  seared_at: string | null
  created_at: string
}

export interface Concord {
  concord_id: number
  name: string
  description: string
  image_url: string
  is_consumable: boolean
  effect_type: 'stat_boost' | 'ability' | 'passive'
  created_at: string
}

// Editable fields for character updates
export type EditableCharacterFields =
  | 'name'
  | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  | 'hp' | 'max_hp' | 'ac' | 'speed'
  | 'level' | 'experience'
  | 'background_story' | 'equipment'

// Type for partial character updates
export type CharacterUpdate = Partial<Pick<Character, EditableCharacterFields>>

export type CharacterFilterTab = 'all' | 'owned' | 'infected' | 'cured' | 'staked'
export type SortOrder = 'asc' | 'desc'

export interface CharacterFilters {
  tab: CharacterFilterTab
  wallet?: string
  sort: SortOrder
  page: number
  perPage: number
  search?: string
  // NEW: Character sheet filter
  hasSheet?: boolean
  // NEW: Origin/body type filter
  origin?: string
  // NEW: Alignment filter (D&D style)
  alignment?: string
}

export interface CharactersResponse {
  characters: Character[]
  hasMore: boolean
  totalCount: number
}

/**
 * Origin count for dropdown population
 */
export interface OriginCount {
  origin: string
  count: number
}

/**
 * Origins endpoint response
 */
export interface OriginsResponse {
  origins: OriginCount[]
  totalCharacters: number
}

/**
 * Alignment count for dropdown population
 */
export interface AlignmentCount {
  alignment: string
  count: number
}

/**
 * Alignments endpoint response
 */
export interface AlignmentsResponse {
  alignments: AlignmentCount[]
  totalCharacters: number
}
