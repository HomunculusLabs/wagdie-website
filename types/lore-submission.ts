import type { Json } from '@/lib/database.types';
import type { CanonStatus, CanonizationStageId, CanonizationStep } from '@/lib/lore/types';

export const loreSubmissionStatuses = [
  'submitted',
  'changes_requested',
  'public',
  'canonized',
  'closed',
] as const;
export type LoreSubmissionStatus = (typeof loreSubmissionStatuses)[number];

export const loreSubmissionVisibilities = ['pending', 'public', 'hidden'] as const;
export type LoreSubmissionVisibility = (typeof loreSubmissionVisibilities)[number];

export const loreSubmissionPublishedKinds = ['community', 'official'] as const;
export type LoreSubmissionPublishedKind = (typeof loreSubmissionPublishedKinds)[number];

export const loreSubmissionLinkRoles = ['source', 'media', 'source_media'] as const;
export type LoreSubmissionLinkRole = (typeof loreSubmissionLinkRoles)[number];

export const loreSubmissionLinkTypes = ['twitter', 'youtube', 'generic'] as const;
export type LoreSubmissionLinkType = (typeof loreSubmissionLinkTypes)[number];

export const loreSubmissionReviewActions = [
  'submit',
  'resubmit',
  'request_changes',
  'publish',
  'canonize',
  'decanonize',
  'close',
  'hide',
  'curate',
  'admin_note',
] as const;
export type LoreSubmissionReviewAction = (typeof loreSubmissionReviewActions)[number];

export interface LoreSubmission {
  id: string;
  submitter_address: string;
  token_id: string;
  title: string;
  summary: string;
  body_markdown: string;
  tags: string[];
  curated_title: string | null;
  curated_summary: string | null;
  curated_body_markdown: string | null;
  curated_tags: string[] | null;
  season_id: string | null;
  character_ids: string[];
  location_ids: string[];
  status: LoreSubmissionStatus;
  review_note: string | null;
  status_reason: string | null;
  last_admin_address: string | null;
  published_slug: string | null;
  visibility: LoreSubmissionVisibility;
  published_kind: LoreSubmissionPublishedKind | null;
  canon_status: CanonStatus;
  canon_stage_id: CanonizationStageId;
  canon_note: string | null;
  canon_path: CanonizationStep[];
  publication_snapshot: Json | null;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  reviewed_at: string | null;
  published_at: string | null;
  canonized_at: string | null;
  closed_at: string | null;
}

export interface LoreSubmissionLinkMetadata {
  youtubeVideoId?: string;
  youtubeEmbedUrl?: string;
  [key: string]: Json | undefined;
}

export interface LoreSubmissionLink {
  id: string;
  submission_id: string;
  role: LoreSubmissionLinkRole;
  link_type: LoreSubmissionLinkType;
  original_url: string;
  normalized_url: string;
  display_title: string | null;
  platform: string | null;
  author: string | null;
  published_at: string | null;
  archived_url: string | null;
  attribution: string | null;
  preservation_note: string | null;
  metadata: LoreSubmissionLinkMetadata;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LoreSubmissionReview {
  id: string;
  submission_id: string;
  actor_address: string;
  action: LoreSubmissionReviewAction;
  from_status: LoreSubmissionStatus | null;
  to_status: LoreSubmissionStatus;
  note: string | null;
  created_at: string;
}

export interface LoreSubmissionLinkInput {
  url: string;
  role?: LoreSubmissionLinkRole;
  displayTitle?: string;
  archivedUrl?: string;
  attribution?: string;
}

export interface NormalizedLoreSubmissionLinkInput {
  role: LoreSubmissionLinkRole;
  linkType: LoreSubmissionLinkType;
  originalUrl: string;
  normalizedUrl: string;
  displayTitle?: string;
  archivedUrl?: string;
  attribution?: string;
  platform?: string;
  metadata: LoreSubmissionLinkMetadata;
}

export interface CreateLoreSubmissionInput {
  tokenId: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  characterIds: string[];
  locationIds: string[];
  links: NormalizedLoreSubmissionLinkInput[];
}

export interface LoreSubmissionDetailDto {
  submission: LoreSubmission;
  links: LoreSubmissionLink[];
  reviews: LoreSubmissionReview[];
}

export interface LoreSubmissionListItemDto {
  id: string;
  tokenId: string;
  title: string;
  summary: string;
  status: LoreSubmissionStatus;
  visibility: LoreSubmissionVisibility;
  publishedSlug: string | null;
  submittedAt: string;
  updatedAt: string;
}
