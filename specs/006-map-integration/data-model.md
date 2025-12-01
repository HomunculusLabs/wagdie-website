# Data Model: Interactive Map Integration

**Feature**: Interactive Map Integration (006-map-integration)
**Date**: 2025-11-03
**Status**: Draft → Ready for Implementation

## Entity Overview

The map feature introduces **3 new entities** and extends **1 existing entity** to support location tracking and staking functionality.

## Entities

### 1. Location

Represents a named area in the WAGDIE world where characters can be staked.

**Purpose**: Catalog of available locations for character staking
**Storage**: Supabase (fast queries for UI)
**Source of Truth**: WagdieWorld contract (new locations added via governance)

```typescript
interface Location {
  id: string;                    // Unique identifier (e.g., "concord_searing", "forsaken_lands")
  name: string;                  // Display name (e.g., "Concord Searing")
  description?: string;          // Lore description (markdown supported)
  metadata?: {
    coordinates?: { x: number; y: number }; // Map coordinates
    rarity?: 'common' | 'rare' | 'legendary';
    special_properties?: string[];
  };
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp
}
```

**Validation Rules**:
- `id`: Required, unique, lowercase with underscores
- `name`: Required, 3-50 characters
- `description`: Optional, max 1000 characters
- `metadata`: Optional, max 1KB JSON

**Relationships**:
- 1 Location → many CharacterLocation (one-to-many)
- 1 Location → many Character (via CharacterLocation join)

---

### 2. CharacterLocation

Tracks which location a character is currently staked to.

**Purpose**: Link characters to their current location
**Storage**: Supabase (denormalized for performance)
**Source of Truth**: WagdieWorld contract (on-chain)

```typescript
interface CharacterLocation {
  character_id: string;          // WAGDIE token ID (numeric string)
  location_id: string;           // FK to Location.id
  wallet_address: string;        // Owner wallet (lowercase, checksummed)
  transaction_hash: string;      // Latest on-chain transaction
  block_number: number;          // Block where location was set
  status: 'staked' | 'unstaked' | 'pending';
  created_at: string;            // When first staked
  updated_at: string;            // Last movement
}
```

**Validation Rules**:
- `character_id`: Required, exists in characters table
- `location_id`: Required, exists in locations table
- `wallet_address`: Required, valid Ethereum address
- `transaction_hash`: Required if status is 'staked'
- `status`: Required, enum value

**Constraints**:
- Unique: `(character_id)` - character can only be in one location
- Unique: `(transaction_hash)` - prevent duplicates
- Foreign Key: `location_id` → `locations(id)`
- Foreign Key: `character_id` → `characters(id)` (if exists)

**Relationships**:
- 1 CharacterLocation → 1 Location (many-to-one)
- 1 CharacterLocation → 1 Character (many-to-one)
- 1 CharacterLocation → 1 Wallet (via wallet_address)

---

### 3. LocationTransaction

Audit log of all location changes for transparency.

**Purpose**: Complete history of character movements
**Storage**: Supabase (append-only)
**Source of Truth**: WagdieWorld contract events

```typescript
interface LocationTransaction {
  id: string;                    // UUID primary key
  character_id: string;          // WAGDIE token ID
  from_location_id?: string;     // Previous location (null if initial stake)
  to_location_id: string;        // New location
  wallet_address: string;        // User who performed action
  transaction_hash: string;      // On-chain transaction hash
  action: 'stake' | 'move' | 'unstake';
  status: 'pending' | 'confirmed' | 'failed';
  gas_used?: number;             // Gas consumed
  block_number?: number;         // Confirmation block
  created_at: string;            // When record created
  confirmed_at?: string;         // When transaction confirmed
}
```

**Validation Rules**:
- `character_id`: Required
- `action`: Required, enum value
- `status`: Required, enum value
- `to_location_id`: Required for stake/move
- `from_location_id`: Optional (null for initial stake)

**Relationships**:
- 1 LocationTransaction → 1 Character (many-to-one)
- 1 LocationTransaction → 1 from Location (optional, many-to-one)
- 1 LocationTransaction → 1 to Location (many-to-one)

---

### 4. Character (Extended)

**Changes**: Add optional location relationship

**New Fields**:
```typescript
interface Character {
  // ... existing fields
  location?: {
    id: string;
    name: string;
    description?: string;
  } | null;  // null if not staked
}
```

**Note**: This is a **view/join**, not a new column. Characters table remains unchanged. Location data accessed via JOIN on CharacterLocation.

---

## Data Flow

### Character Location Query Flow

```
1. UI requests character locations
   ↓
2. Check browser cache (< 30s)
   ↓ Cache hit
2a. Return cached data
   ↓ Cache miss
3. Query Supabase for CharacterLocation + Location join
   ↓
4. Check Supabase cache (< 5 min)
   ↓ Cache hit
4a. Return database data + cache in browser
   ↓ Cache miss
5. Query WagdieWorld contract for latest on-chain data
   ↓
6. Compare blockchain vs Supabase
   ↓ If different
6a. Update Supabase cache
   ↓
7. Return fresh data to UI
```

### Character Stake Flow

