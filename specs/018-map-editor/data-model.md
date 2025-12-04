# Data Model: Map Location Pin Editor

**Feature**: 018-map-editor
**Date**: 2025-12-03

## Entity Overview

This feature primarily operates on the existing `locations` table. No new tables are required.

---

## Entities

### Location (Existing - Extended)

The `locations` table already exists in the database. This feature adds CRUD operations but no schema changes.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | TEXT | ✅ | Primary key, human-readable slug (e.g., `dragons_lair`) |
| name | TEXT | ✅ | Display name (e.g., "Dragon's Lair") |
| description | TEXT | ❌ | Optional lore description |
| metadata | JSONB | ❌ | Coordinates, rarity, special properties |
| created_at | TIMESTAMPTZ | ✅ | Auto-generated on insert |
| updated_at | TIMESTAMPTZ | ✅ | Auto-updated on change |

**Metadata Structure**:
```typescript
interface LocationMetadata {
  coordinates?: { x: number; y: number }  // Map position
  bounds?: [[number, number], [number, number]]  // Optional bounds
  center?: [number, number]  // Optional center point
  rarity?: 'common' | 'rare' | 'legendary'
  special_properties?: string[]
}
```

**Constraints**:
- `id` must be unique (PRIMARY KEY)
- `id` follows slug format: lowercase alphanumeric with underscores
- `name` must be non-empty (validated at API layer)

---

### CharacterLocation (Existing - Read Only)

Referenced to check for staked characters before deletion. No modifications.

| Field | Type | Description |
|-------|------|-------------|
| character_id | TEXT | WAGDIE token ID |
| location_id | TEXT | FK to locations.id |
| status | TEXT | 'staked', 'unstaked', 'pending' |

---

## TypeScript Interfaces

### Location (from `lib/types/map.ts`)

```typescript
export interface Location {
  id: string
  name: string
  description?: string
  metadata?: {
    coordinates?: { x: number; y: number }
    bounds?: [[number, number], [number, number]]
    center?: [number, number]
    rarity?: 'common' | 'rare' | 'legendary'
    special_properties?: string[]
  }
  created_at: string
  updated_at: string
}
```

### CreateLocationInput (New)

```typescript
export interface CreateLocationInput {
  name: string                    // Required, non-empty
  description?: string            // Optional
  coordinates: { x: number; y: number }  // Required for placement
}
```

### UpdateLocationInput (New)

```typescript
export interface UpdateLocationInput {
  name?: string                   // Optional update
  description?: string            // Optional update
  coordinates?: { x: number; y: number }  // For repositioning
}
```

### LocationResponse (New)

```typescript
export interface LocationResponse {
  success: boolean
  data?: Location
  error?: string
}

export interface LocationListResponse {
  success: boolean
  data?: Location[]
  error?: string
}
```

---

## State Transitions

Locations have no explicit state machine. They are simply created, updated, or deleted.

```
[Not Exists] --create--> [Exists] --update--> [Exists] --delete--> [Not Exists]
                              ^                    |
                              +--------------------+
```

**Delete Guard**: A location cannot be deleted if `character_locations` has any rows with `status = 'staked'` referencing it.

---

## Validation Rules

### Location ID (Slug)

| Rule | Validation |
|------|------------|
| Format | Lowercase alphanumeric with underscores |
| Pattern | `/^[a-z0-9_]+$/` |
| Length | 1-100 characters |
| Uniqueness | Must be unique in table |

### Name

| Rule | Validation |
|------|------------|
| Required | Yes |
| Length | 1-200 characters |
| Whitespace | Trimmed before save |

### Coordinates

| Rule | Validation |
|------|------------|
| Required | Yes for create/reposition |
| x | Finite number |
| y | Finite number |
| Bounds | Must be within map bounds (0-1000 x 0-1000 typically) |

---

## Relationships

```
┌─────────────┐         ┌────────────────────┐
│  locations  │ 1───n   │ character_locations │
│             │◄────────│                    │
│ id (PK)     │         │ location_id (FK)   │
│ name        │         │ character_id       │
│ description │         │ status             │
│ metadata    │         │ wallet_address     │
└─────────────┘         └────────────────────┘
```

**Note**: The `character_locations` table references `locations.id`. This creates a dependency that must be checked before delete operations.

---

## Database Operations Summary

| Operation | Table | Conditions |
|-----------|-------|------------|
| Create | locations | Admin auth required |
| Read | locations | Public (no auth) |
| Update | locations | Admin auth required |
| Delete | locations | Admin auth + no staked characters |
| Read | character_locations | Checked before delete |

---

## Migration Requirements

**None**. The existing `locations` table schema fully supports all required operations. The `metadata.coordinates` field already exists for storing pin positions.
