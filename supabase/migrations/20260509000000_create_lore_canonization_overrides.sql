-- Lore canonization override drafts/published state for admin workflows.
-- Static lore data remains the fallback when an override row is absent.

CREATE TABLE IF NOT EXISTS lore_canonization_overrides (
  event_id TEXT PRIMARY KEY,

  -- Editable admin draft/current fields.
  status TEXT NOT NULL CHECK (status IN ('canon', 'canonizing', 'community', 'disputed', 'non_canon', 'archival')),
  stage_id TEXT NOT NULL CHECK (stage_id IN (
    'archived',
    'community_recorded',
    'source_attributed',
    'continuity_review',
    'canon_candidate',
    'canonized',
    'disputed',
    'rejected'
  )),
  note TEXT,
  path JSONB NOT NULL DEFAULT '[]'::jsonb,
  publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),

  -- Last published snapshot. These remain intact while admins save newer drafts.
  published_status TEXT CHECK (published_status IS NULL OR published_status IN ('canon', 'canonizing', 'community', 'disputed', 'non_canon', 'archival')),
  published_stage_id TEXT CHECK (published_stage_id IS NULL OR published_stage_id IN (
    'archived',
    'community_recorded',
    'source_attributed',
    'continuity_review',
    'canon_candidate',
    'canonized',
    'disputed',
    'rejected'
  )),
  published_note TEXT,
  published_path JSONB,

  updated_by TEXT NOT NULL,
  published_by TEXT,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (published_status IS NULL AND published_stage_id IS NULL AND published_path IS NULL AND published_by IS NULL AND published_at IS NULL)
    OR
    (published_status IS NOT NULL AND published_stage_id IS NOT NULL AND published_path IS NOT NULL AND published_by IS NOT NULL AND published_at IS NOT NULL)
  )
);

COMMENT ON TABLE lore_canonization_overrides IS 'Admin-authored canonization overrides for static lore events. Deleting a row restores static canonization.';
COMMENT ON COLUMN lore_canonization_overrides.event_id IS 'Static lore event id from lib/lore/data/events.ts';
COMMENT ON COLUMN lore_canonization_overrides.path IS 'Editable draft/current canonization path replacing the static event canon path in admin';
COMMENT ON COLUMN lore_canonization_overrides.published_path IS 'Last explicitly published canonization path for future public effective reads';
COMMENT ON COLUMN lore_canonization_overrides.updated_by IS 'Admin wallet address that last saved the draft/current override';
COMMENT ON COLUMN lore_canonization_overrides.published_by IS 'Admin wallet address that most recently published this override';

CREATE INDEX IF NOT EXISTS idx_lore_canonization_overrides_publication_status
ON lore_canonization_overrides(publication_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_lore_canonization_overrides_published_at
ON lore_canonization_overrides(published_at DESC)
WHERE published_at IS NOT NULL;

DROP TRIGGER IF EXISTS update_lore_canonization_overrides_updated_at ON lore_canonization_overrides;
CREATE TRIGGER update_lore_canonization_overrides_updated_at
  BEFORE UPDATE ON lore_canonization_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE lore_canonization_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manage lore canonization overrides" ON lore_canonization_overrides;
CREATE POLICY "Service role manage lore canonization overrides"
  ON lore_canonization_overrides
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON lore_canonization_overrides TO service_role;
