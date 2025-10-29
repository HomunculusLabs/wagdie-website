/**
 * Character Service
 * Business logic for character CRUD operations, filtering, and queries
 */

import { supabase } from '../supabase'
import type { Character, CharacterFilters, CharactersResponse, CharacterConcord, Concord } from '@/types/character'

/**
 * Get characters with filtering, pagination, and sorting
 */
export async function getCharacters(filters: CharacterFilters): Promise<CharactersResponse> {
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
 * Get a single character by token ID
 */
export async function getCharacter(tokenId: number): Promise<Character | null> {
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
 * Update character data (background story, equipment)
 * Requires ownership validation at API route level
 */
export async function updateCharacter(
  tokenId: number,
  updates: Partial<Pick<Character, 'background_story' | 'equipment'>>
): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .update(updates)
    .eq('token_id', tokenId)
    .select()
    .single()

  if (error) {
    console.error(`Error updating character ${tokenId}:`, error)
    throw new Error(`Failed to update character: ${error.message}`)
  }

  return data as Character
}

/**
 * Get concords owned by a character
 */
export async function getCharacterConcords(tokenId: number): Promise<Array<CharacterConcord & { concord: Concord }>> {
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
