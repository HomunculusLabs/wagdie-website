# Feature Specification: Mock Data Integration & Testing Setup

**Feature Branch**: `005-mock-data-integration`
**Created**: 2025-10-29
**Status**: Draft
**Input**: User description: "Lets make sure everything we can have integrated up to this point is actually integrated. Lets make mock data if necessary for the database for examples."

## Clarifications

### Session 2025-10-29

- Q: When the seed script encounters an error (e.g., constraint violation, network timeout accessing placeholder images, or database connection failure), how should it behave? → A: Continue execution, skip failed records, log errors, display summary report at end
- Q: Which placeholder image service should be used for sample character images? → A: Reuse existing images

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Sample Characters on Browse Page (Priority: P1)

Developers and stakeholders can view a functional character browse page with realistic sample data including character images, stats, equipment, and status indicators. This allows testing of the UI without requiring blockchain integration.

**Why this priority**: This is the foundation for demonstrating the application. Without sample data, developers cannot test or showcase the character browsing functionality that is already built.

**Independent Test**: Can be fully tested by navigating to the characters page and verifying that sample characters display with names, images, stats, infection status, staking status, and ownership badges. Delivers immediate value by making the existing UI functional for testing.

**Acceptance Scenarios**:

1. **Given** the database has sample character data, **When** a user navigates to the characters browse page, **Then** at least 20 sample characters are displayed in the grid
2. **Given** sample characters exist, **When** viewing the browse page, **Then** each character displays an image, name, token ID, and status badges (infected/cured/staked)
3. **Given** a user selects the "owned" filter, **When** viewing characters, **Then** characters marked as owned by test wallets display correctly
4. **Given** a user selects the "infected" filter, **When** viewing characters, **Then** only infected characters are shown
5. **Given** sample data includes characters at different locations, **When** viewing character cards, **Then** location badges display correctly

---

### User Story 2 - Edit Sample Character Sheets (Priority: P1)

Developers can view detailed character sheets with D&D-style stats and edit character names, background stories, and attributes. This demonstrates the full character editing workflow without blockchain ownership verification.

**Why this priority**: Character sheet editing is a core feature that's already implemented but cannot be tested without sample data. This enables immediate functional testing.

**Independent Test**: Can be tested by navigating to any character detail page, editing the character's name or story, saving changes, and verifying persistence. Delivers the ability to test CRUD operations on character data.

**Acceptance Scenarios**:

1. **Given** a sample character exists, **When** navigating to `/characters/[tokenId]`, **Then** the character sheet displays with all D&D stats (STR, DEX, CON, INT, WIS, CHA), HP, level, class, and alignment
2. **Given** viewing a character sheet, **When** clicking "Edit", **Then** the character name and background story become editable
3. **Given** editing a character, **When** changing the background story and clicking "Save", **Then** the changes persist and display on page reload
4. **Given** a character has equipment, **When** viewing the character sheet, **Then** armor, back, and mask equipment displays correctly
5. **Given** viewing a character sheet, **When** clicking "Roll New Character", **Then** new random stats are generated and saved

---

### User Story 3 - Browse Sample Lore/Tweets (Priority: P2)

Users can view a feed of sample tweets/lore content with text, images, and videos. This demonstrates the content browsing and filtering functionality.

**Why this priority**: The lore feed is complete but needs sample content to demonstrate filtering, media display, and infinite scroll. It's P2 because it's less critical than character features for core gameplay.

**Independent Test**: Can be tested by navigating to the lore page and verifying that sample tweets display with various media types, filters work correctly, and infinite scroll loads more content.

**Acceptance Scenarios**:

1. **Given** sample tweets exist, **When** navigating to the lore page, **Then** at least 30 sample tweets display in reverse chronological order
2. **Given** sample tweets include various media types, **When** viewing the lore feed, **Then** text-only, image, and video tweets all render correctly
3. **Given** viewing the lore feed, **When** selecting "Video only" filter, **Then** only tweets with videos are displayed
4. **Given** viewing lore feed, **When** scrolling to the bottom, **Then** additional tweets load automatically (infinite scroll)
5. **Given** sample tweets exist, **When** clicking the translation toggle, **Then** the UI updates to show the translation placeholder state

---

### User Story 4 - Test Infection Spread Workflow (Priority: P2)

Developers can walk through the complete infection spread workflow using mock blockchain transactions. This allows testing of the UI flow, dialogs, and state management without actual blockchain calls.

**Why this priority**: The spread page UI is complete but needs sample data and mock transaction flows to test the multi-step approval and transaction process. It's P2 because it depends on character data from P1.

**Independent Test**: Can be tested by navigating to the spread page, selecting corpses to burn, approving the burn, then selecting mushrooms and target characters for infection. All steps should show appropriate loading states and success messages.

**Acceptance Scenarios**:

