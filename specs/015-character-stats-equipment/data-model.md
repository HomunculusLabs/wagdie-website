# Data Model: Character Stats & Equipment Display

**Feature**: 015-character-stats-equipment
**Date**: 2025-12-01

## Overview

This feature uses existing data models with no schema changes. This document describes the relevant entities and their display mappings.

## Entities

### Character (Existing - No Changes)

The primary entity containing all displayable data.

```typescript
interface Character {
  // Identity
  token_id: number          // Primary key (1-6666)
  name?: string | null      // User-assigned name
  class?: CharacterClass    // Warrior, Mage, Rogue, Cleric

  // Core Stats (D&D-style, 1-20 range)
  str?: number              // Strength
  dex?: number              // Dexterity
  con?: number              // Constitution
  int?: number              // Intelligence
  wis?: number              // Wisdom
  cha?: number              // Charisma

  // Derived Stats
  hp?: number               // Current hit points
  max_hp?: number           // Maximum hit points
  ac?: number               // Armor class
  speed?: number            // Movement speed (ft)

  // Progression
  level?: number            // Character level (1-20)
  experience?: number       // Experience points (0-999999)

  // Equipment (game format)
  equipment?: Equipment | null

  // NFT Metadata (contains original traits + equipment)
  metadata?: CharacterMetadata | null

  // Status
  owner_address?: string
  infection_status?: InfectionStatus
  staking_status?: StakingStatus
}
```

### Equipment (Existing - No Changes)

Equipment can exist in two formats:

```typescript
// Game format (database column)
interface Equipment {
  weapons?: string[]
  armor?: string[]
  items?: string[]
  gold?: number
}

// NFT format (from metadata.equipment)
interface NFTEquipment {
  armor?: string       // Single item name
  back?: string        // Back slot item
  mask?: string        // Mask slot item
}
```

### NFT Metadata (Existing - No Changes)

```typescript
interface CharacterMetadata {
  name?: string
  image?: string
  description?: string
  attributes?: NFTAttribute[]
  equipment?: NFTEquipment
}

interface NFTAttribute {
  trait_type: string   // e.g., "Body", "Alignment", "Head"
  value: string | number
}
```

## New Types (Display Only)

### NFTTrait (New - For Display)

Extracted trait for display purposes:

```typescript
interface NFTTrait {
  type: string         // trait_type from metadata
  value: string        // string representation of value
  category: 'identity' | 'cosmetic' | 'equipment'
}
```

**Category Mapping**:
- `identity`: Body, Alignment
- `equipment`: Weapon, Armor, Back, Mask (handled by SheetEquipment)
- `cosmetic`: All other traits (Head, Eyes, etc.)

## Display Logic

### Stats Display Conditions

| Stat Section | Show When |
|--------------|-----------|
| Core Stats | Any of str, dex, con, int, wis, cha is non-null and > 0 |
| Derived Stats | Any of hp, max_hp, ac, speed is non-null |
| Level/XP | level is non-null |
| Equipment | equipment exists OR metadata.equipment exists (with non-"None" values) |
| NFT Traits | metadata.attributes array has items |

### Data Source Priority

For conflicting data sources, priority is:

1. **Stats**: Database columns take precedence over metadata
2. **Name**: `character.name` > `metadata.name` > `Character #{token_id}`
3. **Equipment**: Merge both sources (database equipment + NFT equipment)

## Validation Rules

All validation rules are existing (no changes):

| Field | Min | Max | Notes |
|-------|-----|-----|-------|
| Core stats | 1 | 20 | Standard D&D range |
| HP | 0 | 999 | Current can be 0 (unconscious) |
| Max HP | 1 | 999 | Must be positive |
| AC | 0 | 50 | 0 for unarmored |
| Speed | 0 | 200 | In feet |
| Level | 1 | 20 | Standard D&D levels |
| Experience | 0 | 999999 | Points |

## State Transitions

No state transitions - this feature is read-only display. Editing is handled by existing `PATCH /api/characters/[tokenId]` endpoint.
