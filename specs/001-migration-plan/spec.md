# Feature Specification: Data Migration from Legacy WAGDIE

**Feature Branch**: `001-migration-plan`
**Created**: 2025-10-27
**Status**: Draft
**Input**: User description: "Lets work on the migration plan"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Safe Data Export and Validation (Priority: P1)

As a WAGDIE platform administrator, I need to export all existing data from the legacy Firestore database and verify its completeness before attempting any migration, so that we ensure no data loss during the transition.

**Why this priority**: This is the foundation of the entire migration. Without safe, verified data export, all subsequent migration steps are at risk. Data loss would be catastrophic for the community.

**Independent Test**: Can be fully tested by exporting data from Firestore, generating checksums/counts, and validating that all expected collections and documents are present with correct field structures.

**Acceptance Scenarios**:

1. **Given** a Firestore database with users, characters, tweets, and locations, **When** an administrator runs the export process, **Then** all collections are exported to JSON files with timestamps and record counts logged
2. **Given** exported JSON files, **When** an administrator runs validation scripts, **Then** each file passes schema validation and record counts match the source database
3. **Given** exported data files, **When** an administrator reviews the validation report, **Then** the report identifies any missing fields, corrupted records, or inconsistencies that need resolution

---

### User Story 2 - Schema Mapping and Transformation (Priority: P2)

As a WAGDIE platform administrator, I need to map the legacy Firestore document structure to the new PostgreSQL schema and transform the data accordingly, so that all existing information fits correctly into the simplified database structure.

**Why this priority**: Once we have verified exported data, we need to transform it to match the new schema. This must happen before any data can be imported into the new system.

**Independent Test**: Can be tested by running transformation scripts on exported JSON files and validating that the output matches the expected PostgreSQL table structures with correct data types and relationships.

**Acceptance Scenarios**:

1. **Given** exported Firestore JSON files, **When** the transformation script processes user documents, **Then** wallet addresses, login history, and preferences are correctly mapped to the new users table structure
2. **Given** exported character documents, **When** the transformation script processes NFT data, **Then** token IDs, ownership, metadata, and game state (burned, infected, location) are correctly mapped to the characters table
3. **Given** transformed data, **When** validation runs, **Then** all foreign key relationships are valid, data types are correct, and no required fields are null
4. **Given** transformation errors, **When** invalid data is encountered, **Then** errors are logged with document IDs and specific issues for manual review

---

### User Story 3 - Safe Data Import with Rollback (Priority: P3)

As a WAGDIE platform administrator, I need to import transformed data into the Supabase database with the ability to rollback if issues occur, so that we can safely populate the new database without risking data integrity.

**Why this priority**: After transformation, we need to actually load the data into the new database. This step requires careful transaction management and validation.

**Independent Test**: Can be tested by importing transformed data into a test Supabase instance, verifying all records are created correctly, and testing rollback functionality if errors occur.

**Acceptance Scenarios**:

1. **Given** transformed data files, **When** the import script runs against Supabase, **Then** all records are inserted into their respective tables with correct relationships maintained
2. **Given** a partial import failure, **When** an error occurs mid-import, **Then** the transaction is rolled back and the database returns to its pre-import state
3. **Given** a successful import, **When** validation queries run, **Then** record counts match the source data and all integrity constraints are satisfied
4. **Given** imported data, **When** spot-checking random records, **Then** the data matches the original Firestore documents

---

### User Story 4 - Migration Verification and Cutover (Priority: P4)

As a WAGDIE platform administrator, I need to verify that the migrated data is complete and accurate, and coordinate a seamless cutover from the old system to the new system, so that users experience minimal disruption.

**Why this priority**: After import, we need comprehensive verification before switching production traffic to the new system. This is the final gate before go-live.

**Independent Test**: Can be tested by running comprehensive validation queries, comparing record counts and sample data between old and new systems, and verifying that all application features work with migrated data.

**Acceptance Scenarios**:

