import { z } from 'zod';
import {
  loreSubmissionLinkRoles,
  type LoreSubmissionLinkRole,
  type LoreSubmissionLinkType,
  type NormalizedLoreSubmissionLinkInput,
} from '@/types/lore-submission';

export const LORE_SUBMISSION_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  summaryMin: 20,
  summaryMax: 500,
  bodyMin: 1,
  bodyMax: 50000,
  tagMax: 32,
  tagsMax: 10,
  linksMin: 1,
  linksMax: 10,
  urlMax: 2048,
} as const;

const TWITTER_HOSTS = new Set(['twitter.com', 'mobile.twitter.com', 'x.com', 'www.twitter.com', 'www.x.com']);
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const YOUTU_BE_HOSTS = new Set(['youtu.be', 'www.youtu.be']);
const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const WALLET_TOKEN_ID_PATTERN = /^[1-9]\d*$/;

type UrlNormalizationResult = {
  linkType: LoreSubmissionLinkType;
  normalizedUrl: string;
  platform?: string;
  metadata: NormalizedLoreSubmissionLinkInput['metadata'];
};

export class LoreSubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoreSubmissionValidationError';
  }
}

function requireHttpUrl(rawUrl: string): URL {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new LoreSubmissionValidationError('URL is required');
  }

  if (trimmed.length > LORE_SUBMISSION_LIMITS.urlMax) {
    throw new LoreSubmissionValidationError('URL must be 2048 characters or fewer');
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new LoreSubmissionValidationError('URL must be valid');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new LoreSubmissionValidationError('URL must use http or https');
  }

  return parsed;
}

function stripDefaultPort(url: URL): void {
  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }
}

function canonicalizeGenericUrl(url: URL): string {
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  url.hash = '';
  stripDefaultPort(url);
  url.searchParams.sort();

  return url.toString();
}

function normalizeTwitterUrl(url: URL): UrlNormalizationResult | null {
  const hostname = url.hostname.toLowerCase();
  if (!TWITTER_HOSTS.has(hostname)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  const statusIndex = segments.findIndex((segment) => segment.toLowerCase() === 'status');
  if (statusIndex < 1 || statusIndex + 1 >= segments.length) {
    throw new LoreSubmissionValidationError('Twitter/X URL must be a status URL');
  }

  const author = segments[statusIndex - 1];
  const statusId = segments[statusIndex + 1];
  if (!/^\d+$/.test(statusId)) {
    throw new LoreSubmissionValidationError('Twitter/X status ID must be numeric');
  }

  return {
    linkType: 'twitter',
    normalizedUrl: `https://x.com/${author}/status/${statusId}`,
    platform: 'Twitter/X',
    metadata: {},
  };
}

function extractYouTubeVideoId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase();

  if (YOUTU_BE_HOSTS.has(hostname)) {
    const [videoId] = url.pathname.split('/').filter(Boolean);
    return videoId ?? null;
  }

  if (!YOUTUBE_HOSTS.has(hostname)) return null;

  const segments = url.pathname.split('/').filter(Boolean);
  if (url.pathname === '/watch') {
    return url.searchParams.get('v');
  }

  if ((segments[0] === 'shorts' || segments[0] === 'embed') && segments[1]) {
    return segments[1];
  }

  return null;
}

