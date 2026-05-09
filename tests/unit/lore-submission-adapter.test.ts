import { adaptLoreSubmissionToEffectiveLore } from '@/lib/lore/submissions/adapter';
import type { LoreSubmission, LoreSubmissionDetailDto, LoreSubmissionLink } from '@/types/lore-submission';

const now = '2026-05-09T16:00:00.000Z';

function submission(overrides: Partial<LoreSubmission> = {}): LoreSubmission {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    submitter_address: '0xsubmitter',
    token_id: '42',
    title: 'Original Bell Account',
    summary: 'A community account of a bell heard after the searing.',
    body_markdown: 'Original **markdown** body',
    tags: ['bell', 'community'],
    curated_title: null,
    curated_summary: null,
    curated_body_markdown: null,
    curated_tags: null,
    season_id: null,
    character_ids: ['character-5'],
    location_ids: ['location-ashen-road'],
    status: 'public',
    review_note: null,
    status_reason: null,
    last_admin_address: null,
    published_slug: 'original-bell-account',
    visibility: 'public',
    published_kind: 'community',
    canon_status: 'community',
    canon_stage_id: 'community_recorded',
    canon_note: 'Community-published submission.',
    canon_path: [{ stageId: 'community_recorded', status: 'current' }],
    publication_snapshot: null,
    created_at: now,
    updated_at: now,
    submitted_at: now,
    reviewed_at: now,
    published_at: now,
    canonized_at: null,
    closed_at: null,
    ...overrides,
  };
}

function link(overrides: Partial<LoreSubmissionLink> = {}): LoreSubmissionLink {
  return {
    id: 'link-1',
    submission_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    role: 'source_media',
    link_type: 'youtube',
    original_url: 'https://youtu.be/dQw4w9WgXcQ',
    normalized_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    display_title: 'Bell witness video',
    platform: 'YouTube',
    author: null,
    published_at: null,
    archived_url: null,
    attribution: 'Submitted by the token owner.',
    preservation_note: 'External media retained by URL only.',
    metadata: {
      youtubeVideoId: 'dQw4w9WgXcQ',
      youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    },
    sort_order: 0,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function detail(overrides: Partial<LoreSubmission> = {}, links: LoreSubmissionLink[] = [link()]): LoreSubmissionDetailDto {
  const nextSubmission = submission(overrides);
  return {
    submission: nextSubmission,
    links: links.map((item) => ({ ...item, submission_id: nextSubmission.id })),
    reviews: [],
  };
}

describe('lore submission effective lore adapter', () => {
  it('maps public submissions to community events with resolvable source/media ids', () => {
    const adapted = adaptLoreSubmissionToEffectiveLore(detail({
      publication_snapshot: {
        title: 'Published Bell Account',
        summary: 'Frozen summary from publish time.',
        bodyMarkdown: 'Frozen body from publish time.',
        tags: ['published', 'bell'],
        seasonId: 'season-community-chronicles',
        characterIds: ['character-5'],
        locationIds: ['location-ashen-road'],
      },
    }));

    expect(adapted).not.toBeNull();
    expect(adapted!.event).toMatchObject({
      id: 'lore-submission:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      slug: 'original-bell-account',
      kind: 'community',
      title: 'Published Bell Account',
      body: 'Frozen body from publish time.',
      seasonId: 'season-community-chronicles',
      characterIds: ['character-5'],
      locationIds: ['location-ashen-road'],
    });
    expect(adapted!.event.sourceIds).toEqual([adapted!.sources[0].id]);
    expect(adapted!.event.mediaIds).toEqual([adapted!.media[0].id]);
    expect(adapted!.sources[0]).toMatchObject({
      kind: 'video',
      title: 'Bell witness video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      platform: 'YouTube',
      mediaIds: [adapted!.media[0].id],
    });
    expect(adapted!.media[0]).toMatchObject({
      kind: 'video',
      title: 'Bell witness video',
      url: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    });
  });

  it('uses publication snapshot links for public source/media rendering when present', () => {
    const adapted = adaptLoreSubmissionToEffectiveLore(detail({
      publication_snapshot: {
        title: 'Snapshot Link Account',
        summary: 'Snapshot link summary.',
        bodyMarkdown: 'Snapshot link body.',
        tags: ['snapshot'],
        seasonId: 'season-community-chronicles',
        characterIds: ['character-5'],
        locationIds: ['location-ashen-road'],
        links: [
          {
            id: 'snapshot-link-1',
            role: 'source_media',
            linkType: 'youtube',
            originalUrl: 'https://youtu.be/snapshot01A',
            normalizedUrl: 'https://www.youtube.com/watch?v=snapshot01A',
            displayTitle: 'Snapshot witness video',
            platform: 'YouTube',
            archivedUrl: 'https://archive.example/snapshot-video',
            attribution: 'Snapshot attribution.',
            metadata: {
              youtubeVideoId: 'snapshot01A',
              youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/snapshot01A',
            },
            sortOrder: 0,
          },
        ],
      },
    }, [
      link({
        id: 'current-link-1',
        display_title: 'Current mutable video',
        normalized_url: 'https://www.youtube.com/watch?v=current01A',
        metadata: {
          youtubeVideoId: 'current01A',
          youtubeEmbedUrl: 'https://www.youtube-nocookie.com/embed/current01A',
        },
      }),
    ]));

    expect(adapted!.sources[0]).toMatchObject({
      id: 'lore-submission:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:source:snapshot-link-1',
      title: 'Snapshot witness video',
      url: 'https://www.youtube.com/watch?v=snapshot01A',
      archivedUrl: 'https://archive.example/snapshot-video',
      attribution: 'Snapshot attribution.',
    });
    expect(adapted!.media[0]).toMatchObject({
      id: 'lore-submission:aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee:media:snapshot-link-1',
      title: 'Snapshot witness video',
      url: 'https://www.youtube-nocookie.com/embed/snapshot01A',
    });
  });


  it('maps canonized submissions to official canon events', () => {
    const adapted = adaptLoreSubmissionToEffectiveLore(detail({
      status: 'canonized',
      published_kind: 'official',
      canon_status: 'canon',
      canon_stage_id: 'canonized',
      canonized_at: now,
    }));

    expect(adapted!.event.kind).toBe('official');
    expect(adapted!.event.canon.status).toBe('canon');
    expect(adapted!.event.canon.stageId).toBe('canonized');
  });

  it('ignores submissions that are not publicly published', () => {
    expect(adaptLoreSubmissionToEffectiveLore(detail({ status: 'submitted', visibility: 'pending', published_slug: null })))
      .toBeNull();
  });
});
