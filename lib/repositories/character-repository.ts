/**
 * Character Repository
 * Infrastructure layer - Handles all database access for characters
 * Abstracts Supabase implementation details from business logic
 */

import { supabase } from '../supabase'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord, EditableCharacterFields } from '@/types/character'

export interface ICharacterRepository {
  findMany(filters: CharacterFilters): Promise<CharactersResponse>
  findById(tokenId: number): Promise<Character | null>
  update(tokenId: number, updates: Partial<Pick<Character, EditableCharacterFields>>): Promise<Character | null>
  findConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>>
}

/**
 * Supabase implementation of character repository
 */
export class CharacterRepository implements ICharacterRepository {
  /**
   * Find characters with filtering, pagination, and sorting
   */
  async findMany(filters: CharacterFilters): Promise<CharactersResponse> {
    let query = supabase
      .from('characters')
      .select('*', { count: 'exact' })

    // Apply filters based on tab
    if (filters.tab === 'owned' && filters.wallet) {
      query = query.eq('owner_address', filters.wallet.toLowerCase())
    } else if (filters.tab === 'infected') {
      query = query.eq('infection_status', 'infected')
    } else if (filters.tab === 'cured') {
      query = query.eq('infection_status', 'cured')
    } else if (filters.tab === 'staked') {
      query = query.eq('staking_status', 'staked')
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.trim()
      // Check if search is a number (token ID search)
      const tokenIdSearch = parseInt(searchTerm, 10)
      if (!isNaN(tokenIdSearch) && tokenIdSearch > 0) {
        query = query.eq('token_id', tokenIdSearch)
      } else {
        // Search by name in metadata (case-insensitive)
        query = query.ilike('metadata->>name', `%${searchTerm}%`)
      }
    }

    // Apply sorting
    const sortColumn = 'token_id'
    query = query.order(sortColumn, { ascending: filters.sort === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.perPage
    const to = from + filters.perPage - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching characters:', error)
      throw new Error(`Failed to fetch characters: ${error.message}`)
    }

    const totalCount = count || 0
    const hasMore = totalCount > filters.page * filters.perPage

    return {
      characters: (data || []) as Character[],
      hasMore,
      totalCount
    }
  }

  /**
   * Find a single character by token ID
   */
  async findById(tokenId: number): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('token_id', tokenId)
      .single()

    if (error) {
      console.error(`Error fetching character ${tokenId}:`, error)
      return null
    }

    return data as Character
  }

  /**
   * Update character data
   */
  async update(
    tokenId: number,
    updates: Partial<Pick<Character, EditableCharacterFields>>
  ): Promise<Character | null> {
    console.log(`[Repository] Updating character ${tokenId} with:`, JSON.stringify(updates, null, 2))

    const { data, error } = await (supabase
      .from('characters') as any)
      .update(updates)
      .eq('token_id', tokenId)
      .select()
      .single()

    if (error) {
      console.error(`[Repository] Error updating character ${tokenId}:`, error)
      console.error(`[Repository] Error code:`, error.code)
      console.error(`[Repository] Error details:`, error.details)
      console.error(`[Repository] Error hint:`, error.hint)
      throw new Error(`Failed to update character: ${error.message}`)
    }

    console.log(`[Repository] Successfully updated character ${tokenId}`)
    return data as Character
  }

  /**
   * Find concords owned by a character
   */
  async findConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>> {
    const { data, error } = await supabase
      .from('character_concords')
      .select(`
        *,
        concord:concords(*)
      `)
      .eq('token_id', tokenId)

    if (error) {
      console.error(`Error fetching concords for character ${tokenId}:`, error)
      throw new Error(`Failed to fetch character concords: ${error.message}`)
    }

    return data as Array<CharacterConcord & { concord: Concord }>
  }

  /**
   * Get all token IDs from the database
   */
  async getAllTokenIds(): Promise<number[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('token_id')
      .order('token_id', { ascending: true })

    if (error) {
      console.error('Error fetching token IDs:', error)
      throw new Error(`Failed to fetch token IDs: ${error.message}`)
    }

    return (data || []).map((row: { token_id: number }) => row.token_id)
  }

  /**
   * Get current ownership state for all characters
   * Returns a map of tokenId -> owner_address
   */
  async getCurrentOwnership(): Promise<Map<number, string | null>> {
    const { data, error } = await supabase
      .from('characters')
      .select('token_id, owner_address')

    if (error) {
      console.error('Error fetching ownership:', error)
      throw new Error(`Failed to fetch ownership: ${error.message}`)
    }

    const ownershipMap = new Map<number, string | null>()
    for (const row of (data || []) as Array<{ token_id: number; owner_address: string | null }>) {
      ownershipMap.set(row.token_id, row.owner_address?.toLowerCase() || null)
    }

    return ownershipMap
  }

  /**
   * Bulk update ownership for multiple characters
   * Updates each record individually to avoid constraint issues
   */
  async bulkUpdateOwnership(
    updates: Array<{ tokenId: number; ownerAddress: string | null }>,
    client = supabase
  ): Promise<{ updated: number; failed: number; errors: Error[] }> {
    const errors: Error[] = []
    let updated = 0
    let failed = 0

    // Process in batches of 50 for parallel updates
    const batchSize = 50
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)

      // Run updates in parallel within each batch
      const results = await Promise.allSettled(
        batch.map(async (u) => {
          const { error } = await (client.from('characters') as any)
            .update({
              owner_address: u.ownerAddress?.toLowerCase() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('token_id', u.tokenId)

          if (error) {
            throw new Error(`Token ${u.tokenId}: ${error.message}`)
          }
          return u.tokenId
        })
      )

      // Count successes and failures
      for (const result of results) {
        if (result.status === 'fulfilled') {
          updated++
        } else {
          failed++
          errors.push(new Error(result.reason?.message || 'Unknown error'))
        }
      }
    }

    return { updated, failed, errors }
  }

  /**
   * Update ownership for a single character
   */
  async updateOwnership(
    tokenId: number,
    ownerAddress: string | null,
    client = supabase
  ): Promise<boolean> {
    const { error } = await (client.from('characters') as any)
      .update({
        owner_address: ownerAddress?.toLowerCase() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('token_id', tokenId)

    if (error) {
      console.error(`Error updating ownership for token ${tokenId}:`, error)
      return false
    }

    return true
  }
}

// Export singleton instance
export const characterRepository = new CharacterRepository()
