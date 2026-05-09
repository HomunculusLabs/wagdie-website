import { LoreSubmissionRepository } from '@/lib/repositories/lore-submission-repository';
import { getSupabaseAdmin } from '@/lib/supabase';

jest.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: jest.fn(),
}));

const row = {
  id: 'sub-1',
  submitter_address: '0xabcdef0000000000000000000000000000000001',
  token_id: '42',
  title: 'A Fallen Bell Rings',
  summary: 'A community account of a strange bell echoing after the searing.',
  body_markdown: 'A bell rang beneath the ash.',
  tags: null,
  curated_title: null,
  curated_summary: null,
  curated_body_markdown: null,
  curated_tags: null,
  season_id: null,
  character_ids: null,
  location_ids: null,
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
  canon_path: null,
  publication_snapshot: null,
  created_at: '2026-05-09T00:00:00.000Z',
  updated_at: '2026-05-09T00:00:00.000Z',
  submitted_at: '2026-05-09T00:00:00.000Z',
  reviewed_at: null,
  published_at: null,
  canonized_at: null,
  closed_at: null,
};

describe('LoreSubmissionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps nullable database arrays to stable submission DTO arrays', async () => {
    const maybeSingle = jest.fn(async () => ({ data: row, error: null }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const repository = new LoreSubmissionRepository();
    const submission = await repository.findById('sub-1');

    expect(from).toHaveBeenCalledWith('lore_submissions');
    expect(eq).toHaveBeenCalledWith('id', 'sub-1');
    expect(submission).toMatchObject({
      id: 'sub-1',
      tags: [],
      character_ids: [],
      location_ids: [],
      canon_path: [],
    });
  });

  it('throws explicit repository errors when Supabase returns an error', async () => {
    const maybeSingle = jest.fn(async () => ({ data: null, error: { message: 'db down' } }));
    const eq = jest.fn(() => ({ maybeSingle }));
    const select = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ select }));
    (getSupabaseAdmin as jest.Mock).mockReturnValue({ from });

    const repository = new LoreSubmissionRepository();

    await expect(repository.findById('sub-1')).rejects.toThrow('Failed to fetch lore submission: db down');
  });
});
