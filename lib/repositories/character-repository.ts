/**
 * Character Repository
 * Infrastructure layer - Handles all database access for characters
 * Abstracts Supabase implementation details from business logic
 */

import { supabase } from '../supabase'
import { CHARACTERS_TABLE } from '@/lib/db/tables'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord, EditableCharacterFields, OriginCount, OriginsResponse, AlignmentCount, AlignmentsResponse, TraitCount, TraitCountsResponse } from '@/types/character'
import type { NormalizedLocationMetadata } from '@/lib/domain/location/metadata-types'
import { normalizeLocationMetadata } from '@/lib/domain/location/metadata'

/**
 * Location data joined from the locations table.
 * The metadata field is normalized to ensure center can be derived from bounds.
 */
export interface JoinedLocation {
  /** UUID of the location */
  id: string;

  /** Human-readable location name */
  name: string;

  /**
   * Normalized metadata with guaranteed bounds field.
   * Center and coordinates are derived if not present in raw data.
   */
  metadata: NormalizedLocationMetadata;
}

/**
 * Character with optional joined location data.
 *
 * Returned by:
 * - CharacterRepository.getStakedCharacters()
 *
 * Consumed by:
 * - useMapData() hook
 * - app/map/page.tsx mapCharacterMarkers memo
 */
export interface CharacterWithLocation extends Character {
  /**
   * Joined location data. Null if:
   * - Character's location_id is null (not staked)
   * - Character's location_id references a deleted location (orphaned FK)
   */
  location?: JoinedLocation | null;
}

export interface ICharacterRepository {
  findMany(filters: CharacterFilters): Promise<CharactersResponse>
  findById(tokenId: number): Promise<Character | null>
  update(tokenId: number, updates: Partial<Pick<Character, EditableCharacterFields>>): Promise<Character | null>
  findConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>>
  getOrigins(): Promise<OriginsResponse>
  getAlignments(): Promise<AlignmentsResponse>
  getTraitCounts(traitType: string): Promise<TraitCountsResponse>
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
      .from(CHARACTERS_TABLE)
      .select('*', { count: 'exact' })

