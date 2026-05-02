import { supabase, getSupabaseAdmin } from '@/lib/supabase'
import type {
  ConcordSearingMap,
  ConcordSearingMapQuery,
  ConcordSearingMapResult,
  ConcordSearingMapRow,
  ConcordSearingMapUpsert,
} from '@/lib/domain/searing'
import { toConcordSearingMap } from '@/lib/domain/searing'

export class ConcordSearingMapRepository {
  async findMany(options: ConcordSearingMapQuery): Promise<ConcordSearingMapResult> {
    const client = supabase
    if (!client) {
      throw new Error('Supabase client not configured')
    }

    let query = client
      .from('concord_searing_maps')
      .select('*', { count: 'exact' })
      .order('concord_token_id', { ascending: true })
      .range(options.offset, options.offset + options.limit - 1)

    if (options.concordTokenIds && options.concordTokenIds.length > 0) {
      query = query.in('concord_token_id', options.concordTokenIds)
    }

    if (options.tokenName) {
      query = query.eq('token_name', options.tokenName)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch concord searing map:', error)
      throw new Error(`Failed to fetch concord searing map: ${error.message}`)
    }

    const rows = (data || []) as ConcordSearingMapRow[]
    return {
      entries: rows.map(toConcordSearingMap),
      total: count || 0,
    }
  }

  async upsertMany(entries: ConcordSearingMapUpsert[]): Promise<number> {
    if (entries.length === 0) return 0

    const client = getSupabaseAdmin()
    if (!client) {
      throw new Error('Supabase admin client not configured')
    }

    const table = client.from('concord_searing_maps') as unknown as {
      upsert: (
        values: ConcordSearingMapUpsert[],
        options: { onConflict: string }
      ) => Promise<{ error: { message: string } | null }>
    }

    const { error } = await table.upsert(entries, { onConflict: 'concord_token_id' })

    if (error) {
      console.error('Failed to upsert concord searing map:', error)
      throw new Error(`Failed to upsert concord searing map: ${error.message}`)
    }

    return entries.length
  }

  async upsertOne(entry: ConcordSearingMapUpsert): Promise<ConcordSearingMap> {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new Error('Supabase admin client not configured')
    }

    const table = client.from('concord_searing_maps') as unknown as {
      upsert: (
        value: ConcordSearingMapUpsert,
        options: { onConflict: string }
      ) => {
        select: (columns: string) => {
          single: () => Promise<{ data: ConcordSearingMapRow | null; error: { message: string } | null }>
        }
      }
    }

    const { data, error } = await table
      .upsert(entry, { onConflict: 'concord_token_id' })
      .select('*')
      .single()

    if (error) {
      console.error('Failed to upsert concord searing map:', error)
      throw new Error(`Failed to upsert concord searing map: ${error.message}`)
    }

    if (!data) {
      throw new Error('Failed to upsert concord searing map: no row returned')
    }

    return toConcordSearingMap(data)
  }

  async deleteOne(concordTokenId: number): Promise<void> {
    const client = getSupabaseAdmin()
    if (!client) {
      throw new Error('Supabase admin client not configured')
    }

    const table = client.from('concord_searing_maps') as unknown as {
      delete: () => {
        eq: (column: string, value: number) => Promise<{ error: { message: string } | null }>
      }
    }

    const { error } = await table.delete().eq('concord_token_id', concordTokenId)

    if (error) {
      console.error('Failed to delete concord searing map:', error)
      throw new Error(`Failed to delete concord searing map: ${error.message}`)
    }
  }
}

export const concordSearingMapRepository = new ConcordSearingMapRepository()
