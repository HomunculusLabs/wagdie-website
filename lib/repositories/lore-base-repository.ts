/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSupabaseAdmin } from '../supabase';
import {
  createLoreBaseDataset,
  type LoreBaseDataset,
} from '../lore/base-dataset';
import type {
  Canonization,
  LoreCharacter,
  LoreEntityRef,
  LoreEvent,
  LoreEventKind,
  LoreLocation,
  LoreMedia,
  LoreSeason,
  SourceKind,
  SourceRecord,
} from '../lore/types';

export interface LoreBaseRepositoryLike {
  loadPublishedDataset: () => Promise<LoreBaseDataset>;
}

type SupabaseError = { message: string };
type UntypedQuery = Record<string, any>;
type UntypedSupabaseClient = { from: (table: string) => UntypedQuery };

interface LoreSeasonRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  sort_order: number;
}

interface LoreMediaRow {
  id: string;
  kind: string;
  title: string;
  url: string | null;
  archived_url: string | null;
  alt: string | null;
  attribution: string;
}

interface LoreSourceRow {
  id: string;
  kind: string;
  title: string;
  url: string | null;
  archived_url: string | null;
  author: string | null;
  platform: string | null;
  published_at: string | null;
  captured_at: string | null;
  attribution: string;
  preservation_note: string | null;
  media_ids: string[] | null;
}

interface LoreLocationRow {
  id: string;
  slug: string;
  name: string;
  aliases: string[] | null;
  summary: string;
  description: string | null;
  image_id: string | null;
  source_ids: string[] | null;
  tags: string[] | null;
}

interface LoreCharacterRow {
  id: string;
  slug: string;
  name: string;
  aliases: string[] | null;
  summary: string;
  token_id: number | null;
  image_url: string | null;
  external_url: string | null;
  origin: string | null;
  character_class: string | null;
  alignment: string | null;
  level: number | null;
  image_id: string | null;
  first_appearance_event_id: string | null;
  tags: string[] | null;
}

interface LoreEventRow {
  id: string;
  slug: string;
  kind: string;
  title: string;
  summary: string;
  body: string;
  season_id: string | null;
  location_ids: string[] | null;
  character_ids: string[] | null;
  entity_refs: unknown;
  occurred_at: string | null;
  published_at: string | null;
  timeline_order: number;
  canon: unknown;
  source_ids: string[] | null;
  media_ids: string[] | null;
  tags: string[] | null;
  keywords: string[] | null;
}

interface TableFetchOptions {
  publishedOnly?: boolean;
  order?: { column: string; ascending?: boolean };
}

const getDefaultClient = (): UntypedSupabaseClient => {
  const client = getSupabaseAdmin();
  if (!client) {
    throw new Error('Supabase admin client not configured');
  }

  return client as unknown as UntypedSupabaseClient;
};

const normalizeArray = <T>(value: T[] | null | undefined): T[] => {
  return Array.isArray(value) ? value : [];
};

const normalizeOptionalArray = <T>(value: T[] | null | undefined): T[] | undefined => {
  return Array.isArray(value) ? value : undefined;
};

const defined = <T>(value: T | null | undefined): T | undefined => value ?? undefined;

const normalizeEntityRefs = (value: unknown): LoreEntityRef[] => {
  return Array.isArray(value) ? value as LoreEntityRef[] : [];
};

const toSeason = (row: LoreSeasonRow): LoreSeason => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  order: row.sort_order,
});

const toMedia = (row: LoreMediaRow): LoreMedia => ({
  id: row.id,
  kind: row.kind as LoreMedia['kind'],
  title: row.title,
  url: defined(row.url),
  archivedUrl: defined(row.archived_url),
  alt: defined(row.alt),
  attribution: row.attribution,
});

