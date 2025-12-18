# Feature Specification: Map Staking Code Quality Fixes

**Feature Branch**: `020-map-staking-fixes`
**Created**: 2025-12-17
**Status**: Draft
**Input**: User description: "Fix map staking issues identified in code review: remove duplicate normalizeLocationMetadata implementation, add proper TypeScript types for joined location data, clean up unused characterLocationRepository changes, and ensure type safety across the staking feature"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Code Maintainability for Location Metadata (Priority: P1)

As a developer working on the map feature, I need a single source of truth for location metadata normalization so that I don't accidentally use inconsistent logic across different parts of the codebase.

**Why this priority**: Duplicate code is the root cause of bugs where one copy gets updated and another doesn't. This directly impacts data consistency on the map.

**Independent Test**: Can be fully tested by verifying that all location metadata normalization flows through the canonical implementation in `lib/domain/location/metadata.ts` and delivers consistent center derivation from bounds.

**Acceptance Scenarios**:

1. **Given** a location with only `bounds` in metadata, **When** the location is processed by `character-repository.getStakedCharacters()`, **Then** the location's `center` is derived using the same logic as `LocationRepository`
2. **Given** the codebase is searched for `normalizeLocationMetadata`, **When** reviewing imports, **Then** all usages import from `lib/domain/location/metadata.ts` (no local implementations)
3. **Given** a location with existing `center` in metadata, **When** processed by any repository, **Then** the existing center is preserved unchanged

---

### User Story 2 - Type Safety for Staked Character Data (Priority: P1)

As a developer, I need proper TypeScript types for staked character data with joined location information so that the compiler catches type errors before runtime.

**Why this priority**: The current `as unknown as { location?: any }` casts bypass TypeScript's safety checks, allowing bugs to slip through to production.

**Independent Test**: Can be fully tested by compiling the codebase with strict TypeScript settings and confirming no type assertions are needed when accessing joined location properties.

**Acceptance Scenarios**:

1. **Given** `getStakedCharacters()` returns data, **When** accessing `character.location.id` or `character.location.metadata`, **Then** TypeScript provides autocomplete and type checking without manual casts
2. **Given** the map page component uses staked character data, **When** building the `mapCharacterMarkers` memo, **Then** no `as unknown` or `as any` casts are required
3. **Given** a developer adds a new property access on joined location data, **When** the property doesn't exist, **Then** TypeScript reports a compile-time error

---

### User Story 3 - Clean Repository Architecture (Priority: P2)

As a developer, I need clarity on which repository handles staked character data so that I don't maintain dead code or use the wrong data source.

**Why this priority**: The recent changes added deduplication logic to `characterLocationRepository.ts` but then switched to using `character-repository.ts`. This creates confusion about which code path is active.

**Independent Test**: Can be fully tested by tracing the data flow from the map page to the database and confirming a single, clear path for staked character data.

**Acceptance Scenarios**:

1. **Given** the map page loads staked characters, **When** tracing the code path, **Then** only one repository method is used (not both `CharacterLocationRepository.getConfirmed()` and `CharacterRepository.getStakedCharacters()`)
2. **Given** `useMapData` hook imports repositories, **When** reviewing the imports, **Then** unused repository imports are removed
3. **Given** the `characterLocationRepository.ts` file, **When** reviewing recent changes, **Then** either the deduplication/normalization changes are used by some feature OR they are removed to avoid maintenance burden

---

### Edge Cases

- What happens when a location has bounds but the bounds array is malformed (wrong length, non-numeric values)?
- What happens when a character has a `location_id` but the joined location query returns null (orphaned foreign key)?
- How does the system handle a character that appears in both `character_locations` table and `wagdie_characters.location_id` with different locations?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use a single `normalizeLocationMetadata` function from `lib/domain/location/metadata.ts` for all location metadata processing
- **FR-002**: System MUST define a TypeScript type `CharacterWithLocation` that explicitly types the joined location data returned by `getStakedCharacters()`
- **FR-003**: System MUST export `CharacterWithLocation` type from the repository so consumers can use it without casting
- **FR-004**: System MUST remove duplicate `normalizeLocationMetadata` and helper functions from `character-repository.ts`
- **FR-005**: System MUST remove unused imports and dead code paths related to the repository switch
- **FR-006**: System MUST handle malformed location metadata gracefully (log warning, skip marker placement rather than crash)
- **FR-007**: System MUST filter out characters with orphaned `location_id` references (where joined location is null) before passing to the map

### Key Entities

- **CharacterWithLocation**: A Character record with an optional joined `location` object containing `id`, `name`, and `metadata` fields. Represents a staked character with its current location data.
- **NormalizedLocationMetadata**: Location metadata that always has a `center` field (either from the original data or derived from `bounds`). Used for consistent marker placement.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero TypeScript `as unknown` or `as any` casts related to staked character location data across the codebase
- **SC-002**: Single file (`lib/domain/location/metadata.ts`) contains all location metadata normalization logic with 100% of usages importing from that file
- **SC-003**: All staked character markers render correctly on the map (no missing markers due to normalization inconsistencies)
- **SC-004**: Build completes with zero TypeScript errors under strict mode for all modified files
- **SC-005**: Code search for duplicate helper functions (`getCenterFromBounds`, local `normalizeLocationMetadata`) returns zero results outside the canonical location
