-- Concord Transfers Table
-- Tracks ERC1155 TransferSingle and TransferBatch events from TokensOfConcord contract
-- Contract: 0x1d38150f1fd989fb89ab19518a9c4e93c5554634

CREATE TABLE IF NOT EXISTS concord_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1,
  operator_address TEXT,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT NOT NULL,
  log_index INTEGER NOT NULL DEFAULT 0,
  event_timestamp TIMESTAMPTZ,
  is_mint BOOLEAN GENERATED ALWAYS AS (from_address = '0x0000000000000000000000000000000000000000') STORED,
  is_burn BOOLEAN GENERATED ALWAYS AS (to_address = '0x0000000000000000000000000000000000000000') STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_hash, log_index, token_id)
);

-- Indexes for common queries
CREATE INDEX idx_concord_transfers_token_id ON concord_transfers(token_id);
CREATE INDEX idx_concord_transfers_from ON concord_transfers(from_address);
CREATE INDEX idx_concord_transfers_to ON concord_transfers(to_address);
CREATE INDEX idx_concord_transfers_block ON concord_transfers(block_number DESC);
CREATE INDEX idx_concord_transfers_mint ON concord_transfers(is_mint) WHERE is_mint = true;

-- Row Level Security
ALTER TABLE concord_transfers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for concord_transfers"
  ON concord_transfers
  FOR SELECT
  USING (true);

-- Grants
GRANT SELECT ON concord_transfers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON concord_transfers TO service_role;
