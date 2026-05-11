import type { LoreSubmissionDetailDto, LoreSubmissionLink } from '@/types/lore-submission';
import type { LoreEvent, LoreEventKind, LoreMedia, SourceKind, SourceRecord } from '@/lib/lore/types';

export interface AdaptedLoreSubmission {
  event: LoreEvent;
  sources: SourceRecord[];
  media: LoreMedia[];
}

type PublicationSnapshot = {
  title?: unknown;
  summary?: unknown;
  bodyMarkdown?: unknown;
  tags?: unknown;
  seasonId?: unknown;
  characterIds?: unknown;
  locationIds?: unknown;
  links?: unknown;
};

type SnapshotLink = {
  id?: unknown;
  role?: unknown;
  linkType?: unknown;
  originalUrl?: unknown;
  normalizedUrl?: unknown;
  displayTitle?: unknown;
  platform?: unknown;
  archivedUrl?: unknown;
  attribution?: unknown;
  metadata?: unknown;
  sortOrder?: unknown;
};

const COMMUNITY_SEASON_ID = 'season-community-chronicles';
const SUBMISSION_EPOCH_TIMELINE_ORDER = 100_000;

const snapshotValue = (snapshot: PublicationSnapshot | null, key: keyof PublicationSnapshot): unknown => {
  if (!snapshot || typeof snapshot !== 'object') return undefined;
  return snapshot[key];
};

const stringOr = (value: unknown, fallback: string): string => (
  typeof value === 'string' && value.trim() ? value : fallback
);

const optionalStringOr = (value: unknown, fallback: string | null | undefined): string | undefined => {
  if (typeof value === 'string' && value.trim()) return value;
  return fallback ?? undefined;
};

const stringArrayOr = (value: unknown, fallback: string[]): string[] => (
  Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : fallback
);

const withTokenCharacterFallback = (characterIds: string[], tokenId: string): string[] => {
  if (characterIds.length > 0 || !/^[1-9]\d*$/.test(tokenId)) return characterIds;
  return [`character-${tokenId}`];
};

const stringOrNull = (value: unknown): string | null => (
  typeof value === 'string' && value.trim() ? value : null
);

const isLinkRole = (value: unknown): value is LoreSubmissionLink['role'] => (
  value === 'source' || value === 'media' || value === 'source_media'
);

const isLinkType = (value: unknown): value is LoreSubmissionLink['link_type'] => (
  value === 'twitter' || value === 'youtube' || value === 'generic'
);

const snapshotLinksOrNull = (
  snapshot: PublicationSnapshot | null,
  submissionId: string,
  fallbackTimestamp: string,
): LoreSubmissionLink[] | null => {
  const rawLinks = snapshotValue(snapshot, 'links');
  if (!Array.isArray(rawLinks)) return null;

  const parsed = rawLinks.flatMap((rawLink, index): LoreSubmissionLink[] => {
    if (!rawLink || typeof rawLink !== 'object') return [];

    const link = rawLink as SnapshotLink;
    const id = stringOrNull(link.id) ?? `snapshot-link-${index}`;
    const role = isLinkRole(link.role) ? link.role : 'source_media';
    const linkType = isLinkType(link.linkType) ? link.linkType : 'generic';
    const originalUrl = stringOrNull(link.originalUrl);
    const normalizedUrl = stringOrNull(link.normalizedUrl) ?? originalUrl;
    if (!originalUrl || !normalizedUrl) return [];

    return [{
      id,
      submission_id: submissionId,
      role,
      link_type: linkType,
      original_url: originalUrl,
      normalized_url: normalizedUrl,
      display_title: stringOrNull(link.displayTitle),
      platform: stringOrNull(link.platform),
      author: null,
      published_at: null,
      archived_url: stringOrNull(link.archivedUrl),
      attribution: stringOrNull(link.attribution),
      preservation_note: null,
      metadata: link.metadata && typeof link.metadata === 'object' ? link.metadata as LoreSubmissionLink['metadata'] : {},
      sort_order: typeof link.sortOrder === 'number' ? link.sortOrder : index,
      created_at: fallbackTimestamp,
      updated_at: fallbackTimestamp,
    }];
  }).sort((a, b) => a.sort_order - b.sort_order);

  return parsed.length > 0 ? parsed : null;
};

const publishedKindForSubmission = (detail: LoreSubmissionDetailDto): LoreEventKind => {
  if (detail.submission.status === 'canonized' || detail.submission.published_kind === 'official') {
    return 'official';
  }

  return 'community';
};

const sourceKindForLink = (link: LoreSubmissionLink): SourceKind => {
  if (link.link_type === 'twitter') return 'tweet';
  if (link.link_type === 'youtube') return 'video';
  return 'website';
};

const titleForLink = (link: LoreSubmissionLink): string => {
  if (link.display_title) return link.display_title;
  if (link.link_type === 'twitter') return 'Submitted Twitter/X source';
  if (link.link_type === 'youtube') return 'Submitted YouTube source';
  return 'Submitted source link';
};

const attributionForLink = (link: LoreSubmissionLink): string => {
  return link.attribution ?? `Submitted community lore link: ${link.normalized_url}`;
};

export const loreSubmissionSourceId = (submissionId: string, linkId: string): string => (
  `lore-submission:${submissionId}:source:${linkId}`
);

