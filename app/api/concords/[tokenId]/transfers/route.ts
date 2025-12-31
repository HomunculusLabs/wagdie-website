import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://kong:8000'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params
  const tokenIdNum = parseInt(tokenId, 10)

  if (isNaN(tokenIdNum) || tokenIdNum < 0) {
    return NextResponse.json(
      { error: 'Invalid token ID' },
      { status: 400 }
    )
  }

  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)
  const mintsOnly = url.searchParams.get('mints_only') === 'true'

  const supabase = createClient(supabaseUrl, supabaseKey)

  let query = supabase
    .from('concord_transfers')
    .select('*', { count: 'exact' })
    .eq('token_id', tokenIdNum)
    .order('block_number', { ascending: false })
    .range(offset, offset + limit - 1)

  if (mintsOnly) {
    query = query.eq('is_mint', true)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch concord transfers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch concord transfers' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    tokenId: tokenIdNum,
    transfers: data || [],
    total: count || 0,
    limit,
    offset,
  })
}
