import { z } from 'zod';

/**
 * Thumbnail selection for community lore submissions.
 *
 * A submitter picks one of three thumbnail sources:
 * - `token`: the WAGDIE token art for a token they own
 * - `map_location`: an existing interactive-map location
 * - `custom`: a custom image URL (with optional attribution)
 */

export const loreThumbnailKinds = ['token', 'map_location', 'custom'] as const;
export type LoreThumbnailKind = (typeof loreThumbnailKinds)[number];

export interface LoreThumbnailToken {
  kind: 'token';
  tokenId: string;
}

export interface LoreThumbnailMapLocation {
  kind: 'map_location';
  mapLocationId: string;
}

export interface LoreThumbnailCustom {
  kind: 'custom';
  imageUrl: string;
  attribution?: string;
}

export type LoreThumbnail =
  | LoreThumbnailToken
  | LoreThumbnailMapLocation
  | LoreThumbnailCustom;

const URL_MAX = 2048;
const ATTRIBUTION_MAX = 500;

const httpUrl = z
  .string()
  .trim()
  .min(1)
  .max(URL_MAX)
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Image URL must be a valid http(s) URL');

export const loreThumbnailSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('token'),
    tokenId: z.string().trim().regex(/^[1-9]\d*$/, 'tokenId must be a positive integer'),
  }),
  z.object({
    kind: z.literal('map_location'),
    mapLocationId: z.string().trim().min(1).max(160),
  }),
  z.object({
    kind: z.literal('custom'),
    imageUrl: httpUrl,
    attribution: z.string().trim().max(ATTRIBUTION_MAX).optional(),
  }),
]);

export type ParsedLoreThumbnail = z.output<typeof loreThumbnailSchema>;

export function parseLoreThumbnail(input: unknown): ParsedLoreThumbnail {
  return loreThumbnailSchema.parse(input);
}

/** Row shape from the lore_submission_thumbnails table. */
export interface LoreSubmissionThumbnailRow {
  submission_id: string;
  kind: LoreThumbnailKind;
  token_id: string | null;
  map_location_id: string | null;
  custom_image_url: string | null;
  custom_image_attribution: string | null;
  created_at: string;
  updated_at: string;
}

export function rowToThumbnail(row: LoreSubmissionThumbnailRow): LoreThumbnail | null {
  switch (row.kind) {
    case 'token':
      return row.token_id ? { kind: 'token', tokenId: row.token_id } : null;
    case 'map_location':
      return row.map_location_id ? { kind: 'map_location', mapLocationId: row.map_location_id } : null;
    case 'custom':
      return row.custom_image_url
        ? {
            kind: 'custom',
            imageUrl: row.custom_image_url,
            attribution: row.custom_image_attribution ?? undefined,
          }
        : null;
    default:
      return null;
  }
}
