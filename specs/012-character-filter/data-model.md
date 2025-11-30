# Data Model: Character Filter Enhancement

**Feature**: 012-character-filter
**Date**: 2025-11-30

## Overview

This document defines the data entities, relationships, and state changes for the character filtering feature.

---

## Entities

### 1. CharacterFilters (Extended)

The existing `CharacterFilters` interface will be extended with new filter options.

```typescript
interface CharacterFilters {
  // Existing fields
  tab: CharacterFilterTab          // 'all' | 'owned' | 'infected' | 'cured' | 'staked'
  wallet?: string                  // Connected wallet address
  sort: SortOrder                  // 'asc' | 'desc'
  page: number                     // Current page (1-indexed)
  perPage: number                  // Items per page (default: 50)
  search?: string                  // Search by name or token ID

  // NEW fields
  hasSheet?: boolean               // Filter to characters with custom sheet data
  origin?: string                  // Filter by character origin/body type
}
```

### 2. Origin (Character Archetype)

Represents the character's origin type derived from NFT "Body" trait.

```typescript
type CharacterOrigin =
  | 'Pilgrim'
  | 'Stranger'
  | 'Wormkin Elite'
  | 'Simple Vagabond'
  | 'Garolin Champion'
  | 'Foolish Jester'
  | 'Aged Traveler'
  | 'Journeyman'
  | 'Saltus'
  | 'Leeched Devotee'
  | 'Her Lover'
  | 'Hole Protector'
  | 'Young Traveler'
  | 'Young Stranger'
  | 'Wormlord Acolyte'
  | 'Logun Disciple'
  | 'Pilgrim of the Hole'
  | 'Pilgrim of the Lakes'
  | 'Pilgrim of the Depth'
  | 'Seeker of Piat'
  | 'Hardened Merchant'
  | 'Her Hidden Blade'
  | 'Transformed Devotee'
  | 'Old Pilgrim'
  | 'Nameless Adventurer'
  | 'Naive Stranger'
  | 'Worm Devotee'
  | 'Follower of Logun'
  | 'Astorian Adventurer'
  | 'Luta\'s Lover'
  | 'Her Wetnurse'
  | 'Wormlord Hybrid'
  | 'Soul of the Wastes'
  | 'Zolian Worm'
  | 'Descendant of Kuul'
  | 'Alchemangel'
  | 'Vessel of Beelzus'
  | 'Fly of Beelzus'
  | 'Fly Lord Beelzus'
  | 'Royal Guard of Beelzus'
  | 'The Lost King'
  | 'The Lost Pope'
  | 'The Lost Red Guard'
  | 'The Lost Blue Guard'
  | 'Galy Veetus the Aged'
  | 'M3RL1N'
  | 'Red Raptor'
  | 'The Beast'
  | 'Toad'
  | string  // Allow for unknown/new origins
```

### 3. OriginCount

Response type for origin statistics endpoint.

```typescript
interface OriginCount {
  origin: string           // The origin/body type value
  count: number            // Number of characters with this origin
}
```

### 4. FilterState (UI State)

Client-side state for managing active filters.

```typescript
interface FilterState {
  tab: CharacterFilterTab
  sort: SortOrder
  page: number
  search: string
  hasSheet: boolean
  origin: string | null    // null means "all origins"
}
```

---

## Database Schema Extensions

### Characters Table (Existing - No Schema Changes)

The filter logic will use existing columns:

| Column | Type | Filter Usage |
|--------|------|--------------|
| `name` | TEXT | Has sheet check (`name IS NOT NULL`) |
| `str` | INTEGER | Has sheet check (`str IS NOT NULL`) |
| `background_story` | TEXT | Has sheet check (`background_story IS NOT NULL`) |
| `metadata` | JSONB | Origin extraction (`metadata->'attributes'`) |

### Computed Column (Optional Optimization)

For performance, a computed/generated column could be added:

```sql
-- Add computed column for has_sheet
ALTER TABLE characters
ADD COLUMN has_sheet BOOLEAN GENERATED ALWAYS AS (
  name IS NOT NULL OR str IS NOT NULL OR background_story IS NOT NULL
) STORED;

-- Add index
CREATE INDEX idx_characters_has_sheet ON characters(has_sheet) WHERE has_sheet = true;
```

### Origin Extraction Index

```sql
-- Create GIN index for JSONB attribute searching
CREATE INDEX idx_characters_metadata_attrs ON characters USING gin (metadata jsonb_path_ops);
```

---

## Data Validation Rules

### Filter Validation

| Field | Rule | Error |
|-------|------|-------|
| `hasSheet` | Must be boolean or undefined | Invalid filter parameter |
| `origin` | Must match known origin value or be empty | Invalid origin value |
| `tab` | Must be one of: all, owned, infected, cured, staked | Invalid tab parameter |
| `sort` | Must be 'asc' or 'desc' | Invalid sort parameter |
| `page` | Must be positive integer | Invalid page number |

### Origin Value Normalization

- Origins are case-sensitive (match exactly as stored)
- Empty string treated as "no filter"
- Unknown origins return empty results (not error)

---

## State Transitions

### Filter State Machine

```
[Initial State]
    |
    v
+-------------------+
|   All Characters  |  tab=all, hasSheet=false, origin=null
+-------------------+
    |
    +-- Apply hasSheet filter --> [Filtered by Sheet]
    |
    +-- Apply origin filter --> [Filtered by Origin]
    |
    +-- Apply tab filter --> [Filtered by Tab]
    |
    +-- Apply search --> [Searched Results]
    |
    +-- Clear all --> [Initial State]
```

### Combined Filter Logic

Filters combine with AND logic:

```
Results = Characters WHERE
  (tab filter) AND
  (hasSheet filter OR !hasSheetApplied) AND
  (origin filter OR !originApplied) AND
  (search filter OR !searchApplied)
```

---

## API Response Types

### CharactersResponse (Extended)

```typescript
interface CharactersResponse {
  characters: Character[]
  hasMore: boolean
  totalCount: number
  // NEW: Include active filters in response for debugging
  appliedFilters?: {
    tab: string
    hasSheet: boolean
    origin: string | null
    search: string | null
  }
}
```

### OriginsResponse

```typescript
interface OriginsResponse {
  origins: OriginCount[]
  totalCharacters: number
}
```

---

## Relationships

```
Character (1) ---> (1) Origin/Body Type
    |
    +---> metadata.attributes[].trait_type = "Body"
    |
    +---> Derived: hasSheet = (name OR str OR background_story exists)
```

---

## Migration Notes

1. **No schema migration required** - Uses existing columns and JSONB
2. **Optional performance indexes** - Can add after feature ships if needed
3. **Backward compatible** - Existing queries unaffected
