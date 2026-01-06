# Research: Blockchain Indexer Reliability Fixes

**Feature**: 021-indexer-fixes
**Date**: 2026-01-06

## Research Topics

### 1. Etherscan API Pagination Handling

**Question**: How to handle cases where Etherscan returns max results (1000) that may span multiple blocks or be confined to a single block?

**Decision**: Binary block range subdivision with single-block detection

**Rationale**:
- Etherscan API V2 returns max 1000 results per query
- If 1000 results returned and all are from the same block, that block has >1000 events (rare but possible)
- If 1000 results span multiple blocks, we need to narrow the range to capture all events

**Algorithm**:
```
if (results.count >= MAX_RESULTS):
  firstBlock = results[0].blockNumber
  lastBlock = results[results.length-1].blockNumber

  if (firstBlock == lastBlock):
    // Single block with >1000 events - extremely rare
    // Log warning, process what we have, note potential data loss
    // Alternative: Use RPC getLogs which has no limit (but slower)

  else:
    // Multiple blocks - subdivide range
    midBlock = (fromBlock + toBlock) / 2
    processRange(fromBlock, midBlock)  // Recurse left
    processRange(midBlock + 1, toBlock) // Recurse right
```

**Alternatives considered**:
1. **Page offset parameter**: Etherscan doesn't support offset/page for log queries
2. **RPC getLogs exclusively**: Slower than Etherscan API, would increase backfill time significantly
3. **Increase page size**: Not supported by Etherscan API

---

### 2. ERC-1155 Batch Transfer Uniqueness

**Question**: How to uniquely identify each token in a TransferBatch event without fabricating log indices?

**Decision**: Add `batch_index` column to `concord_transfers` table

**Rationale**:
- Current approach: `logIndex + i` creates synthetic indices that may collide with real log indices
- Better approach: Preserve original `log_index` and add `batch_index` (0-based position in batch)
- Unique constraint becomes: `(transaction_hash, log_index, batch_index, token_id)`

**Schema change**:
```sql
ALTER TABLE concord_transfers ADD COLUMN batch_index INTEGER DEFAULT 0;
-- Update unique constraint
ALTER TABLE concord_transfers DROP CONSTRAINT concord_transfers_transaction_hash_log_index_token_id_key;
ALTER TABLE concord_transfers ADD CONSTRAINT concord_transfers_unique
  UNIQUE(transaction_hash, log_index, batch_index, token_id);
```

**Alternatives considered**:
1. **Composite key in metadata JSON**: Not enforceable at DB level, harder to query
2. **Separate table for batch items**: Over-engineering, adds complexity
3. **Hash-based ID**: Loses traceability to original event structure

---

### 3. Contract Address Centralization Pattern

**Question**: How should indexers import addresses from `lib/contracts/addresses.ts`?

**Decision**: Import `getContractAddresses(chainId)` function and call at initialization

**Rationale**:
- `lib/contracts/addresses.ts` already exports `getContractAddresses(chainId: number)`
- Supports mainnet (1) and Sepolia (11155111)
- Automatically applies environment variable overrides
- Chain ID is already available in indexers (hardcoded or from RPC)

**Usage pattern**:
```typescript
import { getContractAddresses } from '../../lib/contracts/addresses'

const CHAIN_ID = parseInt(process.env.CHAIN_ID || '1')
const addresses = getContractAddresses(CHAIN_ID)
const WAGDIE_CONTRACT = addresses.wagdie
const CONCORD_CONTRACT = addresses.tokensOfConcord
```

**Alternatives considered**:
1. **Direct import of constants**: Doesn't support env overrides
2. **Separate indexer config file**: Duplicates existing infrastructure
3. **Runtime address resolution via RPC**: Unnecessary complexity

---

### 4. Batched Database Writes

**Question**: What batch size and error handling strategy for bulk upserts?

**Decision**: Chunk size of 100 records, fail-fast with transaction per chunk

**Rationale**:
- Supabase/PostgreSQL handles 100-record upserts efficiently
- Each chunk is a separate transaction for partial failure isolation
- If a chunk fails, log the error and continue with remaining chunks
- Track total success/failure counts for monitoring

**Implementation pattern**:
```typescript
const BATCH_SIZE = 100

async function batchUpsert(records: Record[], tableName: string) {
  const chunks = chunkArray(records, BATCH_SIZE)
  let totalInserted = 0
  let totalFailed = 0

  for (const chunk of chunks) {
    const startTime = Date.now()
    const { error, count } = await client.from(tableName).upsert(chunk, options)
    const duration = Date.now() - startTime

    if (error) {
      console.error(`Batch failed: ${error.message}`)
      totalFailed += chunk.length
    } else {
      totalInserted += count || chunk.length
      log(`Batch of ${chunk.length} in ${duration}ms`)
    }
  }

  return { totalInserted, totalFailed }
}
```

**Alternatives considered**:
1. **Single transaction for all**: One failure rolls back everything
2. **Parallel chunk processing**: Risk of overwhelming database connections
3. **Copy command**: Not supported by Supabase JS client

---

## Implementation Order

Based on dependencies and risk:

1. **Contract addresses** (P3, lowest risk) - Simple import changes
2. **Batch_index column** (P2) - Schema change first, then handler update
3. **Batched writes** (P3) - Can be done after batch_index since handlers are being modified
4. **Pagination fix** (P1, highest impact) - Last, most complex, requires careful testing

This order minimizes risk while allowing incremental verification.
