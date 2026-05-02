import { SearingStorageService } from '@/lib/services/searing-storage'

describe('SearingStorageService object naming', () => {
  it('keeps the legacy token object path when no version is provided', () => {
    const storage = new SearingStorageService({ bucketName: 'bucket', prefix: 'seared' })

    expect(storage.objectNameForToken(5873)).toBe('seared/5873.png')
  })

  it('uses a versioned token subpath when version is provided', () => {
    const storage = new SearingStorageService({ bucketName: 'bucket', prefix: 'seared' })

    expect(storage.objectNameForToken(5873, { version: 'tx-abc123-log-7' })).toBe(
      'seared/5873/tx-abc123-log-7.png'
    )
  })

  it('encodes public object URLs by path segment', () => {
    const storage = new SearingStorageService({ bucketName: 'bucket name', prefix: '' })

    expect(storage.publicUrlForObject('5873/tx abc-log-7.png')).toBe(
      'https://storage.googleapis.com/bucket name/5873/tx%20abc-log-7.png'
    )
  })
})
