# Research: Code Complexity Refactoring

**Feature**: 019-code-complexity-refactor
**Date**: 2025-12-04

## Research Tasks

### 1. React State Management Patterns for Complex Forms

**Decision**: Use `useReducer` for the AI Persona Editor state management

**Rationale**:
- `useReducer` is ideal when state has multiple sub-values that change together
- Centralizes state logic in a single reducer function
- Eliminates need for 9 individual setter functions
- Built into React, no new dependencies required
- Actions are self-documenting and debuggable

**Alternatives Considered**:
- **Factory function for setters**: Still results in 9 functions, just generated; doesn't reduce complexity
- **Zustand/Jotai**: Would add new dependencies (violates FR-017)
- **Single useState with spread**: Same pattern as current, doesn't reduce boilerplate

### 2. Blockchain Transaction Handling Best Practices

**Decision**: Create a generic `useBlockchainTransaction` hook with callback-based customization

**Rationale**:
- Encapsulates common transaction lifecycle (pending → confirming → success/error)
- Uses callbacks for customization (onPending, onSuccess, onError) rather than inheritance
- Integrates with existing transaction store via injection
- Supports toast notifications through callback pattern
- Type-safe with generics for different transaction result types

**Alternatives Considered**:
- **Higher-order hook**: More complex, harder to understand
- **Class-based service**: Would break from React hooks pattern used throughout codebase
- **Copy-paste with helpers**: Still results in duplication, just less of it

### 3. Configuration Objects vs Switch Statements

**Decision**: Use a typed configuration object (`Record<MarkerType, MarkerConfig>`) with helper functions

**Rationale**:
- Single source of truth for marker properties
- Type-safe: TypeScript will error if a marker type is missing
- Self-documenting: all marker properties visible in one place
- Easy to extend: add new marker type by adding one object entry
- No runtime overhead compared to switch statements

**Alternatives Considered**:
- **Class hierarchy**: Over-engineered for simple property lookup
- **Map object**: Less type-safe than Record
- **Separate config files per type**: Scattered, harder to maintain

### 4. Component Extraction Patterns for Next.js App Router

**Decision**: Colocate extracted components in `app/characters/[tokenId]/components/` directory

**Rationale**:
- Follows Next.js App Router convention of colocating related files
- Components are private to the page (not exported from page.tsx)
- Clear ownership: components used only by this page live with it
- Avoids polluting shared `components/` directory

**Alternatives Considered**:
- **Shared components directory**: These components are page-specific, not reusable
- **Inline in page.tsx**: Defeats the purpose of extraction
- **Separate feature module**: Over-engineered for simple tab extraction

### 5. Custom Hook State Consolidation

**Decision**: Create `useCharacterEditor` hook to consolidate all editing state

**Rationale**:
- Single hook returns all editing state and setters
- Uses internal `useReducer` for state management
- Exposes only necessary interface (state + setters + save)
- Encapsulates `hasUnsavedChanges` logic
- Reusable if character editing needed elsewhere

**Alternatives Considered**:
- **Context + Provider**: Too heavy for single-page use
- **Multiple smaller hooks**: Still results in multiple state declarations in page component
- **Global state (Zustand)**: Would add dependency; state is page-local

## Technical Decisions Summary

| Area | Decision | Key Benefit |
|------|----------|-------------|
| AI Persona State | useReducer | Eliminates 9 setter functions |
| Transaction Utility | Callback-based hook | 60% code reduction in transaction hooks |
| Marker Config | Typed Record object | Single location for all marker properties |
| Component Extraction | Colocated directory | Clear ownership, follows Next.js patterns |
| Editor State | Consolidated hook | Reduces page component from 16 to ~3 useState calls |

## Dependencies Verified

- All solutions use built-in React APIs (useState, useReducer, useCallback)
- No new npm packages required
- All patterns compatible with existing TypeScript strict mode
- All patterns compatible with existing Jest testing setup

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | All existing tests must pass; incremental deployment |
| Performance regression | Benchmark before/after; maintain React.memo patterns |
| Type errors during refactor | TypeScript strict mode catches issues at compile time |
| Merge conflicts | Feature branch; small, focused PRs per area |
