# Feature Specification: Character Editor

**Feature Branch**: `012-character-editor`
**Created**: 2025-11-29
**Status**: Draft
**Input**: User description: "I would like to make sure we can edit our characters stats. We have some characters with stats, we need more. Also we need to be able to edit the characters name."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Character Name (Priority: P1)

As a character owner, I want to edit my character's name so that I can personalize my NFT with a custom identity in the WAGDIE universe.

**Why this priority**: Character naming is the most fundamental form of personalization and affects how the character is displayed everywhere in the application.

**Independent Test**: Can be fully tested by connecting a wallet, navigating to an owned character, editing the name field, saving, and verifying the name persists across page refreshes.

**Acceptance Scenarios**:

1. **Given** I am logged in and viewing a character I own, **When** I click on the edit name button, **Then** I see an editable text input with the current name pre-filled
2. **Given** I am editing my character's name, **When** I enter a valid new name and save, **Then** the new name is immediately displayed and persists after page refresh
3. **Given** I am editing my character's name, **When** I click cancel or press Escape, **Then** my changes are discarded and the original name is restored
4. **Given** I am viewing a character I do not own, **When** I view the character details, **Then** I cannot see or access any edit controls

---

### User Story 2 - Edit Character Stats (Priority: P1)

As a character owner, I want to edit my character's core stats (STR, DEX, CON, INT, WIS, CHA) so that I can define my character's abilities for gameplay purposes.

**Why this priority**: Stats define gameplay mechanics and are equally essential to character identity as naming.

**Independent Test**: Can be fully tested by editing any stat value on an owned character and verifying the change saves correctly.

**Acceptance Scenarios**:

1. **Given** I am logged in and viewing a character I own, **When** I click on the edit stats section, **Then** I see editable inputs for all six core stats with current values pre-filled
2. **Given** I am editing character stats, **When** I change a stat value to a valid number and save, **Then** the new value is displayed and persists after page refresh
3. **Given** I am editing character stats, **When** I enter an invalid value (non-numeric, out of range), **Then** I see a validation error and cannot save until corrected
4. **Given** I am editing character stats, **When** I modify multiple stats and save, **Then** all changes are saved atomically

---

### User Story 3 - Edit Derived Stats (Priority: P2)

As a character owner, I want to edit my character's derived stats (HP, Max HP, AC, Speed, Level, Experience) so that I can track my character's progression and combat readiness.

**Why this priority**: Derived stats are important for gameplay but build upon the core stats system.

**Independent Test**: Can be tested by editing HP and Level values and verifying they persist correctly.

**Acceptance Scenarios**:

1. **Given** I am editing an owned character, **When** I modify HP, Max HP, AC, Speed, Level, or Experience, **Then** each change is validated and saved correctly
2. **Given** I am editing HP, **When** I enter a value greater than Max HP, **Then** I see a validation warning (but can still save if intended)
3. **Given** I am editing Level, **When** I change the level, **Then** the experience points thresholds are updated accordingly

---

### User Story 4 - Bulk Stats Assignment (Priority: P3)

As a character owner with a newly created character, I want to assign stats to a character that has no stats yet so that I can initialize my character for gameplay.

**Why this priority**: Enables new character initialization, extending functionality to characters without existing stats.

**Independent Test**: Can be tested by selecting a character with no stats and assigning all values at once.

**Acceptance Scenarios**:

1. **Given** I own a character with no stats assigned, **When** I open the character editor, **Then** I see empty/default values with prompts to assign stats
2. **Given** I am assigning stats to a new character, **When** I complete all required fields and save, **Then** the character now has full stats that persist

---

### Edge Cases

- What happens when a user tries to edit a character during a network disconnection? The system should queue changes and retry, or inform the user their changes could not be saved.
- How does the system handle concurrent edits if the same character is edited from multiple browser tabs? The most recent save wins, with a warning if data was overwritten.
- What happens when stat values exceed reasonable bounds (negative numbers, extremely high values)? Validation should enforce reasonable limits (0-30 for core stats, 0-999 for HP).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST verify wallet ownership before allowing any character edits
- **FR-002**: System MUST allow owners to edit character name with a maximum length of 100 characters
- **FR-003**: System MUST allow owners to edit core stats (STR, DEX, CON, INT, WIS, CHA) with values between 1 and 30
- **FR-004**: System MUST allow owners to edit derived stats (HP, Max HP, AC, Speed, Level, Experience) with appropriate validation
- **FR-005**: System MUST persist all changes to the database and reflect them immediately in the UI
- **FR-006**: System MUST prevent non-owners from accessing edit functionality
- **FR-007**: System MUST validate all input values before saving and display clear error messages for invalid inputs
- **FR-008**: System MUST support editing characters that currently have no stats (initialization flow)
- **FR-009**: System MUST track when changes were made via an updated_at timestamp

### Key Entities

- **Character**: Primary data source with token_id, name, and stat attributes stored in dedicated columns (str, dex, con, int, wis, cha, hp, max_hp, ac, speed, level, experience). All edits persist to this table.
- **Wallet/Owner**: The authenticated user who must match the character's owner_address to edit

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete a character name edit in under 30 seconds from viewing the character
- **SC-002**: Users can complete editing all core stats in under 2 minutes
- **SC-003**: 100% of owned characters are editable by their owners
- **SC-004**: 0% of non-owned characters allow edit access
- **SC-005**: All stat changes persist correctly and are visible immediately after save
- **SC-006**: Characters without stats can be fully initialized within the same editing workflow

## Clarifications

### Session 2025-11-29

- Q: Which storage location should be the source of truth for character stat edits? → A: Use `characters` table (dedicated columns, existing repository)

## Assumptions

- Wallet-based authentication already exists and can determine character ownership
- The existing character data model supports all required stat fields
- Users are familiar with D&D-style stat systems (STR, DEX, CON, INT, WIS, CHA)
- Stat value ranges (1-30 for core stats) are appropriate for the game system
- Character name changes do not require uniqueness validation (multiple characters can share names)
