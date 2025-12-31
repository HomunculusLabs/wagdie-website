-- Migration: Create infection_events table for on-chain event audit trail
-- This stores InfectionSpread events from the Spread contract and
-- mushroom burn events (cure signals) from the Mushroom ERC1155 contract.

-- Create infection_events table
CREATE TABLE IF NOT EXISTS infection_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('infection', 'cure')),
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL DEFAULT 0,
  actor_address TEXT,
  amount BIGINT,  -- For cure events: number of mushrooms burned
  event_timestamp TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_hash, log_index)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_infection_events_token_id ON infection_events(token_id);
CREATE INDEX IF NOT EXISTS idx_infection_events_event_type ON infection_events(event_type);
CREATE INDEX IF NOT EXISTS idx_infection_events_block_number ON infection_events(block_number DESC);
CREATE INDEX IF NOT EXISTS idx_infection_events_created_at ON infection_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_infection_events_actor ON infection_events(actor_address);

-- Composite index for character history queries
CREATE INDEX IF NOT EXISTS idx_infection_events_token_block ON infection_events(token_id, block_number DESC);

-- Enable Row Level Security
ALTER TABLE infection_events ENABLE ROW LEVEL SECURITY;

-- Public read access (anyone can view infection history)
CREATE POLICY "Public read access for infection_events"
  ON infection_events
  FOR SELECT
  USING (true);

-- Service role can insert/update (indexer uses service role)
CREATE POLICY "Service role insert for infection_events"
  ON infection_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role update for infection_events"
  ON infection_events
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Grant permissions to roles
GRANT SELECT ON infection_events TO anon, authenticated;
GRANT INSERT, UPDATE ON infection_events TO service_role;

-- Add comment for documentation
COMMENT ON TABLE infection_events IS 'Audit trail of infection and cure events indexed from on-chain logs';
COMMENT ON COLUMN infection_events.event_type IS 'Type of event: infection (from Spread contract) or cure (from Mushroom burn)';
COMMENT ON COLUMN infection_events.actor_address IS 'Address that triggered the event (sender for infection, burner for cure)';
COMMENT ON COLUMN infection_events.amount IS 'For cure events: number of mushroom tokens burned';
COMMENT ON COLUMN infection_events.metadata IS 'Additional event data in JSON format';
