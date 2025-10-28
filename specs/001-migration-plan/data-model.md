# Phase 1: Data Model Design

**Feature**: Data Migration from Legacy WAGDIE
**Date**: 2025-10-27
**Status**: Complete

## Overview

This document defines the data models for both the source (Firestore) and target (PostgreSQL/Supabase) systems, along with transformation rules and validation requirements for the migration.

---

## Source Schema: Firestore Document Structure

### Collection: `users` (Firestore)

**Firestore Path**: `/users/{ethAddress}`

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| ethAddress | string | Yes | "0xAbC123..." | Document ID, Ethereum address |
| createdAt | Timestamp | Yes | 2024-01-15T10:30:00Z | Account creation timestamp |
| lastLoginAt | Timestamp | Yes | 2025-10-20T14:22:00Z | Last authentication timestamp |
| loginCount | number | Yes | 42 | Total number of logins |
| preferences | object | No | `{ theme: "dark" }` | User preferences (optional) |

**Sample Firestore Document**:
```json
{
  "ethAddress": "0xAbC123...",
  "createdAt": { "_seconds": 1705315800, "_nanoseconds": 0 },
  "lastLoginAt": { "_seconds": 1729432920, "_nanoseconds": 0 },
  "loginCount": 42,
  "preferences": { "theme": "dark", "notifications": true }
}
```

---

### Collection: `characters` (Firestore)

**Firestore Path**: `/characters/{tokenId}`

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| tokenId | number | Yes | 1234 | Document ID, NFT token ID |
| contractAddress | string | Yes | "0xDEF456..." | NFT contract address |
| ownerAddress | string | Yes | "0xAbC123..." | Current owner wallet address |
| metadataUrl | string | No | "ipfs://Qm..." | IPFS URL for metadata |
| imageUrl | string | No | "https://..." | Direct image URL |
| name | string | No | "Character #1234" | Character name from metadata |
| burned | boolean | Yes | false | Whether NFT is burned |
| infected | boolean | Yes | false | Game state: infected status |
| locationId | string | No | "tavern" | Current location (if staked) |
| mintedAt | Timestamp | Yes | 2023-06-01T12:00:00Z | Minting timestamp |
| metadata | object | No | `{ attributes: [...] }` | Full metadata object |

**Sample Firestore Document**:
```json
{
  "tokenId": 1234,
  "contractAddress": "0xDEF456...",
  "ownerAddress": "0xAbC123...",
  "metadataUrl": "ipfs://QmXxx...",
  "imageUrl": "https://wagdie.com/images/1234.png",
  "name": "Wanderer #1234",
  "burned": false,
  "infected": false,
  "locationId": "tavern",
  "mintedAt": { "_seconds": 1685620800, "_nanoseconds": 0 },
  "metadata": {
    "name": "Wanderer #1234",
    "image": "ipfs://QmXxx...",
    "attributes": [
      { "trait_type": "Class", "value": "Warrior" }
    ]
  }
}
```

---

### Collection: `tweets` (Firestore)

**Firestore Path**: `/tweets/{tweetId}`

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| id | string | Yes | "1234567890" | Document ID, Twitter/X tweet ID |
| authorId | string | Yes | "987654321" | Twitter/X user ID |
| content | string | Yes | "WAGDIE forever!" | Tweet text content |
| mediaUrls | array | No | `["https://..."]` | Attached image/video URLs |
| createdAt | Timestamp | Yes | 2025-01-10T08:15:00Z | Tweet creation timestamp |

---

### Collection: `locations` (Firestore)

**Firestore Path**: `/locations/{locationId}`

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| id | string | Yes | "tavern" | Document ID, location identifier |
| name | string | Yes | "The Tavern" | Display name |
| description | string | No | "A place to rest..." | Flavor text |
| capacity | number | No | 100 | Max characters allowed |
| metadata | object | No | `{ imageUrl: "..." }` | Additional data |

---

## Target Schema: PostgreSQL Table Structure

