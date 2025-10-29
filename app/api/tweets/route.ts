/**
 * Tweets API Route
 * GET handler for tweet feed with filters, sorting, and pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTweets } from '@/lib/services/tweet-service'
import type { TweetFilterTab, SortOrder } from '@/types/tweet'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const tab = (searchParams.get('tab') || 'all') as TweetFilterTab
    const sort = (searchParams.get('sort') || 'desc') as SortOrder
    const perPage = parseInt(searchParams.get('perPage') || '25', 10)
    const startAt = searchParams.get('startAt') || undefined

    // Validate parameters
    if (perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'Invalid perPage parameter' },
        { status: 400 }
      )
    }

    if (!['all', 'text', 'video'].includes(tab)) {
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

    // Fetch tweets
    const result = await getTweets({
      tab,
      sort,
      perPage,
      startAt
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching tweets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tweets' },
      { status: 500 }
    )
  }
}
