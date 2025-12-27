/**
 * Characters API Route
 * GET handler for character listing with filters, pagination, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getCharacters } from '@/lib/services/character-service'
import type { CharacterFilterTab, SortOrder } from '@/types/character'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const tab = (searchParams.get('tab') || 'all') as CharacterFilterTab
    const wallet = searchParams.get('wallet') || undefined
    const sort = (searchParams.get('sort') || 'desc') as SortOrder
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '50', 10)
    const search = searchParams.get('search') || undefined
    // Trait filter params
    const hasSheet = searchParams.get('hasSheet') === 'true'
    const origin = searchParams.get('origin') || undefined
    const alignment = searchParams.get('alignment') || undefined
    // Equipment filter params
    const armor = searchParams.get('armor') || undefined
    const back = searchParams.get('back') || undefined
    const mask = searchParams.get('mask') || undefined

    // Validate parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    if (!['all', 'owned', 'infected', 'cured', 'staked'].includes(tab)) {
      return NextResponse.json(
        { error: 'Invalid tab parameter' },
        { status: 400 }
      )
    }

    if (!['asc', 'desc'].includes(sort)) {
      return NextResponse.json(
        { error: 'Invalid sort parameter' },
        { status: 400 }
      )
    }

    // Safety net: 'owned' tab without wallet returns empty (not all characters)
    if (tab === 'owned' && !wallet) {
      return NextResponse.json({
        characters: [],
        hasMore: false,
        totalCount: 0
      })
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
      origin,
      alignment,
      armor,
      back,
      mask
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    )
  }
}
