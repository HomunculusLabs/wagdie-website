import 'dotenv/config'

import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type CharacterRow = {
  token_id: number
  metadata?: Record<string, unknown> | null
}

const tableName =
  process.env.CHARACTERS_TABLE ||
  process.env.NEXT_PUBLIC_CHARACTERS_TABLE ||
  'wagdie_characters'

const imageDir = process.env.LOCAL_IMAGE_DIR || path.join(process.cwd(), 'public/images/characters')
const publicPrefix = process.env.LOCAL_IMAGE_PUBLIC_PREFIX || '/images/characters'
const batchSize = Number(process.env.LOCAL_IMAGE_BATCH_SIZE || 200)
const dryRun = ['1', 'true', 'yes', 'on'].includes((process.env.DRY_RUN || '').toLowerCase())
const skipExisting = !['0', 'false', 'no', 'off'].includes((process.env.LOCAL_IMAGE_SKIP_EXISTING || 'true').toLowerCase())

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)')
if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function getLocalImageMap(): Promise<Map<number, string>> {
  const entries = await readdir(imageDir, { withFileTypes: true })
  const map = new Map<number, string>()

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name)
    const tokenId = Number(path.basename(entry.name, ext))
    if (!Number.isSafeInteger(tokenId) || tokenId <= 0) continue
    map.set(tokenId, `${publicPrefix}/${entry.name}`)
  }

  return map
}

async function loadRows(tokenIds: number[]): Promise<CharacterRow[]> {
  const rows: CharacterRow[] = []

  for (let i = 0; i < tokenIds.length; i += batchSize) {
    const batch = tokenIds.slice(i, i + batchSize)
    const { data, error } = await supabase
      .from(tableName)
      .select('token_id, metadata')
      .in('token_id', batch)

    if (error) {
      throw new Error(`Failed loading rows: ${error.message}`)
    }

    rows.push(...(((data || []) as unknown) as CharacterRow[]))
  }

  return rows
}

async function updateRow(tokenId: number, metadata: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from(tableName)
    .update({ metadata })
    .eq('token_id', tokenId)

  if (error) {
    throw new Error(`Failed updating token ${tokenId}: ${error.message}`)
  }
}

async function main(): Promise<void> {
  const imageMap = await getLocalImageMap()
  const tokenIds = Array.from(imageMap.keys()).sort((a, b) => a - b)

  console.log(`Found ${tokenIds.length} local images in ${imageDir}`)
  console.log(`DB table: ${tableName}`)
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log(`Skip existing DB images: ${skipExisting ? 'yes' : 'no'}`)

  const rows = await loadRows(tokenIds)
  const rowMap = new Map(rows.map((row) => [row.token_id, row]))

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const tokenId of tokenIds) {
    const row = rowMap.get(tokenId)
    if (!row) {
      skipped += 1
      continue
    }

    const localImage = imageMap.get(tokenId)
    if (!localImage) {
      skipped += 1
      continue
    }

    const metadata = { ...(row.metadata || {}) }
    const previousImage = typeof metadata.image === 'string' ? metadata.image : null

    if (previousImage === localImage) {
      skipped += 1
      continue
    }

    if (skipExisting && previousImage && previousImage.trim().length > 0) {
      skipped += 1
      continue
    }

    metadata.image = localImage
    metadata.asset_import = {
      ...((typeof metadata.asset_import === 'object' && metadata.asset_import && !Array.isArray(metadata.asset_import)
        ? (metadata.asset_import as Record<string, unknown>)
        : {})),
      source: 'local-static',
      local_path: localImage,
      imported_at: new Date().toISOString(),
      previous_image: previousImage,
    }

    try {
      if (!dryRun) {
        await updateRow(tokenId, metadata)
      }
      updated += 1
    } catch (error) {
      failed += 1
      console.error(error instanceof Error ? error.message : error)
    }
  }

  console.table({
    totalLocalImages: tokenIds.length,
    updated,
    skipped,
    failed,
  })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
