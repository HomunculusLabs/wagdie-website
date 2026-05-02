import { NextRequest, NextResponse } from 'next/server'
import { parseTokenIdParam } from '@/lib/api/params'
import {
  getConfiguredSearingChainId,
  searingMaterializationService,
} from '@/lib/services/searing-materialization-service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const

type SyncBody = {
  transactionHash?: unknown
  txHash?: unknown
  eventId?: unknown
  chainId?: unknown
  retryFailed?: unknown
  repairCompleted?: unknown
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asChainId(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value)) return undefined
  return value
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tokenId: string }> }
) {
  const params = await context.params
  const tokenId = parseTokenIdParam(params.tokenId, { min: 0 })
  if (tokenId === null) {
    return NextResponse.json(
      { error: 'Invalid token ID' },
      { status: 400, headers: NO_STORE_HEADERS }
    )
  }

  let body: SyncBody = {}
  try {
    const parsed = await request.json()
    body = parsed && typeof parsed === 'object' ? parsed as SyncBody : {}
  } catch {
    body = {}
  }

  const transactionHash = asString(body.transactionHash) || asString(body.txHash)
  const retryFailed = body.retryFailed === true
  const repairCompleted = body.repairCompleted === true

  try {
    if (!transactionHash) {
      return NextResponse.json(
        { error: 'transactionHash is required for public searing sync' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const requestedChainId = asChainId(body.chainId)
    const configuredChainId = getConfiguredSearingChainId()
    if (requestedChainId !== undefined && requestedChainId !== configuredChainId) {
      return NextResponse.json(
        { error: 'chainId does not match server configuration' },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const result = await searingMaterializationService.verifyTransactionAndMaterialize({
      tokenId,
      transactionHash,
      retryFailed,
      repairCompleted,
    })
    return NextResponse.json(result, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sync searing materialization'
    const status = message === 'Invalid transaction hash' ? 400 : 500
    return NextResponse.json(
      { error: message },
      { status, headers: NO_STORE_HEADERS }
    )
  }
}
