# Quickstart: Character Stats & Equipment Display

**Feature**: 015-character-stats-equipment
**Date**: 2025-12-01

## Overview

This feature enhances the character detail page to display all available stats and equipment. It's a low-risk display enhancement with minimal code changes.

## Prerequisites

- Node.js 18+
- Running development server
- Database seeded with character data

## Development Setup

```bash
# Start development server
npm run dev

# Navigate to a character page
open http://localhost:3000/characters/1
```

## Implementation Checklist

### Phase 1: NFT Traits Utility

Create `lib/utils/nft-traits.ts`:

```typescript
export interface NFTTrait {
  type: string
  value: string
  category: 'identity' | 'cosmetic' | 'equipment'
}

const IDENTITY_TRAITS = ['Body', 'Alignment']
const EQUIPMENT_TRAITS = ['Weapon', 'Armor', 'Back', 'Mask']

export function extractNFTTraits(metadata: CharacterMetadata | null): NFTTrait[] {
  if (!metadata?.attributes || !Array.isArray(metadata.attributes)) {
    return []
  }

  return metadata.attributes
    .filter(attr => attr.trait_type && attr.value)
    .map(attr => ({
      type: attr.trait_type,
      value: String(attr.value),
      category: categorize(attr.trait_type)
    }))
}

function categorize(traitType: string): NFTTrait['category'] {
  if (IDENTITY_TRAITS.includes(traitType)) return 'identity'
  if (EQUIPMENT_TRAITS.includes(traitType)) return 'equipment'
  return 'cosmetic'
}
```

### Phase 2: NFT Traits Component

Create `components/characters/NFTTraitsDisplay.tsx`:

```typescript
interface NFTTraitsDisplayProps {
  metadata: CharacterMetadata | null
  showIdentityOnly?: boolean
}

export function NFTTraitsDisplay({ metadata, showIdentityOnly = false }: NFTTraitsDisplayProps) {
  const traits = extractNFTTraits(metadata)
  const displayTraits = showIdentityOnly
    ? traits.filter(t => t.category === 'identity')
    : traits.filter(t => t.category !== 'equipment')

  if (displayTraits.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {displayTraits.map(trait => (
        <Badge key={trait.type} variant="secondary">
          {trait.type}: {trait.value}
        </Badge>
      ))}
    </div>
  )
}
```

### Phase 3: Page Integration

Update `app/characters/[tokenId]/page.tsx`:

1. Add `NFTTraitsDisplay` import
2. Add traits display below character name
3. Ensure stats always show when data exists

### Phase 4: Testing

```bash
# Run tests
npm test

# Manual verification
# 1. View character with stats - all should display
# 2. View character without stats - empty prompt shown for owners
# 3. View character with NFT traits - badges visible
# 4. View as non-owner - read-only, no edit buttons
```

## Key Files

| File | Action | Notes |
|------|--------|-------|
| `lib/utils/nft-traits.ts` | Create | Trait extraction utility |
| `components/characters/NFTTraitsDisplay.tsx` | Create | New component |
| `app/characters/[tokenId]/page.tsx` | Modify | Add traits, fix display logic |
| `components/characters/CoreStatsEditor.tsx` | Minor | Ensure always shows when data |
| `tests/components/characters/NFTTraitsDisplay.test.tsx` | Create | Unit tests |

## Testing Scenarios

1. **Character with full stats**: Token #1 - all stats should display
2. **Character with no stats**: Find one with null stats - empty prompt for owner
3. **Character with NFT traits**: All tokens have metadata - traits should show
4. **Non-owner view**: Disconnect wallet - all data visible, no edit buttons

## Success Criteria

- [ ] All non-null stats display on page load
- [ ] NFT traits (Body, Alignment) visible as badges
- [ ] Equipment section shows items from both formats
- [ ] Empty states show appropriately
- [ ] Non-owners see same data minus edit controls
- [ ] Page loads in < 2 seconds
