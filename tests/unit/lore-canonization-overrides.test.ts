import {
  parseLoreCanonizationOverrideInput,
  validateLoreCanonizationOverride,
  type LoreCanonizationOverride,
  type LoreCanonizationOverrideInput,
} from '@/lib/lore/canonization-overrides';
import { createLoreBaseDataset, getStaticLoreBaseDataset } from '@/lib/lore/base-dataset';
import {
  LoreCanonizationService,
  LoreCanonizationValidationError,
} from '@/lib/services/lore-canonization-service';
import type { LoreCanonizationRepository } from '@/lib/repositories/lore-canonization-repository';

const staticDataset = getStaticLoreBaseDataset();
const dbOnlyEvent = {
  ...staticDataset.events[0],
  id: 'event-db-only-canonization',
  slug: 'db-only-canonization',
  title: 'DB Only Canonization',
};
const dbDataset = createLoreBaseDataset({
  source: 'database',
  events: [dbOnlyEvent],
  characters: staticDataset.characters,
  locations: staticDataset.locations,
  seasons: staticDataset.seasons,
  sources: staticDataset.sources,
  media: staticDataset.media,
});
const loadDbDataset = jest.fn(async () => dbDataset);
const loadStaticDataset = jest.fn(async () => staticDataset);

const validOverride = {
  status: 'canonizing',
  stageId: 'continuity_review',
  note: 'Ready for review',
  path: [
    {
      stageId: 'source_attributed',
      status: 'complete',
      sourceIds: ['source-discord-pilgrimage-thread'],
    },
    {
      stageId: 'continuity_review',
      status: 'current',
      sourceIds: ['source-discord-pilgrimage-thread'],
    },
  ],
};

const makeOverride = (
  input: LoreCanonizationOverrideInput,
  publicationStatus: LoreCanonizationOverride['publicationStatus'] = 'draft',
): LoreCanonizationOverride => ({
  eventId: input.eventId,
  canon: {
    status: input.status,
    stageId: input.stageId,
    note: input.note,
    path: input.path,
    updatedAt: '2026-05-09T00:00:00.000Z',
  },
  publicationStatus,
  updatedBy: '0xAdmin',
  publishedBy: publicationStatus === 'published' ? '0xAdmin' : undefined,
  publishedAt: publicationStatus === 'published' ? '2026-05-09T00:00:00.000Z' : undefined,
  updatedAt: '2026-05-09T00:00:00.000Z',
  createdAt: '2026-05-09T00:00:00.000Z',
});

describe('lore canonization overrides', () => {
  it('parses and validates a complete draft override payload', () => {
    const result = parseLoreCanonizationOverrideInput(validOverride, 'event-pilgrims-ashen-road');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toEqual({
      eventId: 'event-pilgrims-ashen-road',
      ...validOverride,
    });
  });

  it('rejects unknown events, incompatible stages, missing current steps, and missing sources', () => {
    const result = parseLoreCanonizationOverrideInput({
      status: 'canon',
      stageId: 'continuity_review',
      path: [
        {
          stageId: 'source_attributed',
          status: 'complete',
          sourceIds: ['source-missing'],
        },
      ],
    }, 'event-missing');

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(expect.arrayContaining([
      'event_id does not match an active lore event: event-missing',
      'canon status canon is incompatible with stage continuity_review',
      'path must include exactly one current step',
      'path[0].sourceIds references missing source: source-missing',
    ]));
  });

  it('requires the current step stage to match the top-level stage', () => {
    const errors = validateLoreCanonizationOverride({
      eventId: 'event-pilgrims-ashen-road',
      status: 'canonizing',
      stageId: 'continuity_review',
      path: [
        { stageId: 'canon_candidate', status: 'current' },
      ],
    });

    expect(errors).toContain('current step stage canon_candidate does not match stage continuity_review');
  });

  it('validates canonization overrides against a supplied active base dataset', () => {
    const result = parseLoreCanonizationOverrideInput(validOverride, dbOnlyEvent.id, { dataset: dbDataset });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input.eventId).toBe(dbOnlyEvent.id);
  });

  it('saves drafts for DB-only active base events through the service', async () => {
    let stored: LoreCanonizationOverride | null = null;
    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findByEventId: jest.fn(async () => null),
      upsertDraft: jest.fn(async (input: LoreCanonizationOverrideInput) => {
        stored = makeOverride(input, 'draft');
        return { eventId: stored.eventId, draftOverride: stored, override: stored };
      }),
      publish: jest.fn(),
      delete: jest.fn(async () => undefined),
    } as unknown as LoreCanonizationRepository;
    const service = new LoreCanonizationService(repository, loadDbDataset);

    const draft = await service.saveDraft(dbOnlyEvent.id, validOverride, '0xAdmin');

    expect(draft.event.id).toBe(dbOnlyEvent.id);
    expect(repository.upsertDraft).toHaveBeenCalledWith(expect.objectContaining({
      eventId: dbOnlyEvent.id,
      status: 'canonizing',
    }), '0xAdmin');
  });

  it('saves drafts and publishes only current draft overrides through the service', async () => {
    let stored: LoreCanonizationOverride | null = null;
    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findByEventId: jest.fn(async () => stored ? { eventId: stored.eventId, draftOverride: stored.publicationStatus === 'draft' ? stored : undefined, publishedOverride: stored.publicationStatus === 'published' ? stored : undefined, override: stored } : null),
      upsertDraft: jest.fn(async (input: LoreCanonizationOverrideInput) => {
        stored = makeOverride(input, 'draft');
        return { eventId: stored.eventId, draftOverride: stored, override: stored };
      }),
      publish: jest.fn(async (input: LoreCanonizationOverrideInput) => {
        if (!stored) throw new Error('missing');
        stored = { ...stored, eventId: input.eventId, publicationStatus: 'published', publishedBy: '0xAdmin' };
        return { eventId: stored.eventId, publishedOverride: stored, override: stored };
      }),
      delete: jest.fn(async () => undefined),
    } as unknown as LoreCanonizationRepository;
    const service = new LoreCanonizationService(repository, loadStaticDataset);

    const draft = await service.saveDraft('event-pilgrims-ashen-road', validOverride, '0xAdmin');
    expect(draft.draftOverride?.eventId).toBe('event-pilgrims-ashen-road');
    expect(repository.upsertDraft).toHaveBeenCalledWith(expect.objectContaining({
      eventId: 'event-pilgrims-ashen-road',
      status: 'canonizing',
    }), '0xAdmin');

    const published = await service.publishDraft('event-pilgrims-ashen-road', '0xAdmin');
    expect(published.publishedOverride?.publicationStatus).toBe('published');
  });

  it('does not publish an already published override as a draft', async () => {
    const input = parseLoreCanonizationOverrideInput(validOverride, 'event-pilgrims-ashen-road');
    expect(input.ok).toBe(true);
    if (!input.ok) return;

    const repository = {
      findAll: jest.fn().mockResolvedValue([]),
      findByEventId: jest.fn().mockResolvedValue({
        eventId: input.input.eventId,
        publishedOverride: makeOverride(input.input, 'published'),
        override: makeOverride(input.input, 'published'),
      }),
      upsertDraft: jest.fn(),
      publish: jest.fn(),
      delete: jest.fn(),
    } as unknown as LoreCanonizationRepository;
    const service = new LoreCanonizationService(repository, loadStaticDataset);

    await expect(service.publishDraft('event-pilgrims-ashen-road', '0xAdmin')).rejects.toBeInstanceOf(
      LoreCanonizationValidationError,
    );
    expect(repository.publish).not.toHaveBeenCalled();
  });
});
