-- Migration: Add batch_index column to concord_transfers
-- Purpose: Properly track ERC-1155 batch transfers without fabricating log indices
-- Feature: 021-indexer-fixes

-- Add batch_index column with default 0 (correct for existing TransferSingle events)
ALTER TABLE concord_transfers
ADD COLUMN IF NOT EXISTS batch_index INTEGER NOT NULL DEFAULT 0;

-- Drop old unique constraint if it exists
ALTER TABLE concord_transfers
DROP CONSTRAINT IF EXISTS concord_transfers_transaction_hash_log_index_token_id_key;

-- Add new unique constraint including batch_index
-- This allows multiple tokens from the same TransferBatch event to be stored uniquely
ALTER TABLE concord_transfers
ADD CONSTRAINT concord_transfers_unique_event
UNIQUE(transaction_hash, log_index, batch_index, token_id);

-- Add index for efficient batch queries
CREATE INDEX IF NOT EXISTS idx_concord_transfers_batch
ON concord_transfers(transaction_hash, log_index, batch_index);

-- Grant permissions for API access
GRANT SELECT ON concord_transfers TO anon, authenticated;
GRANT ALL ON concord_transfers TO service_role;
