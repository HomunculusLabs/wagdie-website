import type { ConcordSearingMap, ConcordSearingMapRow } from '../domain/searing/concord-searing-map'
import { toConcordSearingMap } from '../domain/searing/concord-searing-map'
import { getSupabaseAdmin } from '../supabase'

type SupabaseAdminClient = NonNullable<ReturnType<typeof getSupabaseAdmin>>

function requireAdminClient(): SupabaseAdminClient {
  const client = getSupabaseAdmin()
  if (!client) {
    throw new Error('Supabase admin client not configured')
  }
  return client
}

type UntypedQueryResult<T = unknown> = Promise<{
  data: T | null
  error: { message: string } | null
}>

type UntypedQueryBuilder = {
  select: (...args: unknown[]) => UntypedQueryBuilder
  eq: (...args: unknown[]) => UntypedQueryBuilder
  maybeSingle: () => UntypedQueryResult
}

function fromTable(client: SupabaseAdminClient, tableName: string): UntypedQueryBuilder {
  return client.from(tableName as never) as unknown as UntypedQueryBuilder
}

export class SearingMapMaterializationRepository {
  constructor(private readonly getClient: () => SupabaseAdminClient = requireAdminClient) {}

  async findByConcordTokenId(concordTokenId: number): Promise<ConcordSearingMap | null> {
    const { data, error } = await fromTable(this.getClient(), 'concord_searing_maps')
      .select('*')
      .eq('concord_token_id', concordTokenId)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to fetch searing map for concord ${concordTokenId}: ${error.message}`)
    }

    return data ? toConcordSearingMap(data as ConcordSearingMapRow) : null
  }
}

export const searingMapMaterializationRepository = new SearingMapMaterializationRepository()
