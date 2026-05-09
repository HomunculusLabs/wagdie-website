-- Community lore submissions, source/media links, and append-only review log.
-- Public/API access should flow through server-side services using the service role.

CREATE TABLE IF NOT EXISTS lore_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  submitter_address TEXT NOT NULL CHECK (submitter_address ~ '^0x[0-9a-f]{40}$'),
  token_id TEXT NOT NULL CHECK (
    token_id ~ '^[1-9][0-9]*$'
    AND token_id::INTEGER BETWEEN 1 AND 6666
  ),

  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 120),
  summary TEXT NOT NULL CHECK (char_length(summary) BETWEEN 20 AND 500),
  body_markdown TEXT NOT NULL CHECK (char_length(body_markdown) BETWEEN 1 AND 50000),
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

  curated_title TEXT CHECK (curated_title IS NULL OR char_length(curated_title) BETWEEN 3 AND 120),
  curated_summary TEXT CHECK (curated_summary IS NULL OR char_length(curated_summary) BETWEEN 20 AND 500),
  curated_body_markdown TEXT CHECK (curated_body_markdown IS NULL OR char_length(curated_body_markdown) BETWEEN 1 AND 50000),
  curated_tags TEXT[],

  season_id TEXT,
  character_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  location_ids TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'submitted',
    'changes_requested',
    'public',
    'canonized',
    'closed'
  )),
  review_note TEXT,
  status_reason TEXT,
  last_admin_address TEXT CHECK (last_admin_address IS NULL OR last_admin_address ~ '^0x[0-9a-f]{40}$'),

  published_slug TEXT CHECK (published_slug IS NULL OR published_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  visibility TEXT NOT NULL DEFAULT 'pending' CHECK (visibility IN ('pending', 'public', 'hidden')),
  published_kind TEXT CHECK (published_kind IS NULL OR published_kind IN ('community', 'official')),

  canon_status TEXT NOT NULL DEFAULT 'community' CHECK (canon_status IN (
    'canon',
    'canonizing',
    'community',
    'disputed',
    'non_canon',
    'archival'
  )),
  canon_stage_id TEXT NOT NULL DEFAULT 'community_recorded' CHECK (canon_stage_id IN (
    'archived',
    'community_recorded',
    'source_attributed',
    'continuity_review',
    'canon_candidate',
    'canonized',
    'disputed',
    'rejected'
  )),
  canon_note TEXT,
  canon_path JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(canon_path) = 'array'),
  publication_snapshot JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  canonized_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  CHECK (array_length(tags, 1) IS NULL OR array_length(tags, 1) <= 10),
  CHECK (curated_tags IS NULL OR array_length(curated_tags, 1) IS NULL OR array_length(curated_tags, 1) <= 10),
  CHECK (status NOT IN ('public', 'canonized') OR published_slug IS NOT NULL),
  CHECK (visibility <> 'public' OR status IN ('public', 'canonized')),
  CHECK (status NOT IN ('public', 'canonized') OR visibility = 'public'),
  CHECK (published_kind IS NULL OR status IN ('public', 'canonized')),
  CHECK (status <> 'canonized' OR published_kind = 'official'),
  CHECK (published_kind IS NULL OR visibility = 'public')
);

COMMENT ON TABLE lore_submissions IS 'Wallet-authenticated community lore submissions for WAGDIE token owners.';
COMMENT ON COLUMN lore_submissions.token_id IS 'WAGDIE character token id being submitted against; stored as text to match lore graph ids.';
COMMENT ON COLUMN lore_submissions.publication_snapshot IS 'Snapshot used when a reviewed submission becomes public/canonized.';
COMMENT ON COLUMN lore_submissions.canon_path IS 'Canonization path for DB-backed community submissions.';

CREATE INDEX IF NOT EXISTS idx_lore_submissions_submitter_created
  ON lore_submissions(submitter_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lore_submissions_token_created
  ON lore_submissions(token_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lore_submissions_token_submitter_created
  ON lore_submissions(token_id, submitter_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lore_submissions_status_submitted
  ON lore_submissions(status, submitted_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lore_submissions_published_slug_unique
  ON lore_submissions(published_slug)
  WHERE published_slug IS NOT NULL;

DROP TRIGGER IF EXISTS update_lore_submissions_updated_at ON lore_submissions;
CREATE TRIGGER update_lore_submissions_updated_at
  BEFORE UPDATE ON lore_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS lore_submission_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES lore_submissions(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'source_media' CHECK (role IN ('source', 'media', 'source_media')),
  link_type TEXT NOT NULL CHECK (link_type IN ('twitter', 'youtube', 'generic')),
  original_url TEXT NOT NULL CHECK (char_length(original_url) BETWEEN 1 AND 2048),
  normalized_url TEXT NOT NULL CHECK (char_length(normalized_url) BETWEEN 1 AND 2048),
  display_title TEXT,
  platform TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  archived_url TEXT CHECK (archived_url IS NULL OR char_length(archived_url) <= 2048),
  attribution TEXT,
  preservation_note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (jsonb_typeof(metadata) = 'object'),
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (submission_id, normalized_url)
);

COMMENT ON TABLE lore_submission_links IS 'Source/media URLs attached to community lore submissions.';
COMMENT ON COLUMN lore_submission_links.normalized_url IS 'Deterministic normalized URL used for deduplication.';
COMMENT ON COLUMN lore_submission_links.metadata IS 'Optional parsed metadata, such as YouTube video id and nocookie embed URL.';

CREATE INDEX IF NOT EXISTS idx_lore_submission_links_submission_sort
  ON lore_submission_links(submission_id, sort_order ASC, created_at ASC);

DROP TRIGGER IF EXISTS update_lore_submission_links_updated_at ON lore_submission_links;
CREATE TRIGGER update_lore_submission_links_updated_at
  BEFORE UPDATE ON lore_submission_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS lore_submission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES lore_submissions(id) ON DELETE CASCADE,

  actor_address TEXT NOT NULL CHECK (actor_address ~ '^0x[0-9a-f]{40}$'),
  action TEXT NOT NULL CHECK (action IN (
    'submit',
    'resubmit',
    'request_changes',
    'publish',
    'canonize',
    'decanonize',
    'close',
    'hide',
    'curate',
    'admin_note'
  )),
  from_status TEXT CHECK (from_status IS NULL OR from_status IN (
    'submitted',
    'changes_requested',
    'public',
    'canonized',
    'closed'
  )),
  to_status TEXT NOT NULL CHECK (to_status IN (
    'submitted',
    'changes_requested',
    'public',
    'canonized',
    'closed'
  )),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE lore_submission_reviews IS 'Append-only moderation/audit history for lore submissions.';

CREATE INDEX IF NOT EXISTS idx_lore_submission_reviews_submission_created
  ON lore_submission_reviews(submission_id, created_at DESC);

ALTER TABLE lore_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_submission_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_submission_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manage lore submissions" ON lore_submissions;
CREATE POLICY "Service role manage lore submissions"
  ON lore_submissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore submission links" ON lore_submission_links;
CREATE POLICY "Service role manage lore submission links"
  ON lore_submission_links
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manage lore submission reviews" ON lore_submission_reviews;
CREATE POLICY "Service role manage lore submission reviews"
  ON lore_submission_reviews
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON lore_submissions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_submission_links TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON lore_submission_reviews TO service_role;
