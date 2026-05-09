export const loreEventKinds = ['official', 'community'] as const;
export type LoreEventKind = (typeof loreEventKinds)[number];

export const canonStatuses = [
  'canon',
  'canonizing',
  'community',
  'disputed',
  'non_canon',
  'archival',
] as const;
export type CanonStatus = (typeof canonStatuses)[number];

export const sourceKinds = [
  'tweet',
  'website',
  'image',
  'video',
  'discord',
  'manual_archive',
] as const;
export type SourceKind = (typeof sourceKinds)[number];

export const loreEntityKinds = [
  'character',
  'location',
  'faction',
  'artifact',
  'event',
] as const;
export type LoreEntityKind = (typeof loreEntityKinds)[number];

export type CanonizationStepStatus = 'complete' | 'current' | 'blocked' | 'not_started';

export interface CanonizationStep {
  label: string;
  status: CanonizationStepStatus;
  date?: string;
  sourceIds?: string[];
}

export interface Canonization {
  status: CanonStatus;
  path: CanonizationStep[];
  note?: string;
}

export interface LoreEntityRef {
  kind: LoreEntityKind;
  id: string;
  label?: string;
}

export interface LoreResolvedEntity extends LoreEntityRef {
  name: string;
  slug?: string;
  summary?: string;
}

export interface LoreSeason {
  id: string;
  slug: string;
  title: string;
  summary: string;
  order: number;
}

export interface LoreLocation {
  id: string;
  slug: string;
  name: string;
  summary: string;
  tags: string[];
}

export interface LoreCharacter {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  summary: string;
  tokenId?: number;
  imageUrl?: string;
  externalUrl?: string;
  origin?: string;
  characterClass?: string;
  alignment?: string;
  level?: number;
  imageId?: string;
  firstAppearanceEventId?: string;
  tags: string[];
}

export interface LoreCharacterConnection {
  character: LoreCharacter;
  sharedEvents: LoreEvent[];
}

export interface LoreMedia {
  id: string;
  kind: Extract<SourceKind, 'image' | 'video'>;
  title: string;
  url?: string;
  archivedUrl?: string;
  alt?: string;
  attribution: string;
}

export interface SourceRecord {
  id: string;
  kind: SourceKind;
  title: string;
  url?: string;
  archivedUrl?: string;
  author?: string;
  platform?: string;
  publishedAt?: string;
  capturedAt?: string;
  attribution: string;
  preservationNote?: string;
  mediaIds?: string[];
}

export interface LoreEvent {
  id: string;
  slug: string;
  kind: LoreEventKind;
  title: string;
  summary: string;
  body: string;
  seasonId?: string;
  locationIds: string[];
  characterIds: string[];
  entityRefs: LoreEntityRef[];
  occurredAt?: string;
  publishedAt?: string;
  timelineOrder: number;
  canon: Canonization;
  sourceIds: string[];
  mediaIds?: string[];
  tags: string[];
  keywords: string[];
}

export interface LoreArchiveFilters {
  season?: string;
  location?: string;
  character?: string;
  keyword?: string;
  canonStatus?: CanonStatus;
}

export interface LoreArchiveValidationResult {
  valid: boolean;
  errors: string[];
}
