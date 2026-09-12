import {
  LoreSubmissionForbiddenError,
  LoreSubmissionService,
  LoreSubmissionValidationError,
} from '@/lib/services/lore-submission-service';
import { LoreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import { loreThumbnailSchema, rowToThumbnail } from '@/lib/lore/submissions/thumbnail';
import { loreSubmissionCreateSchema } from '@/lib/lore/submissions/validation';
import { getStaticLoreBaseDataset } from '@/lib/lore/base-dataset';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth/admin';
import type { LoreSubmissionRepository as LoreSubmissionRepositoryType } from '@/lib/repositories/lore-submission-repository';
import type { LoreSubmission, LoreSubmissionDetailDto } from '@/types/lore-submission';

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: jest.fn(),
}));

jest.mock('@/lib/auth/admin', () => ({
  isAdmin: jest.fn(() => false),
}));

const wallet = '0xabcdef0000000000000000000000000000000001';
const admin = '0xabcdef00000000000000000000000000000000ad';
const staticDataset = getStaticLoreBaseDataset();
const loadStaticDataset = jest.fn(async () => staticDataset);

function submission(overrides: Partial<LoreSubmission> = {}): LoreSubmission {
  return {
    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    submitter_address: wallet,
    token_id: '42',
    title: 'A Fallen Bell Rings',
    summary: 'A community account of a strange bell echoing after the searing.',
    body_markdown: 'A bell rang beneath the ash.',
    tags: ['bell'],
    curated_title: null,
    curated_summary: null,
    curated_body_markdown: null,
    curated_tags: null,
    season_id: null,
    character_ids: [],
    location_ids: [],
    status: 'submitted',
    review_note: null,
    status_reason: null,
    last_admin_address: null,
    published_slug: null,
    visibility: 'pending',
    published_kind: null,
    canon_status: 'community',
    canon_stage_id: 'community_recorded',
    canon_note: null,
    canon_path: [],
    publication_snapshot: null,
    created_at: '2026-05-09T00:00:00.000Z',
    updated_at: '2026-05-09T00:00:00.000Z',
    submitted_at: '2026-05-09T00:00:00.000Z',
    reviewed_at: null,
    published_at: null,
    canonized_at: null,
    closed_at: null,
    ...overrides,
  };
}

function detail(overrides: Partial<LoreSubmission> = {}): LoreSubmissionDetailDto {
  return {
    submission: submission(overrides),
    links: [],
    reviews: [],
  };
}

function validPayload(thumbnail: unknown = undefined) {
  return {
    tokenId: '42',
    title: 'A Fallen Bell Rings',
    summary: 'A community account of a strange bell echoing after the searing.',
    bodyMarkdown: 'A bell rang beneath the ash.',
    tags: ['Bell'],
    links: [{ url: 'https://example.com/source' }],
    ...(thumbnail === undefined ? {} : { thumbnail }),
  };
}

function createRepository(overrides: Partial<Record<keyof LoreSubmissionRepositoryType, jest.Mock>> = {}) {
  return {
    createSubmission: jest.fn(async () => detail()),
    createPublishedSubmission: jest.fn(async () => detail({
      status: 'public',
      visibility: 'public',
      published_kind: 'community',
      published_slug: 'a-fallen-bell-rings',
    })),
    listForSubmitter: jest.fn(async () => []),
    findDetail: jest.fn(async () => detail()),
    findById: jest.fn(async () => submission()),
    listAdmin: jest.fn(async () => ({ submissions: [], total: 0, page: 1, perPage: 25 })),
    countRecentBySubmitter: jest.fn(async () => 0),
    findOpenBySubmitterAndToken: jest.fn(async () => null),
    slugExists: jest.fn(async () => false),
    updateCuration: jest.fn(async () => detail()),
    updateStatusConditional: jest.fn(async () => detail({ status: 'public' })),
    reviseSubmission: jest.fn(async () => detail({ status: 'submitted' })),
    revisePublishedSubmission: jest.fn(async () => detail({
      status: 'public',
      visibility: 'public',
      published_kind: 'community',
      published_slug: 'a-revised-bell-rings',
    })),
    addReview: jest.fn(async () => ({
      id: 'review-1',
      submission_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      actor_address: admin,
      action: 'admin_note',
      from_status: 'submitted',
      to_status: 'submitted',
      note: 'note',
      created_at: '2026-05-09T00:00:00.000Z',
    })),
    ...overrides,
  } as unknown as jest.Mocked<LoreSubmissionRepositoryType>;
}

/**
 * `locations` table router for the service's map_location existence check.
 * The real supabase query builder resolves maybeSingle() through a thenable;
 * for the service's locations lookup we only need the resolved row, so build a
 * minimal builder that captures the eq filter and answers per id.
 */
