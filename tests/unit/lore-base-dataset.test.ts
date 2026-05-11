import {
  createLoreBaseDataset,
  getActiveLoreBaseDataset,
  getStaticLoreBaseDataset,
  resetLoreBaseQueryWarningsForTests,
  validateLoreBaseDataset,
} from '@/lib/lore';
import type { LoreBaseDataset } from '@/lib/lore/base-dataset';

const cloneDataset = (dataset: LoreBaseDataset): LoreBaseDataset => createLoreBaseDataset({
  source: dataset.source,
  events: dataset.events.map((event) => ({
    ...event,
    locationIds: [...event.locationIds],
    characterIds: [...event.characterIds],
    entityRefs: event.entityRefs.map((ref) => ({ ...ref })),
    canon: {
      ...event.canon,
      path: event.canon.path.map((step) => ({
        ...step,
        sourceIds: step.sourceIds ? [...step.sourceIds] : undefined,
      })),
    },
    sourceIds: [...event.sourceIds],
    mediaIds: event.mediaIds ? [...event.mediaIds] : undefined,
    tags: [...event.tags],
    keywords: [...event.keywords],
  })),
  characters: dataset.characters.map((character) => ({
    ...character,
    aliases: [...character.aliases],
    tags: [...character.tags],
  })),
  locations: dataset.locations.map((location) => ({
    ...location,
    aliases: [...location.aliases],
    sourceIds: location.sourceIds ? [...location.sourceIds] : undefined,
    tags: [...location.tags],
  })),
  seasons: dataset.seasons.map((season) => ({ ...season })),
  sources: dataset.sources.map((source) => ({
    ...source,
    mediaIds: source.mediaIds ? [...source.mediaIds] : undefined,
  })),
  media: dataset.media.map((media) => ({ ...media })),
});

describe('lore base dataset foundation', () => {
  const originalSource = process.env.LORE_BASE_SOURCE;

  const restoreSourceEnv = (): void => {
    if (originalSource === undefined) {
      delete process.env.LORE_BASE_SOURCE;
      return;
    }

    process.env.LORE_BASE_SOURCE = originalSource;
  };

  beforeEach(() => {
    resetLoreBaseQueryWarningsForTests();
    restoreSourceEnv();
  });

  afterAll(() => {
    restoreSourceEnv();
  });

  it('builds and validates the static fallback dataset', () => {
    const dataset = getStaticLoreBaseDataset();
    const validation = validateLoreBaseDataset(dataset);

    expect(validation.valid).toBe(true);
    expect(dataset.source).toBe('static');
    expect(dataset.events[0].timelineOrder).toBeLessThanOrEqual(dataset.events[1].timelineOrder);
    expect(dataset.indexes.eventsById.get('event-genesis-mint')?.slug).toBe('genesis-mint');
    expect(dataset.indexes.charactersBySlug.get('astaroth-the-horned-devil-5')?.id).toBe('character-5');
  });

  it('reports duplicates and broken references', () => {
    const dataset = cloneDataset(getStaticLoreBaseDataset());
    dataset.events = createLoreBaseDataset({
      ...dataset,
      events: [
        ...dataset.events,
        {
          ...dataset.events[0],
          id: dataset.events[0].id,
          slug: 'duplicate-genesis-mint',
          characterIds: ['missing-character'],
          sourceIds: ['missing-source'],
          mediaIds: ['missing-media'],
          canon: {
            ...dataset.events[0].canon,
            path: [
              {
                stageId: 'source_attributed',
                status: 'complete',
                sourceIds: ['missing-canon-source'],
              },
            ],
          },
        },
      ],
    }).events;

    const invalidDataset = createLoreBaseDataset(dataset);
    const validation = validateLoreBaseDataset(invalidDataset);

    expect(validation.valid).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      'Events duplicate id: event-genesis-mint',
      'Event event-genesis-mint references missing character: missing-character',
      'Event event-genesis-mint references missing source: missing-source',
      'Event event-genesis-mint references missing media: missing-media',
      'Event event-genesis-mint canon.path[0] references missing source: missing-canon-source',
    ]));
  });

  it('rejects malformed canon payloads instead of coercing them', () => {
    const dataset = cloneDataset(getStaticLoreBaseDataset());
    dataset.events[0] = {
      ...dataset.events[0],
      canon: null as never,
    };

    const validation = validateLoreBaseDataset(createLoreBaseDataset(dataset));

    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain(`Event ${dataset.events[0].id} canon must be an object`);
  });

  it('uses a valid database dataset in auto mode', async () => {
    const dbDataset = createLoreBaseDataset({
      ...cloneDataset(getStaticLoreBaseDataset()),
      source: 'database',
    });
    const repository = {
      loadPublishedDataset: jest.fn().mockResolvedValue(dbDataset),
    };

    const dataset = await getActiveLoreBaseDataset({ source: 'auto', repository });

    expect(dataset.source).toBe('database');
    expect(repository.loadPublishedDataset).toHaveBeenCalledTimes(1);
  });

  it('defaults invalid LORE_BASE_SOURCE values to auto', async () => {
    process.env.LORE_BASE_SOURCE = 'database';
    const dbDataset = createLoreBaseDataset({
      ...cloneDataset(getStaticLoreBaseDataset()),
      source: 'database',
    });
    const repository = {
      loadPublishedDataset: jest.fn().mockResolvedValue(dbDataset),
    };

    const dataset = await getActiveLoreBaseDataset({ repository });

    expect(dataset.source).toBe('database');
    expect(repository.loadPublishedDataset).toHaveBeenCalledTimes(1);
  });

  it('falls back to static in auto mode when database tables are empty', async () => {
    const emptyDbDataset = createLoreBaseDataset({
      source: 'database',
      events: [],
      characters: [],
      locations: [],
      seasons: [],
      sources: [],
      media: [],
    });
    const repository = {
      loadPublishedDataset: jest.fn().mockResolvedValue(emptyDbDataset),
    };
    const logger = { warn: jest.fn() };

    const dataset = await getActiveLoreBaseDataset({ source: 'auto', repository, logger });

    expect(dataset.source).toBe('static');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('collection must not be empty'));
  });

  it('falls back to static once in auto mode when the database dataset is unavailable', async () => {
    const repository = {
      loadPublishedDataset: jest.fn().mockRejectedValue(new Error('offline')),
    };
    const logger = { warn: jest.fn() };

    const first = await getActiveLoreBaseDataset({ source: 'auto', repository, logger });
    const second = await getActiveLoreBaseDataset({ source: 'auto', repository, logger });

    expect(first.source).toBe('static');
    expect(second.source).toBe('static');
    expect(repository.loadPublishedDataset).toHaveBeenCalledTimes(2);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Falling back to static lore base dataset'));
  });
});
