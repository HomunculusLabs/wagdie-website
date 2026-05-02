import { NextRequest, NextResponse } from 'next/server'
import { searingMaterializationService } from '@/lib/services/searing-materialization-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50
const MAX_TOKEN_IDS = 50

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

type BulkSyncBody = {
  limit?: unknown
  includeFailed?: unknown
  retryFailed?: unknown
  tokenIds?: unknown
}

function verifyAuthorization(request: NextRequest): boolean {
  const syncSecret = process.env.SYNC_SECRET_KEY
  if (!syncSecret) {
    console.error('SYNC_SECRET_KEY not configured')
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    if (token === syncSecret) return true
  }

  return request.nextUrl.searchParams.get('secret') === syncSecret
}

function parseLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return DEFAULT_LIMIT
  return Math.min(Math.max(value, 1), MAX_LIMIT)
}

function parseTokenIds(value: unknown): number[] | undefined {
  if (value === undefined || value === null) return undefined
  if (!Array.isArray(value)) return []

  const seen = new Set<number>()
  const tokenIds: number[] = []
  for (const item of value) {
    if (typeof item !== 'number' || !Number.isInteger(item) || item <= 0) return []
    if (seen.has(item)) continue
    seen.add(item)
    tokenIds.push(item)
  }

  return tokenIds
}

export async function POST(request: NextRequest) {
  if (!verifyAuthorization(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
  }

  let body: BulkSyncBody = {}
  try {
    const parsed = await request.json()
    body = parsed && typeof parsed === 'object' ? parsed as BulkSyncBody : {}
  } catch {
    body = {}
  }

  const tokenIds = parseTokenIds(body.tokenIds)
  if (tokenIds && tokenIds.length === 0 && body.tokenIds !== undefined) {
    return NextResponse.json(
      { error: 'tokenIds must be an array of positive integers' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  if (tokenIds && tokenIds.length > MAX_TOKEN_IDS) {
    return NextResponse.json(
      { error: `Maximum ${MAX_TOKEN_IDS} tokenIds per request` },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  const limit = parseLimit(body.limit)
  const includeFailed = body.includeFailed === true || body.retryFailed === true

  try {
    const results = await searingMaterializationService.materializePendingBatch({
      limit,
      includeFailed,
      retryFailed: includeFailed,
      tokenIds,
    })

    return NextResponse.json(
      {
        success: results.every((result) => result.status !== 'failed'),
        count: results.length,
        limit,
        includeFailed,
        results,
      },
      { headers: NO_STORE_HEADERS }
    )
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync searing events' },
      { status: 500, headers: NO_STORE_HEADERS }
    )
  }
}
