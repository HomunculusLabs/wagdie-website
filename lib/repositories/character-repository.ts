/**
 * Character Repository
 * Infrastructure layer - Handles all database access for characters
 * Abstracts Supabase implementation details from business logic
 */

import { supabase } from '../supabase'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord, EditableCharacterFields, OriginCount, OriginsResponse, AlignmentCount, AlignmentsResponse } from '@/types/character'

export interface ICharacterRepository {
  findMany(filters: CharacterFilters): Promise<CharactersResponse>
  findById(tokenId: number): Promise<Character | null>
  update(tokenId: number, updates: Partial<Pick<Character, EditableCharacterFields>>): Promise<Character | null>
  findConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>>
  getOrigins(): Promise<OriginsResponse>
  getAlignments(): Promise<AlignmentsResponse>
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

    // NEW: Has sheet filter - characters with custom name, stats, or background
    if (filters.hasSheet) {
      query = query.or('name.not.is.null,str.not.is.null,background_story.not.is.null')
    }

    // NEW: Origin filter - filter by Body trait in metadata JSONB
    if (filters.origin) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Body', value: filters.origin }]
      })
    }

    // NEW: Alignment filter - filter by Alignment trait in metadata JSONB
    if (filters.alignment) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Alignment', value: filters.alignment }]
      })
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
   * Get all unique origins with character counts
   * Extracts Body trait from metadata JSONB
   */
  async getOrigins(): Promise<OriginsResponse> {
    // Fetch all metadata to extract Body trait
    const { data, error, count } = await supabase
      .from('characters')
      .select('metadata', { count: 'exact' })

    if (error) {
      console.error('Error fetching origins:', error)
      throw new Error(`Failed to fetch origins: ${error.message}`)
    }

    // Extract Body trait from each character's metadata
    const originCounts = new Map<string, number>()

    for (const row of data || []) {
      const metadata = row.metadata
      if (metadata?.attributes && Array.isArray(metadata.attributes)) {
        const bodyAttr = metadata.attributes.find(
          (attr: { trait_type: string; value: string }) => attr.trait_type === 'Body'
        )
        if (bodyAttr?.value) {
          const origin = bodyAttr.value as string
          originCounts.set(origin, (originCounts.get(origin) || 0) + 1)
        }
      }
    }

    // Convert to array and sort by count descending
    const origins: OriginCount[] = Array.from(originCounts.entries())
      .map(([origin, count]) => ({ origin, count }))
      .sort((a, b) => b.count - a.count)

    return {
      origins,
      totalCharacters: count || 0
    }
  }

  /**
   * Get all unique alignments with character counts
   * Extracts Alignment trait from metadata JSONB
   */
  async getAlignments(): Promise<AlignmentsResponse> {
    // Fetch all metadata to extract Alignment trait
    const { data, error, count } = await supabase
      .from('characters')
      .select('metadata', { count: 'exact' })

    if (error) {
      console.error('Error fetching alignments:', error)
      throw new Error(`Failed to fetch alignments: ${error.message}`)
    }

    // Extract Alignment trait from each character's metadata
    const alignmentCounts = new Map<string, number>()
    const allTraitTypes = new Set<string>()

    for (const row of data || []) {
      const metadata = row.metadata
      if (metadata?.attributes && Array.isArray(metadata.attributes)) {
        // Collect all trait types for debugging
        for (const attr of metadata.attributes) {
          if (attr.trait_type) {
            allTraitTypes.add(attr.trait_type)
          }
        }

        const alignmentAttr = metadata.attributes.find(
          (attr: { trait_type: string; value: string }) => attr.trait_type === 'Alignment'
        )
        if (alignmentAttr?.value) {
          const alignment = alignmentAttr.value as string
          alignmentCounts.set(alignment, (alignmentCounts.get(alignment) || 0) + 1)
        }
      }
    }

    // Log available trait types for debugging
    console.log('[getAlignments] Available trait types in metadata:', Array.from(allTraitTypes))
    console.log('[getAlignments] Found alignments:', alignmentCounts.size)

    // Convert to array and sort by alignment name
    const alignments: AlignmentCount[] = Array.from(alignmentCounts.entries())
      .map(([alignment, count]) => ({ alignment, count }))
      .sort((a, b) => a.alignment.localeCompare(b.alignment))

    return {
      alignments,
      totalCharacters: count || 0
    }
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