### Table: `users`

**PostgreSQL Table**: `public.users`

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | `gen_random_uuid()` | Auto-generated |
| eth_address | TEXT | UNIQUE NOT NULL | - | Normalized checksummed address |
| created_at | TIMESTAMPTZ | NOT NULL | `NOW()` | User creation timestamp |
| last_login_at | TIMESTAMPTZ | NOT NULL | `NOW()` | Last login timestamp |
| login_count | INTEGER | NOT NULL | 1 | Total login count |

**Indexes**:
- `idx_users_eth_address` on `eth_address` (for fast lookup by wallet)

---

### Table: `characters`

**PostgreSQL Table**: `public.characters`

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | UUID | PRIMARY KEY | `gen_random_uuid()` | Auto-generated |
| token_id | INTEGER | NOT NULL | - | NFT token ID |
| contract_address | TEXT | NOT NULL | - | NFT contract address |
| owner_address | TEXT | NULL | - | Current owner (null if burned) |
| metadata | JSONB | NULL | - | Full metadata object |
| burned | BOOLEAN | NOT NULL | false | Burn status |
| infected | BOOLEAN | NOT NULL | false | Game infection status |
| location_id | TEXT | NULL | - | Foreign key to locations |
| created_at | TIMESTAMPTZ | NOT NULL | `NOW()` | Record creation |
| updated_at | TIMESTAMPTZ | NOT NULL | `NOW()` | Last update timestamp |

**Constraints**:
- `UNIQUE(contract_address, token_id)` - Prevent duplicate NFTs

**Indexes**:
- `idx_characters_token_id` on `token_id`
- `idx_characters_owner` on `owner_address`
- `idx_characters_burned` on `burned`
- `idx_characters_infected` on `infected`
- `idx_characters_location` on `location_id`

**Triggers**:
- `update_characters_updated_at` - Auto-update `updated_at` on row modification

---

### Table: `tweets`

**PostgreSQL Table**: `public.tweets`

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | TEXT | PRIMARY KEY | - | Twitter/X tweet ID |
| author_id | TEXT | NOT NULL | - | Twitter/X user ID |
| content | TEXT | NOT NULL | - | Tweet text content |
| media_urls | TEXT[] | NULL | - | Array of media URLs |
| created_at | TIMESTAMPTZ | NOT NULL | - | Tweet creation timestamp |
| stored_at | TIMESTAMPTZ | NOT NULL | `NOW()` | Migration/storage timestamp |

**Indexes**:
- `idx_tweets_author` on `author_id`
- `idx_tweets_created_at` on `created_at DESC`

---

### Table: `locations`

**PostgreSQL Table**: `public.locations`

| Column | Type | Constraints | Default | Notes |
|--------|------|-------------|---------|-------|
| id | TEXT | PRIMARY KEY | - | Location identifier |
| name | TEXT | NOT NULL | - | Display name |
| description | TEXT | NULL | - | Flavor text |
| metadata | JSONB | NULL | - | Additional data |

---

## Transformation Rules

### General Rules

1. **Timestamp Conversion**:
   - Firestore Timestamp → PostgreSQL TIMESTAMPTZ
   - Convert Firestore `{ _seconds, _nanoseconds }` to ISO 8601 string
   - Preserve timezone information (UTC)

2. **Address Normalization**:
   - All Ethereum addresses MUST be checksummed using `ethers.getAddress()`
   - Convert to EIP-55 format before inserting into PostgreSQL
   - Reject invalid addresses (throw error)

3. **Optional Fields**:
   - Firestore missing field → PostgreSQL NULL
   - Firestore undefined/null → PostgreSQL NULL

4. **JSON/JSONB**:
   - Firestore nested objects → PostgreSQL JSONB
   - Preserve structure exactly as stored in Firestore

---

### Entity-Specific Transformation Rules

#### Users Transformation

