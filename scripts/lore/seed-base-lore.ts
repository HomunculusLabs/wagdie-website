import 'dotenv/config';

import { getStaticLoreBaseDataset, validateLoreBaseDataset } from '../../lib/lore/base-dataset';
import type { LoreBaseDataset } from '../../lib/lore/base-dataset';
import type { LoreCharacter, LoreEvent, LoreLocation, LoreMedia, LoreSeason, SourceRecord } from '../../lib/lore/types';

interface SupabaseError {
  message: string;
}

interface UntypedSupabaseClient {
  from: (table: string) => {
    upsert: (
      rows: Record<string, unknown>[],
      options: { onConflict: string },
    ) => {
      select: (columns: string) => Promise<{ data: unknown[] | null; error: SupabaseError | null }>;
    };
  };
}

interface SeedOptions {
  dryRun: boolean;
}

const optional = <T>(value: T | undefined): T | null => value ?? null;

const seasonRows = (seasons: LoreSeason[]): Record<string, unknown>[] => seasons.map((season) => ({
  id: season.id,
  slug: season.slug,
  title: season.title,
  summary: season.summary,
  sort_order: season.order,
}));

const mediaRows = (media: LoreMedia[]): Record<string, unknown>[] => media.map((item) => ({
  id: item.id,
  kind: item.kind,
  title: item.title,
  url: optional(item.url),
  archived_url: optional(item.archivedUrl),
  alt: optional(item.alt),
  attribution: item.attribution,
}));

const sourceRows = (sources: SourceRecord[]): Record<string, unknown>[] => sources.map((source) => ({
  id: source.id,
  kind: source.kind,
  title: source.title,
  url: optional(source.url),
  archived_url: optional(source.archivedUrl),
  author: optional(source.author),
  platform: optional(source.platform),
  published_at: optional(source.publishedAt),
  captured_at: optional(source.capturedAt),
  attribution: source.attribution,
  preservation_note: optional(source.preservationNote),
  media_ids: optional(source.mediaIds),
}));

const locationRows = (locations: LoreLocation[]): Record<string, unknown>[] => locations.map((location) => ({
  id: location.id,
  slug: location.slug,
  name: location.name,
  aliases: location.aliases,
  summary: location.summary,
  description: optional(location.description),
  image_id: optional(location.imageId),
  source_ids: optional(location.sourceIds),
  tags: location.tags,
  is_published: true,
}));

const characterRows = (characters: LoreCharacter[]): Record<string, unknown>[] => characters.map((character) => ({
  id: character.id,
  slug: character.slug,
  name: character.name,
  aliases: character.aliases,
  summary: character.summary,
  token_id: optional(character.tokenId),
  image_url: optional(character.imageUrl),
  external_url: optional(character.externalUrl),
  origin: optional(character.origin),
  character_class: optional(character.characterClass),
  alignment: optional(character.alignment),
  level: optional(character.level),
  image_id: optional(character.imageId),
  first_appearance_event_id: optional(character.firstAppearanceEventId),
  tags: character.tags,
  is_published: true,
}));

const eventRows = (events: LoreEvent[]): Record<string, unknown>[] => events.map((event) => ({
  id: event.id,
  slug: event.slug,
  kind: event.kind,
  title: event.title,
  summary: event.summary,
  body: event.body,
  season_id: optional(event.seasonId),
  location_ids: event.locationIds,
  character_ids: event.characterIds,
  entity_refs: event.entityRefs,
  occurred_at: optional(event.occurredAt),
  published_at: optional(event.publishedAt),
  timeline_order: event.timelineOrder,
  canon: event.canon,
  source_ids: event.sourceIds,
  media_ids: optional(event.mediaIds),
  tags: event.tags,
  keywords: event.keywords,
  is_published: true,
}));

async function upsertRows(
  client: UntypedSupabaseClient | null,
  table: string,
  rows: Record<string, unknown>[],
  options: SeedOptions,
): Promise<void> {
  if (options.dryRun) {
    console.log(`[dry-run] ${table}: would upsert ${rows.length} row(s)`);
    return;
  }

  if (rows.length === 0) {
    console.log(`${table}: no rows to upsert`);
    return;
  }

  if (!client) {
    throw new Error('Supabase admin client not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const { error } = await client
    .from(table)
    .upsert(rows, { onConflict: 'id' })
    .select('id');

  if (error) {
    throw new Error(`Failed to seed ${table}: ${error.message}`);
  }

  console.log(`${table}: upserted ${rows.length} row(s)`);
}

function parseOptions(argv: string[]): SeedOptions {
  return {
    dryRun: argv.includes('--dry-run'),
  };
}

async function getAdminClient(options: SeedOptions): Promise<UntypedSupabaseClient | null> {
  if (options.dryRun) {
    return null;
  }

  const { getSupabaseAdmin } = await import('../../lib/supabase');
  return getSupabaseAdmin() as unknown as UntypedSupabaseClient | null;
}

async function seedDataset(dataset: LoreBaseDataset, options: SeedOptions): Promise<void> {
  const client = await getAdminClient(options);

  await upsertRows(client, 'lore_seasons', seasonRows(dataset.seasons), options);
  await upsertRows(client, 'lore_media', mediaRows(dataset.media), options);
  await upsertRows(client, 'lore_sources', sourceRows(dataset.sources), options);
  await upsertRows(client, 'lore_locations', locationRows(dataset.locations), options);
  await upsertRows(client, 'lore_characters', characterRows(dataset.characters), options);
  await upsertRows(client, 'lore_events', eventRows(dataset.events), options);
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  const dataset = getStaticLoreBaseDataset();
  const validation = validateLoreBaseDataset(dataset);

  if (!validation.valid) {
    throw new Error(`Static lore base dataset is invalid:\n${validation.errors.join('\n')}`);
  }

  console.log('Seeding base lore tables from static lore dataset');
  console.log(JSON.stringify({
    dryRun: options.dryRun,
    events: dataset.events.length,
    characters: dataset.characters.length,
    locations: dataset.locations.length,
    seasons: dataset.seasons.length,
    sources: dataset.sources.length,
    media: dataset.media.length,
  }, null, 2));

  await seedDataset(dataset, options);
  console.log('Base lore seed complete');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
