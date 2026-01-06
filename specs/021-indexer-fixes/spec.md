# Feature Specification: Blockchain Indexer Reliability Fixes

**Feature Branch**: `021-indexer-fixes`
**Created**: 2026-01-06
**Status**: Draft
**Input**: User description: "Fix remaining blockchain indexer issues: pagination skip bug, batch logIndex fabrication, centralized contract addresses, and batched DB writes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete Event Indexing Without Data Loss (Priority: P1)

As a system operator, I need the blockchain indexers to capture every on-chain event without skipping any, so that the application displays accurate and complete blockchain history to users.

**Why this priority**: Data integrity is critical - missing events means users see incomplete information about their NFTs, which destroys trust in the application.

**Independent Test**: Can be verified by running a backfill against a known block range and comparing indexed events against Etherscan's event count for the same range.

**Acceptance Scenarios**:

1. **Given** a block contains more events than the API page limit (1000), **When** the indexer queries that block, **Then** all events from that block are captured without any being skipped
2. **Given** consecutive blocks each contain near-maximum events, **When** the indexer processes them, **Then** the total event count matches the on-chain reality
3. **Given** an indexer is restarted mid-backfill, **When** it resumes, **Then** no events are duplicated or lost from the interrupted block range

---

### User Story 2 - Accurate Batch Transfer Tracking (Priority: P2)

As a user viewing my Concord (ERC-1155) token history, I need batch transfers to be recorded with accurate identifiers, so that I can trace individual token movements within batch transactions.

**Why this priority**: ERC-1155 batch transfers are common in the ecosystem. Inaccurate log indices cause database conflicts and incorrect ordering in user-facing history views.

**Independent Test**: Can be verified by processing a known batch transfer transaction and confirming each token's record has a unique, traceable identifier that doesn't conflict with other logs.

**Acceptance Scenarios**:

1. **Given** a batch transfer contains 5 tokens, **When** the indexer processes it, **Then** each token receives a unique record with its batch position preserved
2. **Given** two batch transfers occur in the same block, **When** both are indexed, **Then** all records are unique and correctly ordered
3. **Given** a batch transfer is re-indexed, **When** upsert occurs, **Then** records are updated correctly without duplicate key violations

---

### User Story 3 - Consistent Contract Configuration (Priority: P3)

As a developer deploying to different environments (mainnet, testnet), I need contract addresses to come from a single source of truth, so that indexers automatically use the correct addresses without manual configuration.

**Why this priority**: Reduces deployment errors and maintenance overhead. Prevents indexing wrong contracts when environment changes.

**Independent Test**: Can be verified by deploying to a test environment and confirming indexers use the configured contract addresses without code changes.

**Acceptance Scenarios**:

1. **Given** a contract address is configured in the central config, **When** any indexer starts, **Then** it uses that address without hardcoded overrides
2. **Given** an environment override is set, **When** the indexer initializes, **Then** it respects the override over the default
3. **Given** a new contract needs indexing, **When** its address is added to the central config, **Then** indexers can reference it without code duplication

---

### User Story 4 - Efficient Bulk Data Processing (Priority: P3)

As a system operator, I need backfill operations to complete within a reasonable time, so that historical data is available without extended downtime or excessive database load.

**Why this priority**: Serial writes create bottlenecks during backfills. While not blocking functionality, it significantly impacts operational efficiency during re-indexing.

**Independent Test**: Can be verified by measuring backfill completion time before and after optimization, targeting measurable improvement.

**Acceptance Scenarios**:

1. **Given** 1000 events need to be written to the database, **When** the handler processes them, **Then** they are written in batches rather than one at a time
2. **Given** a batch write partially fails, **When** the error occurs, **Then** successful records are preserved and failures are logged for retry
3. **Given** a backfill of 10,000 events, **When** run with batched writes, **Then** completion time is reduced compared to serial writes

---

### Edge Cases

- What happens when Etherscan API returns exactly the page limit (1000 results)?
- How does the system handle a block that contains more than 1000 events of the same type?
- What happens when a batch transfer contains duplicate token IDs (same token transferred multiple times)?
- How does batched write handle network timeout mid-batch?
- What happens when central config is missing an address that an indexer needs?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST capture all blockchain events even when a single block contains more events than the API page limit
- **FR-002**: System MUST use block range subdivision when event count equals or exceeds the page limit
- **FR-003**: System MUST preserve the original log index for batch transfers
- **FR-004**: System MUST include a batch position field for each item in ERC-1155 batch transfers
- **FR-005**: System MUST use a unique constraint that includes both log index and batch position for batch transfers
- **FR-006**: System MUST read contract addresses from a centralized configuration module
- **FR-007**: System MUST support environment-based address overrides for deployment flexibility
- **FR-008**: System MUST write database records in configurable batch sizes during backfill operations
- **FR-009**: System MUST handle partial batch write failures gracefully, preserving successful records
- **FR-010**: System MUST log batch write performance metrics for monitoring

### Key Entities

- **Blockchain Event**: An on-chain event (transfer, stake, burn, etc.) with transaction hash, block number, log index, and event-specific data
- **Batch Transfer Record**: An ERC-1155 transfer record with original log index plus batch position for uniqueness
- **Contract Configuration**: Centralized mapping of contract names to addresses with environment override support
- **Write Batch**: A group of database records written together, with configurable size and error handling

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero events are skipped during backfill of any block range, verified by comparing indexed count to Etherscan totals
- **SC-002**: All ERC-1155 batch transfers are indexed without database constraint violations
- **SC-003**: Contract addresses are defined in exactly one location in the codebase (no hardcoded duplicates in indexers)
- **SC-004**: Backfill operations for 10,000+ events complete at least 3x faster than serial write baseline
- **SC-005**: System recovers gracefully from partial batch failures with clear error logging

## Assumptions

- Etherscan API page limit is 1000 results (current known limit)
- The existing `lib/contracts/addresses.ts` is the appropriate location for centralized configuration
- Batch size of 100 records is a reasonable default based on typical database transaction limits
- Binary block range subdivision is an appropriate algorithm for handling over-limit results
