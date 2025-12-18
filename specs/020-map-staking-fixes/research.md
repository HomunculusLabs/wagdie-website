# Research: Map Staking Code Quality Fixes

## Executive Summary

This document captures research findings for consolidating location metadata normalization and improving type safety in the map staking feature. The codebase has two implementations of `normalizeLocationMetadata` that need consolidation.

---

## Research Topics

### 1. Duplicate normalizeLocationMetadata Implementations

**Question**: Which implementation should be canonical and what are the differences?

**Findings**:

| Location | Implementation | Differences |
|----------|---------------|-------------|
| `lib/domain/location/metadata.ts` | Full implementation with typed exports | Uses `[number, number]` tuple format for center |
| `lib/repositories/character-repository.ts` | Simplified local copy | Uses `{ lat: number; lng: number }` object format |

**Decision**: Use canonical `lib/domain/location/metadata.ts`
**Rationale**:
1. Already exported and designed for reuse
2. Has comprehensive type definitions in `metadata-types.ts`
3. Handles more edge cases (coordinates, bounds formats)
4. Already imported correctly in `app/map/page.tsx` and `characterLocationRepository.ts`

**Alternatives Rejected**:
- Keep both: Creates maintenance burden and inconsistency
- Move to character-repository: Violates domain separation (metadata belongs in domain layer)

---

### 2. CharacterWithLocation Type Design

**Question**: How should the joined character-location data be typed?

**Findings**:

Current pattern in `character-repository.ts`:
```typescript
const rows = (data || []) as Array<
  Character & {
    location?: { id: string; name: string; metadata?: unknown } | null
  }
>
```

**Decision**: Define explicit `CharacterWithLocation` interface
**Rationale**:
1. Explicit types catch errors at compile time
2. Consumers get autocomplete for `character.location.id`, `character.location.name`, `character.location.metadata`
3. Can be refined to use `NormalizedLocationMetadata` for the metadata field

**Type Design**:
```typescript
// In lib/repositories/character-repository.ts or types/character.ts

export interface JoinedLocation {
  id: string;
  name: string;
  metadata: NormalizedLocationMetadata;
}

export interface CharacterWithLocation extends Character {
  location?: JoinedLocation | null;
}
```

---

### 3. characterLocationRepository.ts Usage Analysis

**Question**: Is this repository still needed after switching to character-repository.ts?

**Findings**:

| Method | Used By | Status |
|--------|---------|--------|
| `getConfirmed()` | Previously useMapData.ts | UNUSED after switch |
| `getByTokenId()` | Unknown | POTENTIALLY UNUSED |
| `getByWalletAddress()` | Unknown | POTENTIALLY UNUSED |
| `getByLocationId()` | Unknown | POTENTIALLY UNUSED |
| `getAll()` | Unknown | POTENTIALLY UNUSED |

Search for imports:
```bash
grep -r "characterLocationRepository" --include="*.ts" --include="*.tsx"
```

**Decision**: Evaluate and either:
1. Remove dead code (if truly unused)
2. Document purpose (if needed for future staking transactions)

**Rationale**: The `character_locations` table appears to be for tracking staking transactions (with status, transaction_hash), while `wagdie_characters.location_id` is the source of truth for current location. The repository may be needed for:
- Recording new staking transactions
- Transaction history
- Pending transaction tracking

**Recommendation**: Keep repository but remove dead normalization/deduplication code from `getConfirmed()` since map now uses `character-repository.getStakedCharacters()`.

---

### 4. Malformed Metadata Edge Cases

**Question**: How does the canonical `normalizeLocationMetadata` handle malformed data?

**Findings**:

The canonical implementation in `metadata.ts`:
- Returns `undefined` from parse functions for invalid data (not throw)
- `parseBounds()` validates array structure and numeric values
- Falls back to `[[0, 0], [0, 0]]` bounds if nothing can be derived
- Always returns a valid `NormalizedLocationMetadata` object

**Decision**: Canonical implementation is robust enough
**Rationale**: Graceful fallbacks ensure map doesn't crash on bad data

---

### 5. Type Casting Pattern

**Question**: How to eliminate `as unknown as { location?: any }` casts?

**Findings**:

Current problem in `app/map/page.tsx`:
```typescript
const joinedLocation = (c as unknown as { location?: any }).location;
```

This happens because `stakedCharacters` is typed as `Character[]` but actually contains joined location data from `getStakedCharacters()`.

**Decision**: Update `getStakedCharacters()` return type to `CharacterWithLocation[]`
**Rationale**: Type flows correctly through hook to consumers, eliminating need for casts

---

## Summary of Decisions

| Topic | Decision | File Changes |
|-------|----------|--------------|
| Normalization | Use canonical `metadata.ts` | Remove duplicates from `character-repository.ts` |
| Type Safety | Add `CharacterWithLocation` type | `character-repository.ts`, `useMapData.ts` |
| Dead Code | Keep repository, remove dead helpers | `characterLocationRepository.ts` if dedup unused |
| Edge Cases | Rely on canonical implementation | No changes needed |
| Casts | Fix with proper return types | `app/map/page.tsx` |
