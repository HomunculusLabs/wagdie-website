-- Concord searing map and materialization state
-- Adds the legacy searing-map data contract used by the searing UX/materializer.

-- Harden the concord_transfers batch uniqueness contract. A prior migration adds
-- these fields; keeping this here makes Item 1 safe for databases that missed it.
ALTER TABLE concord_transfers
ADD COLUMN IF NOT EXISTS batch_index INTEGER DEFAULT 0;

ALTER TABLE concord_transfers
ALTER COLUMN batch_index SET DEFAULT 0;

UPDATE concord_transfers
SET batch_index = 0
WHERE batch_index IS NULL;

ALTER TABLE concord_transfers
ALTER COLUMN batch_index SET NOT NULL;

ALTER TABLE concord_transfers
DROP CONSTRAINT IF EXISTS concord_transfers_transaction_hash_log_index_token_id_key;

ALTER TABLE concord_transfers
DROP CONSTRAINT IF EXISTS concord_transfers_unique_event;

ALTER TABLE concord_transfers
ADD CONSTRAINT concord_transfers_unique_event
UNIQUE(transaction_hash, log_index, batch_index, token_id);

CREATE INDEX IF NOT EXISTS idx_concord_transfers_batch
ON concord_transfers(transaction_hash, log_index, batch_index);

-- Searing map imported from the legacy Firestore searing_map collection.
CREATE TABLE IF NOT EXISTS concord_searing_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concord_token_id INTEGER NOT NULL,
  token_name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  new_trait TEXT NOT NULL DEFAULT '',
  makes_bald BOOLEAN NOT NULL DEFAULT FALSE,
  alt_1 JSONB,
  alt_2 JSONB,
  alt_3 JSONB,
  alt_4 JSONB,
  alt_5 JSONB,
  alt_6 JSONB,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'legacy-firestore',
  imported_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(concord_token_id),
  UNIQUE(token_name)
);

COMMENT ON TABLE concord_searing_maps IS 'Legacy concord searing map entries used to resolve seared trait/materialization behavior';
COMMENT ON COLUMN concord_searing_maps.concord_token_id IS 'ERC-1155 Concord token ID from the legacy tokenId field';
COMMENT ON COLUMN concord_searing_maps.token_name IS 'Legacy Firestore document ID / display token name';
COMMENT ON COLUMN concord_searing_maps.raw_data IS 'Original imported legacy searing-map payload for audit/debugging';

CREATE INDEX IF NOT EXISTS idx_concord_searing_maps_token_id
ON concord_searing_maps(concord_token_id);

CREATE INDEX IF NOT EXISTS idx_concord_searing_maps_token_name
ON concord_searing_maps(token_name);

DROP TRIGGER IF EXISTS update_concord_searing_maps_updated_at ON concord_searing_maps;
CREATE TRIGGER update_concord_searing_maps_updated_at
  BEFORE UPDATE ON concord_searing_maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Materialization state for the server-side seared artwork/read-model update path.
ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS materialization_status TEXT NOT NULL DEFAULT 'pending'
  CHECK (materialization_status IN ('pending', 'processing', 'completed', 'failed', 'skipped'));

ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS materialization_attempts INTEGER NOT NULL DEFAULT 0;

ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS materialization_error TEXT;

ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS materialized_at TIMESTAMPTZ;

ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS seared_image_url TEXT;

ALTER TABLE searing_events
ADD COLUMN IF NOT EXISTS materialization_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_searing_events_materialization_status
ON searing_events(materialization_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_searing_events_pending_materialization
ON searing_events(created_at ASC)
WHERE materialization_status IN ('pending', 'failed');

ALTER TABLE concord_searing_maps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for concord_searing_maps"
  ON concord_searing_maps
  FOR SELECT
  USING (true);

CREATE POLICY "Service role write access for concord_searing_maps"
  ON concord_searing_maps
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON concord_searing_maps TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON concord_searing_maps TO service_role;
GRANT SELECT, INSERT, UPDATE ON searing_events TO service_role;
GRANT SELECT ON searing_events TO anon, authenticated;
