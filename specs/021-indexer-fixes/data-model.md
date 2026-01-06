# Data Model: Blockchain Indexer Reliability Fixes

**Feature**: 021-indexer-fixes
**Date**: 2026-01-06

## Schema Changes

### concord_transfers Table

**Current Schema** (from `20251231200000_concord_transfers.sql`):
```sql
CREATE TABLE concord_transfers (
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
  is_mint BOOLEAN GENERATED ALWAYS AS (...) STORED,
  is_burn BOOLEAN GENERATED ALWAYS AS (...) STORED,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transaction_hash, log_index, token_id)
);
```

**Required Changes**:

| Change | Column | Type | Default | Notes |
|--------|--------|------|---------|-------|
| ADD | batch_index | INTEGER | 0 | Position in batch for TransferBatch events |
| MODIFY | UNIQUE constraint | - | - | Add batch_index to uniqueness |

**New Schema**:
```sql
-- Add batch_index column
ALTER TABLE concord_transfers
ADD COLUMN IF NOT EXISTS batch_index INTEGER NOT NULL DEFAULT 0;

-- Drop old constraint
ALTER TABLE concord_transfers
DROP CONSTRAINT IF EXISTS concord_transfers_transaction_hash_log_index_token_id_key;

-- Add new constraint including batch_index
ALTER TABLE concord_transfers
ADD CONSTRAINT concord_transfers_unique_event
UNIQUE(transaction_hash, log_index, batch_index, token_id);

-- Add index for batch queries
CREATE INDEX IF NOT EXISTS idx_concord_transfers_batch
ON concord_transfers(transaction_hash, log_index, batch_index);
```

## Entity Definitions

### BlockchainEvent (Abstract)

Base entity for all indexed events:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| transaction_hash | string | Yes | Transaction containing this event |
| block_number | bigint | Yes | Block number where event occurred |
| log_index | integer | Yes | Position of log within transaction |

### ConcordTransfer (extends BlockchainEvent)

ERC-1155 transfer record:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token_id | integer | Yes | Concord token ID |
| from_address | string | Yes | Sender address |
| to_address | string | Yes | Recipient address |
| amount | integer | Yes | Number of tokens transferred |
| operator_address | string | No | Address that initiated transfer |
| batch_index | integer | Yes | Position in batch (0 for single transfers) |

**Unique Key**: (transaction_hash, log_index, batch_index, token_id)

### IndexerState

Persisted state for resumable backfills:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chainId | integer | Yes | Network chain ID |
| contract | string | Yes | Contract address being indexed |
| lastIndexedBlock | string | Yes | Last fully processed block (as string for BigInt) |

**Storage**: JSON file at `scripts/indexer/state-{indexer-name}.json`

## Relationships

```
ContractAddresses (lib/contracts/addresses.ts)
    │
    ├── WAGDIE_CONTRACT ──────► transfer-indexer.ts
    ├── CONCORD_CONTRACT ─────► concord-indexer.ts
    ├── WAGDIE_WORLD_CONTRACT ► staking-indexer.ts
    ├── SEARING_CONTRACT ─────► searing-indexer.ts
    ├── SPREAD_CONTRACT ──────► infection-indexer.ts
    └── MUSHROOM_CONTRACT ────► infection-indexer.ts

BlockchainEvent
    │
    ├── ConcordTransfer ──► concord_transfers table
    │   └── batch_index (NEW) for TransferBatch events
    │
    ├── StakingEvent ─────► staking_events table
    ├── SearingEvent ─────► searing_events table
    └── InfectionEvent ───► infection_events table
```

## Migration Strategy

1. **Non-destructive**: Add column with default, then modify constraint
2. **Backwards compatible**: Existing data gets `batch_index = 0` (correct for TransferSingle)
3. **No downtime**: ALTER TABLE operations are fast for this table size

## Validation Rules

| Entity | Rule | Error |
|--------|------|-------|
| ConcordTransfer | batch_index >= 0 | Invalid batch position |
| ConcordTransfer | log_index >= 0 | Invalid log index |
| ConcordTransfer | amount > 0 | Amount must be positive |
| BlockchainEvent | transaction_hash matches /^0x[a-f0-9]{64}$/ | Invalid tx hash |
| BlockchainEvent | block_number > 0 | Invalid block number |
