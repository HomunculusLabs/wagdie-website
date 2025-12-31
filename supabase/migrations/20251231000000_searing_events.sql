-- Searing Events Table
-- Tracks when concords (equipment) are seared/applied to WAGDIE characters

CREATE TABLE IF NOT EXISTS searing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,           -- Character ID (wagdieId)
  concord_id INTEGER NOT NULL,         -- Concord/equipment ID
  event_type TEXT NOT NULL CHECK (event_type IN ('sear', 'tame')),
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL DEFAULT 0,
  actor_address TEXT,                  -- Who triggered searing
  event_timestamp TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_hash, log_index)
);

-- Indexes for common queries
CREATE INDEX idx_searing_events_token_id ON searing_events(token_id);
CREATE INDEX idx_searing_events_concord_id ON searing_events(concord_id);
CREATE INDEX idx_searing_events_block_number ON searing_events(block_number DESC);
CREATE INDEX idx_searing_events_actor ON searing_events(actor_address);
CREATE INDEX idx_searing_events_created_at ON searing_events(created_at DESC);

-- Row Level Security
ALTER TABLE searing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON searing_events FOR SELECT USING (true);
CREATE POLICY "Service role insert" ON searing_events FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON searing_events TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON searing_events TO service_role;
