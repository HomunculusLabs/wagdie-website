import { loreCanonizationRepository } from '@/lib/repositories/lore-canonization-repository';
import { getActiveLoreBaseDataset } from '@/lib/lore/base-query';
import {
  applyPublishedCanonizationOverrides,
  getAllEffectiveLoreCharacters,
  getAllEffectiveLoreEvents,
  getAllEffectiveLoreLocations,
  getAllEffectiveLoreSeasons,
  getEffectiveArchiveItems,
  getEffectiveLoreEventBySlug,
  getEffectiveMediaById,
  getEffectiveMediaForEvent,
  getEffectiveRelatedEntitiesForEvent,
  getEffectiveSourcesByEventId,
  getEffectiveSourcesForEvent,
} from '@/lib/lore/effective-query';
import { createLoreBaseDataset, getStaticLoreBaseDataset } from '@/lib/lore/base-dataset';
import { loreEvents } from '@/lib/lore/data/events';
import { loreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import type { LoreCanonizationOverride } from '@/lib/lore/canonization-overrides';
import type { Canonization, LoreEvent } from '@/lib/lore/types';

jest.mock('@/lib/lore/base-query', () => ({
  getActiveLoreBaseDataset: jest.fn(),
}));

jest.mock('@/lib/repositories/lore-canonization-repository', () => ({
  loreCanonizationRepository: {
    findAll: jest.fn(),
  },
}));

jest.mock('@/lib/repositories/lore-submission-repository', () => ({
  loreSubmissionRepository: {
    listPublishedForEffectiveLore: jest.fn(),
  },
}));

const staticDataset = getStaticLoreBaseDataset();
const staticEvent = loreEvents.find((event) => event.id === 'event-pilgrims-ashen-road')!;
const dbOnlyEvent: LoreEvent = {
  ...staticEvent,
  id: 'event-db-only-bell',
  slug: 'db-only-bell',
  title: 'DB Only Bell',
  summary: 'A database-only bell event.',
  characterIds: [staticDataset.characters[0].id],
  locationIds: [staticDataset.locations[0].id],
  entityRefs: [
    { kind: 'character', id: staticDataset.characters[0].id },
    { kind: 'location', id: staticDataset.locations[0].id },
  ],
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

const publishedCanon: Canonization = {
  status: 'canon',
  stageId: 'canonized',
  note: 'Published canon override',
  updatedAt: '2026-05-09T00:00:00.000Z',
  path: [
    { stageId: 'source_attributed', status: 'complete' },
    { stageId: 'canonized', status: 'current' },
  ],
};

const draftCanon: Canonization = {
  status: 'non_canon',
  stageId: 'rejected',
  note: 'Draft-only rejection',
  updatedAt: '2026-05-09T00:00:00.000Z',
  path: [
    { stageId: 'source_attributed', status: 'complete' },
    { stageId: 'rejected', status: 'current' },
  ],
};

const makeOverride = (
  canon: Canonization,
  publicationStatus: LoreCanonizationOverride['publicationStatus'],
  eventId = staticEvent.id,
): LoreCanonizationOverride => ({
  eventId,
  canon,
  publicationStatus,
  updatedBy: '0xAdmin',
  publishedBy: publicationStatus === 'published' ? '0xAdmin' : undefined,
  publishedAt: publicationStatus === 'published' ? '2026-05-09T00:00:00.000Z' : undefined,
  updatedAt: '2026-05-09T00:00:00.000Z',
  createdAt: '2026-05-09T00:00:00.000Z',
});

describe('published lore effective query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getActiveLoreBaseDataset as jest.Mock).mockResolvedValue(staticDataset);
    (loreCanonizationRepository.findAll as jest.Mock).mockResolvedValue([]);
    (loreSubmissionRepository.listPublishedForEffectiveLore as jest.Mock).mockResolvedValue([]);
  });

  it('applies published overrides while ignoring draft overrides', () => {
    const [event] = applyPublishedCanonizationOverrides([staticEvent as LoreEvent], [
      {
        eventId: staticEvent.id,
        draftOverride: makeOverride(draftCanon, 'draft'),
        publishedOverride: makeOverride(publishedCanon, 'published'),
      },
    ]);

    expect(event.canon.status).toBe('canon');
    expect(event.canon.stageId).toBe('canonized');
    expect(event.canon.note).toBe('Published canon override');
  });

  it('keeps static canonization when only a draft override exists', async () => {
    (loreCanonizationRepository.findAll as jest.Mock).mockResolvedValueOnce([
      {
        eventId: staticEvent.id,
        draftOverride: makeOverride(draftCanon, 'draft'),
      },
    ]);

    const items = await getEffectiveArchiveItems({ canonStatus: 'non_canon' });

    expect(items.some((event) => event.id === staticEvent.id)).toBe(false);
    expect(loreCanonizationRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('makes published overrides visible to archive filters', async () => {
    (loreCanonizationRepository.findAll as jest.Mock).mockResolvedValueOnce([
      {
        eventId: staticEvent.id,
        draftOverride: makeOverride(draftCanon, 'draft'),
        publishedOverride: makeOverride(publishedCanon, 'published'),
      },
    ]);

    const items = await getEffectiveArchiveItems({ canonStatus: 'canon', canonStage: 'canonized' });

    expect(items.some((event) => event.id === staticEvent.id)).toBe(true);
  });

  it('uses DB-backed base events and filter/entity indexes from the active base dataset', async () => {
    (getActiveLoreBaseDataset as jest.Mock).mockResolvedValue(dbDataset);

    const events = await getAllEffectiveLoreEvents();
    const archiveItems = await getEffectiveArchiveItems({
      character: staticDataset.characters[0].slug,
      location: staticDataset.locations[0].slug,
    });
    const seasonItems = await getEffectiveArchiveItems({
      season: staticDataset.seasons.find((season) => season.id === dbOnlyEvent.seasonId)!.slug,
    });
    const keywordItems = await getEffectiveArchiveItems({ keyword: 'database-only' });
    const relatedEntities = await getEffectiveRelatedEntitiesForEvent(dbOnlyEvent);
    const [characters, locations, seasons] = await Promise.all([
      getAllEffectiveLoreCharacters(),
      getAllEffectiveLoreLocations(),
      getAllEffectiveLoreSeasons(),
    ]);
    const sourcesByEventId = await getEffectiveSourcesByEventId([dbOnlyEvent]);
    const media = await getEffectiveMediaById(staticDataset.media[0].id);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(dbOnlyEvent.id);
    expect(archiveItems.map((event) => event.id)).toEqual([dbOnlyEvent.id]);
    expect(seasonItems.map((event) => event.id)).toEqual([dbOnlyEvent.id]);
    expect(keywordItems.map((event) => event.id)).toEqual([dbOnlyEvent.id]);
    expect(characters.map((character) => character.id)).toContain(staticDataset.characters[0].id);
    expect(locations.map((location) => location.id)).toContain(staticDataset.locations[0].id);
    expect(seasons.map((season) => season.id)).toContain(dbOnlyEvent.seasonId);
    expect(sourcesByEventId[dbOnlyEvent.id].map((source) => source.id)).toEqual(dbOnlyEvent.sourceIds);
    expect(media?.id).toBe(staticDataset.media[0].id);
    expect(relatedEntities).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'character', slug: staticDataset.characters[0].slug }),
      expect.objectContaining({ kind: 'location', slug: staticDataset.locations[0].slug }),
    ]));
  });

  it('applies published canonization overrides to DB-backed base events', async () => {
    (getActiveLoreBaseDataset as jest.Mock).mockResolvedValue(dbDataset);
    (loreCanonizationRepository.findAll as jest.Mock).mockResolvedValueOnce([
      {
        eventId: dbOnlyEvent.id,
        publishedOverride: makeOverride(publishedCanon, 'published', dbOnlyEvent.id),
      },
    ]);

    const event = await getEffectiveLoreEventBySlug(dbOnlyEvent.slug);

    expect(event?.canon.status).toBe('canon');
    expect(event?.canon.stageId).toBe('canonized');
  });

  it('does not let published submission id or slug collisions override base lore', async () => {
    (getActiveLoreBaseDataset as jest.Mock).mockResolvedValue(dbDataset);
    (loreSubmissionRepository.listPublishedForEffectiveLore as jest.Mock).mockResolvedValue([
      {
        submission: {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          submitter_address: '0xsubmitter',
          token_id: '42',
          title: 'Collision',
          summary: 'A colliding community submission.',
          body_markdown: 'This should not replace base lore.',
          tags: ['collision'],
          curated_title: null,
          curated_summary: null,
          curated_body_markdown: null,
          curated_tags: null,
          season_id: dbOnlyEvent.seasonId,
          character_ids: dbOnlyEvent.characterIds,
          location_ids: dbOnlyEvent.locationIds,
          status: 'public',
          review_note: null,
          status_reason: null,
          last_admin_address: null,
          published_slug: dbOnlyEvent.slug,
          visibility: 'public',
          published_kind: 'community',
          canon_status: 'community',
          canon_stage_id: 'community_recorded',
          canon_note: null,
          canon_path: [{ stageId: 'community_recorded', status: 'current' }],
          publication_snapshot: null,
          created_at: '2026-05-09T16:00:00.000Z',
          updated_at: '2026-05-09T16:00:00.000Z',
          submitted_at: '2026-05-09T16:00:00.000Z',
          reviewed_at: '2026-05-09T16:00:00.000Z',
          published_at: '2026-05-09T16:00:00.000Z',
          canonized_at: null,
          closed_at: null,
        },
        links: [],
        reviews: [],
      },
    ]);

    const event = await getEffectiveLoreEventBySlug(dbOnlyEvent.slug);
    const events = await getAllEffectiveLoreEvents();

    expect(event?.id).toBe(dbOnlyEvent.id);
    expect(events).toHaveLength(1);
  });

  it('includes DB-backed published submissions in archive and effective source/media resolution', async () => {
    (loreSubmissionRepository.listPublishedForEffectiveLore as jest.Mock).mockResolvedValue([
      {
        submission: {
          id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          submitter_address: '0xsubmitter',
          token_id: '42',
          title: 'Bell Glow Witness',
          summary: 'A public community submission tied to a token owner.',
          body_markdown: 'The bell glowed in witness reports.',
          tags: ['bell'],
          curated_title: null,
          curated_summary: null,
          curated_body_markdown: null,
          curated_tags: null,
          season_id: 'season-community-chronicles',
          character_ids: ['character-5'],
          location_ids: ['location-ashen-road'],
          status: 'public',
          review_note: null,
          status_reason: null,
          last_admin_address: null,
          published_slug: 'bell-glow-witness',
          visibility: 'public',
          published_kind: 'community',
          canon_status: 'community',
          canon_stage_id: 'community_recorded',
          canon_note: null,
          canon_path: [{ stageId: 'community_recorded', status: 'current' }],
          publication_snapshot: null,
          created_at: '2026-05-09T16:00:00.000Z',
          updated_at: '2026-05-09T16:00:00.000Z',
          submitted_at: '2026-05-09T16:00:00.000Z',
          reviewed_at: '2026-05-09T16:00:00.000Z',
          published_at: '2026-05-09T16:00:00.000Z',
          canonized_at: null,
          closed_at: null,
        },
        links: [
          {
            id: 'link-1',
            submission_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            role: 'source_media',
            link_type: 'youtube',
            original_url: 'https://youtu.be/dQw4w9WgXcQ',
            normalized_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            display_title: 'Bell witness video',
            platform: 'YouTube',
            author: null,
            published_at: '2026-05-09T15:00:00.000Z',
            archived_url: 'https://archive.example/bell',
            attribution: 'Submitted by 0xsubmitter.',
            preservation_note: 'Archive URL supplied by submitter.',
            metadata: {
              youtubeVideoId: 'dQw4w9WgXcQ',
              youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
            },
            sort_order: 0,
            created_at: '2026-05-09T16:00:00.000Z',
            updated_at: '2026-05-09T16:00:00.000Z',
          },
        ],
        reviews: [],
      },
    ]);

    const events = await getAllEffectiveLoreEvents();
    const event = events.find((item) => item.slug === 'bell-glow-witness');

    expect(event).toBeDefined();
    expect(event!.kind).toBe('community');
    expect(event!.characterIds).toContain('character-5');

    const archiveItems = await getEffectiveArchiveItems({ character: 'character-5' });
    expect(archiveItems.some((item) => item.slug === 'bell-glow-witness')).toBe(true);

    const sources = await getEffectiveSourcesForEvent(event!);
    const media = await getEffectiveMediaForEvent(event!);
    expect(sources).toHaveLength(1);
    expect(sources[0]).toMatchObject({
      kind: 'video',
      title: 'Bell witness video',
      archivedUrl: 'https://archive.example/bell',
      mediaIds: [media[0].id],
    });
    expect(media).toHaveLength(1);
    expect(media[0]).toMatchObject({
      kind: 'video',
      title: 'Bell witness video',
      url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      archivedUrl: 'https://archive.example/bell',
    });
  });
});
