import {
  createDeterministicOfficialUuid,
  createOfficialLocationRoomId,
  createOfficialLocationServiceUserId,
  createOfficialLocationWorldId,
  normalizeOfficialLocationId,
} from '@/lib/eliza/official/ids'

const UUID_V5_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('official elizaOS location ids', () => {
  it('normalizes map location ids before deriving official ids', () => {
    expect(normalizeOfficialLocationId('  Concord_Searing  ')).toBe('concord_searing')
  })

  it('requires a non-empty location id', () => {
    expect(() => normalizeOfficialLocationId('   ')).toThrow('Location id is required')
  })

  it('derives deterministic room, world, and service-user UUIDs from location id', () => {
    const locationId = '  Concord_Searing  '
    const expectedRoomId = createDeterministicOfficialUuid('location-room', 'concord_searing')
    const expectedWorldId = createDeterministicOfficialUuid('location-world', 'concord_searing')
    const expectedServiceUserId = createDeterministicOfficialUuid(
      'location-service-user',
      'concord_searing'
    )

    expect(createOfficialLocationRoomId(locationId)).toBe(expectedRoomId)
    expect(createOfficialLocationRoomId(locationId)).toMatch(UUID_V5_PATTERN)
    expect(createOfficialLocationWorldId(locationId)).toBe(expectedWorldId)
    expect(createOfficialLocationServiceUserId(locationId)).toBe(expectedServiceUserId)

    expect(new Set([expectedRoomId, expectedWorldId, expectedServiceUserId]).size).toBe(3)
  })
})
