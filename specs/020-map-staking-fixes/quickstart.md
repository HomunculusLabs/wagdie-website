# Quickstart: Map Staking Code Quality Fixes

## Overview

This is a refactoring feature to improve code quality in the map staking implementation. No new features are added.

## Prerequisites

- Node.js 18+
- pnpm/npm/yarn
- Existing dev environment set up

## Quick Verification

After implementing the changes, verify:

```bash
# 1. TypeScript compiles without errors
npm run build

# 2. No unsafe casts remain
grep -r "as unknown as" app/map/page.tsx
# Should return empty (no matches)

# 3. Single source of normalizeLocationMetadata
grep -r "function normalizeLocationMetadata" lib/
# Should only match lib/domain/location/metadata.ts

# 4. No duplicate helpers
grep -r "function getCenterFromBounds" lib/
# Should return empty (removed from character-repository.ts)
```

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `lib/repositories/character-repository.ts` | Modify | Remove duplicate helpers, add types |
| `app/map/page.tsx` | Modify | Remove unsafe casts |
| `hooks/map/useMapData.ts` | Modify | Update return type |
| `lib/repositories/characterLocationRepository.ts` | Evaluate | Remove dead code if unused |

## Testing

```bash
# Run existing tests to verify no regressions
npm test

# Manual test: Load map page and verify character markers appear
npm run dev
# Navigate to /map
# Verify: Staked characters display on location markers
```

## Success Criteria Verification

| Criteria | How to Verify |
|----------|--------------|
| SC-001: Zero unsafe casts | `grep -r "as unknown" app/map/page.tsx` returns empty |
| SC-002: Single normalization | `grep -r "normalizeLocationMetadata" lib/` shows only canonical import |
| SC-003: Markers render | Manual test on /map page |
| SC-004: Build succeeds | `npm run build` exits 0 |
| SC-005: No duplicate helpers | `grep -r "getCenterFromBounds" lib/` returns empty |
