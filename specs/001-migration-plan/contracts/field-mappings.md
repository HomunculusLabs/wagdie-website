# Field Mapping Contract: Firestore → PostgreSQL

**Feature**: Data Migration from Legacy WAGDIE
**Date**: 2025-10-27
**Version**: 1.0

## Overview

This document provides authoritative field-by-field mappings between the legacy Firestore schema and the new PostgreSQL schema. All migration transformation code MUST implement these mappings exactly as specified.

---

## Users Entity

### Mapping Table

| Firestore Collection | Firestore Field | Transform | PostgreSQL Table | PostgreSQL Column | Type Conversion |
|---------------------|----------------|-----------|------------------|-------------------|-----------------|
| `/users/{ethAddress}` | `ethAddress` (doc ID) | `getAddress()` | `public.users` | `eth_address` | string → TEXT (checksummed) |
| `/users/{ethAddress}` | `createdAt` | `.toDate().toISOString()` | `public.users` | `created_at` | Timestamp → TIMESTAMPTZ |
| `/users/{ethAddress}` | `lastLoginAt` | `.toDate().toISOString()` | `public.users` | `last_login_at` | Timestamp → TIMESTAMPTZ |
| `/users/{ethAddress}` | `loginCount` | Direct | `public.users` | `login_count` | number → INTEGER |
| `/users/{ethAddress}` | `preferences` | **NOT MIGRATED** | - | - | Intentionally dropped |
| - | - | Auto-generated | `public.users` | `id` | - → UUID (primary key) |

### Transformation Example

**Input (Firestore)**:
```json
{
  "ethAddress": "0xabc123...",
  "createdAt": { "_seconds": 1705315800, "_nanoseconds": 0 },
  "lastLoginAt": { "_seconds": 1729432920, "_nanoseconds": 0 },
  "loginCount": 42,
  "preferences": { "theme": "dark" }
}
```

**Output (PostgreSQL)**:
```sql
INSERT INTO users (eth_address, created_at, last_login_at, login_count) VALUES
('0xAbC123...', '2024-01-15T10:30:00.000Z', '2025-10-20T14:22:00.000Z', 42);
-- id is auto-generated as UUID
```

### Validation Rules

- `eth_address` MUST pass `isAddress()` check before normalization
- `eth_address` MUST be unique (constraint enforced by PostgreSQL)
- All timestamps MUST be valid ISO 8601 format
- `login_count` MUST be >= 1

---

## Characters Entity

### Mapping Table

| Firestore Collection | Firestore Field | Transform | PostgreSQL Table | PostgreSQL Column | Type Conversion |
|---------------------|----------------|-----------|------------------|-------------------|-----------------|
| `/characters/{tokenId}` | `tokenId` (doc ID) | Direct | `public.characters` | `token_id` | number → INTEGER |
| `/characters/{tokenId}` | `contractAddress` | `getAddress()` | `public.characters` | `contract_address` | string → TEXT (checksummed) |
| `/characters/{tokenId}` | `ownerAddress` | `getAddress()` or NULL if burned | `public.characters` | `owner_address` | string → TEXT (checksummed) or NULL |
| `/characters/{tokenId}` | `burned` | Direct | `public.characters` | `burned` | boolean → BOOLEAN |
| `/characters/{tokenId}` | `infected` | Direct | `public.characters` | `infected` | boolean → BOOLEAN |
| `/characters/{tokenId}` | `locationId` | Direct or NULL | `public.characters` | `location_id` | string → TEXT or NULL |
| `/characters/{tokenId}` | `mintedAt` | `.toDate().toISOString()` | `public.characters` | `created_at` | Timestamp → TIMESTAMPTZ |
| `/characters/{tokenId}` | `mintedAt` | `.toDate().toISOString()` | `public.characters` | `updated_at` | Timestamp → TIMESTAMPTZ |
| `/characters/{tokenId}` | `metadata` + `metadataUrl` + `imageUrl` + `name` | Merge into JSONB | `public.characters` | `metadata` | object → JSONB (merged) |
| - | - | Auto-generated | `public.characters` | `id` | - → UUID (primary key) |

