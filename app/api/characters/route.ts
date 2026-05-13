/**
 * Characters API Route
 * GET handler for character listing with filters, pagination, and sorting
 */

import { NextRequest } from 'next/server'
import { getCharacters } from '@/lib/services/character-service'
import { parseEnumParam, parsePositiveIntParam } from '@/lib/api/params'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import type { CharacterFilterTab, CharactersResponse, SortOrder } from '@/types/character'

export const runtime = 'nodejs'

const CHARACTER_FILTER_TABS: readonly CharacterFilterTab[] = [
  'all',
  'owned',
  'infected',
  'cured',
  'staked',
  'fallen',
] as const

const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'] as const

const EMPTY_CHARACTERS_RESPONSE: CharactersResponse = {
  characters: [],
  hasMore: false,
  totalCount: 0,
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const tab = parseEnumParam(
      searchParams.get('tab') || null,
      CHARACTER_FILTER_TABS,
      'all'
    )
    const wallet = searchParams.get('wallet') || undefined
    const sort = parseEnumParam(searchParams.get('sort') || null, SORT_ORDERS, 'desc')
    const page = parsePositiveIntParam(searchParams.get('page'), { defaultValue: 1, min: 1 })
    const perPage = parsePositiveIntParam(searchParams.get('perPage'), {
      defaultValue: 50,
      min: 1,
      max: 200,
    })
    const search = searchParams.get('search') || undefined
    // Trait filter params
    const hasSheet = searchParams.get('hasSheet') === 'true'
    const hasElizaProfile = searchParams.get('hasElizaProfile') === 'true'
    const origin = searchParams.get('origin') || undefined
    const alignment = searchParams.get('alignment') || undefined
    const the17 = searchParams.get('the17') || undefined
    // Equipment filter params
    const armor = searchParams.get('armor') || undefined
    const back = searchParams.get('back') || undefined
    const mask = searchParams.get('mask') || undefined

    // Validate parameters
    if (page === null || perPage === null) {
      return jsonRawError('Invalid pagination parameters', 400)
    }

    if (tab === null) {
      return jsonRawError('Invalid tab parameter', 400)
    }

    if (sort === null) {
      return jsonRawError('Invalid sort parameter', 400)
    }

    // Safety net: 'owned' tab without wallet returns empty (not all characters)
    if (tab === 'owned' && !wallet) {
      return jsonRaw(EMPTY_CHARACTERS_RESPONSE)
    }

    // Fetch characters
    const result = await getCharacters({
      tab,
      wallet,
      sort,
      page,
      perPage,
      search,
      hasSheet: hasSheet || undefined,
      hasElizaProfile: hasElizaProfile || undefined,
      origin,
      alignment,
      the17,
      armor,
      back,
      mask
    })

    return jsonRaw(result)
  } catch (error) {
    console.error('Error fetching characters:', error)
    return jsonRawError('Failed to fetch characters', 500)
  }
}
