import { loreCanonizationRepository } from '@/lib/repositories/lore-canonization-repository';
import {
  applyPublishedCanonizationOverrides,
  getAllEffectiveLoreEvents,
  getEffectiveArchiveItems,
  getEffectiveMediaForEvent,
  getEffectiveSourcesForEvent,
} from '@/lib/lore/effective-query';
import { loreEvents } from '@/lib/lore/data/events';
import { loreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import type { LoreCanonizationOverride } from '@/lib/lore/canonization-overrides';
import type { Canonization, LoreEvent } from '@/lib/lore/types';

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

const staticEvent = loreEvents.find((event) => event.id === 'event-pilgrims-ashen-road')!;

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
): LoreCanonizationOverride => ({
  eventId: staticEvent.id,
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
