import type {
  ConcordSearingMap,
  ConcordSearingMapQuery,
  ConcordSearingMapResult,
  ConcordSearingMapUpsert,
} from '@/lib/domain/searing'
import {
  concordSearingMapRepository,
  type ConcordSearingMapRepository,
} from '@/lib/repositories/concord-searing-map-repository'

export class ConcordSearingMapService {
  constructor(private repository: ConcordSearingMapRepository = concordSearingMapRepository) {}

  async getSearingMap(options: ConcordSearingMapQuery): Promise<ConcordSearingMapResult> {
    return this.repository.findMany(options)
  }

  async importSearingMap(entries: ConcordSearingMapUpsert[]): Promise<number> {
    return this.repository.upsertMany(entries)
  }

  async upsertSearingMap(entry: ConcordSearingMapUpsert): Promise<ConcordSearingMap> {
    return this.repository.upsertOne(entry)
  }

  async deleteSearingMap(concordTokenId: number): Promise<void> {
    return this.repository.deleteOne(concordTokenId)
  }
}

export const concordSearingMapService = new ConcordSearingMapService()
