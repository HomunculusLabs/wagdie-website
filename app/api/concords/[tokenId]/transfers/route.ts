import { parseLimitOffsetParams, parseTokenIdParam } from '@/lib/api/params'
import { jsonRaw, jsonRawError } from '@/lib/api/responses'
import { activityRepository } from '@/lib/repositories/activity-repository'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params
  const tokenIdNum = parseTokenIdParam(tokenId, { min: 0 })
  if (tokenIdNum === null) {
    return jsonRawError('Invalid token ID', 400)
  }

  const url = new URL(request.url)
  const { limit, offset } = parseLimitOffsetParams(url.searchParams, { defaultLimit: 50, maxLimit: 100 })
  const mintsOnly = url.searchParams.get('mints_only') === 'true'
  let transfers = []
  let total = 0
  try {
    const result = await activityRepository.findConcordTransfers(tokenIdNum, {
      limit,
      offset,
      mintsOnly,
    })
    transfers = result.transfers
    total = result.total
  } catch (error) {
    console.error('Failed to fetch concord transfers:', error)
    return jsonRawError('Failed to fetch concord transfers', 500)
  }

  return jsonRaw({
    tokenId: tokenIdNum,
    transfers,
    total,
    limit,
    offset,
  })
}
