/**
 * Staking Status API Route
 * GET handler for batch staking status lookup by token IDs
 * Returns staking status from database (not blockchain)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { CHARACTERS_TABLE } from '@/lib/db/tables'

interface StakingStatusResponse {
  tokenId: number
  isStaked: boolean
  locationId: string | null
}

interface ApiResponse {
  statuses: StakingStatusResponse[]
  error?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams
    const tokenIdsParam = searchParams.get('tokenIds')

    if (!tokenIdsParam) {
      return NextResponse.json(
        { statuses: [], error: 'tokenIds parameter is required' },
        { status: 400 }
      )
    }

    // Parse token IDs from comma-separated string
    const tokenIds = tokenIdsParam
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id) && id > 0)

    if (tokenIds.length === 0) {
      return NextResponse.json({ statuses: [] })
    }

    // Limit to 500 token IDs per request to prevent abuse
    if (tokenIds.length > 500) {
      return NextResponse.json(
        { statuses: [], error: 'Maximum 500 token IDs per request' },
        { status: 400 }
      )
    }

    // Query database for staking status (location_id)
    const { data, error } = await supabase
      .from(CHARACTERS_TABLE)
      .select('token_id, location_id')
      .in('token_id', tokenIds)

    if (error) {
      console.error('Error fetching staking status:', error)
      return NextResponse.json(
        { statuses: [], error: 'Failed to fetch staking status' },
        { status: 500 }
      )
    }

    // Build response with staking status
    const statusMap = new Map<number, { location_id: string | null }>()
    for (const row of (data || []) as Array<{ token_id: number; location_id: string | null }>) {
      statusMap.set(row.token_id, { location_id: row.location_id })
    }

    // Build response array for all requested token IDs
    const statuses: StakingStatusResponse[] = tokenIds.map(tokenId => {
      const record = statusMap.get(tokenId)
      const locationId = record?.location_id ?? null
      return {
        tokenId,
        isStaked: locationId !== null,
        locationId,
      }
    })

    return NextResponse.json({ statuses })
  } catch (error) {
    console.error('Error in staking-status API:', error)
    return NextResponse.json(
      { statuses: [], error: 'Internal server error' },
      { status: 500 }
    )
  }
}
