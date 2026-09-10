-- Thumbnail + map link support for community lore submissions
-- Feature: lore thumbnails (token art / map location / custom image)
-- Created: 2026-09-10

-- Thumbnail chosen by the submitter for their lore submission.
-- shape: { kind: 'token' | 'map_location' | 'custom', ... } — see
-- lib/lore/submissions/thumbnail.ts for the discriminated union.
CREATE TABLE IF NOT EXISTS lore_submission_thumbnails (
  submission_id UUID PRIMARY KEY REFERENCES lore_submissions(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('token', 'map_location', 'custom')),
  token_id TEXT,
  map_location_id TEXT REFERENCES locations(id) ON DELETE SET NULL,
  custom_image_url TEXT,
  custom_image_attribution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (kind = 'token' AND token_id IS NOT NULL) OR
    (kind = 'map_location' AND map_location_id IS NOT NULL) OR
    (kind = 'custom' AND custom_image_url IS NOT NULL)
  )
);

-- Curated links between static lore locations and live map locations,
-- so lore pages can embed/link the interactive map.
CREATE TABLE IF NOT EXISTS lore_map_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lore_location_slug TEXT NOT NULL,
  map_location_id TEXT NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (lore_location_slug)
);

CREATE INDEX IF NOT EXISTS idx_lore_map_links_map_location ON lore_map_links(map_location_id);

ALTER TABLE lore_submission_thumbnails ENABLE ROW LEVEL SECURITY;
ALTER TABLE lore_map_links ENABLE ROW LEVEL SECURITY;

-- Thumbnails: submitters can insert/update their own; everyone can read
-- (submitted lore is public once published; admin curation handles the rest).
CREATE POLICY "thumbnails_readable_by_all" ON lore_submission_thumbnails
  FOR SELECT USING (true);

CREATE POLICY "thumbnails_insert_own" ON lore_submission_thumbnails
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lore_submissions s
      WHERE s.id = submission_id
        AND s.submitter_address = auth.jwt() ->> 'eth_address'
    )
  );

CREATE POLICY "thumbnails_update_own" ON lore_submission_thumbnails
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lore_submissions s
      WHERE s.id = submission_id
        AND s.submitter_address = auth.jwt() ->> 'eth_address'
    )
  );

-- Map links: readable by all, writable by admins only (enforced via the
-- service layer's requireAdmin in addition to RLS deny-by-default on write).
CREATE POLICY "map_links_readable_by_all" ON lore_map_links
  FOR SELECT USING (true);
