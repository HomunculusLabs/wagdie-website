# Data Model: Map Staking Code Quality Fixes

## Overview

This feature is a refactoring task that does not introduce new database entities. It consolidates TypeScript types for existing data structures.

## Existing Entities (No Changes)

### Database Tables

| Table | Purpose | Changes |
|-------|---------|---------|
| `wagdie_characters` | Character data with `location_id` FK | None |
| `locations` | Map locations with metadata | None |
| `character_locations` | Staking transaction history | None |

## New TypeScript Types

### CharacterWithLocation

**Purpose**: Represents a character with joined location data from `getStakedCharacters()` query.

**Definition**:
```typescript
// lib/repositories/character-repository.ts

import type { NormalizedLocationMetadata } from '@/lib/domain/location/metadata-types';
import type { Character } from '@/types/character';

/**
 * Location data joined from the locations table.
 * Metadata is normalized to always have bounds and optionally center/coordinates.
 */
export interface JoinedLocation {
  id: string;
  name: string;
  metadata: NormalizedLocationMetadata;
}

/**
 * Character with optional joined location data.
 * Returned by getStakedCharacters() when querying characters with location_id.
 */
export interface CharacterWithLocation extends Character {
  location?: JoinedLocation | null;
}
```

**Relationships**:
```
CharacterWithLocation
├── extends Character (all existing fields)
└── location?: JoinedLocation
    ├── id: string (locations.id)
    ├── name: string (locations.name)
    └── metadata: NormalizedLocationMetadata
        ├── bounds: [[number, number], [number, number]] (always present)
        ├── center?: [number, number] (derived from bounds if missing)
        └── coordinates?: { x: number; y: number } (derived if missing)
```

### Existing Types (Reference)

**NormalizedLocationMetadata** (from `metadata-types.ts`):
```typescript
export type LocationBounds = [[number, number], [number, number]];
export type LocationCenter = [number, number];
export interface LocationCoordinatesObj { x: number; y: number; }

export interface NormalizedLocationMetadata extends Record<string, unknown> {
  bounds: LocationBounds;                 // always present
  center?: LocationCenter;                // present when derivable
  coordinates?: LocationCoordinatesObj;   // present when derivable
}
```

**Character** (from `types/character.ts`):
```typescript
export interface Character {
  token_id: number;
  name?: string | null;
  owner_address?: string | null;
  location_id?: string | null;
  metadata?: CharacterMetadata | null;
  // ... other fields
}
```

## Data Flow

```
Supabase Query (getStakedCharacters)
    ↓
Raw rows with joined location
    ↓
normalizeLocationMetadata() applied to location.metadata
    ↓
CharacterWithLocation[] returned
    ↓
useMapData hook receives typed data
    ↓
app/map/page.tsx consumes without casts
```

## Validation Rules

1. **location.metadata normalization**:
   - If `center` is missing but `bounds` exists → derive center from bounds
   - If `bounds` is missing but `coordinates` exists → derive bounds from coordinates
   - If nothing derivable → use fallback `[[0, 0], [0, 0]]`

2. **Null handling**:
   - `location` can be `null` (character has `location_id` but FK target missing)
   - Characters with null location should be filtered before map display

## State Transitions

N/A - This is a read-only data structure for display purposes.