function locationsFrom(existingIds: string[]) {
  return jest.fn((table: string) => {
    if (table !== 'locations') throw new Error(`Unexpected table ${table}`);
    return {
      select: jest.fn(() => ({
        eq: jest.fn((_column: string, value: string) => ({
          maybeSingle: jest.fn(async () => ({
            data: existingIds.includes(value) ? { id: value } : null,
            error: null,
          })),
        })),
      })),
    };
  });
}

describe('lore thumbnail zod union', () => {
  it('accepts valid token, map_location, and custom thumbnails', () => {
    expect(loreThumbnailSchema.parse({ kind: 'token', tokenId: '42' })).toEqual({
      kind: 'token',
      tokenId: '42',
    });
    expect(loreThumbnailSchema.parse({ kind: 'map_location', mapLocationId: '80.11.black-bell-toll' })).toEqual({
      kind: 'map_location',
      mapLocationId: '80.11.black-bell-toll',
    });
    expect(loreThumbnailSchema.parse({ kind: 'custom', imageUrl: 'https://example.com/bell.jpg' })).toEqual({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
    });
    expect(loreThumbnailSchema.parse({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
      attribution: 'Art by the Ashen Choir',
    })).toEqual({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
      attribution: 'Art by the Ashen Choir',
    });
  });

  it('rejects unknown thumbnail kinds', () => {
    expect(loreThumbnailSchema.safeParse({ kind: 'token_art', tokenId: '42' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({ kind: 'location', mapLocationId: 'loc-1' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({ tokenId: '42' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse(null).success).toBe(false);
  });

  it('rejects malformed token thumbnail tokenIds', () => {
    for (const tokenId of ['0', '-1', '1.5', 'abc', '  ', '']) {
      expect(loreThumbnailSchema.safeParse({ kind: 'token', tokenId }).success).toBe(false);
    }
  });

  it('rejects map_location thumbnails with empty or oversized ids', () => {
    expect(loreThumbnailSchema.safeParse({ kind: 'map_location', mapLocationId: '' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({ kind: 'map_location', mapLocationId: 'x'.repeat(161) }).success).toBe(false);
  });

  it('rejects custom thumbnails with non-http(s) URLs or oversized attribution', () => {
    expect(loreThumbnailSchema.safeParse({ kind: 'custom', imageUrl: 'ftp://example.com/bell.jpg' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({ kind: 'custom', imageUrl: 'javascript:alert(1)' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({ kind: 'custom', imageUrl: 'not a url' }).success).toBe(false);
    expect(loreThumbnailSchema.safeParse({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
      attribution: 'x'.repeat(501),
    }).success).toBe(false);
  });
});

describe('lore submission validation schema thumbnail field', () => {
  it('keeps the thumbnail optional on create payloads', () => {
    const parsed = loreSubmissionCreateSchema.parse(validPayload());
    expect(parsed.thumbnail).toBeUndefined();
  });

  it('parses a valid thumbnail through the create schema', () => {
    const parsed = loreSubmissionCreateSchema.parse(validPayload({ kind: 'token', tokenId: '42' }));
    expect(parsed.thumbnail).toEqual({ kind: 'token', tokenId: '42' });
  });

  it('rejects invalid thumbnail shapes on create payloads', () => {
    const result = loreSubmissionCreateSchema.safeParse(validPayload({ kind: 'custom', imageUrl: 'javascript:alert(1)' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('thumbnail');
    }
  });
});

describe('lore thumbnail service policy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdmin).mockReturnValue(false);
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: locationsFrom([]) });
  });

  it('allows a thumbnail token that differs from the submission token when the wallet owns it', async () => {
    const repository = createRepository();
    const ownershipVerifier = jest.fn(async ({ tokenId }: { tokenId: string }) => ({
      owns: tokenId === '42' || tokenId === '7',
      reason: 'owned',
    }));
    const service = new LoreSubmissionService(repository, {
      ownershipVerifier,
      loreBaseDatasetLoader: loadStaticDataset,
    });

    await service.createSubmission(
      validPayload({ kind: 'token', tokenId: '7' }),
      '0xABCDEF0000000000000000000000000000000001',
    );

    // Ownership is enforced per token: submission token first, thumbnail token second.
    expect(ownershipVerifier.mock.calls.map((call) => call[0].tokenId)).toEqual(['42', '7']);
    expect(repository.createPublishedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnail: { kind: 'token', tokenId: '7' } }),
      wallet,
      expect.objectContaining({ publishedSlug: 'a-fallen-bell-rings' }),
    );
  });

  it('rejects a foreign thumbnail token the wallet does not own', async () => {
    const repository = createRepository();
    const ownershipVerifier = jest.fn(async ({ tokenId }: { tokenId: string }) => ({
      owns: tokenId === '42',
      reason: tokenId === '42' ? 'owned' : 'not_owner',
    }));
    const service = new LoreSubmissionService(repository, {
      ownershipVerifier,
      loreBaseDatasetLoader: loadStaticDataset,
    });

    await expect(service.createSubmission(
      validPayload({ kind: 'token', tokenId: '777' }),
      '0xABCDEF0000000000000000000000000000000001',
    )).rejects.toBeInstanceOf(LoreSubmissionForbiddenError);

    expect(repository.createPublishedSubmission).not.toHaveBeenCalled();
  });

  it('exempts admins from thumbnail token ownership', async () => {
    jest.mocked(isAdmin).mockReturnValue(true);
    const repository = createRepository();
    const ownershipVerifier = jest.fn(async () => ({ owns: false, reason: 'not_owner' }));
    const service = new LoreSubmissionService(repository, {
      ownershipVerifier,
      loreBaseDatasetLoader: loadStaticDataset,
    });

    await expect(service.createSubmission(
      validPayload({ kind: 'token', tokenId: '6666' }),
      admin,
    )).resolves.toEqual(expect.any(Object));

    expect(ownershipVerifier).not.toHaveBeenCalled();
    expect(repository.createPublishedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnail: { kind: 'token', tokenId: '6666' } }),
      admin,
      expect.any(Object),
    );
  });

  it('rejects map_location thumbnails referencing an unknown location id', async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: locationsFrom(['80.11.black-bell-toll']) });
    const repository = createRepository();
    const service = new LoreSubmissionService(repository, {
      ownershipVerifier: jest.fn(async () => ({ owns: true, reason: 'owned' })),
      loreBaseDatasetLoader: loadStaticDataset,
    });

    await expect(service.createSubmission(
      validPayload({ kind: 'map_location', mapLocationId: '99.99.does-not-exist' }),
      '0xABCDEF0000000000000000000000000000000001',
    )).rejects.toMatchObject({
      name: 'LoreSubmissionValidationError',
      details: ['Map location "99.99.does-not-exist" does not exist'],
    });

    expect(repository.createPublishedSubmission).not.toHaveBeenCalled();
  });

  it('accepts map_location thumbnails referencing an existing location', async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: locationsFrom(['80.11.black-bell-toll']) });
    const repository = createRepository();
    const service = new LoreSubmissionService(repository, {
      ownershipVerifier: jest.fn(async () => ({ owns: true, reason: 'owned' })),
      loreBaseDatasetLoader: loadStaticDataset,
    });

    await expect(service.createSubmission(
      validPayload({ kind: 'map_location', mapLocationId: '80.11.black-bell-toll' }),
      '0xABCDEF0000000000000000000000000000000001',
    )).resolves.toEqual(expect.any(Object));

    expect(repository.createPublishedSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ thumbnail: { kind: 'map_location', mapLocationId: '80.11.black-bell-toll' } }),
      wallet,
      expect.any(Object),
    );
  });
});

