/**
 * Batch Upsert Utility
 * Processes database writes in configurable chunks for improved performance
 * Feature: 021-indexer-fixes
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_BATCH_SIZE = 100

export interface BatchUpsertOptions {
  /** Supabase client to use (or will create one from env vars) */
  client?: SupabaseClient
  /** Chunk size for batch operations (default: 100) */
  batchSize?: number
  /** Column(s) to use for conflict resolution */
  onConflict: string
  /** Whether to continue on batch error (default: true) */
  continueOnError?: boolean
}

export interface BatchUpsertResult {
  /** Total records successfully inserted/updated */
  totalInserted: number
  /** Total records that failed */
  totalFailed: number
  /** Number of batches processed */
  batchCount: number
  /** Errors encountered during processing */
  errors: Array<{ batchIndex: number; error: string; recordCount: number }>
}

function log(message: string): void {
  console.log(`[${new Date().toISOString()}] [batch-upsert] ${message}`)
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

let defaultClient: SupabaseClient | null = null

function getDefaultClient(): SupabaseClient {
  if (!defaultClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
      )
    }

    defaultClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return defaultClient
}

/**
 * Batch upsert records to a Supabase table
 *
 * @param tableName - The table to upsert into
 * @param records - Array of records to upsert
 * @param options - Upsert options including conflict resolution
 * @returns Result object with success/failure counts
 */
export async function batchUpsert<T extends Record<string, unknown>>(
  tableName: string,
  records: T[],
  options: BatchUpsertOptions
): Promise<BatchUpsertResult> {
  if (!records || records.length === 0) {
    return { totalInserted: 0, totalFailed: 0, batchCount: 0, errors: [] }
  }

  const client = options.client ?? getDefaultClient()
  const batchSize = options.batchSize ?? DEFAULT_BATCH_SIZE
  const continueOnError = options.continueOnError ?? true

  const chunks = chunkArray(records, batchSize)
  let totalInserted = 0
  let totalFailed = 0
  const errors: BatchUpsertResult['errors'] = []

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const startTime = Date.now()

    try {
      const { error, count } = await client
        .from(tableName)
        .upsert(chunk, {
          onConflict: options.onConflict,
          count: 'exact'
        })

      const duration = Date.now() - startTime

      if (error) {
        log(`Batch ${i + 1}/${chunks.length} failed (${chunk.length} records): ${error.message}`)
        errors.push({ batchIndex: i, error: error.message, recordCount: chunk.length })
        totalFailed += chunk.length

        if (!continueOnError) {
          throw new Error(`Batch ${i + 1} failed: ${error.message}`)
        }
      } else {
        const inserted = count ?? chunk.length
        totalInserted += inserted
        log(`Batch ${i + 1}/${chunks.length}: ${inserted} records in ${duration}ms`)
      }
    } catch (err) {
      const duration = Date.now() - startTime
      const message = err instanceof Error ? err.message : String(err)

      log(`Batch ${i + 1}/${chunks.length} error after ${duration}ms: ${message}`)
      errors.push({ batchIndex: i, error: message, recordCount: chunk.length })
      totalFailed += chunk.length

      if (!continueOnError) {
        throw err
      }
    }
  }

  // Summary log
  if (chunks.length > 1) {
    log(`Batch upsert complete: ${totalInserted} inserted, ${totalFailed} failed across ${chunks.length} batches`)
  }

  return {
    totalInserted,
    totalFailed,
    batchCount: chunks.length,
    errors,
  }
}