export function getYouTubeNoCookieEmbedUrl(videoId: string): string {
  if (!YOUTUBE_ID_PATTERN.test(videoId)) {
    throw new LoreSubmissionValidationError('Invalid YouTube video ID');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

function normalizeYouTubeUrl(url: URL): UrlNormalizationResult | null {
  const videoId = extractYouTubeVideoId(url);
  if (videoId === null) return null;

  if (!YOUTUBE_ID_PATTERN.test(videoId)) {
    throw new LoreSubmissionValidationError('YouTube URL must include a valid video ID');
  }

  return {
    linkType: 'youtube',
    normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
    platform: 'YouTube',
    metadata: {
      youtubeVideoId: videoId,
      youtubeEmbedUrl: getYouTubeNoCookieEmbedUrl(videoId),
    },
  };
}

export function normalizeLoreSubmissionUrl(rawUrl: string): UrlNormalizationResult {
  const url = requireHttpUrl(rawUrl);
  const twitter = normalizeTwitterUrl(url);
  if (twitter) return twitter;

  const youtube = normalizeYouTubeUrl(url);
  if (youtube) return youtube;

  return {
    linkType: 'generic',
    normalizedUrl: canonicalizeGenericUrl(url),
    metadata: {},
  };
}

function normalizeOptionalString(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeTag(tag: string): string {
  return tag
    .trim()
    .replace(/^#+/, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function normalizeTags(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const tag of tags) {
    const next = normalizeTag(tag);
    if (!next || seen.has(next)) continue;
    seen.add(next);
    normalized.push(next);
  }

  return normalized;
}

export function normalizeAndDeduplicateLinks(
  links: readonly {
    url: string;
    role?: LoreSubmissionLinkRole;
    displayTitle?: string;
    archivedUrl?: string;
    attribution?: string;
  }[]
): NormalizedLoreSubmissionLinkInput[] {
  const seen = new Set<string>();
  const normalized: NormalizedLoreSubmissionLinkInput[] = [];

  for (const link of links) {
    const url = link.url.trim();
    const result = normalizeLoreSubmissionUrl(url);
    if (seen.has(result.normalizedUrl)) continue;
    seen.add(result.normalizedUrl);

    normalized.push({
      role: link.role ?? 'source_media',
      linkType: result.linkType,
      originalUrl: url,
      normalizedUrl: result.normalizedUrl,
      displayTitle: normalizeOptionalString(link.displayTitle),
      archivedUrl: normalizeOptionalString(link.archivedUrl),
      attribution: normalizeOptionalString(link.attribution),
      platform: result.platform,
      metadata: result.metadata,
    });
  }

  return normalized;
}

const rawLinkSchema = z.object({
  url: z.string().trim().min(1).max(LORE_SUBMISSION_LIMITS.urlMax),
  role: z.enum(loreSubmissionLinkRoles).optional(),
  displayTitle: z.string().trim().max(160).optional(),
  archivedUrl: z.string().trim().max(LORE_SUBMISSION_LIMITS.urlMax).optional(),
  attribution: z.string().trim().max(500).optional(),
});

export const loreSubmissionCreateSchema = z.object({
  tokenId: z.string()
    .trim()
    .regex(WALLET_TOKEN_ID_PATTERN, 'tokenId must be a canonical positive integer')
    .refine((tokenId) => Number(tokenId) <= 6666, 'tokenId must be between 1 and 6666'),
  title: z.string().trim().min(LORE_SUBMISSION_LIMITS.titleMin).max(LORE_SUBMISSION_LIMITS.titleMax),
  summary: z.string().trim().min(LORE_SUBMISSION_LIMITS.summaryMin).max(LORE_SUBMISSION_LIMITS.summaryMax),
  bodyMarkdown: z.string().trim().min(LORE_SUBMISSION_LIMITS.bodyMin).max(LORE_SUBMISSION_LIMITS.bodyMax),
  tags: z.array(z.string()).max(LORE_SUBMISSION_LIMITS.tagsMax).default([]).transform((tags, ctx) => {
    const normalized = normalizeTags(tags);
    const invalidTag = normalized.find((tag) => tag.length > LORE_SUBMISSION_LIMITS.tagMax);
    if (invalidTag) {
      ctx.addIssue({
        code: 'custom',
        message: `Tag "${invalidTag}" must be ${LORE_SUBMISSION_LIMITS.tagMax} characters or fewer`,
      });
      return z.NEVER;
    }
    return normalized;
  }),
  links: z.array(rawLinkSchema)
    .min(LORE_SUBMISSION_LIMITS.linksMin)
    .max(LORE_SUBMISSION_LIMITS.linksMax)
    .transform((links, ctx) => {
      try {
        return normalizeAndDeduplicateLinks(links);
      } catch (error) {
        ctx.addIssue({
          code: 'custom',
          message: error instanceof Error ? error.message : 'Invalid link URL',
        });
        return z.NEVER;
      }
    })
    .refine((links) => links.length >= LORE_SUBMISSION_LIMITS.linksMin, {
      message: 'At least one unique link is required',
    }),
});

export type LoreSubmissionCreateInput = z.input<typeof loreSubmissionCreateSchema>;
export type ParsedLoreSubmissionCreateInput = z.output<typeof loreSubmissionCreateSchema>;

export function parseLoreSubmissionCreateInput(input: unknown): ParsedLoreSubmissionCreateInput {
  return loreSubmissionCreateSchema.parse(input);
}
