export type ConcordSearingVariantKey =
  | 'alt_1'
  | 'alt_2'
  | 'alt_3'
  | 'alt_4'
  | 'alt_5'
  | 'alt_6'

export const CONCORD_SEARING_VARIANT_KEYS: ConcordSearingVariantKey[] = [
  'alt_1',
  'alt_2',
  'alt_3',
  'alt_4',
  'alt_5',
  'alt_6',
]

export type ConcordSearingVariant = {
  location?: string
  new_trait?: string
  makesBald?: boolean
  traits?: unknown[]
  trait?: unknown[]
  [key: string]: unknown
}

export type ConcordSearingMap = {
  token_name: string
  location: string
  new_trait: string
  makesBald: boolean
  tokenId: string
  concordTokenId: number
  alt_1?: ConcordSearingVariant | null
  alt_2?: ConcordSearingVariant | null
  alt_3?: ConcordSearingVariant | null
  alt_4?: ConcordSearingVariant | null
  alt_5?: ConcordSearingVariant | null
  alt_6?: ConcordSearingVariant | null
}

export type ConcordSearingMapRow = {
  id: string
  concord_token_id: number
  token_name: string
  location: string
  new_trait: string
  makes_bald: boolean
  alt_1: ConcordSearingVariant | null
  alt_2: ConcordSearingVariant | null
  alt_3: ConcordSearingVariant | null
  alt_4: ConcordSearingVariant | null
  alt_5: ConcordSearingVariant | null
  alt_6: ConcordSearingVariant | null
  raw_data: Record<string, unknown>
  source: string
  imported_at: string | null
  created_at: string
  updated_at: string
}

export type ConcordSearingMapUpsert = {
  concord_token_id: number
  token_name: string
  location?: string
  new_trait?: string
  makes_bald?: boolean
  alt_1?: ConcordSearingVariant | null
  alt_2?: ConcordSearingVariant | null
  alt_3?: ConcordSearingVariant | null
  alt_4?: ConcordSearingVariant | null
  alt_5?: ConcordSearingVariant | null
  alt_6?: ConcordSearingVariant | null
  raw_data?: Record<string, unknown>
  source?: string
  imported_at?: string | null
}

export type ConcordSearingMapQuery = {
  concordTokenIds?: number[]
  tokenName?: string
  limit: number
  offset: number
}

export type ConcordSearingMapResult = {
  entries: ConcordSearingMap[]
  total: number
}

export function toConcordSearingMap(row: ConcordSearingMapRow): ConcordSearingMap {
  return {
    token_name: row.token_name,
    location: row.location,
    new_trait: row.new_trait,
    makesBald: row.makes_bald,
    tokenId: String(row.concord_token_id),
    concordTokenId: row.concord_token_id,
    alt_1: row.alt_1,
    alt_2: row.alt_2,
    alt_3: row.alt_3,
    alt_4: row.alt_4,
    alt_5: row.alt_5,
    alt_6: row.alt_6,
  }
}