1. **Given** a user has sample corpse tokens, **When** navigating to the spread page, **Then** the corpse count displays and burn controls are enabled
2. **Given** viewing the spread page, **When** selecting burn quantity and confirming, **Then** the burn approval dialog appears and mock transaction executes
3. **Given** corpses are burned, **When** mushrooms are revealed, **Then** the UI transitions to the infection spread interface
4. **Given** mushrooms are available, **When** selecting spread amount and target character, **Then** the infection approval dialog appears
5. **Given** completing an infection spread, **When** the mock transaction succeeds, **Then** a success message displays and character infection status updates in the database

---

### User Story 5 - Verify Database Migrations Applied (Priority: P1)

Developers can verify that all database migrations are applied correctly and the schema matches what the application expects. This ensures the database is ready for the application.

**Why this priority**: This is foundational - without the correct database schema, nothing else works. It must be verified before testing any features.

**Independent Test**: Can be tested by checking that all tables exist with correct columns, indexes are created, and RLS policies are in place. Delivers confidence that the database is correctly configured.

**Acceptance Scenarios**:

1. **Given** migrations are run, **When** checking the database, **Then** all tables exist: users, characters, concords, character_concords, tweets, locations
2. **Given** migrations are applied, **When** inspecting the characters table, **Then** all D&D stat columns exist: str, dex, con, int, wis, cha, level, hp, max_hp, ac, speed
3. **Given** migrations are applied, **When** checking indexes, **Then** performance indexes exist on token_id, owner_address, infection_status, staking_status, location_id
4. **Given** migrations are applied, **When** checking the concords table, **Then** sample concord data is seeded (at minimum Concord #15 - Strange Mushroom)
5. **Given** migrations are applied, **When** checking locations, **Then** sample locations are seeded: The Ruins, Crossroads, Dark Forest, Haven

---

### Edge Cases

- What happens when sample data includes invalid stat values (e.g., STR > 20)?
- How does the system handle sample characters with missing required fields?
- What happens when sample tweets have malformed media URLs?
- How does infinite scroll behave with exactly 20 items (page boundary)?
- What happens when trying to edit a character that doesn't exist in the database?
- How does the system handle sample data with duplicate token IDs?
- What happens when mock transactions intentionally fail?
- How does the UI handle sample characters with null or undefined equipment?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run all existing database migrations successfully without errors
- **FR-002**: System MUST seed at least 20 sample characters with complete data: token_id, name, image_url, owner_address, all D&D stats, class, level, equipment, location_id
- **FR-003**: System MUST seed at least 30 sample tweets with varied content: text-only, with images, with videos
- **FR-004**: System MUST seed all required locations: The Ruins, Crossroads, Dark Forest, Haven
- **FR-005**: System MUST seed Concord #15 (Strange Mushroom) with correct metadata
- **FR-006**: Sample characters MUST include variety in infection status: healthy, infected, cured
- **FR-007**: Sample characters MUST include variety in staking status: unstaked, staked at different locations
- **FR-008**: Sample characters MUST include variety in ownership: some owned by test wallet addresses, others unowned
- **FR-009**: Sample character stats MUST follow D&D constraints: stats between 1-20, level between 1-20, hp <= max_hp
- **FR-010**: Sample characters MUST include varied equipment: some with full sets (armor/back/mask), some partial, some none
- **FR-011**: System MUST provide a seed script that can be run multiple times safely (idempotent)
- **FR-012**: Sample data MUST include character concord associations (at least 5 characters with concords)
- **FR-013**: Character browse page MUST load and display sample characters without errors
- **FR-014**: Character detail pages MUST load for all sample characters and display complete stats
- **FR-015**: Lore page MUST load and display sample tweets with proper media rendering
- **FR-016**: Spread page MUST display mock token balances (corpses, mushrooms) for test scenarios
- **FR-017**: Sample data MUST be realistic and representative of actual game content
- **FR-018**: System MUST handle missing optional fields gracefully (e.g., characters without background stories)
- **FR-019**: All sample character images MUST reference existing images from the project's image assets
- **FR-020**: Mock transaction workflows MUST simulate realistic timing (loading states, delays)
- **FR-021**: Seed script MUST continue execution when encountering errors, skip failed records, log all errors during execution, and display a summary report at completion showing successful and failed operations

### Key Entities

- **Sample Character**: A test character record with complete D&D stats, equipment, status flags, and metadata representing what a real character would look like
- **Sample Tweet**: A test social media post with text content, optional media (images/videos), author info, and timestamps
- **Sample Concord**: A test special item/power record with ID, name, description, image, and effect type
- **Sample Location**: A test game location with ID, name, description, and active status
- **Test Wallet**: A fake wallet address used to simulate character ownership in sample data
- **Mock Transaction**: A simulated blockchain transaction that mimics the timing and state changes of real transactions without actual blockchain interaction
- **Seed Script**: An executable script that populates the database with sample data in a repeatable manner

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All database migrations execute successfully with zero errors when run on a fresh database
- **SC-002**: Character browse page loads with 20+ sample characters within 2 seconds
- **SC-003**: Character detail page displays complete character sheet with all stats within 1 second
- **SC-004**: Lore page loads with 30+ sample tweets within 2 seconds
- **SC-005**: All character filter tabs (all/owned/infected/cured/staked) return correct filtered results
- **SC-006**: Character edit and save workflow completes successfully for all sample characters
- **SC-007**: Spread page displays mock token balances and allows complete workflow simulation
- **SC-008**: 100% of sample characters have valid stat values within defined constraints
- **SC-009**: 100% of sample characters and tweets reference valid existing image/video assets without broken links
- **SC-010**: Seed script can be run multiple times without creating duplicate records or errors
- **SC-011**: Developers can demonstrate all major features (browse, detail, edit, lore, spread) using sample data
- **SC-012**: Sample data includes sufficient variety to test all UI states and edge cases
- **SC-013**: Character sheets display equipment for characters that have it, and gracefully show empty state for those that don't
- **SC-014**: Mock blockchain transactions show appropriate loading states for at least 1-2 seconds to simulate reality
- **SC-015**: Seed script displays a summary report showing count of successful records inserted, failed records skipped, and specific error messages for each failure

## Assumptions

1. **Migration Safety**: Existing migrations have been tested and are safe to run on production-like database
2. **Existing Images**: Project contains existing image assets that can be reused for sample character data
3. **Test Wallets**: Sample wallet addresses will be fake Ethereum addresses (valid format but not real wallets)
4. **Media Hosting**: Sample tweet media will use publicly accessible URLs (placeholder images, sample videos)
5. **Data Volume**: 20-50 characters and 30-60 tweets is sufficient sample data for testing and demonstration
6. **Character Distribution**: Sample characters should have roughly equal distribution across infection/staking statuses
7. **Realistic Names**: Sample character names should feel appropriate for the dark fantasy WAGDIE theme
8. **Mock Transaction Timing**: Simulated transactions should take 1-3 seconds to feel realistic
9. **Database Reset**: Developers have access to reset the database and re-run migrations when needed
10. **No Real Blockchain**: This feature explicitly does not involve any real blockchain calls or wallet connections

## Dependencies

1. **Database Dependencies**:
   - Supabase instance must be running and accessible
   - All three migration files must be present and executable
   - Database user must have permissions to create tables, indexes, and policies

2. **Application Dependencies**:
   - All existing API routes must be functional (`/api/characters`, `/api/tweets`, `/api/characters/[tokenId]`)
   - All existing UI components must be built (CharacterCard, SheetMenuBar, CustomTweet, etc.)
   - Service layer functions must be working (character-service, tweet-service, wallet-service)

3. **Environment Dependencies**:
   - NEXT_PUBLIC_SUPABASE_URL must be configured
   - NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured
   - SUPABASE_SERVICE_ROLE_KEY must be configured for seed script

4. **Image Dependencies**:
   - Existing project image assets must be accessible in the public directory
   - Sample video URLs must be publicly accessible

## Out of Scope

1. **Real Blockchain Data**: No actual NFT data fetching from Ethereum mainnet
2. **Real Wallet Connections**: No actual wallet authentication or ownership verification
3. **Production Data**: Sample data is for development/testing only, not production use
4. **Data Import Tools**: No tools for importing real user data or real NFT metadata
5. **Data Validation UI**: No admin interface for managing or validating sample data
6. **Performance Testing**: No load testing or stress testing with large datasets
7. **Data Migration from Old System**: No migration of data from the previous Firebase system
8. **Automated Data Generation**: No procedural generation of infinite sample data
9. **Real Transaction Simulation**: Mock transactions don't simulate gas fees, network errors, or real blockchain timing
10. **Multi-user Scenarios**: Sample data focuses on single-user testing, not concurrent multi-user interactions

## Technical Constraints

1. **Data Consistency**: Sample data must maintain referential integrity (e.g., characters must reference valid locations)
2. **Migration Idempotency**: Migrations must be safe to run multiple times using IF NOT EXISTS checks
3. **Performance**: Sample data insertion should complete in under 10 seconds total
4. **Storage**: Sample data should not exceed 10MB total including placeholder images
5. **Format Compliance**: All sample data must match TypeScript type definitions in the codebase
6. **SQL Safety**: Seed script must use parameterized queries to prevent SQL injection
7. **Cleanup**: Seed script should provide option to clear existing sample data before inserting new data
8. **Documentation**: Seed script must include comments explaining sample data structure and purpose
9. **Error Resilience**: Seed script must handle errors gracefully by continuing execution, logging each failure with context (record type, field values, error message), and providing a final summary report of all successes and failures
