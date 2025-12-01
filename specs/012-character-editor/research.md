# Research: Character Editor

**Feature**: 012-character-editor
**Date**: 2025-11-29

## Research Summary

This feature extends existing infrastructure with minimal new patterns. Research focused on best practices for form handling, validation, and optimistic updates in the current stack.

---

## Decision 1: Form State Management

**Decision**: Use React controlled components with local state (useState)

**Rationale**:
- Consistent with existing pattern in `app/characters/[tokenId]/page.tsx` (see `editedStory` state)
- No need for heavy form libraries for 6-10 input fields
- Keeps bundle size small
- Easy to implement validation inline

**Alternatives Considered**:
- React Hook Form: Overkill for simple stat inputs, adds dependency
- Formik: Heavy, deprecated patterns
- Tanstack Form: New API, unnecessary complexity for this use case

---

## Decision 2: Validation Strategy

**Decision**: Client-side validation with server-side re-validation

**Rationale**:
- Client-side provides immediate feedback (matches SC-001, SC-002 timing goals)
- Server-side ensures data integrity for malicious requests
- Validation rules are simple (numeric ranges, string length)

**Implementation**:
```typescript
// lib/utils/stat-validation.ts
export const STAT_CONSTRAINTS = {
  coreStats: { min: 1, max: 30 },      // STR, DEX, CON, INT, WIS, CHA
  hp: { min: 0, max: 999 },
  maxHp: { min: 1, max: 999 },
  ac: { min: 0, max: 30 },
  speed: { min: 0, max: 120 },
  level: { min: 1, max: 20 },
  experience: { min: 0, max: 999999 },
  name: { maxLength: 100 }
}
```

**Alternatives Considered**:
- Zod schema validation: Good but adds dependency; simple range checks sufficient
- Server-only validation: Poor UX, fails timing requirements

---

## Decision 3: UI Pattern for Stat Editing

**Decision**: Inline editing within existing character detail page

**Rationale**:
- Maintains context (user sees character image while editing)
- Consistent with existing edit pattern for background_story
- No modal/popup complexity
- Supports atomic save of all changes

**UI Flow**:
1. Owner clicks "Edit" button (already exists)
2. All stat fields become editable inputs
3. Validation errors shown inline below each input
4. "Save" commits all changes atomically
5. "Cancel" reverts to original values

**Alternatives Considered**:
- Modal form: Disconnects from character context
- Separate edit page: Extra navigation, inconsistent with existing pattern

---

## Decision 4: API Extension Pattern

**Decision**: Extend existing PATCH endpoint with additional allowed fields

**Rationale**:
- Consistent with REST principles
- Existing ownership verification reused
- Single atomic update for all fields
- No new endpoints required

**Current Code** (`app/api/characters/[tokenId]/route.ts:92-98`):
```typescript
const allowedUpdates: any = {}
if ('background_story' in updates) {
  allowedUpdates.background_story = updates.background_story
}
if ('equipment' in updates) {
  allowedUpdates.equipment = updates.equipment
}
```

**Extended Pattern**:
```typescript
const allowedFields = [
  'background_story', 'equipment', 'name',
  'str', 'dex', 'con', 'int', 'wis', 'cha',
  'hp', 'max_hp', 'ac', 'speed', 'level', 'experience'
]
```

**Alternatives Considered**:
- New `/api/characters/[tokenId]/stats` endpoint: Unnecessary fragmentation
- PUT instead of PATCH: Would require sending entire character object

---

## Decision 5: Optimistic Updates

**Decision**: Optimistic UI update with rollback on error

**Rationale**:
- Matches "immediately displayed" requirement (SC-005)
- Common React pattern for perceived performance
- Existing toast notifications for success/error (already in codebase)

**Implementation Pattern**:
```typescript
// 1. Save original state
const original = { ...character }
// 2. Update UI immediately
setCharacter({ ...character, ...updates })
// 3. Send API request
const response = await fetch(...)
// 4. On error, rollback
if (!response.ok) {
  setCharacter(original)
  toast.error('Failed to save')
}
```

**Alternatives Considered**:
- Wait for API response: Slower perceived performance
- React Query mutations: Adds complexity, current fetch pattern works

---

## Decision 6: Repository Layer Update

**Decision**: Extend existing `update()` method signature

**Rationale**:
- Maintains single update method
- Type system prevents invalid field combinations
- Existing Supabase update pattern works with additional columns

**Current Signature** (`lib/repositories/character-repository.ts:13`):
```typescript
update(tokenId: number, updates: Partial<Pick<Character, 'background_story' | 'equipment'>>): Promise<Character | null>
```

**New Signature**:
```typescript
type EditableFields = 'name' | 'background_story' | 'equipment' |
  'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha' |
  'hp' | 'max_hp' | 'ac' | 'speed' | 'level' | 'experience'

update(tokenId: number, updates: Partial<Pick<Character, EditableFields>>): Promise<Character | null>
```

**Alternatives Considered**:
- Separate `updateStats()` method: Unnecessary fragmentation
- Direct Supabase calls: Bypasses repository pattern

---

## Technology Compatibility Check

| Dependency | Version | Compatible | Notes |
|------------|---------|------------|-------|
| Next.js | 15 | ✓ | App Router, async params |
| React | 18 | ✓ | useState, controlled inputs |
| Supabase | 2.39 | ✓ | Update method supports partial updates |
| TypeScript | 5 | ✓ | Strict mode, Pick/Partial utility types |
| Tailwind | 3.4 | ✓ | Existing styling patterns |

---

## Open Questions (None)

All technical decisions resolved. Proceed to Phase 1.