```typescript
interface FirestoreUser {
  ethAddress: string;
  createdAt: FirebaseFirestore.Timestamp;
  lastLoginAt: FirebaseFirestore.Timestamp;
  loginCount: number;
  preferences?: object;
}

interface PostgresUser {
  id?: string; // Auto-generated, omit during insert
  eth_address: string;
  created_at: string; // ISO 8601
  last_login_at: string; // ISO 8601
  login_count: number;
}

function transformUser(firestoreUser: FirestoreUser): PostgresUser {
  return {
    eth_address: getAddress(firestoreUser.ethAddress.toLowerCase()),
    created_at: firestoreUser.createdAt.toDate().toISOString(),
    last_login_at: firestoreUser.lastLoginAt.toDate().toISOString(),
    login_count: firestoreUser.loginCount
    // Note: preferences NOT migrated (not in target schema)
  };
}
```

**Data Loss Note**: `preferences` field is not migrated (not in target schema). Document this as intentional simplification.

---

#### Characters Transformation

```typescript
interface FirestoreCharacter {
  tokenId: number;
  contractAddress: string;
  ownerAddress: string;
  metadataUrl?: string;
  imageUrl?: string;
  name?: string;
  burned: boolean;
  infected: boolean;
  locationId?: string;
  mintedAt: FirebaseFirestore.Timestamp;
  metadata?: object;
}

interface PostgresCharacter {
  id?: string; // Auto-generated
  token_id: number;
  contract_address: string;
  owner_address: string | null;
  metadata: object | null;
  burned: boolean;
  infected: boolean;
  location_id: string | null;
  created_at: string; // Use mintedAt
  updated_at: string; // Use mintedAt initially
}

function transformCharacter(firestoreChar: FirestoreCharacter): PostgresCharacter {
  return {
    token_id: firestoreChar.tokenId,
    contract_address: getAddress(firestoreChar.contractAddress.toLowerCase()),
    owner_address: firestoreChar.burned
      ? null
      : getAddress(firestoreChar.ownerAddress.toLowerCase()),
    metadata: firestoreChar.metadata
      ? {
          ...firestoreChar.metadata,
          metadataUrl: firestoreChar.metadataUrl,
          imageUrl: firestoreChar.imageUrl,
          name: firestoreChar.name
        }
      : null,
    burned: firestoreChar.burned,
    infected: firestoreChar.infected,
    location_id: firestoreChar.locationId || null,
    created_at: firestoreChar.mintedAt.toDate().toISOString(),
    updated_at: firestoreChar.mintedAt.toDate().toISOString()
  };
}
```

**Field Consolidation**: `metadataUrl`, `imageUrl`, and `name` are merged into the `metadata` JSONB column for consistency.

---

#### Tweets Transformation

```typescript
interface FirestoreTweet {
  id: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: FirebaseFirestore.Timestamp;
}

interface PostgresTweet {
  id: string;
  author_id: string;
  content: string;
  media_urls: string[] | null;
  created_at: string;
  stored_at?: string; // Auto-generated
}

function transformTweet(firestoreTweet: FirestoreTweet): PostgresTweet {
  return {
    id: firestoreTweet.id,
    author_id: firestoreTweet.authorId,
    content: firestoreTweet.content,
    media_urls: firestoreTweet.mediaUrls || null,
    created_at: firestoreTweet.createdAt.toDate().toISOString()
  };
}
```

---

#### Locations Transformation

```typescript
interface FirestoreLocation {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  metadata?: object;
}

interface PostgresLocation {
  id: string;
  name: string;
  description: string | null;
  metadata: object | null;
}

function transformLocation(firestoreLocation: FirestoreLocation): PostgresLocation {
  return {
    id: firestoreLocation.id,
    name: firestoreLocation.name,
    description: firestoreLocation.description || null,
    metadata: firestoreLocation.metadata
      ? { ...firestoreLocation.metadata, capacity: firestoreLocation.capacity }
      : (firestoreLocation.capacity ? { capacity: firestoreLocation.capacity } : null)
  };
}
```

