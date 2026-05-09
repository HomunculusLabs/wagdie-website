import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoreSubmissionPublishControls } from '@/components/admin/lore-submissions/LoreSubmissionPublishControls';
import type { LoreSubmissionDetailDto, LoreSubmissionStatus } from '@/types/lore-submission';

const makeDetail = (status: LoreSubmissionStatus): LoreSubmissionDetailDto => ({
  submission: {
    id: 'sub-1',
    submitter_address: '0x0000000000000000000000000000000000000001',
    token_id: '7',
    title: 'A Bone Road',
    summary: 'A long enough summary for component testing.',
    body_markdown: 'Body',
    tags: [],
    curated_title: null,
    curated_summary: null,
    curated_body_markdown: null,
    curated_tags: null,
    season_id: null,
    character_ids: [],
    location_ids: [],
    status,
    review_note: null,
    status_reason: null,
    last_admin_address: null,
    published_slug: status === 'submitted' ? null : 'a-bone-road',
    visibility: status === 'submitted' ? 'pending' : 'public',
    published_kind: status === 'canonized' ? 'official' : status === 'public' ? 'community' : null,
    canon_status: status === 'canonized' ? 'canon' : 'community',
    canon_stage_id: status === 'canonized' ? 'canonized' : 'community_recorded',
    canon_note: null,
    canon_path: [],
    publication_snapshot: null,
    created_at: '2026-05-09T00:00:00.000Z',
    updated_at: '2026-05-09T00:00:00.000Z',
    submitted_at: '2026-05-09T00:00:00.000Z',
    reviewed_at: null,
    published_at: status === 'submitted' ? null : '2026-05-09T00:00:00.000Z',
    canonized_at: status === 'canonized' ? '2026-05-09T00:00:00.000Z' : null,
    closed_at: null,
  },
  links: [],
  reviews: [],
});

const jsonResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
}) as unknown as Response;

describe('LoreSubmissionPublishControls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts to the canonize endpoint for public community lore', async () => {
    const fetchMock = jest.fn().mockResolvedValue(jsonResponse({ success: true, data: makeDetail('canonized') }));
    global.fetch = fetchMock;
    const onUpdated = jest.fn();

    render(<LoreSubmissionPublishControls detail={makeDetail('public')} onUpdated={onUpdated} />);

    fireEvent.change(screen.getByLabelText(/action note/i), {
      target: { value: 'Accepted into canon.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^canonize$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/lore/submissions/sub-1/canonize', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ note: 'Accepted into canon.' }),
    }));
    expect(onUpdated).toHaveBeenCalledWith(makeDetail('canonized'));
  });

  it('disables publish-only actions when status does not allow them', () => {
    render(<LoreSubmissionPublishControls detail={makeDetail('submitted')} onUpdated={jest.fn()} />);

    expect(screen.getByRole('button', { name: /publish community lore/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /^canonize$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /decanonize/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /unpublish/i })).toBeDisabled();
  });
});