export const loreSubmissionMediaId = (submissionId: string, linkId: string): string => (
  `lore-submission:${submissionId}:media:${linkId}`
);

const linkHasSourceRecord = (link: LoreSubmissionLink): boolean => (
  link.role === 'source' || link.role === 'source_media'
);

const linkHasMediaRecord = (link: LoreSubmissionLink): boolean => (
  link.role === 'media' || link.role === 'source_media'
);

const mediaUrlForLink = (link: LoreSubmissionLink): string | undefined => {
  if (link.link_type === 'youtube') {
    return typeof link.metadata.youtubeEmbedUrl === 'string'
      ? link.metadata.youtubeEmbedUrl
      : link.normalized_url;
  }

  return link.archived_url ?? link.normalized_url;
};

export function adaptLoreSubmissionToEffectiveLore(detail: LoreSubmissionDetailDto): AdaptedLoreSubmission | null {
  const { submission, links } = detail;
  if (submission.visibility !== 'public') return null;
  if (submission.status !== 'public' && submission.status !== 'canonized') return null;
  if (!submission.published_slug) return null;

  const snapshot = submission.publication_snapshot as PublicationSnapshot | null;
  const title = stringOr(snapshotValue(snapshot, 'title'), submission.curated_title ?? submission.title);
  const summary = stringOr(snapshotValue(snapshot, 'summary'), submission.curated_summary ?? submission.summary);
  const body = stringOr(snapshotValue(snapshot, 'bodyMarkdown'), submission.curated_body_markdown ?? submission.body_markdown);
  const tags = stringArrayOr(snapshotValue(snapshot, 'tags'), submission.curated_tags ?? submission.tags);
  const characterIds = withTokenCharacterFallback(
    stringArrayOr(snapshotValue(snapshot, 'characterIds'), submission.character_ids),
    submission.token_id,
  );
  const locationIds = stringArrayOr(snapshotValue(snapshot, 'locationIds'), submission.location_ids);
  const seasonId = optionalStringOr(snapshotValue(snapshot, 'seasonId'), submission.season_id ?? COMMUNITY_SEASON_ID);
  const effectiveLinks = snapshotLinksOrNull(snapshot, submission.id, submission.published_at ?? submission.updated_at) ?? links;

  const media = effectiveLinks
    .filter(linkHasMediaRecord)
    .map((link): LoreMedia => ({
      id: loreSubmissionMediaId(submission.id, link.id),
      kind: link.link_type === 'youtube' ? 'video' : 'image',
      title: titleForLink(link),
      url: mediaUrlForLink(link),
      archivedUrl: link.archived_url ?? undefined,
      alt: link.display_title ?? titleForLink(link),
      attribution: attributionForLink(link),
    }));

  const mediaIdByLinkId = new Map(
    effectiveLinks
      .filter(linkHasMediaRecord)
      .map((link) => [link.id, loreSubmissionMediaId(submission.id, link.id)]),
  );
  const sources = effectiveLinks
    .filter(linkHasSourceRecord)
    .map((link): SourceRecord => ({
      id: loreSubmissionSourceId(submission.id, link.id),
      kind: sourceKindForLink(link),
      title: titleForLink(link),
      url: link.normalized_url,
      archivedUrl: link.archived_url ?? undefined,
      author: link.author ?? undefined,
      platform: link.platform ?? undefined,
      publishedAt: link.published_at ?? undefined,
      capturedAt: link.created_at,
      attribution: attributionForLink(link),
      preservationNote: link.preservation_note ?? undefined,
      mediaIds: mediaIdByLinkId.has(link.id) ? [mediaIdByLinkId.get(link.id)!] : undefined,
    }));

  const publishedAt = submission.published_at ?? submission.canonized_at ?? submission.submitted_at;
  const publishedTimestampSeconds = Number.isFinite(new Date(publishedAt).getTime())
    ? new Date(publishedAt).getTime() / 1000
    : 0;
  const event: LoreEvent = {
    id: `lore-submission:${submission.id}`,
    slug: submission.published_slug,
    kind: publishedKindForSubmission(detail),
    title,
    summary,
    body,
    seasonId,
    locationIds,
    characterIds,
    entityRefs: [
      ...characterIds.map((id) => ({ kind: 'character' as const, id })),
      ...locationIds.map((id) => ({ kind: 'location' as const, id })),
    ],
    publishedAt,
    timelineOrder: SUBMISSION_EPOCH_TIMELINE_ORDER + publishedTimestampSeconds,
    canon: {
      status: submission.status === 'canonized' ? 'canon' : submission.canon_status,
      stageId: submission.status === 'canonized' ? 'canonized' : submission.canon_stage_id,
      path: submission.canon_path,
      note: submission.canon_note ?? undefined,
      updatedAt: submission.updated_at,
    },
    sourceIds: sources.map((source) => source.id),
    mediaIds: media.map((item) => item.id),
    tags: [...new Set([...tags, 'community-submission'])],
    keywords: [...new Set([
      ...tags,
      submission.token_id,
      submission.submitter_address,
      title,
      summary,
    ].map((keyword) => keyword.toLowerCase()))],
  };

  return { event, sources, media };
}
