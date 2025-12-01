# Data Model: Character Editor

**Feature**: 012-character-editor
**Date**: 2025-11-29

## Entity Overview

This feature uses the existing `characters` table. No new tables or columns required.

---

## Character Entity (Existing)

**Table**: `characters`
**Source of Truth**: Supabase PostgreSQL

### Schema

| Column | Type | Nullable | Default | Editable | Validation |
|--------|------|----------|---------|----------|------------|
| token_id | INTEGER | NOT NULL | - | No | Primary key |
| contract_address | VARCHAR | NULL | - | No | Immutable |
| owner_address | VARCHAR | NULL | - | No | Set by blockchain sync |
| name | VARCHAR(100) | NULL | - | **Yes** | Max 100 chars |
| class | VARCHAR | NULL | - | No | Derived from NFT |
| level | INTEGER | NULL | 1 | **Yes** | 1-20 |
| experience | INTEGER | NULL | 0 | **Yes** | 0-999999 |
| str | INTEGER | NULL | 0 | **Yes** | 1-30 |
| dex | INTEGER | NULL | 0 | **Yes** | 1-30 |
| con | INTEGER | NULL | 0 | **Yes** | 1-30 |
| int | INTEGER | NULL | 0 | **Yes** | 1-30 |
| wis | INTEGER | NULL | 0 | **Yes** | 1-30 |
| cha | INTEGER | NULL | 0 | **Yes** | 1-30 |
| hp | INTEGER | NULL | 0 | **Yes** | 0-999 |
| max_hp | INTEGER | NULL | 0 | **Yes** | 1-999 |
| ac | INTEGER | NULL | 0 | **Yes** | 0-30 |
| speed | INTEGER | NULL | 30 | **Yes** | 0-120 |
| background_story | TEXT | NULL | - | Yes | Existing |
| equipment | JSONB | NULL | {} | Yes | Existing |
| metadata | JSONB | NULL | - | No | NFT metadata |
| image_url | VARCHAR | NULL | - | No | NFT image |
| infection_status | VARCHAR | NULL | 'healthy' | No | Game state |
| staking_status | VARCHAR | NULL | 'unstaked' | No | Blockchain state |
| burned | BOOLEAN | NULL | false | No | Blockchain state |
| infected | BOOLEAN | NULL | false | No | Deprecated |
| location_id | VARCHAR | NULL | - | No | Map feature |
| created_at | TIMESTAMPTZ | NULL | NOW() | No | Immutable |
| updated_at | TIMESTAMPTZ | NULL | NOW() | Yes | Auto-updated |

---

## Editable Fields Type

```typescript
// types/character.ts - New type addition

export type EditableCharacterFields =
  | 'name'
  | 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
  | 'hp' | 'max_hp' | 'ac' | 'speed'
  | 'level' | 'experience'
  | 'background_story' | 'equipment'

export type CharacterUpdate = Partial<Pick<Character, EditableCharacterFields>>
```

---

## Validation Rules

### Core Stats (str, dex, con, int, wis, cha)

```typescript
interface CoreStatValidation {
  type: 'integer'
  min: 1
  max: 30
  required: false  // Can be null for uninitialized characters
}
```

### Derived Stats

```typescript
interface DerivedStatValidation {
  hp: { type: 'integer', min: 0, max: 999, required: false }
  max_hp: { type: 'integer', min: 1, max: 999, required: false }
  ac: { type: 'integer', min: 0, max: 30, required: false }
  speed: { type: 'integer', min: 0, max: 120, required: false }
  level: { type: 'integer', min: 1, max: 20, required: false }
  experience: { type: 'integer', min: 0, max: 999999, required: false }
}
```

### Name

```typescript
interface NameValidation {
  type: 'string'
  maxLength: 100
  required: false
  trim: true
  allowEmpty: true  // Empty string clears the name
}
```

---

## State Transitions

Characters do not have explicit state machine transitions for editing. The only constraint is:

1. **Pre-condition**: Caller must own the character (owner_address matches session address)
2. **Post-condition**: updated_at timestamp is set to current time

---

## Relationships

```
Character (1) <---owns--- (1) Wallet
     |
     +--- metadata (JSONB) - NFT traits, immutable
     +--- equipment (JSONB) - game items, editable
     +--- location (FK) - map position, separate feature
```

---

## Migration Notes

No database migration required. All columns already exist in the `characters` table.

The existing repository `update()` method already supports arbitrary field updates via Supabase's partial update API. The type constraint is at the TypeScript level, not the database level.
