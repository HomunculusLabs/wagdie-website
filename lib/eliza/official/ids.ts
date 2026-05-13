import { createHash, randomUUID } from 'crypto'

const WAGDIE_OFFICIAL_NAMESPACE = '6b69d0b1-47f8-4ce7-9f4b-wagdieelizaos'

function bytesToUuid(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

export function createDeterministicOfficialUuid(scope: string, value: string): string {
  const hash = createHash('sha1')
    .update(WAGDIE_OFFICIAL_NAMESPACE)
    .update(':')
    .update(scope)
    .update(':')
    .update(value)
    .digest()

  return bytesToUuid(new Uint8Array(hash.subarray(0, 16)))
}

export function createOfficialAgentId(externalId?: string | null): string {
  if (externalId && externalId.trim()) {
    return createDeterministicOfficialUuid('agent', externalId.trim())
  }

  return randomUUID()
}

export function createOfficialWalletUserId(address: string): string {
  return createDeterministicOfficialUuid('wallet-user', address.trim().toLowerCase())
}

export function createOfficialServiceUserId(value = 'wagdie-service-user'): string {
  return createDeterministicOfficialUuid('user', value)
}

export function normalizeOfficialLocationId(locationId: string): string {
  const normalized = locationId.trim().toLowerCase()

  if (!normalized) {
    throw new Error('Location id is required for official ElizaOS room ids')
  }

  return normalized
}

export function createOfficialLocationRoomId(locationId: string): string {
  return createDeterministicOfficialUuid(
    'location-room',
    normalizeOfficialLocationId(locationId)
  )
}

export function createOfficialLocationWorldId(locationId: string): string {
  return createDeterministicOfficialUuid(
    'location-world',
    normalizeOfficialLocationId(locationId)
  )
}

export function createOfficialLocationServiceUserId(locationId: string): string {
  return createDeterministicOfficialUuid(
    'location-service-user',
    normalizeOfficialLocationId(locationId)
  )
}
