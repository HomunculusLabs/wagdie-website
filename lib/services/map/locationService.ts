/**
 * Supabase service for map feature
 * Handles all database operations for locations and character locations
 */

import { supabase } from '@/lib/supabase'
import type { Location, CharacterLocation, LocationTransaction, MAP_CACHE_CONFIG } from '@/types/map'

/**
 * Get all available locations in the WAGDIE world
 * @returns Promise<Location[]> - Array of locations
 * @throws Error if Supabase query fails
 */
export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch locations: ${error.message}`)
  }

  return data || []
}

/**
 * Get character locations for a specific wallet
 * @param walletAddress - Ethereum address of the wallet owner
 * @returns Promise<CharacterLocation[]> - Array of character locations with joined location data
 * @throws Error if Supabase query fails
 */
export async function getCharacterLocations(walletAddress: string): Promise<CharacterLocation[]> {
  const { data, error } = await supabase
    .from('character_locations')
    .select(`
      *,
      location:locations(*)
    `)
    .eq('wallet_address', walletAddress.toLowerCase())
    .eq('status', 'staked')
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch character locations: ${error.message}`)
  }

  return data || []
}

/**
 * Get all character locations (for admin or sync purposes)
 * @returns Promise<CharacterLocation[]> - All character locations
 */
export async function getAllCharacterLocations(): Promise<CharacterLocation[]> {
  const { data, error } = await supabase
    .from('character_locations')
    .select(`
      *,
      location:locations(*)
    `)
    .order('updated_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch all character locations: ${error.message}`)
  }

  return data || []
}

/**
 * Get location transaction history for a character
 * @param characterId - WAGDIE token ID
 * @returns Promise<LocationTransaction[]> - Array of transactions
 */
export async function getCharacterLocationHistory(characterId: string): Promise<LocationTransaction[]> {
  const { data, error } = await supabase
    .from('location_transactions')
    .select(`
      *,
      from_location:locations!location_transactions_from_location_id_fkey(id, name, description),
      to_location:locations!location_transactions_to_location_id_fkey(id, name, description)
    `)
    .eq('character_id', characterId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch character location history: ${error.message}`)
  }

  return data || []
}

/**
 * Get location transaction history for a wallet
 * @param walletAddress - Ethereum address
 * @param limit - Optional limit for number of transactions
 * @returns Promise<LocationTransaction[]> - Array of transactions
 */
export async function getWalletLocationHistory(
  walletAddress: string,
  limit: number = 50
): Promise<LocationTransaction[]> {
  const { data, error } = await supabase
    .from('location_transactions')
    .select(`
      *,
      from_location:locations!location_transactions_from_location_id_fkey(id, name),
      to_location:locations!location_transactions_to_location_id_fkey(id, name)
    `)
    .eq('wallet_address', walletAddress.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch wallet location history: ${error.message}`)
  }

  return data || []
}

/**
 * Create or update character location in Supabase cache
 * This is called after successful blockchain transaction
 * @param characterLocation - Character location data to upsert
 * @returns Promise<void>
 */
export async function updateCharacterLocationCache(characterLocation: CharacterLocation): Promise<void> {
  const { error } = await supabase
    .from('character_locations')
    // @ts-ignore - Supabase types not generated for new tables yet
    .upsert({
      character_id: characterLocation.character_id,
      location_id: characterLocation.location_id,
      wallet_address: characterLocation.wallet_address.toLowerCase(),
      transaction_hash: characterLocation.transaction_hash,
      block_number: characterLocation.block_number,
      status: characterLocation.status,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'character_id'
    })

  if (error) {
    throw new Error(`Failed to update character location cache: ${error.message}`)
  }
}

/**
 * Create location transaction audit record
 * @param transaction - Transaction data to insert
 * @returns Promise<string> - ID of created transaction
 */
