import 'dotenv/config'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type CharacterRow = {
  token_id: number
  image_url?: string | null
  metadata?: Record<string, unknown> | null
}

type ImportSummary = {
  scanned: number
  downloaded: number
  imageUpdated: number
  metadataUpdated: number
  skipped: number
  failed: number
}

const bucket = process.env.GCS_BUCKET_NAME || process.env.GCS_BUCKET || 'seared-wagdie-images'
const prefix = (process.env.GCS_PREFIX || '').replace(/^\/+|\/+$/g, '')
const downloadDir = process.env.GCS_DOWNLOAD_DIR || path.join(process.cwd(), 'public/images/characters')
const tableName =
  process.env.CHARACTERS_TABLE ||
  process.env.NEXT_PUBLIC_CHARACTERS_TABLE ||
  'wagdie_characters'
const pageSize = Number(process.env.GCS_IMPORT_PAGE_SIZE || 500)
const concurrency = Number(process.env.GCS_IMPORT_CONCURRENCY || 8)
const importLimit = Number(process.env.GCS_IMPORT_LIMIT || 0)
const dryRun = toBoolean(process.env.DRY_RUN)
const onlyMissing = toBoolean(process.env.GCS_ONLY_MISSING)
const importSidecarMetadata = toBoolean(process.env.GCS_IMPORT_SIDECAR_METADATA, true)
const exts = (process.env.GCS_IMAGE_EXTENSIONS || 'png,jpg,jpeg,webp,gif')
  .split(',')
  .map((value) => value.trim().replace(/^\./, ''))
  .filter(Boolean)

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
}

if (!serviceRoleKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let hasImageUrlColumn = true

function toBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value == null || value === '') return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function bucketObjectPath(fileName: string): string {
  return prefix ? `${prefix}/${fileName}` : fileName
}

function bucketUrl(fileName: string): string {
  const objectPath = bucketObjectPath(fileName)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `https://storage.googleapis.com/${bucket}/${objectPath}`
}

function isBucketUrl(value: unknown): value is string {
  return typeof value === 'string' && value.includes(`storage.googleapis.com/${bucket}/`)
}

function getMetadataImage(metadata: Record<string, unknown> | null | undefined): string | null {
  const image = metadata?.image
  return typeof image === 'string' && image.trim() ? image : null
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' })
    if (head.ok) return true
    if (head.status !== 405) return false

    const partial = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-0' },
    })

    return partial.ok || partial.status === 206
  } catch {
    return false
  }
}

async function findImageUrl(tokenId: number, row: CharacterRow): Promise<string | null> {
  const candidates = new Set<string>()

  if (isBucketUrl(row.image_url)) candidates.add(row.image_url)

  const metadataImage = getMetadataImage(row.metadata)
  if (isBucketUrl(metadataImage)) candidates.add(metadataImage)

  for (const ext of exts) {
    candidates.add(bucketUrl(`${tokenId}.${ext}`))
  }

  for (const candidate of candidates) {
    if (await urlExists(candidate)) return candidate
  }

  return null
}

