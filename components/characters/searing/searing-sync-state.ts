export type SearingMaterializationResult = {
  status?: 'completed' | 'completed_without_image' | 'failed' | 'skipped' | 'processing'
  error?: string
  reason?: string
  imageUrl?: string | null
}

export type SearingSyncResponse = {
  error?: string
  results?: SearingMaterializationResult[]
}

export type SearingSyncState =
  | { status: 'idle' }
  | { status: 'syncing'; message?: string }
  | { status: 'completed'; message?: string; imageUrl: string }
  | { status: 'completed_without_image'; message: string }
  | { status: 'pending'; message?: string }
  | { status: 'failed'; message: string }

function asImageUrl(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function syncStateFromResponse(
  payload: SearingSyncResponse,
  options: { responseOk?: boolean } = {}
): SearingSyncState {
  const results = Array.isArray(payload.results) ? payload.results : []
  const failed = results.find((result) => result.status === 'failed')

  if (failed) {
    return {
      status: 'failed',
      message: failed.error || 'The off-chain materialization step failed.',
    }
  }

  if (options.responseOk === false || payload.error) {
    return {
      status: 'failed',
      message: payload.error || 'Failed to sync searing materialization',
    }
  }

  const completed = results.find((result) =>
    result.status === 'completed' ||
    (result.status === 'skipped' && result.reason === 'completed')
  )

  if (completed) {
    const imageUrl = asImageUrl(completed.imageUrl)
    if (imageUrl) {
      return {
        status: 'completed',
        imageUrl,
        message: 'Seared artwork was generated and saved.',
      }
    }

    return {
      status: 'completed_without_image',
      message: 'The searing event is synced, but no materialized seared image URL was returned. Retry off-chain sync to repair the artwork.',
    }
  }

  const completedWithoutImage = results.find((result) => result.status === 'completed_without_image')
  if (completedWithoutImage) {
    return {
      status: 'completed_without_image',
      message: completedWithoutImage.error || completedWithoutImage.reason || 'The searing event is synced, but no materialized seared image URL was returned. Retry off-chain sync to repair the artwork.',
    }
  }

  return {
    status: 'pending',
    message: 'No completed materialization result was returned yet. The on-chain searing transaction is confirmed.',
  }
}

export async function readSearingSyncResponse(response: Response): Promise<SearingSyncResponse> {
  try {
    return await response.json() as SearingSyncResponse
  } catch {
    return {}
  }
}