```
1. User selects new location in UI
   ↓
2. Verify wallet ownership of character
   ↓
3. Estimate gas fees
   ↓
4. Prompt wallet signature
   ↓
5. Send transaction to WagdieWorld contract
   ↓
6. Show "Traveling..." status
   ↓
7. Wait for confirmation (1-2 blocks)
   ↓
8. Update Supabase CharacterLocation table
   ↓
9. Create LocationTransaction audit record
   ↓
10. Show success message
   ↓
11. Refresh UI data
```

---

## Database Schema

### SQL Migration: Create Tables

```sql
-- Locations table
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CharacterLocation table
CREATE TABLE character_locations (
  character_id TEXT NOT NULL,
  location_id TEXT NOT NULL REFERENCES locations(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER,
  status TEXT NOT NULL CHECK (status IN ('staked', 'unstaked', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id)
);

-- LocationTransaction audit table
CREATE TABLE location_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id TEXT NOT NULL,
  from_location_id TEXT REFERENCES locations(id),
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('stake', 'move', 'unstake')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used INTEGER,
  block_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_character_locations_wallet ON character_locations(wallet_address);
CREATE INDEX idx_character_locations_location ON character_locations(location_id);
CREATE INDEX idx_location_transactions_character ON location_transactions(character_id);
CREATE INDEX idx_location_transactions_hash ON location_transactions(transaction_hash);
CREATE INDEX idx_location_transactions_created ON location_transactions(created_at DESC);

-- RLS (Row Level Security) - Optional
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Locations are publicly readable" ON locations FOR SELECT USING (true);
CREATE POLICY "Character locations publicly readable" ON character_locations FOR SELECT USING (true);
CREATE POLICY "Transactions publicly readable" ON location_transactions FOR SELECT USING (true);

-- Policies for authenticated writes (service role)
CREATE POLICY "Service role can manage locations" ON locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage character locations" ON character_locations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage transactions" ON location_transactions FOR ALL USING (auth.role() = 'service_role');
```

---

## TypeScript Types

Generated types available in `lib/types/map.ts`:

```typescript
export type Location = {
  id: string
  name: string
  description?: string
  metadata?: {
    coordinates?: { x: number; y: number }
    rarity?: 'common' | 'rare' | 'legendary'
    special_properties?: string[]
  }
  created_at: string
  updated_at: string
}

export type CharacterLocation = {
  character_id: string
  location_id: string
  wallet_address: string
  transaction_hash: string
  block_number?: number
  status: 'staked' | 'unstaked' | 'pending'
  created_at: string
  updated_at: string
  // Joined fields
  location?: Location
}

export type LocationTransaction = {
  id: string
  character_id: string
  from_location_id?: string
  to_location_id: string
  wallet_address: string
  transaction_hash: string
  action: 'stake' | 'move' | 'unstake'
  status: 'pending' | 'confirmed' | 'failed'
  gas_used?: number
  block_number?: number
  created_at: string
  confirmed_at?: string
}
```

---

## Data Validation

### Client-Side (Zod Schemas)

```typescript
import { z } from 'zod'

export const LocationSchema = z.object({
  id: z.string().regex(/^[a-z0-9_]+$/, 'ID must be lowercase with underscores'),
  name: z.string().min(3).max(50),
  description: z.string().max(1000).optional(),
  metadata: z.object({
    coordinates: z.object({
      x: z.number(),
      y: z.number()
    }).optional(),
    rarity: z.enum(['common', 'rare', 'legendary']).optional(),
    special_properties: z.array(z.string()).optional()
  }).optional()
})

export const CharacterLocationSchema = z.object({
  character_id: z.string(),
  location_id: z.string(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  transaction_hash: z.string().regex(/^0x([A-Fa-f0-9]{64})$/),
  block_number: z.number().optional(),
  status: z.enum(['staked', 'unstaked', 'pending'])
})
```

### Server-Side (Supabase Constraints)

See SQL migration above for CHECK constraints and foreign key validations.

---

## Migration Strategy

### Phase 1: Create Tables
1. Run SQL migration to create tables
2. Seed with initial location data
3. Verify RLS policies

### Phase 2: Sync Existing Data
1. Query WagdieWorld contract for current staking state
2. Populate character_locations table
3. Create location_transactions for all historical movements

### Phase 3: Enable Feature
1. Deploy map page
2. Enable navigation links
3. Monitor for data consistency

### Rollback Plan
```sql
-- If needed, drop tables (careful - data loss!)
DROP TABLE IF EXISTS location_transactions;
DROP TABLE IF EXISTS character_locations;
DROP TABLE IF EXISTS locations;
```

---

## Notes

- **Denormalization**: CharacterLocation is denormalized for performance. On-chain data is source of truth.
- **Caching Strategy**: 30s browser cache, 5min Supabase cache, periodic blockchain sync
- **Audit Trail**: All movements tracked in location_transactions for transparency
- **Gas Optimization**: Batch operations possible (stake multiple characters at once)
- **Real-time**: Optional Supabase real-time subscriptions can be added later
- **Backfill**: Historical data can be backfilled from contract events

---

**Status**: ✅ Ready for Implementation
**Next Step**: Create services for data access and business logic
