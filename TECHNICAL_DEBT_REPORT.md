# Technical Debt Report

**Project:** wagdie-simplified
**Date:** November 29, 2025
**Analysis Method:** Historical code analysis, commit history review, and code quality indicators

---

## Executive Summary

The WAGDIE Simplified codebase shows evidence of **moderate technical debt** accumulated primarily during rapid feature development. The most significant debt originated from the map integration feature, which required a complete rebuild after initial implementation failed. Overall, the codebase demonstrates good refactoring practices when debt was identified, but several areas remain that warrant attention.

**Estimated Technical Debt Level:** **Medium** (40-60% confidence)

---

## 1. Historical Analysis

### 1.1 Commit History Overview

| Metric | Value |
|--------|-------|
| Total Commits | 58 |
| Fix Commits | 11 (19%) |
| Refactor Commits | 6 (10%) |
| Rebuild/Complete Rewrites | 1 major (map feature) |
| Code Churn (Lines Changed) | 614,666 insertions / 26,174 deletions |

### 1.2 Key Historical Events

#### Major Technical Debt Event: Map Feature Rebuild (Commit 8e259c1)
**Impact: HIGH**

The map feature required a complete rebuild from scratch, documented as:
- **Deleted:** 20+ broken files
- **Created:** 4-file simple solution
- **Root Causes:**
  - SSR/hydration errors
  - Unstable mapKey generation
  - Missing metadata handling
  - Complex architecture that couldn't be debugged

This represents the largest single technical debt event in the codebase. The commit message explicitly documents:
> "Completely rebuilt the interactive map feature from scratch, deleting 20+ broken files and creating a simple, working 4-file solution."

#### Secondary Debt: Infinite Loop Issues (Commits 4690b3b, 6a4ab53)
**Impact: MEDIUM**

The lore page experienced infinite loop issues requiring emergency fixes:
- Required reducing tweet loading limits
- Indicates potential state management issues

---

## 2. High-Churn Files (Technical Debt Indicators)

Files with the highest change frequency often indicate areas of technical debt:

| File | Changes | Lines Changed | Status |
|------|---------|---------------|--------|
| `app/map/page.tsx` | 14 | 1,602 | **High Debt** - Major rewrite to Phaser |
| `app/characters/[tokenId]/page.tsx` | 13 | 2,432 | Medium Debt |
| `components/map/SimpleMap.tsx` | 12 | 3,986 | **Addressed** - Refactored |
| `components/layout/Header.tsx` | 11 | 1,443 | Medium Debt |
| `app/lore/page.tsx` | 11 | 2,041 | Medium Debt (infinite loop) |
| `app/characters/page.tsx` | 11 | 987 | Low Debt |
| `components/characters/CharacterCard.tsx` | 11 | 466 | Low Debt |

---

## 3. Code Quality Indicators

### 3.1 TODO/FIXME Analysis

**Found 25+ TODO comments** indicating incomplete implementations:

| Location | Issue | Priority |
|----------|-------|----------|
| `hooks/useContractWrite.ts:28,46,88,106` | Placeholder contract implementations | **HIGH** |
| `lib/services/wallet-service.ts:15` | Contract addresses hardcoded as zeros | **HIGH** |
| `scripts/migration/tests/` | 15+ TODO items in integration tests | MEDIUM |

### 3.2 ESLint Disable Comments (12 occurrences)

| File | Reason |
|------|--------|
| `game/PhaserGame.tsx:117` | react-hooks/exhaustive-deps |
| `hooks/useStaking.ts:391` | react-hooks/exhaustive-deps |
| `hooks/useCharacterOwnership.ts:64,120` | react-hooks/exhaustive-deps |
| `app/characters/page.tsx:48` | react-hooks/exhaustive-deps |
| `app/spread/page.tsx:45` | react-hooks/exhaustive-deps |
| `hooks/useCure.ts:62` | react-hooks/exhaustive-deps |
| `components/modals/*.tsx` (4 files) | react-hooks/exhaustive-deps |

**Pattern:** Most disabled lints are for `react-hooks/exhaustive-deps`, indicating dependency array issues that may cause stale closures or unnecessary re-renders.

### 3.3 Type Safety Issues

- **78 occurrences of `any` type** across 20 files
- Highest concentrations in:
  - `game/scenes/MapScene.ts` (9)
  - `lib/services/blockchain/staking.ts` (8)
  - `lib/utils/multicall.ts` (7)

### 3.4 Deleted/Orphaned Code

Currently staged for deletion (unstaged):
- `lib/services/AssetCache.ts` (619 lines)
- `lib/services/AssetRegistry.ts`
- `lib/services/eventService.ts`

**Duplicate files detected:**
- `lib/services/asset-loading-service.ts` (kebab-case)
- `lib/services/AssetLoadingService.ts` (PascalCase)
- Similar patterns in `AssetErrorHandler.ts`

---

## 4. Architectural Debt

### 4.1 Dual Map Implementation
**Status: ACTIVE DEBT**

The codebase currently has TWO separate map implementations:
1. **Leaflet-based** (`components/map/SimpleMap.tsx`) - 358 lines
2. **Phaser-based** (`game/scenes/MapScene.ts`) - 492 lines

The `app/map/page.tsx` was recently rewritten to use Phaser (commit 716ec4f), but the Leaflet components remain. This creates:
- Maintenance burden for two systems
- Confusion about which implementation is canonical
- ~850 lines of potentially redundant code

