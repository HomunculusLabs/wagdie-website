import 'dotenv/config'

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

type ExtractedFile = {
  file: string
  token_id: number | null
  width: number | null
  height: number | null
  textEntries: Array<{
    chunkType: 'tEXt' | 'zTXt' | 'iTXt'
    keyword: string
    text: string
    compressed?: boolean
    languageTag?: string
    translatedKeyword?: string
  }>
}

type DbRow = {
  token_id: number
  name?: string | null
  metadata?: Record<string, unknown> | null
}

type ComparisonReport = {
  token_id: number
  extractedFile: string
  dbName: string | null
  dbImage: string | null
  textEntryKeywords: string[]
  extractedTitles: string[]
  usefulCharacterMatches: {
    matchesDbName: boolean
    matchesTokenId: boolean
    mentionsDbImage: boolean
    hasLikelyNftFields: boolean
  }
  rawTextPreview: string[]
}

const extractedDir = path.join(process.cwd(), 'data/gcs-bucket-dump/extracted-metadata')
const outputDir = path.join(process.cwd(), 'data/gcs-bucket-dump/comparison')

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8010'
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const tableName =
  process.env.CHARACTERS_TABLE ||
  process.env.NEXT_PUBLIC_CHARACTERS_TABLE ||
  'wagdie_characters'

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

function extractPotentialTitles(text: string): string[] {
  const titles: string[] = []
  const patterns = [
    /<rdf:li[^>]*>([^<]+)<\/rdf:li>/g,
    /<Iptc4xmpExt:ArtworkTitle>([^<]+)<\/Iptc4xmpExt:ArtworkTitle>/g,
    /<dc:title>[\s\S]*?<rdf:li[^>]*>([^<]+)<\/rdf:li>[\s\S]*?<\/dc:title>/g,
  ]

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const value = match[1]?.trim()
      if (value && !titles.includes(value)) titles.push(value)
    }
  }

  return titles
}

function hasLikelyNftFields(text: string): boolean {
  const lowered = text.toLowerCase()
  return ['tokenid', 'attributes', 'description', 'image', 'external_url', 'animation_url', 'trait_type'].some((field) => lowered.includes(field))
}

async function loadExtracted(): Promise<ExtractedFile[]> {
  const files = (await readdir(extractedDir))
    .filter((file) => /^\d+\.json$/.test(file))
    .sort((a, b) => Number(a.split('.')[0]) - Number(b.split('.')[0]))

  const result: ExtractedFile[] = []
  for (const file of files) {
    const content = await readFile(path.join(extractedDir, file), 'utf8')
    result.push(JSON.parse(content) as ExtractedFile)
  }
  return result
}

async function loadDbRows(tokenIds: number[]): Promise<Map<number, DbRow>> {
  const map = new Map<number, DbRow>()
  const { data, error } = await supabase
    .from(tableName)
    .select('token_id, name, metadata')
    .in('token_id', tokenIds)

  if (error) throw new Error(`Failed to load DB rows: ${error.message}`)

  for (const row of ((data || []) as unknown as DbRow[])) {
    map.set(row.token_id, row)
  }

  return map
}

async function main(): Promise<void> {
  await mkdir(outputDir, { recursive: true })

  const extracted = await loadExtracted()
  const tokenIds = extracted.map((entry) => entry.token_id).filter((id): id is number => Number.isSafeInteger(id))
  const dbRows = await loadDbRows(tokenIds)

  const reports: ComparisonReport[] = extracted.map((entry) => {
    const tokenId = entry.token_id ?? -1
    const dbRow = dbRows.get(tokenId)
    const dbName = typeof dbRow?.name === 'string' ? dbRow.name : typeof dbRow?.metadata?.name === 'string' ? String(dbRow?.metadata?.name) : null
    const dbImage = typeof dbRow?.metadata?.image === 'string' ? String(dbRow.metadata.image) : null

    const textEntryKeywords = entry.textEntries.map((item) => item.keyword)
    const extractedTitles = entry.textEntries.flatMap((item) => extractPotentialTitles(item.text))
    const rawTextPreview = entry.textEntries.map((item) => item.text.slice(0, 400))
    const combinedText = entry.textEntries.map((item) => item.text).join('\n')

    return {
      token_id: tokenId,
      extractedFile: entry.file,
      dbName,
      dbImage,
      textEntryKeywords,
      extractedTitles,
      usefulCharacterMatches: {
        matchesDbName: !!dbName && extractedTitles.some((title) => title.toLowerCase() === dbName.toLowerCase()),
        matchesTokenId: combinedText.includes(String(tokenId)),
        mentionsDbImage: !!dbImage && combinedText.includes(dbImage),
        hasLikelyNftFields: hasLikelyNftFields(combinedText),
      },
      rawTextPreview,
    }
  })

  const summary = {
    compared: reports.length,
    likelyUseful: reports.filter((report) => Object.values(report.usefulCharacterMatches).some(Boolean)).length,
    generatedAt: new Date().toISOString(),
  }

  await writeFile(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2))
  await writeFile(path.join(outputDir, 'comparison.json'), JSON.stringify(reports, null, 2))

  console.log(JSON.stringify(summary, null, 2))
  for (const report of reports) {
    console.log(`\nToken ${report.token_id}`)
    console.log(`  DB name: ${report.dbName ?? 'n/a'}`)
    console.log(`  Extracted titles: ${report.extractedTitles.join(' | ') || 'none'}`)
    console.log(`  Useful flags: ${JSON.stringify(report.usefulCharacterMatches)}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