**Field Consolidation**: `capacity` is moved into the `metadata` JSONB column.

---

## Validation Rules

### Field-Level Validation

| Entity | Field | Validation | Error Action |
|--------|-------|------------|--------------|
| Users | eth_address | Must pass `isAddress()` check | Throw error, log document ID |
| Characters | token_id | Must be positive integer | Throw error, log document ID |
| Characters | contract_address | Must pass `isAddress()` check | Throw error, log document ID |
| Characters | owner_address | If not burned, must pass `isAddress()` | Throw error, log document ID |
| Tweets | id | Must be non-empty string | Throw error, log document ID |
| Locations | id | Must be non-empty string | Throw error, log document ID |

### Cross-Entity Validation

| Validation | Rule | Error Action |
|------------|------|--------------|
| Character Owner Exists | `character.owner_address` must exist in `users.eth_address` (if not burned) | Log warning, create user record with defaults |
| Location Reference | If `character.location_id` is set, location must exist in `locations` | Log warning, set `location_id` to NULL |

### Data Integrity Checks

1. **Record Counts**:
   - `COUNT(*) FROM firestore_export` = `COUNT(*) FROM postgres_table`
   - Must match exactly for each entity type

2. **Checksum Validation**:
   - Calculate SHA-256 hash of sorted key field values
   - Source checksum must match target checksum

3. **Spot Check Sampling**:
   - Randomly select 1% of records
   - Fetch from both source and target
   - Compare field-by-field
   - Report any discrepancies

---

## Edge Case Handling

### Case 1: Orphaned Characters (owner not in users table)

**Scenario**: Character's `ownerAddress` doesn't match any user record.

**Resolution**:
1. Log warning with character token ID and owner address
2. Create a new user record with:
   - `eth_address` = character's owner address (normalized)
   - `created_at` = character's `mintedAt` (best guess)
   - `last_login_at` = character's `mintedAt`
   - `login_count` = 1
3. Continue migration

**Rationale**: NFT ownership is source of truth; user records are derived.

---

### Case 2: Duplicate Addresses with Different Casing

**Scenario**: Firestore has "0xABC..." and "0xabc..." as different users.

**Resolution**:
1. Normalize both to checksummed format using `getAddress()`
2. If they normalize to the same address:
   - Merge records by taking the most recent `lastLoginAt`
   - Sum `loginCount` values
   - Log warning with both original addresses
3. Insert single normalized record

**Rationale**: Ethereum addresses are case-insensitive for comparison; checksummed format is canonical.

---

### Case 3: Invalid/Broken Metadata URLs

**Scenario**: Character's `metadataUrl` returns 404 or is malformed.

**Resolution**:
1. Store URL as-is in `metadata` JSONB (don't fetch/validate)
2. Log info message noting URL may be broken
3. Continue migration

**Rationale**: Migration is not responsible for fixing source data issues; migrate faithfully.

---

### Case 4: Missing Location Reference

**Scenario**: Character references `locationId` that doesn't exist in locations table.

**Resolution**:
1. Set `location_id` to NULL in PostgreSQL
2. Log warning with character ID and missing location ID
3. Continue migration

**Rationale**: Referential integrity over failing migration; admin can fix later.

---

### Case 5: Burned Character with Owner

**Scenario**: Character has `burned: true` but still has an `ownerAddress`.

**Resolution**:
1. Set `owner_address` to NULL in PostgreSQL (burned NFTs have no owner)
2. Log info message
3. Continue migration

**Rationale**: Burned status takes precedence; correct inconsistency during migration.

---

## Summary

- **4 entities** migrated: Users, Characters, Tweets, Locations
- **Addresses normalized** using EIP-55 checksumming
- **Timestamps converted** from Firestore format to ISO 8601
- **Optional fields** handled gracefully (NULL in PostgreSQL)
- **5 edge cases** documented with resolution strategies
- **3-tier validation** (record counts, checksums, spot checks)

**Ready for Phase 1 Contracts**: Field mapping documentation.