export async function createLocationTransaction(transaction: Omit<LocationTransaction, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('location_transactions')
    // @ts-ignore - Supabase types not generated for new tables yet
    .insert({
      character_id: transaction.character_id,
      from_location_id: transaction.from_location_id,
      to_location_id: transaction.to_location_id,
      wallet_address: transaction.wallet_address.toLowerCase(),
      transaction_hash: transaction.transaction_hash,
      action: transaction.action,
      status: transaction.status,
      gas_used: transaction.gas_used,
      block_number: transaction.block_number,
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create location transaction: ${error.message}`)
  }

  return (data as any).id
}

/**
 * Update location transaction status (e.g., from pending to confirmed)
 * @param transactionHash - Transaction hash to update
 * @param status - New status
 * @param blockNumber - Optional block number
 * @param gasUsed - Optional gas used
 * @returns Promise<void>
 */
export async function updateLocationTransactionStatus(
  transactionHash: string,
  status: 'pending' | 'confirmed' | 'failed',
  blockNumber?: number,
  gasUsed?: number
): Promise<void> {
  const { error } = await supabase
    .from('location_transactions')
    // @ts-ignore - Supabase types not generated for new tables yet
    .update({
      status,
      block_number: blockNumber,
      gas_used: gasUsed,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
    })
    .eq('transaction_hash', transactionHash)

  if (error) {
    throw new Error(`Failed to update location transaction status: ${error.message}`)
  }
}

/**
 * Delete character location (when unstaked)
 * @param characterId - WAGDIE token ID
 * @returns Promise<void>
 */
export async function deleteCharacterLocation(characterId: string): Promise<void> {
  const { error } = await supabase
    .from('character_locations')
    // @ts-ignore - Supabase types not generated for new tables yet
    .delete()
    .eq('character_id', characterId)

  if (error) {
    throw new Error(`Failed to delete character location: ${error.message}`)
  }
}

/**
 * Get location by ID
 * @param locationId - Location identifier
 * @returns Promise<Location | null> - Location data or null if not found
 */
export async function getLocationById(locationId: string): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch location: ${error.message}`)
  }

  return data
}

/**
 * Check if character location exists in cache
 * @param characterId - WAGDIE token ID
 * @returns Promise<CharacterLocation | null> - Character location or null
 */
export async function getCachedCharacterLocation(characterId: string): Promise<CharacterLocation | null> {
  const { data, error } = await supabase
    .from('character_locations')
    // @ts-ignore - Supabase types not generated for new tables yet
    .select(`
      *,
      location:locations(*)
    `)
    .eq('character_id', characterId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw new Error(`Failed to fetch cached character location: ${error.message}`)
  }

  return data as CharacterLocation | null
}

/**
 * Sync character location with blockchain
 * This is a placeholder for the sync logic that will query the blockchain
 * @param characterId - WAGDIE token ID
 * @returns Promise<CharacterLocation> - Updated character location
 * @throws Error if sync fails
 */
export async function refreshCharacterLocation(characterId: string): Promise<CharacterLocation> {
  // TODO: Implement blockchain sync logic
  // 1. Query WagdieWorld contract for latest on-chain data
  // 2. Compare with Supabase cache
  // 3. Update cache if different
  // 4. Return updated data

  throw new Error('refreshCharacterLocation not yet implemented - requires blockchain integration')
}

/**
 * Handle transaction confirmation and update Supabase cache
 * This is called after a successful blockchain transaction
 * @param params - Transaction confirmation parameters
 * @returns Promise<void>
 */
export async function handleTransactionConfirmation(params: {
  characterId: string
  transactionHash: `0x${string}`
  locationId: string
  action: 'stake' | 'move' | 'unstake'
  walletAddress: string
  blockNumber?: number
  gasUsed?: number
}): Promise<void> {
  const { characterId, transactionHash, locationId, action, walletAddress, blockNumber, gasUsed } = params

  try {
    // 1. Create transaction audit record
    const fromLocationId = action === 'move' || action === 'unstake'
      ? (await getCachedCharacterLocation(characterId))?.location_id
      : null

    const toLocationId = action === 'stake' || action === 'move'
      ? locationId
      : null

    await createLocationTransaction({
      character_id: characterId,
      from_location_id: fromLocationId || undefined,
      to_location_id: toLocationId || locationId,
      wallet_address: walletAddress,
      transaction_hash: transactionHash,
      action,
      status: 'confirmed',
      gas_used: gasUsed,
      block_number: blockNumber,
      created_at: new Date().toISOString(),
    })

    // 2. Update character location cache
    if (action === 'unstake') {
      // Remove from cache if unstaked
      await deleteCharacterLocation(characterId)
    } else {
      // Update cache with new location
      await updateCharacterLocationCache({
        character_id: characterId,
        location_id: locationId,
        wallet_address: walletAddress,
        transaction_hash: transactionHash,
        block_number: blockNumber,
        status: 'staked',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    // 3. Update transaction status to confirmed
    await updateLocationTransactionStatus(transactionHash, 'confirmed', blockNumber, gasUsed)
  } catch (error) {
    // If confirmation fails, mark transaction as failed
    await updateLocationTransactionStatus(transactionHash, 'failed').catch(() => {})

    throw error
  }
}

/**
 * Get cache statistics for monitoring
 * @returns Promise<object> - Cache statistics
 */
export async function getCacheStatistics(): Promise<object> {
  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  const { count: characterLocationCount } = await supabase
    .from('character_locations')
    .select('*', { count: 'exact', head: true })

  const { count: pendingTransactions } = await supabase
    .from('location_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    locations: locationCount || 0,
    characterLocations: characterLocationCount || 0,
    pendingTransactions: pendingTransactions || 0,
  }
}
