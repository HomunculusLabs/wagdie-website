import 'dotenv/config';

import { getStaticLoreBaseDataset, validateLoreBaseDataset } from '../../lib/lore/base-dataset';
import { LoreBaseRepository } from '../../lib/repositories/lore-base-repository';
import type { LoreBaseDataset } from '../../lib/lore/base-dataset';

interface NormalizedDataset {
  events: unknown;
  characters: unknown;
  locations: unknown;
  seasons: unknown;
  sources: unknown;
  media: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeDateString(key: string, value: string): string {
  if (!key.endsWith('At')) {
    return value;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Date(timestamp).toISOString();
}

function normalizeValue(value: unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((entryKey) => value[entryKey] !== undefined)
        .sort()
        .map((entryKey) => [entryKey, normalizeValue(value[entryKey], entryKey)]),
    );
  }

  if (typeof value === 'string') {
    return normalizeDateString(key, value);
  }

  return value;
}

function normalizeDataset(dataset: LoreBaseDataset): NormalizedDataset {
  return {
    events: normalizeValue(dataset.events),
    characters: normalizeValue(dataset.characters),
    locations: normalizeValue(dataset.locations),
    seasons: normalizeValue(dataset.seasons),
    sources: normalizeValue(dataset.sources),
    media: normalizeValue(dataset.media),
  };
}

function collectIds(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => isPlainObject(item) && typeof item.id === 'string' ? item.id : undefined)
    .filter((id): id is string => Boolean(id))
    .sort();
}

function printCollectionDrift(staticDataset: NormalizedDataset, dbDataset: NormalizedDataset): void {
  (['events', 'characters', 'locations', 'seasons', 'sources', 'media'] as const).forEach((collection) => {
    const staticIds = collectIds(staticDataset[collection]);
    const dbIds = collectIds(dbDataset[collection]);
    const missing = staticIds.filter((id) => !dbIds.includes(id));
    const extra = dbIds.filter((id) => !staticIds.includes(id));

    if (missing.length > 0 || extra.length > 0) {
      console.error(`${collection}: missing=${missing.join(', ') || '(none)'} extra=${extra.join(', ') || '(none)'}`);
    }
  });
}

async function main(): Promise<void> {
  const staticDataset = getStaticLoreBaseDataset();
  const staticValidation = validateLoreBaseDataset(staticDataset);
  if (!staticValidation.valid) {
    throw new Error(`Static lore base dataset is invalid:\n${staticValidation.errors.join('\n')}`);
  }

  const dbDataset = await new LoreBaseRepository().loadPublishedDataset();
  const dbValidation = validateLoreBaseDataset(dbDataset);
  if (!dbValidation.valid) {
    throw new Error(`DB lore base dataset is invalid:\n${dbValidation.errors.join('\n')}`);
  }

  const normalizedStatic = normalizeDataset(staticDataset);
  const normalizedDb = normalizeDataset(dbDataset);
  const staticJson = JSON.stringify(normalizedStatic, null, 2);
  const dbJson = JSON.stringify(normalizedDb, null, 2);

  if (staticJson !== dbJson) {
    console.error('Base lore DB parity failed: normalized DB dataset differs from static dataset.');
    printCollectionDrift(normalizedStatic, normalizedDb);
    process.exitCode = 1;
    return;
  }

  console.log('Base lore DB parity verified. Static and DB normalized datasets match.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
