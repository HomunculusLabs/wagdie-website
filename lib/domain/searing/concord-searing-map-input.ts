import type { ConcordSearingMapUpsert, ConcordSearingVariant, ConcordSearingVariantKey } from './concord-searing-map'
import { CONCORD_SEARING_VARIANT_KEYS } from './concord-searing-map'

type JsonRecord = Record<string, unknown>

export type SearingMapParseResult =
  | { entry: ConcordSearingMapUpsert; error?: never }
  | { entry?: never; error: string }

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
}

function readString(input: JsonRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string') return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return undefined
}

function readBoolean(input: JsonRecord, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase()
      if (normalized === 'true') return true
      if (normalized === 'false') return false
    }
  }
  return undefined
}

function readConcordTokenId(input: JsonRecord, fallback?: number): number | null {
  const value = input.concordTokenId ?? input.concord_token_id ?? input.tokenId ?? fallback
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

function readVariant(value: unknown): ConcordSearingVariant | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  return asRecord(value) as ConcordSearingVariant | null
}

export function parseConcordSearingMapUpsert(
  input: unknown,
  fallbackConcordTokenId?: number
): SearingMapParseResult {
  const record = asRecord(input)
  if (!record) return { error: 'Invalid JSON body' }

  const concordTokenId = readConcordTokenId(record, fallbackConcordTokenId)
  if (concordTokenId === null) return { error: 'Concord token ID must be a positive integer' }

  const tokenName = readString(record, 'token_name', 'tokenName', 'name')
  if (!tokenName) return { error: 'Token name is required' }

  const entry: ConcordSearingMapUpsert = {
    concord_token_id: concordTokenId,
    token_name: tokenName,
    location: readString(record, 'location') ?? '',
    new_trait: readString(record, 'new_trait', 'newTrait') ?? '',
    makes_bald: readBoolean(record, 'makes_bald', 'makesBald') ?? false,
    source: readString(record, 'source') ?? 'admin-web-editor',
    imported_at: new Date().toISOString(),
    raw_data: asRecord(record.raw_data) ?? asRecord(record.rawData) ?? { source: 'admin-web-editor' },
  }

  for (const key of CONCORD_SEARING_VARIANT_KEYS) {
    const variant = readVariant(record[key])
    if (variant !== undefined) {
      entry[key as ConcordSearingVariantKey] = variant
    }
  }

  return { entry }
}
