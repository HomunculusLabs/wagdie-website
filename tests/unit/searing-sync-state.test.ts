import { syncStateFromResponse } from '@/components/characters/searing/searing-sync-state'

describe('syncStateFromResponse', () => {
  it('returns completed only when a completed result has an image URL', () => {
    expect(syncStateFromResponse({
      results: [{ status: 'completed', imageUrl: 'https://example.com/seared.png' }],
    })).toEqual({
      status: 'completed',
      imageUrl: 'https://example.com/seared.png',
      message: 'The seared character image and metadata were updated.',
    })
  })

  it('treats completed without image URL as a warning state', () => {
    expect(syncStateFromResponse({
      results: [{ status: 'completed' }],
    }).status).toBe('completed_without_image')
  })

  it('treats skipped completed with image URL as completed', () => {
    expect(syncStateFromResponse({
      results: [{ status: 'skipped', reason: 'completed', imageUrl: 'https://example.com/existing.png' }],
    })).toMatchObject({
      status: 'completed',
      imageUrl: 'https://example.com/existing.png',
    })
  })

  it('returns failed when any materialization result failed', () => {
    expect(syncStateFromResponse({
      results: [{ status: 'failed', error: 'upload failed' }],
    })).toEqual({
      status: 'failed',
      message: 'upload failed',
    })
  })

  it('returns failed for non-OK responses', () => {
    expect(syncStateFromResponse({ error: 'bad request' }, { responseOk: false })).toEqual({
      status: 'failed',
      message: 'bad request',
    })
  })

  it('returns pending when no actionable result is present', () => {
    expect(syncStateFromResponse({ results: [{ status: 'processing' }] }).status).toBe('pending')
  })
})
