# Quickstart: Character Filter Enhancement

**Feature**: 012-character-filter
**Date**: 2025-11-30

## Overview

This feature adds two new filters to the `/characters` page:
1. **Has Sheet Toggle** - Filter to characters with custom character sheet data
2. **Origin Dropdown** - Filter by character archetype (Body trait)

## Prerequisites

- Node.js 18+
- Running Supabase instance with characters data
- Existing `/characters` page working

## Key Files to Modify

### Backend (API)

| File | Change |
|------|--------|
| `app/api/characters/route.ts` | Add `hasSheet` and `origin` query parameters |
| `lib/repositories/character-repository.ts` | Add filter conditions to `findMany` |
| `app/api/characters/origins/route.ts` | **NEW** - Endpoint for origin list |
| `types/character.ts` | Extend `CharacterFilters` interface |

### Frontend (UI)

| File | Change |
|------|--------|
| `app/characters/page.tsx` | Add filter state and URL params |
| `components/characters/TokenFilterBar.tsx` | Add sheet toggle and origin dropdown |
| `components/characters/OriginDropdown.tsx` | **NEW** - Origin selector component |
| `components/characters/SheetToggle.tsx` | **NEW** - Sheet filter toggle |
| `hooks/useCharacters.ts` | Pass new filter params to API |
| `hooks/useOrigins.ts` | **NEW** - Fetch available origins |

## Implementation Steps

### Step 1: Extend Types

```typescript
// types/character.ts
export interface CharacterFilters {
  // ... existing
  hasSheet?: boolean
  origin?: string
}
```

### Step 2: Update Repository

```typescript
// lib/repositories/character-repository.ts
async findMany(filters: CharacterFilters) {
  let query = supabase.from('characters').select('*', { count: 'exact' })

  // NEW: Has sheet filter
  if (filters.hasSheet) {
    query = query.or('name.not.is.null,str.not.is.null,background_story.not.is.null')
  }

  // NEW: Origin filter
  if (filters.origin) {
    query = query.contains('metadata', {
      attributes: [{ trait_type: 'Body', value: filters.origin }]
    })
  }

  // ... rest of existing logic
}
```

### Step 3: Add Origins Endpoint

```typescript
// app/api/characters/origins/route.ts
export async function GET() {
  const { data } = await supabase.rpc('get_origin_counts')
  return NextResponse.json({ origins: data })
}
```

### Step 4: Update UI

```tsx
// app/characters/page.tsx
const hasSheet = searchParams.get('hasSheet') === 'true'
const origin = searchParams.get('origin') || null

// Pass to hook
const { characters } = useCharacters({
  ...existingFilters,
  hasSheet,
  origin,
})
```

## Testing

### Manual Tests

1. Navigate to `/characters`
2. Enable "Has Sheet" toggle → only characters with names/stats appear
3. Select origin from dropdown → only characters with that origin appear
4. Combine with existing tabs (Owned, Infected, etc.)
5. Copy URL and open in new tab → filters restored

### API Tests

```bash
# Has sheet filter
curl "http://localhost:3000/api/characters?hasSheet=true"

# Origin filter
curl "http://localhost:3000/api/characters?origin=Pilgrim"

# Combined
curl "http://localhost:3000/api/characters?hasSheet=true&origin=Wormkin%20Elite&tab=infected"

# Get origins
curl "http://localhost:3000/api/characters/origins"
```

## Success Criteria Verification

- [ ] SC-001: Characters with sheets found in ≤2 clicks
- [ ] SC-002: Filter response time <1 second
- [ ] SC-003: Filter combinations accurate (100%)
- [ ] SC-004: URL state preserved correctly
- [ ] SC-005: 4 simultaneous filters work without degradation

## Common Issues

### Issue: Origin filter returns no results
**Cause**: Origin value case mismatch
**Fix**: Ensure exact case match with metadata values

### Issue: Has sheet filter too slow
**Cause**: Missing index on filter columns
**Fix**: Add composite index:
```sql
CREATE INDEX idx_characters_has_sheet ON characters
  WHERE name IS NOT NULL OR str IS NOT NULL OR background_story IS NOT NULL;
```

### Issue: URL params not persisting
**Cause**: Router.push not including new params
**Fix**: Check updateURL function includes hasSheet and origin

## Related Docs

- [Spec](./spec.md) - Feature requirements
- [Data Model](./data-model.md) - Entity definitions
- [API Contract](./contracts/api.yaml) - OpenAPI spec
