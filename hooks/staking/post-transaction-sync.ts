import { ApiError, readApiRaw } from '@/lib/api/client-response'
import { logError as defaultLogError } from '@/lib/utils/errors'
import { showErrorToast } from '@/lib/utils/toast'

export type SyncStakingApiResult = {
  tokenId: number
  success: boolean
  locationId: string | null
  chainLocationId: string
  error?: string
}

export type SyncStakingApiResponse = {
  results: SyncStakingApiResult[]
  error?: string
}

export type PostTransactionSyncOutcome = {
  ok: boolean
  message?: string
  results?: SyncStakingApiResult[]
  retryable: boolean
}

type PostTransactionSyncEffects = {
  showDelayedSyncToast?: () => void
  logError?: (error: unknown, context: string) => void
  warn?: (...args: unknown[]) => void
  debug?: (...args: unknown[]) => void
}

const showDefaultDelayedSyncToast = () => {
  showErrorToast(
    'Staking Sync Delayed',
    'Transaction confirmed, but map data is still syncing.'
  )
}

function coerceSyncStakingApiResponse(value: unknown): SyncStakingApiResponse | null {
  return value && typeof value === 'object'
    ? value as SyncStakingApiResponse
    : null
}

export function buildSyncFailureMessage(params: {
  tokenId: number
  responseOk: boolean
  status: number
  payload: SyncStakingApiResponse | null
}): string {
  const { tokenId, responseOk, status, payload } = params

  if (!responseOk) {
    const serverMessage =
      payload && typeof payload.error === 'string' && payload.error.trim().length > 0
        ? payload.error.trim()
        : `Request failed (${status})`
    return `Failed to sync staking state for #${tokenId}: ${serverMessage}`
  }

  if (payload?.error && payload.error.trim().length > 0) {
    return `Failed to sync staking state for #${tokenId}: ${payload.error.trim()}`
  }

  const results = Array.isArray(payload?.results) ? payload!.results : []
  const failed = results.filter((r) => !r.success)

  if (failed.length > 0) {
    const first = failed[0]
    const reason =
      typeof first?.error === 'string' && first.error.trim().length > 0
        ? first.error.trim()
        : 'Unknown error'
    return `Failed to sync staking state for #${tokenId}: ${reason}`
  }

  return `Failed to sync staking state for #${tokenId}`
}

export async function syncStakingStateToDb(params: {
  tokenId: number
  action: 'stake' | 'unstake'
  effects?: PostTransactionSyncEffects
}): Promise<PostTransactionSyncOutcome> {
  const { tokenId, action, effects } = params
  const warn = effects?.warn ?? console.warn
  const debug = effects?.debug ?? console.debug
  const showDelayedSyncToast = effects?.showDelayedSyncToast ?? showDefaultDelayedSyncToast
  const logError = effects?.logError ?? defaultLogError

  try {
    const response = await fetch('/api/sync/staking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenIds: [tokenId] }),
    })

    let payload: SyncStakingApiResponse | null = null
    let parseMessage: string | null = null
    try {
      payload = await readApiRaw<SyncStakingApiResponse>(
        response,
        `Request failed (${response.status})`
      )
    } catch (readError) {
      if (readError instanceof ApiError) {
        payload = coerceSyncStakingApiResponse(readError.data)
        if (payload === null) {
          parseMessage = readError.message
        }
      } else {
        payload = null
        parseMessage = readError instanceof Error ? readError.message : String(readError)
      }

      if (payload === null && parseMessage) {
        warn('[useStaking] Failed to parse /api/sync/staking JSON:', {
          tokenId,
          action,
          status: response.status,
          parseError: parseMessage,
        })
      }
    }

    const results = Array.isArray(payload?.results) ? payload!.results : []
    const failedResults = results.filter((r) => !r.success)
    const hasFailure =
      !response.ok ||
      !!payload?.error ||
      failedResults.length > 0 ||
      payload === null

    if (hasFailure) {
      const message = payload === null && parseMessage
        ? `Failed to sync staking state for #${tokenId}: ${parseMessage}`
        : buildSyncFailureMessage({
          tokenId,
          responseOk: response.ok,
          status: response.status,
          payload,
        })

      warn('[useStaking] /api/sync/staking failed:', {
        tokenId,
        action,
        status: response.status,
        ok: response.ok,
        payload,
      })

      showDelayedSyncToast()
      return {
        ok: false,
        message,
        results,
        retryable: true,
      }
    }

    if (process.env.NODE_ENV === 'development') {
      debug('[useStaking] /api/sync/staking succeeded:', { tokenId, action, payload })
    }

    return {
      ok: true,
      results,
      retryable: false,
    }
  } catch (syncError) {
    const message = `Failed to sync staking state for #${tokenId}. Please refresh and try again.`
    warn('[useStaking] Failed to sync staking state to DB:', {
      tokenId,
      action,
      error: syncError instanceof Error ? syncError.message : String(syncError),
    })
    showDelayedSyncToast()
    logError(syncError, 'syncStakingStateToDb')
    return {
      ok: false,
      message,
      retryable: true,
    }
  }
}
