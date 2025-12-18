# Requirements Checklist: Map Staking Code Quality Fixes

## User Stories

- [X] **US-1**: Code Maintainability for Location Metadata (P1)
  - [X] All `normalizeLocationMetadata` usages import from `lib/domain/location/metadata.ts`
  - [X] Location center derived consistently from bounds across all repositories
  - [X] Existing center values preserved when present in metadata

- [X] **US-2**: Type Safety for Staked Character Data (P1)
  - [X] `CharacterWithLocation` type defined and exported from repository
  - [X] No `as unknown` or `as any` casts for joined location data
  - [X] TypeScript provides autocomplete for `character.location.id` and `character.location.metadata`

- [X] **US-3**: Clean Repository Architecture (P2)
  - [X] Single repository method used for staked character data
  - [X] Unused repository imports removed from `useMapData`
  - [X] Dead code in `characterLocationRepository.ts` either used or removed (documented - functions ARE used internally)

## Functional Requirements

- [X] **FR-001**: Single `normalizeLocationMetadata` function from `lib/domain/location/metadata.ts`
- [X] **FR-002**: `CharacterWithLocation` TypeScript type defined for joined location data
- [X] **FR-003**: `CharacterWithLocation` type exported from repository for consumer use
- [X] **FR-004**: Duplicate `normalizeLocationMetadata` and helpers removed from `character-repository.ts`
- [X] **FR-005**: Unused imports and dead code paths removed
- [X] **FR-006**: Malformed location metadata handled gracefully (log warning, skip marker)
- [X] **FR-007**: Characters with orphaned `location_id` references filtered out

## Success Criteria

- [X] **SC-001**: Zero `as unknown` or `as any` casts for staked character location data
- [X] **SC-002**: All location metadata normalization in single file with 100% import coverage
- [ ] **SC-003**: All staked character markers render correctly on map (requires manual test)
- [X] **SC-004**: Build completes with zero TypeScript errors under strict mode
- [X] **SC-005**: No duplicate helper functions found outside canonical location

## Edge Cases

- [X] Malformed bounds array (wrong length, non-numeric) handled without crash
- [X] Orphaned `location_id` foreign key (null joined location) filtered
- [X] Character in both `character_locations` and `wagdie_characters.location_id` handled
