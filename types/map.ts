/**
 * TypeScript type definitions for Interactive Map Integration feature
 * Generated from data model specification
 */

// Location entity - represents a named area in the WAGDIE world
export interface Location {
  id: string // Unique identifier (e.g., "concord_searing", "forsaken_lands")
  name: string // Display name (e.g., "Concord Searing")
  description?: string // Optional lore description
  metadata?: {
    coordinates?: { x: number; y: number } // Map coordinates
    rarity?: 'common' | 'rare' | 'legendary'
    special_properties?: string[]
  }
  created_at: string // ISO 8601 timestamp
  updated_at: string // ISO 8601 timestamp
}

// CharacterLocation - tracks which location a character is staked to
export interface CharacterLocation {
  character_id: string // WAGDIE token ID (numeric string)
  location_id: string // FK to Location.id
  wallet_address: string // Owner wallet (lowercase, checksummed)
  transaction_hash: string // Latest on-chain transaction
  block_number?: number // Block where location was set
  status: 'staked' | 'unstaked' | 'pending'
  created_at: string // When first staked
  updated_at: string // Last movement
  // Joined fields from Supabase
  location?: Location
}

// LocationTransaction - audit log of all location changes
export interface LocationTransaction {
  id: string // UUID primary key
  character_id: string // WAGDIE token ID
  from_location_id?: string // Previous location (null if initial stake)
  to_location_id: string // New location
  wallet_address: string // User who performed action
  transaction_hash: string // On-chain transaction hash
  action: 'stake' | 'move' | 'unstake'
  status: 'pending' | 'confirmed' | 'failed'
  gas_used?: number // Gas consumed
  block_number?: number // Confirmation block
  created_at: string // When record created
  confirmed_at?: string // When transaction confirmed
  // Joined fields
  from_location?: Location
  to_location?: Location
}

// Character (extended) - adds optional location relationship
export interface Character {
  id: string
  token_id: string
  name?: string
  image_url?: string
  metadata?: any
  location?: {
    id: string
    name: string
    description?: string
  } | null // null if not staked
}

// Stake operation parameters
export interface StakeWagdieParams {
  wagdieId: bigint
  locationId: bigint
}

// Change location parameters
export interface ChangeWagdieLocationParams {
  wagdieId: bigint
  newLocationId: bigint
}

// Unstake parameters
export interface UnstakeWagdieParams {
  wagdieId: bigint
}

// Transaction result from blockchain
export interface LocationTransactionResult {
  transaction_hash: string
  status: 'pending' | 'confirmed' | 'failed'
  estimated_gas?: number
  characters_affected?: number
  action: 'stake' | 'move' | 'unstake'
}

// Cache configuration
export interface MapCacheConfig {
  browserTTL: number // Browser cache TTL in seconds (default: 30)
  queryStaleTime: number // React Query stale time in ms (default: 30000)
  queryGcTime: number // React Query gc time in ms (default: 300000)
}

// Default cache configuration
export const MAP_CACHE_CONFIG: MapCacheConfig = {
  browserTTL: 30, // 30 seconds
  queryStaleTime: 30 * 1000, // 30 seconds
  queryGcTime: 5 * 60 * 1000, // 5 minutes
}

// Validation schemas (for runtime validation if needed)
export interface LocationValidation {
  id: {
    required: boolean
    pattern: RegExp
    description: string
  }
  name: {
    required: boolean
    minLength: number
    maxLength: number
  }
  description?: {
    maxLength: number
  }
}

// Type guards
export function isLocation(obj: any): obj is Location {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  )
}

export function isCharacterLocation(obj: any): obj is CharacterLocation {
  return (
    obj &&
    typeof obj.character_id === 'string' &&
    typeof obj.location_id === 'string' &&
    typeof obj.wallet_address === 'string' &&
    typeof obj.transaction_hash === 'string' &&
    ['staked', 'unstaked', 'pending'].includes(obj.status)
  )
}

export function isLocationTransaction(obj: any): obj is LocationTransaction {
  return (
    obj &&
    typeof obj.character_id === 'string' &&
    typeof obj.to_location_id === 'string' &&
    typeof obj.wallet_address === 'string' &&
    ['stake', 'move', 'unstake'].includes(obj.action) &&
    ['pending', 'confirmed', 'failed'].includes(obj.status)
  )
}