    // Apply filters based on tab
    if (filters.tab === 'owned' && filters.wallet) {
      query = query.eq('owner_address', filters.wallet.toLowerCase())
    } else if (filters.tab === 'infected') {
      // `wagdie_characters` uses a boolean column `infected`
      query = query.eq('infected', true)
    } else if (filters.tab === 'cured') {
      // No explicit "cured" state in `wagdie_characters`; treat as "not infected"
      query = query.eq('infected', false)
    } else if (filters.tab === 'staked') {
      // Staked characters are those with a non-null location_id
      query = query.not('location_id', 'is', null)
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

    // Has sheet filter - characters with custom data (name, stats, level, or background)
    // A character "has sheet" if any player-edited field is populated
    if (filters.hasSheet) {
      query = query.or(
        'name.not.is.null,' +           // Custom name
        'str.not.is.null,' +            // Core stats defined
        'level.gt.1,' +                 // Level > 1 (default is 1)
        'background_story.not.is.null'  // Custom backstory
      )
    }

    // NEW: Origin filter - filter by Body trait in metadata JSONB
    if (filters.origin) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Body', value: filters.origin }]
      })
    }

    // Alignment filter - filter by Alignment trait in metadata JSONB
    if (filters.alignment) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Alignment', value: filters.alignment }]
      })
    }

    // Equipment filters - filter by Armor, Back, Mask traits in metadata JSONB
    if (filters.armor) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Armor', value: filters.armor }]
      })
    }
    if (filters.back) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Back', value: filters.back }]
      })
    }
    if (filters.mask) {
      query = query.contains('metadata', {
        attributes: [{ trait_type: 'Mask', value: filters.mask }]
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
      .from(CHARACTERS_TABLE)
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
    // Cast required: Supabase generated types may not allow partial updates on this table
    const query = supabase.from(CHARACTERS_TABLE) as unknown as {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: number) => {
          select: () => {
            single: () => Promise<{ data: unknown; error: { message: string } | null }>
          }
        }
      }
    }
    const { data, error } = await query
      .update(updates as Record<string, unknown>)
      .eq('token_id', tokenId)
      .select()
      .single()

    if (error) {
      console.error(`[Repository] Error updating character ${tokenId}:`, error.message)
      throw new Error(`Failed to update character: ${error.message}`)
    }

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
      .from(CHARACTERS_TABLE)
      .select('metadata', { count: 'exact' })

    if (error) {
      console.error('Error fetching origins:', error)
      throw new Error(`Failed to fetch origins: ${error.message}`)
    }

    // Extract Body trait from each character's metadata
    const originCounts = new Map<string, number>()

    // Type the data since Supabase may not infer correctly for JSONB selection
    const rows = (data || []) as Array<{ metadata: { attributes?: Array<{ trait_type: string; value: string }> } | null }>

    for (const row of rows) {
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
      .from(CHARACTERS_TABLE)
      .select('metadata', { count: 'exact' })

    if (error) {
      console.error('Error fetching alignments:', error)
      throw new Error(`Failed to fetch alignments: ${error.message}`)
    }

    // Extract Alignment trait from each character's metadata
    const alignmentCounts = new Map<string, number>()
    const allTraitTypes = new Set<string>()

    // Type the data since Supabase may not infer correctly for JSONB selection
    const rows = (data || []) as Array<{ metadata: { attributes?: Array<{ trait_type: string; value: string }> } | null }>

    for (const row of rows) {
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
   * Get counts for any trait type in metadata JSONB
   * Generic method to support Armor, Back, Mask, and other trait filters
   */
  async getTraitCounts(traitType: string): Promise<TraitCountsResponse> {
    // Fetch all metadata to extract the specified trait
    const { data, error, count } = await supabase
      .from(CHARACTERS_TABLE)
      .select('metadata', { count: 'exact' })

    if (error) {
      throw new Error(`Failed to fetch ${traitType} traits: ${error.message}`)
    }

    // Extract trait values from each character's metadata
    const traitCounts = new Map<string, number>()

    // Type the data since Supabase may not infer correctly for JSONB selection
    const rows = (data || []) as Array<{ metadata: { attributes?: Array<{ trait_type: string; value: string }> } | null }>

    for (const row of rows) {
      const metadata = row.metadata
      if (metadata?.attributes && Array.isArray(metadata.attributes)) {
        const traitAttr = metadata.attributes.find(
          (attr: { trait_type: string; value: string }) => attr.trait_type === traitType
        )
        if (traitAttr?.value) {
          const value = String(traitAttr.value)
          traitCounts.set(value, (traitCounts.get(value) || 0) + 1)
        }
      }
    }

    // Convert to array and sort by count descending
    const traits: TraitCount[] = Array.from(traitCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)

    return {
      traitType,
      traits,
      totalCharacters: count || 0
    }
  }

  async getStakedCharacters(): Promise<CharacterWithLocation[]> {
    // Step 1: Get characters with location_id set
    // Note: Using separate queries because there's no FK constraint between wagdie_characters and locations
    const { data, error: charError } = await supabase
      .from(CHARACTERS_TABLE)
      .select('*')
      .not('location_id', 'is', null)
      .order('token_id', { ascending: true })

    if (charError) {
      console.error('Error fetching staked characters:', charError)
      throw new Error(`Failed to fetch staked characters: ${charError.message}`)
    }

    // Cast to Character[] since Supabase doesn't infer the full type
    const characters = (data || []) as Character[]

    if (characters.length === 0) {
      return []
    }

    // Step 2: Get unique location IDs
    const locationIds = [...new Set(
      characters
        .map(c => c.location_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    )]

    // Step 3: Fetch locations for those IDs
    const { data: locationsData, error: locError } = await supabase
      .from('locations')
      .select('id, name, metadata')
      .in('id', locationIds)

    if (locError) {
      console.error('Error fetching locations for staked characters:', locError)
      // Return characters without location data rather than failing completely
      return characters.map(c => ({ ...c, location: null })) as CharacterWithLocation[]
    }

    // Cast to proper type since Supabase doesn't infer it
    const locations = (locationsData || []) as Array<{ id: string; name: string; metadata: unknown }>

    // Step 4: Create location lookup map
    const locationMap = new Map<string, { id: string; name: string; metadata: unknown }>()
    for (const loc of locations) {
      locationMap.set(loc.id, loc)
    }

    // Step 5: Join characters with locations and normalize metadata
    const result: CharacterWithLocation[] = characters.map(char => {
      const rawLoc = char.location_id ? locationMap.get(char.location_id) : undefined
      if (!rawLoc) {
        return { ...char, location: null } as CharacterWithLocation
      }
      return {
        ...char,
        location: {
          id: rawLoc.id,
          name: rawLoc.name,
          metadata: normalizeLocationMetadata(rawLoc.metadata),
        },
      } as CharacterWithLocation
    })

    return result
  }

  /**
   * Get all token IDs from the database
   */
  async getAllTokenIds(): Promise<number[]> {
    const { data, error } = await supabase
      .from(CHARACTERS_TABLE)
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
      .from(CHARACTERS_TABLE)
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
          // Cast required: Supabase generated types may not allow partial updates on this table
          const query = client.from(CHARACTERS_TABLE) as unknown as {
            update: (values: Record<string, unknown>) => {
              eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>
            }
          }
          const { error } = await query
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
    // Cast required: Supabase generated types may not allow partial updates on this table
    const query = client.from(CHARACTERS_TABLE) as unknown as {
      update: (values: Record<string, unknown>) => {
        eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>
      }
    }
    const { error } = await query
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

export const getStakedCharacters = () => characterRepository.getStakedCharacters()
