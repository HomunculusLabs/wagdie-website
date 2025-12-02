# Feature Specification: Character Stats & Equipment Display

**Feature Branch**: `015-character-stats-equipment`
**Created**: 2025-12-01
**Status**: Draft
**Input**: User description: "We are missing many details on the character page, like their stats and equipment. Can we get that loaded in?"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Complete Character Stats (Priority: P1)

A user visits a character's detail page and wants to see all available character statistics at a glance, including core attributes (STR, DEX, CON, INT, WIS, CHA), derived stats (HP, AC, Speed), level, experience, and any additional traits from the NFT metadata.

**Why this priority**: This is the core functionality requested - users need to see complete character information that is currently missing or not displayed prominently.

**Independent Test**: Can be fully tested by navigating to any character page and verifying all available stats are displayed with proper formatting and labels.

**Acceptance Scenarios**:

1. **Given** a character has core stats in the database, **When** the user views the character page, **Then** all six core stats (STR, DEX, CON, INT, WIS, CHA) are displayed with their values and visual progress indicators.
2. **Given** a character has derived stats (HP, Max HP, AC, Speed), **When** the user views the character page, **Then** these stats are displayed in the quick stats section.
3. **Given** a character has level and experience values, **When** the user views the character page, **Then** level is prominently displayed and experience shows progress toward the next level.
4. **Given** a character has no stats assigned, **When** the user views the character page, **Then** a clear message indicates stats are not yet assigned (no empty/zero values shown).

---

### User Story 2 - View Character Equipment (Priority: P2)

A user wants to see what equipment their character has, including weapons, armor, items, and any special gear from the NFT metadata (back items, masks, etc.).

**Why this priority**: Equipment is a key part of character identity but requires stats to be visible first for context.

**Independent Test**: Can be tested by viewing the Equipment tab on any character with equipment data and verifying all items display correctly.

**Acceptance Scenarios**:

1. **Given** a character has equipment in the standard format (weapons, armor, items arrays), **When** the user views the Equipment tab, **Then** all equipment is listed in categorized sections.
2. **Given** a character has NFT metadata equipment (armor, back, mask strings), **When** the user views the Equipment tab, **Then** these items are displayed in appropriate categories.
3. **Given** a character has gold/currency, **When** the user views the Equipment tab, **Then** the gold amount is displayed.
4. **Given** a character has no equipment, **When** the user views the Equipment tab, **Then** a clear "No equipment" message is shown.

---

### User Story 3 - View NFT Trait Attributes (Priority: P3)

A user wants to see all the original NFT traits/attributes for their character (e.g., Body type, Alignment, and other metadata attributes) that were part of the original NFT.

**Why this priority**: NFT traits provide character identity but are secondary to game-relevant stats.

**Independent Test**: Can be tested by viewing any character and confirming all NFT attributes from the metadata are visible.

**Acceptance Scenarios**:

1. **Given** a character has NFT attributes in array format, **When** the user views the character page, **Then** all trait_type/value pairs are displayed.
2. **Given** a character has specific traits like Body, Alignment, Origin, **When** the user views the character page, **Then** these traits are prominently displayed as character identity markers.
3. **Given** a character has no NFT attributes, **When** the user views the character page, **Then** no empty attributes section is shown.

---

### User Story 4 - Consistent Stats Display for Non-Owners (Priority: P3)

A user viewing a character they don't own should see all publicly available stats and equipment without edit capabilities.

**Why this priority**: Ensures all users can view character information regardless of ownership.

**Independent Test**: Can be tested by viewing a character page while not connected as the owner and confirming all stats are visible but not editable.

**Acceptance Scenarios**:

1. **Given** a user is viewing a character they don't own, **When** they view the stats section, **Then** all stats display in read-only mode with no edit buttons.
2. **Given** a user is not connected with a wallet, **When** they view any character page, **Then** all public stats and equipment are visible.

---

### Edge Cases

- What happens when stats are partially defined (some null, some with values)? Display only the stats that have values.
- How does the system handle legacy data formats in metadata? Both array-based NFT attributes and object-based character attributes should be supported.
- What happens when equipment contains "None" as a value? Filter out "None" values to avoid clutter.
- What happens with very large stat values (edge case testing)? Cap display at validation limits while preserving the stored value.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display all six core stats (STR, DEX, CON, INT, WIS, CHA) when available, with visual progress indicators showing relative strength (1-20 scale).
- **FR-002**: System MUST display derived stats (HP, Max HP, AC, Speed) in the quick stats section when values exist.
- **FR-003**: System MUST display level prominently with experience progress when these values exist.
- **FR-004**: System MUST display equipment organized into categories: Weapons, Armor, Items, and Gold.
- **FR-005**: System MUST support both NFT metadata equipment format (armor/back/mask strings) and game equipment format (weapons/armor/items arrays).
- **FR-006**: System MUST display NFT trait attributes (Body type, Alignment, etc.) from the metadata attributes array.
- **FR-007**: System MUST filter out "None" values from equipment display to avoid showing placeholder data.
- **FR-008**: System MUST show clear empty states ("No stats assigned", "No equipment") when data is not available.
- **FR-009**: System MUST load all character data including stats, equipment, and metadata in a single data fetch.
- **FR-010**: System MUST display stats consistently for all users (owners and non-owners) with edit capabilities only for owners.

### Key Entities

- **Character**: The core entity containing stats (str, dex, con, int, wis, cha, hp, max_hp, ac, speed), level, experience, and relationships to equipment and metadata.
- **Equipment**: Weapons, armor, items, and gold owned by a character - can exist in database format or NFT metadata format.
- **NFT Metadata**: Original token metadata including name, image, description, and attributes array containing trait_type/value pairs.
- **Character Attributes**: Stats and traits displayed on the character sheet, sourced from either the database columns or metadata JSONB.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view all available character stats within 2 seconds of page load.
- **SC-002**: 100% of non-null stat values in the database are displayed on the character page.
- **SC-003**: Equipment display correctly handles both NFT metadata format and game format in 100% of cases.
- **SC-004**: Empty states are shown appropriately when data is missing - no blank sections or zero values for unassigned stats.
- **SC-005**: Users can identify all key character traits (Body type, Alignment, Origin) at a glance.
- **SC-006**: Character information displays identically for owners and non-owners (excluding edit controls).

## Assumptions

- The existing database schema with dedicated stat columns (str, dex, con, etc.) is the source of truth for game stats.
- NFT metadata is available in the metadata JSONB column and contains attributes in array format with trait_type/value pairs.
- Equipment can exist in two formats and both must be supported: NFT format (armor, back, mask strings) and game format (weapons, armor, items arrays).
- The current character page layout will be enhanced rather than redesigned.
- All data required is already available through the existing /api/characters/[tokenId] endpoint.
