# Quickstart: Blockchain Indexer Reliability Fixes

**Feature**: 021-indexer-fixes
**Date**: 2026-01-06

## Overview

This feature fixes four reliability issues in the blockchain indexer system:
1. Pagination skip bug when Etherscan returns max results
2. Batch logIndex fabrication for ERC-1155 transfers
3. Hardcoded contract addresses in indexers
4. Serial database writes during backfills

## Prerequisites

- Node.js 18+
- Access to Supabase instance
- Etherscan API key (optional but recommended)
- Environment variables configured

## Setup

### 1. Apply Database Migration

```bash
# From project root
npx supabase db push
# Or manually apply migration
psql $DATABASE_URL < supabase/migrations/20260106000000_add_batch_index.sql
```

### 2. Verify Migration

```sql
-- Check batch_index column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'concord_transfers' AND column_name = 'batch_index';

-- Verify unique constraint
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'concord_transfers'::regclass;
```

## Testing the Fixes

### Test 1: Pagination (P1)

Run a backfill against a known dense block range:

```bash
# Set a small block range that contains many events
START_BLOCK=15422334 END_BLOCK=15422400 \
  npx tsx scripts/indexer/transfer-indexer.ts
```

Expected: All events captured, logs show "Block range subdivision" when needed.

### Test 2: Batch Transfers (P2)

Process a known TransferBatch transaction:

```bash
# Test with specific block containing batch transfer
START_BLOCK=16000000 END_BLOCK=16000100 \
  npx tsx scripts/indexer/concord-indexer.ts
```

Expected: Each batch item has unique (tx_hash, log_index, batch_index, token_id).

### Test 3: Contract Addresses (P3)

Verify addresses come from central config:

```bash
# Grep for hardcoded addresses - should find none in indexers
grep -r "0x659a4bdaaacc62d2bd9cb18225d9c89b5b697a5a" scripts/indexer/
# Should only find import from lib/contracts/addresses.ts
```

### Test 4: Batched Writes (P3)

Measure backfill performance:

```bash
# Time a 10k event backfill
time START_BLOCK=15422334 \
  npx tsx scripts/indexer/transfer-indexer.ts
```

Expected: Logs show "Batch of X in Yms", 3x faster than baseline.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ETHERSCAN_API_KEY` | No | Increases rate limit from 1/5s to 5/s |
| `CHAIN_ID` | No | Default: 1 (mainnet). Set to 11155111 for Sepolia |
| `WS_RPC_URL` | Yes | WebSocket RPC endpoint for live watching |
| `START_BLOCK` | No | Override starting block for backfill |

## Verification Checklist

- [ ] Migration applied successfully
- [ ] Existing data preserved (batch_index = 0)
- [ ] No hardcoded addresses in `scripts/indexer/*.ts`
- [ ] Backfill completes without skipped events
- [ ] Batch transfers have unique records
- [ ] Performance logs show batched writes

## Rollback

If issues arise:

```sql
-- Remove batch_index column (loses batch position data)
ALTER TABLE concord_transfers DROP COLUMN IF EXISTS batch_index;

-- Restore original constraint
ALTER TABLE concord_transfers
ADD CONSTRAINT concord_transfers_transaction_hash_log_index_token_id_key
UNIQUE(transaction_hash, log_index, token_id);
```

## Files Modified

| File | Changes |
|------|---------|
| `scripts/indexer/transfer-indexer.ts` | Pagination fix, address import |
| `scripts/indexer/concord-indexer.ts` | Pagination fix, address import |
| `scripts/indexer/staking-indexer.ts` | Pagination fix, address import |
| `scripts/indexer/searing-indexer.ts` | Pagination fix, address import |
| `scripts/indexer/infection-indexer.ts` | Pagination fix, address import |
| `scripts/indexer/concord-transfer-handler.ts` | batch_index, batched writes |
| `scripts/indexer/staking-event-handler.ts` | Batched writes |
| `scripts/indexer/searing-event-handler.ts` | Batched writes |
| `scripts/indexer/infection-event-handler.ts` | Batched writes |
| `scripts/indexer/event-handler.ts` | Batched writes |
| `supabase/migrations/20260106000000_add_batch_index.sql` | New migration |
