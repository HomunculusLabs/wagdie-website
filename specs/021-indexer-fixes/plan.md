# Implementation Plan: Blockchain Indexer Reliability Fixes

**Branch**: `021-indexer-fixes` | **Date**: 2026-01-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/021-indexer-fixes/spec.md`

## Summary

This plan addresses four remaining reliability issues in the blockchain indexer system:
1. **Pagination skip bug** - Events skipped when Etherscan returns max results within a single block
2. **Batch logIndex fabrication** - ERC-1155 batch transfers use fabricated log indices causing conflicts
3. **Hardcoded contract addresses** - Indexers duplicate addresses instead of using centralized config
4. **Serial DB writes** - Backfills bottleneck on one-at-a-time database inserts

Technical approach: Refactor existing indexer files with block range subdivision, proper batch_index column, centralized address imports, and chunked upsert operations.

## Technical Context

**Language/Version**: TypeScript 5+ (Node.js 18+)
**Primary Dependencies**: viem 2.x, @supabase/supabase-js v2
**Storage**: Supabase PostgreSQL (existing tables: concord_transfers, staking_events, searing_events, infection_events)
**Testing**: Jest with ts-jest (existing test infrastructure)
**Target Platform**: Linux server (Docker containers)
**Project Type**: Backend indexer services (Node.js scripts)
**Performance Goals**: 3x faster backfill throughput (SC-004), zero skipped events (SC-001)
**Constraints**: Must maintain backwards compatibility with existing data, no downtime during deployment
**Scale/Scope**: ~10k-50k events per full backfill, 5 indexer scripts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution template is not customized for this project. Applying general best practices:

| Principle | Status | Notes |
|-----------|--------|-------|
| Test-First | PASS | Existing test infrastructure; new logic will have unit tests |
| Simplicity | PASS | Minimal changes to existing architecture; no new abstractions |
| Observability | PASS | Logging already in place; adding performance metrics |

**Gate Result**: PASS - No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/021-indexer-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new APIs)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
scripts/indexer/
├── transfer-indexer.ts      # Fix: pagination, contract addresses
├── concord-indexer.ts       # Fix: pagination, contract addresses
├── staking-indexer.ts       # Fix: pagination, contract addresses
├── searing-indexer.ts       # Fix: pagination, contract addresses
├── infection-indexer.ts     # Fix: pagination, contract addresses
├── concord-transfer-handler.ts  # Fix: batch_index, batched writes
├── staking-event-handler.ts     # Fix: batched writes
├── searing-event-handler.ts     # Fix: batched writes
├── infection-event-handler.ts   # Fix: batched writes
└── event-handler.ts             # Fix: batched writes

lib/contracts/
└── addresses.ts          # Already exists - source of truth

supabase/migrations/
└── 20260106000000_add_batch_index.sql  # New: batch_index column

tests/
└── indexer/              # New test files for pagination logic
```

**Structure Decision**: Modifications to existing files in `scripts/indexer/`, one new migration, one new test directory. No new architectural components.

## Complexity Tracking

No constitution violations to justify.
