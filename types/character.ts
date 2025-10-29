/**
 * Character entity types
 * Represents WAGDIE NFT characters with game attributes and metadata
 */

export type InfectionStatus = 'healthy' | 'infected' | 'cured'
export type StakingStatus = 'unstaked' | 'staked'
export type CharacterClass = 'Warrior' | 'Mage' | 'Rogue' | 'Cleric'

export interface Character {
  token_id: number
  owner_address: string
  name: string | null
  class: CharacterClass | null
  level: number
  experience: number
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  hp: number
  max_hp: number
  ac: number
  speed: number
  background_story: string | null
  equipment: Equipment | null
  location_id: string | null
  infection_status: InfectionStatus
  staking_status: StakingStatus
  image_url: string
  created_at: string
  updated_at: string
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

export type CharacterFilterTab = 'all' | 'owned' | 'infected' | 'cured' | 'staked'
export type SortOrder = 'asc' | 'desc'

export interface CharacterFilters {
  tab: CharacterFilterTab
  wallet?: string
  sort: SortOrder
  page: number
  perPage: number
}

export interface CharactersResponse {
  characters: Character[]
  hasMore: boolean
  totalCount: number
}