describe('lore thumbnail repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const thumbnailRow = (overrides: Record<string, unknown> = {}) => ({
    submission_id: 'sub-1',
    kind: 'token',
    token_id: '42',
    map_location_id: null,
    custom_image_url: null,
    custom_image_attribution: null,
    created_at: '2026-05-09T00:00:00.000Z',
    updated_at: '2026-05-09T00:00:00.000Z',
    ...overrides,
  });

  function mockThumbnailSelect(row: unknown) {
    return jest.fn((table: string) => {
      if (table !== 'lore_submission_thumbnails') throw new Error(`Unexpected table ${table}`);
      return {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn(async () => ({ data: row, error: null })),
          })),
        })),
      };
    });
  }

  it('findThumbnail maps token, map_location, and custom rows to the thumbnail union', async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: mockThumbnailSelect(thumbnailRow()) });
    expect(await new LoreSubmissionRepository().findThumbnail('sub-1')).toEqual({
      kind: 'token',
      tokenId: '42',
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: mockThumbnailSelect(thumbnailRow({
        kind: 'map_location',
        token_id: null,
        map_location_id: '80.11.black-bell-toll',
      })),
    });
    expect(await new LoreSubmissionRepository().findThumbnail('sub-1')).toEqual({
      kind: 'map_location',
      mapLocationId: '80.11.black-bell-toll',
    });

    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: mockThumbnailSelect(thumbnailRow({
        kind: 'custom',
        token_id: null,
        custom_image_url: 'https://example.com/bell.jpg',
        custom_image_attribution: 'Art by the Ashen Choir',
      })),
    });
    expect(await new LoreSubmissionRepository().findThumbnail('sub-1')).toEqual({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
      attribution: 'Art by the Ashen Choir',
    });
  });

  it('findThumbnail maps a custom row without attribution to an undefined attribution', async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({
      from: mockThumbnailSelect(thumbnailRow({
        kind: 'custom',
        token_id: null,
        custom_image_url: 'https://example.com/bell.jpg',
        custom_image_attribution: null,
      })),
    });

    expect(await new LoreSubmissionRepository().findThumbnail('sub-1')).toEqual({
      kind: 'custom',
      imageUrl: 'https://example.com/bell.jpg',
      attribution: undefined,
    });
  });

  it('findThumbnail returns null when no row exists', async () => {
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from: mockThumbnailSelect(null) });

    expect(await new LoreSubmissionRepository().findThumbnail('sub-1')).toBeNull();
  });

  it('rowToThumbnail returns null for rows with missing payload columns or unknown kinds', () => {
    expect(rowToThumbnail({
      submission_id: 'sub-1',
      kind: 'token',
      token_id: null,
      map_location_id: null,
      custom_image_url: null,
      custom_image_attribution: null,
      created_at: '2026-05-09T00:00:00.000Z',
      updated_at: '2026-05-09T00:00:00.000Z',
    })).toBeNull();
    expect(rowToThumbnail({
      submission_id: 'sub-1',
      kind: 'custom' as never,
      token_id: null,
      map_location_id: null,
      custom_image_url: null,
      custom_image_attribution: null,
      created_at: '2026-05-09T00:00:00.000Z',
      updated_at: '2026-05-09T00:00:00.000Z',
    })).toBeNull();
  });

  it('replaceThumbnail deletes the existing row before upserting the new one', async () => {
    const calls: string[] = [];
    const deleteEq = jest.fn(async () => {
      calls.push('delete.eq');
      return { error: null };
    });
    const upsert = jest.fn(() => {
      calls.push('upsert');
      return {
        select: jest.fn(() => ({
          maybeSingle: jest.fn(async () => ({
            data: thumbnailRow(),
            error: null,
          })),
        })),
      };
    });
    const from = jest.fn((table: string) => {
      if (table !== 'lore_submission_thumbnails') throw new Error(`Unexpected table ${table}`);
      return {
        delete: jest.fn(() => ({ eq: deleteEq })),
        upsert,
      };
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const result = await new LoreSubmissionRepository().replaceThumbnail('sub-1', { kind: 'token', tokenId: '42' });

    expect(deleteEq).toHaveBeenCalledWith('submission_id', 'sub-1');
    expect(upsert).toHaveBeenCalledWith({
      submission_id: 'sub-1',
      kind: 'token',
      token_id: '42',
      map_location_id: null,
      custom_image_url: null,
      custom_image_attribution: null,
    });
    // The delete must be awaited (and succeed) before the upsert runs.
    expect(calls).toEqual(['delete.eq', 'upsert']);
    expect(result).toEqual({ kind: 'token', tokenId: '42' });
  });

  it.each([
    {
      label: 'map_location',
      thumbnail: { kind: 'map_location', mapLocationId: '80.11.black-bell-toll' },
      insertRow: {
        submission_id: 'sub-1',
        kind: 'map_location',
        token_id: null,
        map_location_id: '80.11.black-bell-toll',
        custom_image_url: null,
        custom_image_attribution: null,
      },
    },
    {
      label: 'custom with attribution',
      thumbnail: { kind: 'custom', imageUrl: 'https://example.com/bell.jpg', attribution: 'Art by the Ashen Choir' },
      insertRow: {
        submission_id: 'sub-1',
        kind: 'custom',
        token_id: null,
        map_location_id: null,
        custom_image_url: 'https://example.com/bell.jpg',
        custom_image_attribution: 'Art by the Ashen Choir',
      },
    },
    {
      label: 'custom without attribution',
      thumbnail: { kind: 'custom', imageUrl: 'https://example.com/bell.jpg' },
      insertRow: {
        submission_id: 'sub-1',
        kind: 'custom',
        token_id: null,
        map_location_id: null,
        custom_image_url: 'https://example.com/bell.jpg',
        custom_image_attribution: null,
      },
    },
  ])('replaceThumbnail upserts the exact $label insert row', async ({ thumbnail, insertRow }) => {
    const deleteEq = jest.fn(async () => ({ error: null }));
    const upsert = jest.fn(() => ({
      select: jest.fn(() => ({
        maybeSingle: jest.fn(async () => ({ data: insertRow, error: null })),
      })),
    }));
    const from = jest.fn((table: string) => {
      if (table !== 'lore_submission_thumbnails') throw new Error(`Unexpected table ${table}`);
      return { delete: jest.fn(() => ({ eq: deleteEq })), upsert };
    });
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    await new LoreSubmissionRepository().replaceThumbnail('sub-1', thumbnail);

    expect(upsert).toHaveBeenCalledWith(insertRow);
  });
});