async function findSidecarMetadata(tokenId: number): Promise<Record<string, unknown> | null> {
  const url = bucketUrl(`${tokenId}.json`)

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const json = (await response.json()) as unknown
    return json && typeof json === 'object' && !Array.isArray(json)
      ? (json as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

async function downloadImage(url: string, tokenId: number): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Download failed with ${response.status} ${response.statusText}`)
  }

  const ext = path.extname(new URL(url).pathname) || '.png'
  const filePath = path.join(downloadDir, `${tokenId}${ext}`)
  const bytes = Buffer.from(await response.arrayBuffer())

  await mkdir(downloadDir, { recursive: true })
  await writeFile(filePath, bytes)

  return filePath
}

function mergeMetadata(
  existingMetadata: Record<string, unknown> | null | undefined,
  sidecarMetadata: Record<string, unknown> | null,
  imageUrl: string | null,
  localPath: string | null
): Record<string, unknown> {
  const merged: Record<string, unknown> = {
    ...(existingMetadata || {}),
    ...(sidecarMetadata || {}),
  }

  if (imageUrl) {
    merged.image = imageUrl
  }

  merged.asset_import = {
    ...((typeof merged.asset_import === 'object' && merged.asset_import && !Array.isArray(merged.asset_import)
      ? (merged.asset_import as Record<string, unknown>)
      : {})),
    source: 'gcs',
    bucket,
    prefix: prefix || null,
    imported_at: new Date().toISOString(),
    local_path: localPath,
    image_url: imageUrl,
  }

  return merged
}

function metadataChanged(before: Record<string, unknown> | null | undefined, after: Record<string, unknown>): boolean {
  return JSON.stringify(before || {}) !== JSON.stringify(after)
}

async function loadCharacters(): Promise<CharacterRow[]> {
  const rows: CharacterRow[] = []
  let from = 0

  while (true) {
    let selectColumns = hasImageUrlColumn ? 'token_id, image_url, metadata' : 'token_id, metadata'
    let query = supabase
      .from(tableName)
      .select(selectColumns)
      .order('token_id', { ascending: true })
      .range(from, from + pageSize - 1)

    if (onlyMissing && hasImageUrlColumn) {
      query = query.or('image_url.is.null,metadata->>image.is.null')
    }

    const { data, error } = await query

    if (error) {
      if (hasImageUrlColumn && error.message.includes('image_url')) {
        hasImageUrlColumn = false
        continue
      }
      throw new Error(`Failed to read ${tableName}: ${error.message}`)
    }

    const page = ((data || []) as unknown) as CharacterRow[]
    if (page.length === 0) break

    rows.push(...page)
    from += page.length

    if (page.length < pageSize) break
  }

  const filtered = onlyMissing
    ? rows.filter((row) => !row.image_url && !getMetadataImage(row.metadata))
    : rows

  return importLimit > 0 ? filtered.slice(0, importLimit) : filtered
}

async function updateCharacter(tokenId: number, updates: Partial<CharacterRow>): Promise<void> {
  const safeUpdates = { ...updates }

  if (!hasImageUrlColumn) {
    delete safeUpdates.image_url
  }

  const { error } = await supabase.from(tableName).update(safeUpdates).eq('token_id', tokenId)
  if (error) {
    if (hasImageUrlColumn && error.message.includes('image_url')) {
      hasImageUrlColumn = false
      delete safeUpdates.image_url
      const retry = await supabase.from(tableName).update(safeUpdates).eq('token_id', tokenId)
      if (!retry.error) return
      throw new Error(`DB update failed for token ${tokenId}: ${retry.error.message}`)
    }

    throw new Error(`DB update failed for token ${tokenId}: ${error.message}`)
  }
}

async function mapWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let index = 0

  async function run(): Promise<void> {
    while (true) {
      const current = index
      index += 1
      if (current >= items.length) return
      await worker(items[current])
    }
  }

  await Promise.all(Array.from({ length: Math.max(1, limit) }, () => run()))
}

async function main(): Promise<void> {
  console.log(`📦 Bucket: ${bucket}${prefix ? `/${prefix}` : ''}`)
  console.log(`🗂  Table: ${tableName}`)
  console.log(`📁 Download dir: ${downloadDir}`)
  console.log(`🧪 Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log(`🔎 Only missing: ${onlyMissing ? 'yes' : 'no'}`)
  console.log(`🔢 Limit: ${importLimit > 0 ? importLimit : 'all'}`)

  const rows = await loadCharacters()
  console.log(`Found ${rows.length} character rows to inspect`)

  const summary: ImportSummary = {
    scanned: 0,
    downloaded: 0,
    imageUpdated: 0,
    metadataUpdated: 0,
    skipped: 0,
    failed: 0,
  }

  await mapWithConcurrency(rows, concurrency, async (row) => {
    summary.scanned += 1

    try {
      const imageUrl = await findImageUrl(row.token_id, row)
      const sidecarMetadata = importSidecarMetadata ? await findSidecarMetadata(row.token_id) : null

      if (!imageUrl && !sidecarMetadata) {
        summary.skipped += 1
        return
      }

      let localPath: string | null = null
      if (imageUrl && !dryRun) {
        localPath = await downloadImage(imageUrl, row.token_id)
        summary.downloaded += 1
      } else if (imageUrl) {
        localPath = path.join(downloadDir, `${row.token_id}${path.extname(new URL(imageUrl).pathname) || '.png'}`)
      }

      const nextMetadata = mergeMetadata(row.metadata || null, sidecarMetadata, imageUrl, localPath)
      const updates: Partial<CharacterRow> = {}

      if (imageUrl && row.image_url !== imageUrl) {
        updates.image_url = imageUrl
      }

      if (sidecarMetadata || imageUrl) {
        if (metadataChanged(row.metadata || null, nextMetadata)) {
          updates.metadata = nextMetadata
        }
      }

      if (Object.keys(updates).length === 0) {
        summary.skipped += 1
        return
      }

      if (!dryRun) {
        await updateCharacter(row.token_id, updates)
      }

      if (updates.image_url) summary.imageUpdated += 1
      if (updates.metadata) summary.metadataUpdated += 1

      console.log(
        `${dryRun ? '[dry-run] ' : ''}token ${row.token_id}:` +
          ` image=${updates.image_url ? 'updated' : 'unchanged'}` +
          ` metadata=${updates.metadata ? 'updated' : 'unchanged'}` +
          ` local=${localPath || 'n/a'}`
      )
    } catch (error) {
      summary.failed += 1
      console.error(`token ${row.token_id}:`, error instanceof Error ? error.message : error)
    }
  })

  console.log('\nImport summary')
  console.table(summary)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
