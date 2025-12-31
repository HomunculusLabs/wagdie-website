/**
 * Character Infection Events API Route
 * GET: Fetch infection and cure events for a character
 *
 * Query params:
 *   - type: 'infection' | 'cure' (optional, filters by event type)
 *   - limit: number (optional, max results, default 50)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

interface InfectionEvent {
  id: string
  token_id: number
  event_type: 'infection' | 'cure'
  transaction_hash: string
  block_number: number
  log_index: number
  actor_address: string | null
  amount: number | null
  event_timestamp: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseInt(params.tokenId, 10)

  if (isNaN(tokenId) || tokenId < 0) {
    return NextResponse.json(
      { error: 'Invalid token ID' },
      { status: 400 }
    )
  }

  const searchParams = request.nextUrl.searchParams
  const eventType = searchParams.get('type')
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50

  // Validate event type if provided
  if (eventType && eventType !== 'infection' && eventType !== 'cure') {
    return NextResponse.json(
      { error: 'Invalid event type. Must be "infection" or "cure"' },
      { status: 400 }
    )
  }

  const supabase = createSupabaseClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection unavailable' },
      { status: 503 }
    )
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('infection_events')
      .select('*')
      .eq('token_id', tokenId)
      .order('block_number', { ascending: false })
      .limit(limit)

    if (eventType) {
      query = query.eq('event_type', eventType)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching infection events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    const events: InfectionEvent[] = data || []

    return NextResponse.json({
      tokenId,
      events,
      count: events.length,
    })
  } catch (error) {
    console.error('Unexpected error in infection events API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