### Metadata Consolidation

The following Firestore fields are consolidated into the PostgreSQL `metadata` JSONB column:

```typescript
// Firestore fields (flat structure):
{
  metadata: { name: "...", image: "...", attributes: [...] },
  metadataUrl: "ipfs://...",
  imageUrl: "https://...",
  name: "Character #1234"
}

// PostgreSQL metadata JSONB (consolidated):
{
  "name": "Character #1234",           // From Firestore 'name'
  "image": "ipfs://...",               // From Firestore metadata.image
  "attributes": [...],                 // From Firestore metadata.attributes
  "metadataUrl": "ipfs://...",         // From Firestore 'metadataUrl'
  "imageUrl": "https://..."            // From Firestore 'imageUrl'
}
```

### Transformation Example

**Input (Firestore)**:
```json
{
  "tokenId": 1234,
  "contractAddress": "0xdef456...",
  "ownerAddress": "0xabc123...",
  "burned": false,
  "infected": false,
  "locationId": "tavern",
  "mintedAt": { "_seconds": 1685620800, "_nanoseconds": 0 },
  "metadataUrl": "ipfs://QmXxx...",
  "imageUrl": "https://wagdie.com/images/1234.png",
  "name": "Wanderer #1234",
  "metadata": {
    "name": "Wanderer #1234",
    "image": "ipfs://QmXxx...",
    "attributes": [{ "trait_type": "Class", "value": "Warrior" }]
  }
}
```

**Output (PostgreSQL)**:
```sql
INSERT INTO characters (
  token_id, contract_address, owner_address, burned, infected,
  location_id, created_at, updated_at, metadata
) VALUES (
  1234,
  '0xDeF456...',
  '0xAbC123...',
  false,
  false,
  'tavern',
  '2023-06-01T12:00:00.000Z',
  '2023-06-01T12:00:00.000Z',
  '{"name": "Wanderer #1234", "image": "ipfs://QmXxx...", "attributes": [{"trait_type": "Class", "value": "Warrior"}], "metadataUrl": "ipfs://QmXxx...", "imageUrl": "https://wagdie.com/images/1234.png"}'::jsonb
);
```

### Validation Rules

- `token_id` MUST be positive integer
- `contract_address` MUST pass `isAddress()` check
- `owner_address` MUST pass `isAddress()` check if `burned` is false
- If `burned` is true, `owner_address` MUST be set to NULL
- `(contract_address, token_id)` pair MUST be unique (enforced by constraint)
- If `location_id` is set, location MUST exist in `locations` table (validated post-import)

---

## Tweets Entity

### Mapping Table

| Firestore Collection | Firestore Field | Transform | PostgreSQL Table | PostgreSQL Column | Type Conversion |
|---------------------|----------------|-----------|------------------|-------------------|-----------------|
| `/tweets/{tweetId}` | `id` (doc ID) | Direct | `public.tweets` | `id` | string → TEXT |
| `/tweets/{tweetId}` | `authorId` | Direct | `public.tweets` | `author_id` | string → TEXT |
| `/tweets/{tweetId}` | `content` | Direct | `public.tweets` | `content` | string → TEXT |
| `/tweets/{tweetId}` | `mediaUrls` | Direct or NULL | `public.tweets` | `media_urls` | string[] → TEXT[] or NULL |
| `/tweets/{tweetId}` | `createdAt` | `.toDate().toISOString()` | `public.tweets` | `created_at` | Timestamp → TIMESTAMPTZ |
| - | - | Auto-generated | `public.tweets` | `stored_at` | - → TIMESTAMPTZ (NOW()) |

### Transformation Example

**Input (Firestore)**:
```json
{
  "id": "1234567890",
  "authorId": "987654321",
  "content": "WAGDIE forever!",
  "mediaUrls": ["https://pbs.twimg.com/media/abc.jpg"],
  "createdAt": { "_seconds": 1704873300, "_nanoseconds": 0 }
}
```

