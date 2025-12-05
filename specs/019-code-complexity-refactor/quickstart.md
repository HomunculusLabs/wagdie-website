# Quickstart: Code Complexity Refactoring

**Feature**: 019-code-complexity-refactor
**Date**: 2025-12-04

## Overview

This refactoring reduces code complexity in 4 high-traffic areas without changing functionality.

## Prerequisites

- Node.js 18+
- Existing wagdie-simplified development environment
- All existing tests passing (`npm test`)

## Development Setup

```bash
# Checkout feature branch
git checkout 019-code-complexity-refactor

# Install dependencies (no new deps added)
npm install

# Run tests to establish baseline
npm test

# Start dev server
npm run dev
```

## Implementation Order

### Priority 1: Character Detail Page (P1)

**Files**: `app/characters/[tokenId]/page.tsx`, new `hooks/useCharacterEditor.ts`

1. Create `useCharacterEditor` hook
2. Extract tab components to `app/characters/[tokenId]/components/`
3. Update page.tsx to use new hook and components
4. Verify all character detail tests pass

**Success Criteria**: Page reduced from 737 to <300 lines

### Priority 2: Blockchain Transaction Utility (P2)

**Files**: `hooks/useBlockchainTransaction.ts`, `hooks/useSpread.ts`

1. Create `useBlockchainTransaction` generic hook
2. Refactor `useSpread` to use new hook
3. Verify infection and spread transactions work identically

**Success Criteria**: New transaction type requires <30 lines

### Priority 3: Map Marker Configuration (P3)

**Files**: `game/config/markerConfig.ts`, `game/scenes/MapScene.ts`

1. Create `MARKER_CONFIG` configuration object
2. Replace 4 switch statements with config lookups
3. Verify all marker types render correctly

**Success Criteria**: New marker type requires 1 file change

### Priority 4: AI Persona Editor State (P4)

**Files**: `hooks/useAIPersonaEditor.ts`

1. Replace useState with useReducer
2. Replace 9 setter functions with dispatch
3. Verify draft persistence and change tracking work

**Success Criteria**: No duplicate setter boilerplate

## Testing

```bash
# Run all tests
npm test

# Run specific area tests
npm test -- app/characters
npm test -- hooks/useSpread
npm test -- game/scenes

# Run with coverage
npm test -- --coverage
```

## Verification Checklist

- [ ] All existing tests pass (100%)
- [ ] Character detail page loads correctly
- [ ] Character stats editing works
- [ ] Character save functionality works
- [ ] Infection transaction works
- [ ] Spread transaction works
- [ ] Map markers render correctly (all 5 types)
- [ ] Layer visibility toggles work
- [ ] AI persona editor saves correctly
- [ ] AI persona draft persistence works
- [ ] No console errors
- [ ] Build succeeds (`npm run build`)

## Rollback Plan

Each refactored area is independently deployable. If issues arise:

1. Revert only the affected file(s)
2. Keep other refactored areas in place
3. All changes are internal; no API changes to revert

## Code Review Checklist

- [ ] No new dependencies added (check package.json)
- [ ] No functionality changes (behavior identical)
- [ ] Line count reduction achieved
- [ ] TypeScript strict mode passes
- [ ] All tests pass
- [ ] Performance maintained (no regression)
