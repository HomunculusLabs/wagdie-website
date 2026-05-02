import 'dotenv/config'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type JsonRecord = Record<string, unknown>

type LegacySearingMapEntry = {
  token_name?: string
  tokenId?: string | number
  concordTokenId?: string | number
  location?: string
  new_trait?: string
  makesBald?: boolean
  default?: {
    location?: string
    new_trait?: string
    makesBald?: boolean
  }
  alt_1?: unknown
  alt_2?: unknown
  alt_3?: unknown
  alt_4?: unknown
  alt_5?: unknown
  alt_6?: unknown
  [key: string]: unknown
}

type ConcordSearingMapUpsert = {
  concord_token_id: number
  token_name: string
  location: string
  new_trait: string
  makes_bald: boolean
  alt_1: JsonRecord | null
  alt_2: JsonRecord | null
  alt_3: JsonRecord | null
  alt_4: JsonRecord | null
  alt_5: JsonRecord | null
  alt_6: JsonRecord | null
  raw_data: JsonRecord
  source: string
  imported_at: string
}

type ImportSummary = {
  scanned: number
  valid: number
  skipped: number
  imported: number
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY
const dryRun = toBoolean(process.env.DRY_RUN)
const batchSize = parseBatchSize(process.env.SEARING_MAP_IMPORT_BATCH_SIZE)

function createSupabaseServiceClient() {
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function toBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value == null || value === '') return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : null
}

function asOptionalRecord(value: unknown): JsonRecord | null {
  return asRecord(value)
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function asBoolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : false
}

function parseBatchSize(value: string | undefined): number {
  if (!value) return 500
  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) {
    throw new Error('SEARING_MAP_IMPORT_BATCH_SIZE must be a positive integer')
  }

  const parsed = Number(trimmed)
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error('SEARING_MAP_IMPORT_BATCH_SIZE must be a positive integer')
  }

  return parsed
}

function parseTokenId(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0 ? value : null
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!/^\d+$/.test(trimmed)) return null

  const parsed = Number(trimmed)
  return Number.isSafeInteger(parsed) ? parsed : null
}

function getArrayPayload(json: unknown): Array<LegacySearingMapEntry & { token_name?: string }> | null {
  if (Array.isArray(json)) {
    return json as Array<LegacySearingMapEntry & { token_name?: string }>
  }

  const root = asRecord(json)
  if (!root) return null

  for (const key of ['searingMap', 'searing_map', 'concords', 'entries', 'data']) {
    const value = root[key]
    if (Array.isArray(value)) {
      return value as Array<LegacySearingMapEntry & { token_name?: string }>
    }
  }

  return null
}

function getWrappedObjectPayload(json: unknown): Array<LegacySearingMapEntry & { token_name: string }> | null {
  const root = asRecord(json)
  if (!root) return null

  for (const key of ['searingMap', 'searing_map', 'concords', 'entries', 'data']) {
    const value = root[key]
    if (asRecord(value)) {
      return getObjectPayload(value)
    }
  }

  return null
}

function getObjectPayload(json: unknown): Array<LegacySearingMapEntry & { token_name: string }> | null {
  const root = asRecord(json)
  if (!root) return null

  const entries: Array<LegacySearingMapEntry & { token_name: string }> = []
  for (const [tokenName, value] of Object.entries(root)) {
    const record = asRecord(value)
    if (!record) continue
    entries.push({
      ...record,
      token_name: asString(record.token_name) || tokenName,
    })
  }

  return entries.length > 0 ? entries : null
}

function normalizePayload(json: unknown): Array<LegacySearingMapEntry & { token_name?: string }> {
  const arrayPayload = getArrayPayload(json)
  if (arrayPayload) return arrayPayload

  const wrappedObjectPayload = getWrappedObjectPayload(json)
  if (wrappedObjectPayload) return wrappedObjectPayload

  const objectPayload = getObjectPayload(json)
  if (objectPayload) return objectPayload

  throw new Error(
    'Unsupported searing-map JSON shape. Expected an array, an object with searingMap/entries/data, or an object keyed by token name.'
  )
}

function normalizeEntry(entry: LegacySearingMapEntry, importedAt: string): ConcordSearingMapUpsert | null {
  const tokenName = asString(entry.token_name).trim()
  const tokenId = parseTokenId(entry.concordTokenId ?? entry.tokenId)

  if (!tokenName || tokenId === null) {
    return null
  }

  const defaultMap = asRecord(entry.default)
  const location = asString(entry.location) || asString(defaultMap?.location)
  const newTrait = asString(entry.new_trait) || asString(defaultMap?.new_trait)
  const makesBald = typeof entry.makesBald === 'boolean'
    ? entry.makesBald
    : asBoolean(defaultMap?.makesBald)

  return {
    concord_token_id: tokenId,
    token_name: tokenName,
    location,
    new_trait: newTrait,
    makes_bald: makesBald,
    alt_1: asOptionalRecord(entry.alt_1),
    alt_2: asOptionalRecord(entry.alt_2),
    alt_3: asOptionalRecord(entry.alt_3),
    alt_4: asOptionalRecord(entry.alt_4),
    alt_5: asOptionalRecord(entry.alt_5),
    alt_6: asOptionalRecord(entry.alt_6),
    raw_data: entry as JsonRecord,
    source: 'legacy-firestore-json',
    imported_at: importedAt,
  }
}

async function upsertInBatches(entries: ConcordSearingMapUpsert[]): Promise<number> {
  const supabase = createSupabaseServiceClient()
  let imported = 0

  for (let index = 0; index < entries.length; index += batchSize) {
    const batch = entries.slice(index, index + batchSize)
    const { error } = await supabase
      .from('concord_searing_maps')
      .upsert(batch, { onConflict: 'concord_token_id' })

    if (error) {
      throw new Error(`Failed to import batch starting at ${index}: ${error.message}`)
    }

    imported += batch.length
  }

  return imported
}

async function main(): Promise<void> {
  const inputPath = process.argv[2] || process.env.SEARING_MAP_JSON
  if (!inputPath) {
    throw new Error('Usage: npx ts-node --project scripts/tsconfig.json scripts/import-concord-searing-map.ts <searing-map.json>')
  }

  const resolvedPath = path.resolve(process.cwd(), inputPath)
  const raw = await readFile(resolvedPath, 'utf8')
  const json = JSON.parse(raw) as unknown
  const payload = normalizePayload(json)
  const importedAt = new Date().toISOString()

  const summary: ImportSummary = {
    scanned: payload.length,
    valid: 0,
    skipped: 0,
    imported: 0,
  }

  const entries: ConcordSearingMapUpsert[] = []
  for (const entry of payload) {
    const normalized = normalizeEntry(entry, importedAt)
    if (!normalized) {
      summary.skipped += 1
      continue
    }

    summary.valid += 1
    entries.push(normalized)
  }

  console.log(`📄 Source: ${resolvedPath}`)
  console.log(`🧪 Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log(`🗂  Rows: ${summary.valid} valid, ${summary.skipped} skipped`)

  if (!dryRun) {
    summary.imported = await upsertInBatches(entries)
  }

  console.log('\nImport summary')
  console.table(summary)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