### 4.2 Placeholder Blockchain Integration
**Status: ACTIVE DEBT**

The contract write hooks (`hooks/useContractWrite.ts`) are entirely placeholder implementations:
```typescript
// TODO: Implement actual contract write
await new Promise((resolve) => setTimeout(resolve, 2000))
const mockHash = '0x' + Math.random().toString(16).substring(2)
```

Contract addresses in `wallet-service.ts` are all zeros:
```typescript
CORPSE: '0x0000000000000000000000000000000000000000' as Address
```

### 4.3 Test Infrastructure
**Status: MODERATE DEBT**

- `tests/TODO-integration/` directory contains incomplete tests
- E2E tests reference `@playwright/test` but it's not in dependencies
- Several test files throw TypeScript errors (per `tsc_output_3.txt`)

---

## 5. Impact Assessment

### 5.1 Maintenance Impact

| Area | Impact | Description |
|------|--------|-------------|
| Map Feature | HIGH | Dual implementation requires double maintenance |
| Blockchain Hooks | HIGH | All contract interactions are non-functional |
| Type Safety | MEDIUM | `any` types reduce IDE assistance and error detection |
| ESLint Suppressions | LOW-MEDIUM | May cause subtle bugs with stale closures |
| Orphaned Code | LOW | Adds to codebase size but no functional impact |

### 5.2 Development Velocity Impact

- **Onboarding difficulty:** New developers must understand two map implementations
- **Feature development:** Blockchain features cannot be implemented until contract integration is complete
- **Testing friction:** Integration tests are incomplete/broken

### 5.3 Risk Assessment

| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| Map bugs due to dual implementation | Medium | High | **HIGH** |
| Runtime errors from `any` types | Medium | Medium | MEDIUM |
| Stale closure bugs | Low | Medium | LOW |
| Contract integration delays | High | High | **HIGH** |

---

## 6. Prioritized Recommendations

### Priority 1: CRITICAL (Address Immediately)

1. **Remove unused map implementation**
   - Decision needed: Keep Leaflet OR Phaser, not both
   - Impact: Reduces maintenance burden by ~400-500 lines
   - Effort: 2-4 hours

2. **Implement actual contract integration**
   - Replace placeholder hooks with real wagmi implementations
   - Add proper contract addresses to environment variables
   - Impact: Enables core blockchain functionality
   - Effort: 1-2 days

### Priority 2: HIGH (Address This Sprint)

3. **Fix ESLint dependency array issues**
   - Review each suppression and fix properly
   - Consider using `useCallback` patterns
   - Impact: Prevents subtle bugs
   - Effort: 4-8 hours

4. **Clean up deleted/duplicate files**
   - Remove staged deletions
   - Consolidate kebab-case vs PascalCase duplicates
   - Impact: Cleaner codebase
   - Effort: 1-2 hours

### Priority 3: MEDIUM (Address This Month)

5. **Reduce `any` type usage**
   - Focus on `game/scenes/MapScene.ts` and `lib/services/blockchain/`
   - Add proper type definitions
   - Impact: Better IDE support, fewer runtime errors
   - Effort: 1-2 days

6. **Fix integration tests**
   - Add @playwright/test as dev dependency
   - Complete TODO tests or remove
   - Impact: Better test coverage
   - Effort: 2-4 hours

### Priority 4: LOW (Backlog)

7. **Complete TODO implementations**
   - Address remaining 25+ TODO comments
   - Impact: Feature completeness
   - Effort: Varies

8. **Document architecture decisions**
   - Why Phaser vs Leaflet?
   - Contract integration approach
   - Impact: Better onboarding
   - Effort: 2-4 hours

---

## 7. Positive Observations

Despite the identified debt, the codebase shows evidence of good practices:

1. **Proactive refactoring:** The map rebuild demonstrates willingness to address debt head-on
2. **Clean architecture:** Recent refactoring (commit 7bceee7) implemented clean architecture principles
3. **Good documentation:** Map refactoring is well-documented in CLAUDE.md
4. **Performance focus:** Icon caching, memoization, and performance monitoring are implemented
5. **Test coverage:** 87.62% test coverage on map components

---

## 8. Metrics Summary

| Metric | Value | Assessment |
|--------|-------|------------|
| Technical Debt Ratio | ~20-25% | Moderate |
| Fix Commit Percentage | 19% | Acceptable |
| TODO Comments | 25+ | Needs attention |
| Type Safety (any usage) | 78 occurrences | Needs improvement |
| Test Coverage | 87.62% (map) | Good |
| Code Duplication | 2 duplicate services | Needs cleanup |

---

## Appendix: Files Requiring Attention

### High Priority Files
- `hooks/useContractWrite.ts`
- `lib/services/wallet-service.ts`
- `app/map/page.tsx`
- `components/map/SimpleMap.tsx`

### Medium Priority Files
- `game/scenes/MapScene.ts`
- `app/lore/page.tsx`
- `hooks/useStaking.ts`
- `hooks/useCharacterOwnership.ts`

### Low Priority Files
- `lib/services/AssetCache.ts` (staged for deletion)
- `lib/services/AssetRegistry.ts` (staged for deletion)
- `tests/TODO-integration/*`

---

*Report generated by technical debt analysis*