1. **Given** migrated data in Supabase, **When** comprehensive validation queries run, **Then** all record counts, relationship counts, and data checksums match the source system
2. **Given** a functional new application, **When** test users authenticate with their wallets, **Then** they see their historical data (characters, preferences) correctly displayed
3. **Given** a cutover plan, **When** the administrator switches DNS/routing to the new system, **Then** users experience no more than 5 minutes of downtime
4. **Given** the new system in production, **When** monitoring tools check data integrity, **Then** no missing or corrupted data is detected

---

### Edge Cases

- What happens when Firestore documents have fields that don't exist in the PostgreSQL schema (legacy fields no longer needed)?
- What happens when a character's owner address doesn't match any user record (orphaned NFT)?
- What happens when the same wallet address appears multiple times with different casing (0xABC vs 0xabc)?
- What happens when NFT metadata URLs are broken or return 404 errors?
- What happens when timestamps in Firestore are in different formats or timezones?
- What happens if the import process is interrupted by network failures or timeout issues?
- What happens when validation discovers data inconsistencies that can't be automatically resolved?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST export all Firestore collections (users, characters, tweets, locations) to timestamped JSON files with complete field data
- **FR-002**: System MUST validate exported data for schema compliance, completeness, and data integrity before transformation
- **FR-003**: System MUST transform Firestore document structure to match the new PostgreSQL schema defined in the Supabase migrations
- **FR-004**: System MUST handle wallet address normalization (convert all addresses to lowercase checksummed format)
- **FR-005**: System MUST create foreign key relationships correctly (characters to users, characters to locations)
- **FR-006**: System MUST log all transformation errors with source document IDs and specific issues for manual review
- **FR-007**: System MUST import transformed data into Supabase using transactions with rollback capability
- **FR-008**: System MUST validate imported data against source data with record counts, checksums, and spot-check comparisons
- **FR-009**: System MUST provide a detailed migration report showing: records processed, records migrated successfully, errors encountered, and validation results
- **FR-010**: System MUST preserve all historical timestamps (user creation, character minting, last login) in the migration
- **FR-011**: System MUST handle optional/nullable fields correctly (don't fail on missing data that's allowed to be null)
- **FR-012**: System MUST provide a rollback procedure to revert the Supabase database to pre-migration state if critical issues are found

### Key Entities

- **User**: Wallet address (primary identifier), created timestamp, last login, preferences (JSON), login count
- **Character**: Token ID, owner wallet address (foreign key to User), metadata URL, image URL, name, burned status (boolean), infected status (boolean), location ID (foreign key to Location), minted timestamp
- **Tweet**: Tweet ID, character ID (foreign key to Character), content, timestamp, author info
- **Location**: Location ID, name, description, capacity, current occupancy count

### Assumptions

- The legacy Firestore database is read-only and will remain accessible during the migration period
- Administrators have full access credentials to both the source Firestore database and target Supabase database
- The new PostgreSQL schema (in Supabase) has already been created via migrations before data import begins
- Wallet addresses in Firestore follow Ethereum address format (0x + 40 hex characters)
- NFT metadata follows a consistent JSON structure with name, image, and attributes fields
- The migration will be performed during a planned maintenance window with user notification
- A backup of the Firestore database exists and is verified before starting the migration
- The Supabase instance has sufficient storage and performance capacity for the expected data volume

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user records are migrated with zero data loss (validated by record count comparison and spot checks)
- **SC-002**: 100% of character NFT records are migrated with correct ownership and metadata preserved
- **SC-003**: All foreign key relationships (characters to users, characters to locations) are correctly established with zero integrity violations
- **SC-004**: Migration validation scripts report zero critical errors and all checksums match between source and target
- **SC-005**: The new application successfully authenticates users with their wallets and displays their complete historical data
- **SC-006**: Migration completes within 4 hours for databases with up to 10,000 characters and 1,000 users
- **SC-007**: If rollback is needed, the database returns to pre-migration state within 30 minutes
- **SC-008**: Post-migration verification confirms zero user-reported data discrepancies within the first week

### Documentation Deliverables

- Migration runbook with step-by-step instructions and rollback procedures
- Data mapping documentation showing Firestore fields to PostgreSQL columns
- Validation report template with required checks and acceptance criteria
- Troubleshooting guide for common migration issues and their resolutions