**Output (PostgreSQL)**:
```sql
INSERT INTO tweets (id, author_id, content, media_urls, created_at) VALUES
(
  '1234567890',
  '987654321',
  'WAGDIE forever!',
  ARRAY['https://pbs.twimg.com/media/abc.jpg'],
  '2025-01-10T08:15:00.000Z'
);
-- stored_at is auto-generated as NOW()
```

### Validation Rules

- `id` MUST be non-empty string
- `author_id` MUST be non-empty string
- `content` MUST be non-empty string
- `id` MUST be unique (enforced by primary key constraint)

---

## Locations Entity

### Mapping Table

| Firestore Collection | Firestore Field | Transform | PostgreSQL Table | PostgreSQL Column | Type Conversion |
|---------------------|----------------|-----------|------------------|-------------------|-----------------|
| `/locations/{locationId}` | `id` (doc ID) | Direct | `public.locations` | `id` | string → TEXT |
| `/locations/{locationId}` | `name` | Direct | `public.locations` | `name` | string → TEXT |
| `/locations/{locationId}` | `description` | Direct or NULL | `public.locations` | `description` | string → TEXT or NULL |
| `/locations/{locationId}` | `metadata` + `capacity` | Merge into JSONB | `public.locations` | `metadata` | object → JSONB |

### Metadata Consolidation

```typescript
// Firestore fields:
{
  id: "tavern",
  name: "The Tavern",
  description: "A place to rest...",
  capacity: 100,
  metadata: { imageUrl: "https://..." }
}

// PostgreSQL metadata JSONB (consolidated):
{
  "capacity": 100,
  "imageUrl": "https://..."
}
```

### Transformation Example

**Input (Firestore)**:
```json
{
  "id": "tavern",
  "name": "The Tavern",
  "description": "A place to rest and recover.",
  "capacity": 100,
  "metadata": {
    "imageUrl": "https://wagdie.com/locations/tavern.png"
  }
}
```

**Output (PostgreSQL)**:
```sql
INSERT INTO locations (id, name, description, metadata) VALUES
(
  'tavern',
  'The Tavern',
  'A place to rest and recover.',
  '{"capacity": 100, "imageUrl": "https://wagdie.com/locations/tavern.png"}'::jsonb
);
```

### Validation Rules

- `id` MUST be non-empty string
- `name` MUST be non-empty string
- `id` MUST be unique (enforced by primary key constraint)

---

## Type Conversion Reference

### Firestore Timestamp → PostgreSQL TIMESTAMPTZ

```typescript
// Firestore format:
{
  "_seconds": 1705315800,
  "_nanoseconds": 0
}

// Conversion:
const date = firestoreTimestamp.toDate();
const iso8601 = date.toISOString();  // "2024-01-15T10:30:00.000Z"

// PostgreSQL:
'2024-01-15T10:30:00.000Z'::timestamptz
```

### Ethereum Address Normalization

```typescript
import { getAddress, isAddress } from 'ethers';

// Input (various casings):
"0xabc123..." or "0xAbC123..." or "0xABC123..."

// Validation:
if (!isAddress(input)) {
  throw new Error(`Invalid Ethereum address: ${input}`);
}

// Normalization (EIP-55 checksum):
const normalized = getAddress(input.toLowerCase());
// Output: "0xAbC123..." (mixed case per checksum algorithm)
```

### Firestore Array → PostgreSQL Array

```typescript
// Firestore:
["url1", "url2", "url3"]

// PostgreSQL:
ARRAY['url1', 'url2', 'url3']
// Or in Supabase client:
{ media_urls: ["url1", "url2", "url3"] }
```

### Firestore Object → PostgreSQL JSONB

```typescript
// Firestore:
{
  theme: "dark",
  notifications: true
}

// PostgreSQL:
'{"theme": "dark", "notifications": true}'::jsonb
// Or in Supabase client:
{ metadata: { theme: "dark", notifications: true } }
```

---

## Implementation Checklist

For each entity transformation function, implementers MUST:

