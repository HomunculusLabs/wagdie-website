# Research: Map Location Pin Editor

**Feature**: 018-map-editor
**Date**: 2025-12-03

## Research Summary

All technical unknowns have been resolved through codebase analysis. No external research required - the feature leverages existing patterns and infrastructure.

---

## 1. Admin Authentication Pattern

**Decision**: Reuse existing `isAdmin()` function from `lib/auth/admin.ts`

**Rationale**:
- Already implemented and proven in character editing (see `app/api/characters/[tokenId]/route.ts:106`)
- Uses wallet-based authentication with session management
- Hardcoded admin list is appropriate for small admin team

**Alternatives Considered**:
- Role-based access control (RBAC) - Overkill for single admin role
- On-chain admin verification - Unnecessary complexity

**Implementation Reference**:
```typescript
// Existing pattern from app/api/characters/[tokenId]/route.ts
import { isAdmin } from '@/lib/auth/admin'
const userIsAdmin = isAdmin(session.address)
```

---

## 2. Map Editor Integration with Phaser

**Decision**: Create a separate map editor page that wraps the existing Phaser game with editor-specific event handlers

**Rationale**:
- Current map uses Phaser 3.90 with custom `EventBus` for communication
- Phaser supports click events on the game canvas for coordinate capture
- Editor mode can overlay React components on top of Phaser canvas

**Alternatives Considered**:
- Modify existing map page with conditional editor UI - Increases complexity of main map
- Create entirely new React-Leaflet based editor - Duplicates map rendering logic

**Implementation Reference**:
```typescript
// Existing EventBus pattern from app/map/page.tsx
import { EventBus, MapEvents } from '@/game/EventBus';
EventBus.emit(MapEvents.UPDATE_LOCATIONS, locations);
```

---

## 3. Location CRUD API Pattern

**Decision**: Create new API routes at `/api/locations` following existing REST patterns

**Rationale**:
- Follows established patterns from `/api/characters/[tokenId]`
- Uses Supabase service role for write operations (existing RLS policy)
- Session-based auth with admin check

**Alternatives Considered**:
- GraphQL mutations - Inconsistent with existing REST API
- Direct Supabase client calls from frontend - Bypasses auth layer

**Implementation Reference**:
```typescript
// Pattern from existing character API
import { getSession } from '@/lib/auth/session'
const session = await getSession()
if (!session.address) {
  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}
```

---

## 4. Location ID Generation (Slug)

**Decision**: Generate human-readable slugs from location names (e.g., "Dragon's Lair" → "dragons_lair")

**Rationale**:
- Matches existing location IDs in database (e.g., `concord_searing`, `forsaken_lands`)
- Human-readable for debugging and URL usage
- Consistent with WAGDIE lore style

**Alternatives Considered**:
- UUID - Not human-readable
- Admin-provided IDs - Error-prone, inconsistent formatting

**Implementation**:
```typescript
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .trim()
}
```

---

## 5. Coordinate System

**Decision**: Use existing `metadata.coordinates` field with `{ x: number, y: number }` format

**Rationale**:
- Existing schema already supports this (see `types/map.ts:13`)
- Coordinates are relative to Phaser game world bounds
- No migration needed

**Implementation Reference**:
```typescript
// From types/map.ts
metadata?: {
  coordinates?: { x: number; y: number }
  rarity?: 'common' | 'rare' | 'legendary'
  special_properties?: string[]
}
```

---

## 6. Draggable Markers in Phaser

**Decision**: Use Phaser's built-in drag events with `setInteractive({ draggable: true })`

**Rationale**:
- Phaser 3 natively supports draggable game objects
- Can emit events to React layer for save operations
- Maintains 60fps performance

**Implementation Pattern**:
```typescript
// Phaser drag pattern
marker.setInteractive({ draggable: true });
marker.on('drag', (pointer, dragX, dragY) => {
  marker.setPosition(dragX, dragY);
});
marker.on('dragend', () => {
  EventBus.emit('LOCATION_MOVED', { id, x: marker.x, y: marker.y });
});
```

---

## 7. Character Staking Check (Delete Protection)

**Decision**: Query `character_locations` table before allowing delete

**Rationale**:
- Existing `character_locations` table tracks staked characters
- Simple count query to check if any characters are staked
- Returns clear error message if delete blocked

**Implementation Reference**:
```typescript
// Check before delete
const { count } = await supabase
  .from('character_locations')
  .select('*', { count: 'exact', head: true })
  .eq('location_id', locationId)
  .eq('status', 'staked')

if (count && count > 0) {
  return { error: 'Cannot delete: characters are staked at this location' }
}
```

---

## 8. Optimistic Updates

**Decision**: Use React state for immediate UI updates, then sync with server

**Rationale**:
- Provides instant feedback (<30 second task completion goal)
- Rollback on error with toast notification
- Follows React best practices

**Alternatives Considered**:
- Server-first updates - Slower UX, doesn't meet SC-002 criteria
- IndexedDB caching - Unnecessary complexity for admin tool

---

## Resolved Clarifications

| Question | Answer | Source |
|----------|--------|--------|
| Location ID generation | Human-readable slug from name | Clarification session 2025-12-03 |
| Admin action logging | Server-side console logs only | Clarification session 2025-12-03 |

---

## Dependencies Verified

| Dependency | Version | Status |
|------------|---------|--------|
| Phaser | 3.90.0 | ✅ Installed |
| @supabase/supabase-js | 2.39.0 | ✅ Installed |
| wagmi | 2.0.0 | ✅ Installed |
| Next.js | 15.0.0 | ✅ Installed |
| Tailwind CSS | 3.4.0 | ✅ Installed |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Phaser click conflicts with existing handlers | Low | Medium | Use dedicated edit mode that disables normal click behavior |
| Slug collisions | Low | Low | Add numeric suffix if slug exists (e.g., `dragons_lair_2`) |
| RLS policy blocks write | Low | High | Use service role key for API routes (already established pattern) |
