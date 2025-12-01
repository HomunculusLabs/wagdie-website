# Feature Specification: Character Filter Enhancement

**Feature Branch**: `012-character-filter`
**Created**: 2025-11-30
**Status**: Draft
**Input**: User description: "Characters - I want to add a way to filter characters in /characters so that we can view by alignment, and whether or not they have character sheets"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter by Character Sheet Status (Priority: P1)

As a user browsing the characters page, I want to filter characters based on whether they have a character sheet created, so that I can easily find characters with detailed RPG stats and background stories versus unedited characters.

**Why this priority**: This is the core filter functionality that enables users to distinguish between characters that have been developed with custom names, stats, and backstories versus those that only have base NFT metadata. This directly addresses a key user need for exploring the collection.

**Independent Test**: Can be fully tested by clicking a "Has Sheet" filter toggle and verifying only characters with custom name/stats appear. Delivers immediate value by reducing the 6,666 character collection to a manageable subset of developed characters.

**Acceptance Scenarios**:

1. **Given** I am on the /characters page with no filters applied, **When** I activate the "Has Sheet" filter, **Then** only characters that have custom character sheet data (name, stats, or background story) are displayed.
2. **Given** I have the "Has Sheet" filter active, **When** I deactivate it, **Then** all characters are displayed again regardless of sheet status.
3. **Given** I have the "Has Sheet" filter active, **When** I also apply the "Owned" tab filter, **Then** I see only my owned characters that have character sheets.

---

### User Story 2 - Filter by Alignment (Priority: P2)

As a user browsing the characters page, I want to filter characters by their alignment category, so that I can explore characters that match my preferred playstyle or roleplay preferences.

**Why this priority**: Alignment filtering adds significant value for users interested in roleplay aspects of the collection. However, since alignment may need to be derived from existing metadata (Body trait/origin) rather than being an explicit field, this requires additional data interpretation logic.

**Independent Test**: Can be fully tested by selecting an alignment option from a dropdown and verifying characters are filtered accordingly. Delivers value by enabling thematic browsing of the collection.

**Acceptance Scenarios**:

1. **Given** I am on the /characters page, **When** I select a specific alignment from the alignment filter, **Then** only characters matching that alignment are displayed.
2. **Given** I have selected an alignment filter, **When** I clear the filter, **Then** all characters are displayed again.
3. **Given** I am on the /characters page, **When** I view the alignment filter options, **Then** I see all available alignments with counts of how many characters match each.

---

### User Story 3 - Combine Multiple Filters (Priority: P2)

As a user, I want to combine the character sheet filter with alignment filter and existing filters (owned, infected, staked, etc.), so that I can perform precise searches across the collection.

**Why this priority**: Filter combination extends the existing filter system naturally and provides power users with sophisticated search capabilities. This builds on P1 and P2 foundations.

**Independent Test**: Can be fully tested by applying multiple filters simultaneously (e.g., "Has Sheet" + "Lawful" + "Owned") and verifying results match all criteria.

**Acceptance Scenarios**:

1. **Given** I am on the /characters page, **When** I apply both "Has Sheet" and an alignment filter, **Then** only characters matching both criteria are displayed.
2. **Given** I have multiple filters active, **When** I view the results count, **Then** it accurately reflects the number of characters matching all active filters.
3. **Given** I have multiple filters active, **When** I click a "Clear All Filters" option, **Then** all filters are reset and all characters are displayed.

---

### User Story 4 - Persistent Filter State via URL (Priority: P3)

As a user, I want my filter selections to be preserved in the URL, so that I can share filtered views with others or bookmark specific filter combinations.

**Why this priority**: URL persistence is a quality-of-life enhancement that builds on the existing URL-based filter system already in place for tabs and sorting.

**Independent Test**: Can be fully tested by applying filters, copying the URL, opening in a new browser tab, and verifying filters are restored.

**Acceptance Scenarios**:

1. **Given** I apply filters on the /characters page, **When** I copy and share the URL, **Then** recipients see the same filtered view when they open the link.
2. **Given** I have a bookmarked URL with filters, **When** I navigate to that bookmark, **Then** all filters are restored from the URL parameters.

---

### Edge Cases

- What happens when no characters match the applied filter combination? Display an empty state with a message suggesting to adjust filters.
- How does the system handle when alignment data is not available for a character? Characters without alignment data are excluded from alignment-specific filters but included in "All" alignment option.
- What happens when the character sheet filter is combined with search? Both filters apply simultaneously - search within the filtered results.
- How are filters maintained during pagination? Filter state persists as users navigate between pages.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a toggle or checkbox filter to show only characters with character sheets (defined as having at least one of: custom name, custom stats, or background story)
- **FR-002**: System MUST provide an alignment filter dropdown with available alignment options derived from character data
- **FR-003**: System MUST allow combining character sheet filter with alignment filter and all existing tab filters (all, owned, infected, cured, staked)
- **FR-004**: System MUST update the character count display to reflect currently active filters
- **FR-005**: System MUST persist filter selections in URL query parameters for shareability
- **FR-006**: System MUST display the currently active filters clearly to users
- **FR-007**: System MUST provide a way to clear all filters at once
- **FR-008**: System MUST reset pagination to page 1 when filters change

### Key Entities

- **Character Sheet Status**: Boolean indicator derived from whether a character has custom data (name, stats, background_story) beyond base NFT metadata
- **Alignment (Origin)**: Character archetype derived from the "Body" NFT trait (e.g., Pilgrim, Stranger, Wormkin Elite, Vagabond). Approximately 50 distinct values exist in the collection. For characters with sheets, the "origin" field may override the Body trait.
- **Filter State**: Collection of active filter values (sheet status, alignment, tab, sort, search, page)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can find characters with sheets within 2 clicks from the characters page
- **SC-002**: Filter response time remains under 1 second for any filter combination
- **SC-003**: 100% of filter combinations produce accurate results matching all selected criteria
- **SC-004**: Filter state is correctly preserved and restored via URL in 100% of cases
- **SC-005**: Users can combine up to 4 filters simultaneously (tab + sheet status + alignment + search) without performance degradation

## Assumptions

- Character "has sheet" is determined by the presence of custom data (name OR stats OR background_story) that differs from base NFT metadata
- The alignment system will be derived from existing character data rather than requiring new data fields
- The existing pagination and URL parameter system will be extended rather than replaced
- Performance targets assume current infrastructure and database indexes are sufficient