- [ ] Read Firestore document with all fields listed in mapping table
- [ ] Apply transformations exactly as specified (e.g., `getAddress()` for addresses)
- [ ] Handle NULL/missing fields correctly (use `|| null` for optional fields)
- [ ] Validate required fields (throw error if missing)
- [ ] Log transformation errors with document ID and field name
- [ ] Return PostgreSQL-compatible object matching target schema
- [ ] Include unit tests comparing input/output examples from this doc

---

## Versioning

**Version**: 1.0
**Last Updated**: 2025-10-27

Changes to this mapping contract MUST be versioned. If field mappings change during development:

1. Update version number (e.g., 1.0 → 1.1)
2. Document changes in a "Changelog" section
3. Notify all migration script implementers
4. Update unit tests to reflect new mappings

---

## Appendix: Full Transformation Pseudocode

### Users

```typescript
function transformUser(doc: FirestoreDocumentSnapshot): PostgresUser {
  const data = doc.data();

  // Validate required fields
  if (!data.ethAddress) throw new Error(`Missing ethAddress in user ${doc.id}`);
  if (!data.createdAt) throw new Error(`Missing createdAt in user ${doc.id}`);
  if (!data.lastLoginAt) throw new Error(`Missing lastLoginAt in user ${doc.id}`);

  // Normalize address
  const normalizedAddress = getAddress(data.ethAddress.toLowerCase());

  return {
    eth_address: normalizedAddress,
    created_at: data.createdAt.toDate().toISOString(),
    last_login_at: data.lastLoginAt.toDate().toISOString(),
    login_count: data.loginCount || 1
  };
}
```

### Characters

```typescript
function transformCharacter(doc: FirestoreDocumentSnapshot): PostgresCharacter {
  const data = doc.data();

  // Validate required fields
  if (!data.tokenId) throw new Error(`Missing tokenId in character ${doc.id}`);
  if (!data.contractAddress) throw new Error(`Missing contractAddress in character ${doc.id}`);

  // Normalize addresses
  const contractAddress = getAddress(data.contractAddress.toLowerCase());
  const ownerAddress = data.burned
    ? null
    : (data.ownerAddress ? getAddress(data.ownerAddress.toLowerCase()) : null);

  // Consolidate metadata
  const metadata = {
    ...(data.metadata || {}),
    metadataUrl: data.metadataUrl,
    imageUrl: data.imageUrl,
    name: data.name
  };

  return {
    token_id: data.tokenId,
    contract_address: contractAddress,
    owner_address: ownerAddress,
    metadata: Object.keys(metadata).length > 0 ? metadata : null,
    burned: data.burned || false,
    infected: data.infected || false,
    location_id: data.locationId || null,
    created_at: data.mintedAt?.toDate().toISOString() || new Date().toISOString(),
    updated_at: data.mintedAt?.toDate().toISOString() || new Date().toISOString()
  };
}
```

### Tweets

```typescript
function transformTweet(doc: FirestoreDocumentSnapshot): PostgresTweet {
  const data = doc.data();

  // Validate required fields
  if (!data.id) throw new Error(`Missing id in tweet ${doc.id}`);
  if (!data.authorId) throw new Error(`Missing authorId in tweet ${doc.id}`);
  if (!data.content) throw new Error(`Missing content in tweet ${doc.id}`);

  return {
    id: data.id,
    author_id: data.authorId,
    content: data.content,
    media_urls: data.mediaUrls || null,
    created_at: data.createdAt.toDate().toISOString()
  };
}
```

### Locations

```typescript
function transformLocation(doc: FirestoreDocumentSnapshot): PostgresLocation {
  const data = doc.data();

  // Validate required fields
  if (!data.id) throw new Error(`Missing id in location ${doc.id}`);
  if (!data.name) throw new Error(`Missing name in location ${doc.id}`);

  // Consolidate metadata
  const metadata = {
    ...(data.metadata || {}),
    ...(data.capacity ? { capacity: data.capacity } : {})
  };

  return {
    id: data.id,
    name: data.name,
    description: data.description || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : null
  };
}
```

---

**End of Field Mapping Contract**
