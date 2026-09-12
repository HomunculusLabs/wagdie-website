import { syncStakingStateToDb } from '@/hooks/staking/post-transaction-sync'
import { logError } from '@/lib/utils/errors'
import { showErrorToast } from '@/lib/utils/toast'

jest.mock('@/lib/utils/toast', () => ({
  showErrorToast: jest.fn(),
}))

jest.mock('@/lib/utils/errors', () => ({
  logError: jest.fn(),
}))

const mockFetch = jest.fn()
const showErrorToastMock = showErrorToast as jest.Mock
const logErrorMock = logError as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  global.fetch = mockFetch as unknown as typeof fetch
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('syncStakingStateToDb', () => {
  it('returns a successful sync outcome for successful API results', async () => {
    const result = { tokenId: 7, success: true, locationId: null, chainLocationId: '0' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ results: [result] }),
    })

    const outcome = await syncStakingStateToDb({ tokenId: 7, action: 'stake' })

    expect(mockFetch).toHaveBeenCalledWith('/api/sync/staking', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenIds: [7] }),
    }))
    expect(outcome).toEqual({ ok: true, results: [result], retryable: false })
    expect(showErrorToastMock).not.toHaveBeenCalled()
  })

  it('returns a retryable failure for a non-OK response with a JSON error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: jest.fn().mockResolvedValue({ results: [], error: 'Indexer unavailable' }),
    })

    const outcome = await syncStakingStateToDb({ tokenId: 7, action: 'stake' })

    expect(outcome).toEqual({
      ok: false,
      message: 'Failed to sync staking state for #7: Indexer unavailable',
      results: [],
      retryable: true,
    })
    expect(showErrorToastMock).toHaveBeenCalledWith(
      'Staking Sync Delayed',
      'Transaction confirmed, but map data is still syncing.'
    )
  })

  it('returns a retryable failure for an OK response with failed result rows', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        results: [{
          tokenId: 7,
          success: false,
          locationId: null,
          chainLocationId: '3',
          error: 'No location mapping for chain_location_id',
        }],
      }),
    })

    const outcome = await syncStakingStateToDb({ tokenId: 7, action: 'stake' })

    expect(outcome).toMatchObject({
      ok: false,
      message: 'Failed to sync staking state for #7: No location mapping for chain_location_id',
      retryable: true,
    })
    expect(showErrorToastMock).toHaveBeenCalledTimes(1)
  })

  it('returns a retryable failure for malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new Error('Unexpected token < in JSON')),
    })

    const outcome = await syncStakingStateToDb({ tokenId: 7, action: 'unstake' })

    // Since the readApiRaw migration (9c93f237), JSON parse failures surface as
    // ApiError with the fallback message, not the raw parser message.
    expect(outcome).toEqual({
      ok: false,
      message: 'Failed to sync staking state for #7: Request failed (200)',
      results: [],
      retryable: true,
    })
    expect(showErrorToastMock).toHaveBeenCalledTimes(1)
  })

  it('returns a retryable failure and logs when fetch throws', async () => {
    const syncError = new Error('network down')
    mockFetch.mockRejectedValueOnce(syncError)

    const outcome = await syncStakingStateToDb({ tokenId: 7, action: 'stake' })

    expect(outcome).toEqual({
      ok: false,
      message: 'Failed to sync staking state for #7. Please refresh and try again.',
      retryable: true,
    })
    expect(showErrorToastMock).toHaveBeenCalledTimes(1)
    expect(logErrorMock).toHaveBeenCalledWith(syncError, 'syncStakingStateToDb')
  })
})
