# Internal Interfaces: Blockchain Indexer Reliability Fixes

**Feature**: 021-indexer-fixes
**Date**: 2026-01-06

## Overview

This feature does not introduce new external APIs. This document defines the internal interfaces/contracts between components.

## Function Interfaces

### Block Range Subdivision

```typescript
/**
 * Recursively fetches logs from Etherscan, subdividing range when max results hit.
 * @param fromBlock - Starting block (inclusive)
 * @param toBlock - Ending block (inclusive) or 'latest'
 * @returns All logs in the range, never exceeding actual event count
 */
async function fetchLogsWithSubdivision(
  fromBlock: bigint,
  toBlock: bigint | 'latest'
): Promise<Log[]>
```

### Batched Upsert

```typescript
interface BatchUpsertResult {
  totalInserted: number
  totalFailed: number
  durationMs: number
}

/**
 * Upserts records in configurable batch sizes with error isolation.
 * @param records - Array of records to upsert
 * @param tableName - Target table name
 * @param batchSize - Records per batch (default: 100)
 * @returns Aggregate results across all batches
 */
async function batchUpsert<T extends Record<string, unknown>>(
  records: T[],
  tableName: string,
  batchSize?: number
): Promise<BatchUpsertResult>
```

### Contract Address Resolution

```typescript
// Already exists in lib/contracts/addresses.ts
// Indexers must use this instead of hardcoding

import { getContractAddresses, type Address } from '../../lib/contracts/addresses'

const chainId = parseInt(process.env.CHAIN_ID || '1')
const addresses = getContractAddresses(chainId)

// Usage:
const WAGDIE_CONTRACT: Address = addresses.wagdie
const CONCORD_CONTRACT: Address = addresses.tokensOfConcord
```

## Database Contracts

### concord_transfers Upsert

```typescript
interface ConcordTransferRecord {
  token_id: number
  from_address: string
  to_address: string
  amount: number
  operator_address: string
  transaction_hash: string
  block_number: number
  log_index: number
  batch_index: number  // NEW: 0 for TransferSingle, 0..N for TransferBatch
  metadata: Record<string, unknown>
}

// Upsert conflict target (after migration):
// UNIQUE(transaction_hash, log_index, batch_index, token_id)
```

## Event Handling Contract

All event handlers must implement:

```typescript
interface HandleResult {
  highestBlock: bigint | null
  processed: number
}

async function handle*Logs(
  logs: Log[],
  ctx?: IndexerContext
): Promise<HandleResult>
```

## Error Handling Contract

Batch operations must:
1. Log errors per batch, not per record
2. Continue processing after batch failure
3. Return aggregate success/failure counts
4. Preserve successfully processed records

```typescript
// Example error log format
console.error(`[${indexerName}] Batch ${batchIndex}/${totalBatches} failed: ${error.message}`)
console.error(`[${indexerName}] Failed records: ${chunk.length}, continuing...`)
```
