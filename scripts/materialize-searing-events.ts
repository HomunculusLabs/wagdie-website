import 'dotenv/config'

import { searingMaterializationService } from '../lib/services/searing-materialization-service'

function toBoolean(value: string | undefined, defaultValue = false): boolean {
  if (value == null || value === '') return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
}

function parsePositiveInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive integer, got ${value}`)
  }
  return parsed
}

function parseTokenIds(value: string | undefined): number[] | undefined {
  if (!value) return undefined

  const parts = value.split(',').map((part) => part.trim())
  if (parts.length === 0 || parts.some((part) => part.length === 0)) {
    throw new Error('SEARING_MATERIALIZE_TOKEN_IDS must be a comma-separated list of positive integers')
  }

  const tokenIds = parts.map((part) => Number(part))
  if (tokenIds.some((tokenId) => !Number.isInteger(tokenId) || tokenId <= 0)) {
    throw new Error('SEARING_MATERIALIZE_TOKEN_IDS must be a comma-separated list of positive integers')
  }

  return [...new Set(tokenIds)]
}

async function main(): Promise<void> {
  const batchSize = parsePositiveInt(process.env.SEARING_MATERIALIZE_BATCH_SIZE, 10)
  const maxEvents = parsePositiveInt(process.env.SEARING_MATERIALIZE_MAX_EVENTS, 100)
  const includeFailed = toBoolean(process.env.SEARING_MATERIALIZE_RETRY_FAILED, false)
  const once = toBoolean(process.env.SEARING_MATERIALIZE_ONCE, false)
  const tokenIds = parseTokenIds(process.env.SEARING_MATERIALIZE_TOKEN_IDS)

  let processed = 0
  let batchNumber = 0

  console.log('Starting searing materialization backfill')
  console.log(JSON.stringify({ batchSize, maxEvents, includeFailed, once, tokenIds }, null, 2))

  while (processed < maxEvents) {
    batchNumber += 1
    const remaining = maxEvents - processed
    const limit = Math.min(batchSize, remaining)

    const results = await searingMaterializationService.materializePendingBatch({
      limit,
      includeFailed,
      retryFailed: includeFailed,
      tokenIds,
    })

    if (results.length === 0) {
      console.log('No pending searing events found')
      break
    }

    processed += results.length
    console.log(`Batch ${batchNumber}: ${results.length} events`)
    console.table(results.map((result) => ({
      eventId: result.eventId,
      tokenId: result.tokenId,
      concordId: result.concordId,
      status: result.status,
      imageUrl: result.imageUrl || '',
      error: result.error || result.reason || '',
    })))

    if (once) break
  }

  console.log(`Searing materialization backfill complete: processed ${processed} event(s)`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