const toSource = (row: LoreSourceRow): SourceRecord => ({
  id: row.id,
  kind: row.kind as SourceKind,
  title: row.title,
  url: defined(row.url),
  archivedUrl: defined(row.archived_url),
  author: defined(row.author),
  platform: defined(row.platform),
  publishedAt: defined(row.published_at),
  capturedAt: defined(row.captured_at),
  attribution: row.attribution,
  preservationNote: defined(row.preservation_note),
  mediaIds: normalizeOptionalArray(row.media_ids),
});

const toLocation = (row: LoreLocationRow): LoreLocation => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  aliases: normalizeArray(row.aliases),
  summary: row.summary,
  description: defined(row.description),
  imageId: defined(row.image_id),
  sourceIds: normalizeOptionalArray(row.source_ids),
  tags: normalizeArray(row.tags),
});

const toCharacter = (row: LoreCharacterRow): LoreCharacter => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  aliases: normalizeArray(row.aliases),
  summary: row.summary,
  tokenId: defined(row.token_id),
  imageUrl: defined(row.image_url),
  externalUrl: defined(row.external_url),
  origin: defined(row.origin),
  characterClass: defined(row.character_class),
  alignment: defined(row.alignment),
  level: defined(row.level),
  imageId: defined(row.image_id),
  firstAppearanceEventId: defined(row.first_appearance_event_id),
  tags: normalizeArray(row.tags),
});

const toEvent = (row: LoreEventRow): LoreEvent => ({
  id: row.id,
  slug: row.slug,
  kind: row.kind as LoreEventKind,
  title: row.title,
  summary: row.summary,
  body: row.body,
  seasonId: defined(row.season_id),
  locationIds: normalizeArray(row.location_ids),
  characterIds: normalizeArray(row.character_ids),
  entityRefs: normalizeEntityRefs(row.entity_refs),
  occurredAt: defined(row.occurred_at),
  publishedAt: defined(row.published_at),
  timelineOrder: row.timeline_order,
  canon: row.canon as Canonization,
  sourceIds: normalizeArray(row.source_ids),
  mediaIds: normalizeOptionalArray(row.media_ids),
  tags: normalizeArray(row.tags),
  keywords: normalizeArray(row.keywords),
});

function throwOnError(error: SupabaseError | null, context: string): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export class LoreBaseRepository implements LoreBaseRepositoryLike {
  constructor(private readonly getClient: () => UntypedSupabaseClient = getDefaultClient) {}

  private async fetchRows<T>(tableName: string, options: TableFetchOptions = {}): Promise<T[]> {
    let query = this.getClient().from(tableName).select('*');

    if (options.publishedOnly) {
      query = query.eq('is_published', true);
    }

    if (options.order) {
      query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
    }

    const { data, error } = await query;
    throwOnError(error, `Failed to fetch ${tableName}`);
    return (data ?? []) as T[];
  }

  async loadPublishedDataset(): Promise<LoreBaseDataset> {
    const [seasons, media, sources, locations, characters, events] = await Promise.all([
      this.fetchRows<LoreSeasonRow>('lore_seasons', { order: { column: 'sort_order' } }),
      this.fetchRows<LoreMediaRow>('lore_media', { order: { column: 'title' } }),
      this.fetchRows<LoreSourceRow>('lore_sources', { order: { column: 'title' } }),
      this.fetchRows<LoreLocationRow>('lore_locations', {
        publishedOnly: true,
        order: { column: 'name' },
      }),
      this.fetchRows<LoreCharacterRow>('lore_characters', {
        publishedOnly: true,
        order: { column: 'name' },
      }),
      this.fetchRows<LoreEventRow>('lore_events', {
        publishedOnly: true,
        order: { column: 'timeline_order' },
      }),
    ]);

    return createLoreBaseDataset({
      source: 'database',
      seasons: seasons.map(toSeason),
      media: media.map(toMedia),
      sources: sources.map(toSource),
      locations: locations.map(toLocation),
      characters: characters.map(toCharacter),
      events: events.map(toEvent),
    });
  }
}

export const loreBaseRepository = new LoreBaseRepository();
