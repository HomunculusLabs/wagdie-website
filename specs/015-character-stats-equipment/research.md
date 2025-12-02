# Research: Character Stats & Equipment Display

**Feature**: 015-character-stats-equipment
**Date**: 2025-12-01

## Executive Summary

This feature requires minimal research as it enhances existing functionality. The key findings confirm:
1. All required data is already available via the existing API
2. Display components exist but need conditional improvements
3. NFT traits need a new extraction utility and display component

## Research Tasks

### 1. Current Data Availability

**Question**: What character data is already fetched by the API?

**Finding**: The `/api/characters/[tokenId]` endpoint returns the full `Character` object including:
- Core stats: `str`, `dex`, `con`, `int`, `wis`, `cha` (dedicated columns)
- Derived stats: `hp`, `max_hp`, `ac`, `speed` (dedicated columns)
- Level/Experience: `level`, `experience` (dedicated columns)
- Equipment: `equipment` column + `metadata.equipment` (NFT format)
- NFT Metadata: `metadata` JSONB with `attributes` array

**Decision**: No API changes needed - all data is already available.

**Rationale**: The existing `characterRepository.findById()` returns `SELECT *` which includes all columns.

---

### 2. Existing Component Analysis

**Question**: What display components exist and what changes are needed?

**Findings**:

| Component | Current Behavior | Needed Change |
|-----------|-----------------|---------------|
| `CoreStatsEditor` | Shows stats only when `hasCharacterSheet` is true | Always show when any stat > 0 |
| `DerivedStatsEditor` | Shows stats only when values are non-null | Good - keep as is |
| `SheetEquipment` | Shows equipment from both formats | Add better empty state |
| `LevelExperienceEditor` | Shows level/XP | Good - keep as is |

**Decision**: Minor modifications to display logic; add new `NFTTraitsDisplay` component.

**Rationale**: Existing components handle rendering well; issue is conditional display logic in parent page.

---

### 3. NFT Metadata Structure

**Question**: What traits exist in NFT metadata and how should they be displayed?

**Finding**: NFT metadata `attributes` array contains:
```typescript
[
  { trait_type: "Body", value: "Human" },
  { trait_type: "Alignment", value: "Chaotic Evil" },
  { trait_type: "Head", value: "Skull Mask" },
  { trait_type: "Weapon", value: "Bone Sword" },
  // ... other traits
]
```

**Decision**: Create utility to extract and categorize traits:
- Identity traits: Body, Alignment (prominently displayed)
- Equipment traits: Already handled by `SheetEquipment`
- Cosmetic traits: Head, Weapon, etc. (secondary display)

**Rationale**: Body and Alignment are key character identity; other traits vary by character.

---

### 4. Display Priority

**Question**: How should stats/traits be organized on the page?

**Finding**: Current layout (top to bottom):
1. Character image
2. Name + Level/XP
3. Quick stats (HP, AC, Speed)
4. Core attributes (STR, DEX, etc.)
5. Tabs: Story | Equipment | Wallet

**Decision**: Add NFT traits as badges near the name OR as a new section above tabs.

**Alternatives Rejected**:
- New tab for traits: Too hidden for identity-critical info
- Inline with stats: Too cluttered

---

### 5. Empty State Handling

**Question**: How should we handle missing data?

**Finding**: Current behavior varies:
- No stats: Shows `EmptyStatsPrompt` for owners, nothing for non-owners
- No equipment: Shows "No equipment" empty state

**Decision**: Standardize empty states:
- Stats: Show nothing (no zeroes) when all null
- Equipment: Keep "No equipment" message
- NFT Traits: Only show section if traits exist

**Rationale**: Don't show empty sections; only show data that exists.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data format inconsistency | Low | Medium | Support both NFT and game formats |
| Performance regression | Low | Low | No new API calls required |
| Breaking existing functionality | Low | High | Unit tests for all modified components |

## Dependencies

None - all dependencies already exist in the project.

## Open Questions

None - all research questions resolved.
