# Implementation Plan: Mock Data Integration & Testing Setup

**Branch**: `005-mock-data-integration` | **Date**: 2025-10-29 | **Spec**: [spec.md](./spec.md)

## Summary

This feature populates the database with realistic mock data (20-50 characters, 30-60 tweets) to enable functional testing and demonstration of all UI features without blockchain integration. The implementation creates an idempotent seed script that uses existing image assets, maintains data integrity, handles errors gracefully, and provides a summary report of all operations.

**Key Deliverables**:
- Database seed script (`scripts/seed-database.ts`) with error handling and reporting
- 20-50 sample characters with complete D&D stats, equipment, and varied statuses
- 30-60 sample tweets with text/image/video content
- Verification that all pages load and display data correctly
- Documentation for running and understanding the seed process

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Supabase JS Client, @supabase/supabase-js v2
**Storage**: Supabase PostgreSQL (existing migrations applied)
**Testing**: Manual verification via UI pages, optional: Jest for seed script unit tests
**Target Platform**: Node.js script (executed locally or in CI)
**Project Type**: Web application (Next.js 15 App Router)
**Performance Goals**: Seed script completes in <10 seconds, pages load with sample data in <2 seconds
**Constraints**:
- Sample data must not exceed 10MB total
- Must maintain referential integrity (characters → locations, character_concords → concords)
- Must be idempotent (safe to run multiple times)
- Must use existing image assets from `public/images/`
**Scale/Scope**: 20-50 characters, 30-60 tweets, 4 locations (already seeded), 1 concord (already seeded)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Simplicity First
**Status**: PASS
- Seed script uses direct Supabase client (no ORM, no abstraction layers)
- TypeScript + Node.js execution (no Docker, no complex infrastructure)
- Simple INSERT statements with idempotency via ON CONFLICT
- No code generation or build steps beyond TypeScript compilation

### ✅ II. Community Accessibility
**Status**: PASS
- Seed script will include inline comments explaining data structure
- Clear README in scripts/ directory explaining how to run and modify
- Standard patterns: array of objects → INSERT loops
- No clever abstractions, explicit data definitions

### ✅ III. Clean Architecture
**Status**: PASS
- Seed script is standalone utility (not mixed with UI or services)
- Uses service role key (appropriate for data seeding)
- Does not touch UI layer or business logic
- Located in `/scripts/` directory (clear separation)

### ✅ IV. Type Safety & Contract Clarity
**Status**: PASS
- Will use generated Supabase types from `lib/database.types.ts`
- Sample data arrays will have explicit TypeScript interfaces
- No `any` types (will use proper database row types)

### ✅ V. Test-Driven for Critical Paths
**Status**: PASS (Optional testing acceptable)
- Seed script is a utility, not a critical user-facing flow
- Manual verification via UI pages is sufficient
- Optional: Unit tests for validation logic (stat constraints, equipment format)
- Critical paths (auth, NFT data) not affected by this feature

### ✅ VI. Documentation as Code
**Status**: PASS
- Seed script will have file-level comment explaining purpose
- Inline comments for each data section (characters, tweets, concords)
- README.md in scripts/ with usage instructions
- Comments explaining error handling and idempotency strategy

### ✅ VII. Web3 Pragmatism
**Status**: N/A
- This feature does not involve web3 interactions
- Mock data supports testing of future web3 features

**Result**: ✅ All gates passed. No constitution violations. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/005-mock-data-integration/
├── plan.md              # This file
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Sample data structure
├── quickstart.md        # Phase 1: How to run seed script
└── contracts/           # Phase 1: N/A (no API contracts)
```

### Source Code (repository root)

```text
scripts/
├── README.md                    # How to use seed scripts
└── seed-database.ts             # Main seed script (NEW)

supabase/
└── migrations/                  # Existing migrations (already applied)
    ├── 20250101000000_initial_schema.sql
    ├── 20251028000000_page_wireframes_schema.sql
    └── 20251029000000_blockchain_integration.sql

public/images/                   # Existing image assets (reused for characters)
├── community-1.png
├── community-2.png
├── community-3.png
├── interactive-1.png
├── story-1.png
├── story-2.png
└── [14 total image files]

lib/
├── database.types.ts            # Generated Supabase types (existing)
└── supabase.ts                  # Supabase client (existing)
```

**Structure Decision**: Seed script goes in `/scripts/` directory (following Node.js convention for utility scripts). This keeps it separate from application code (`app/`, `components/`, `lib/`) per Clean Architecture principle III. Script uses service role key directly since it's a data initialization utility, not part of the user-facing application.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations.

---

## Phase 0: Research & Design Decisions

### Research Areas

1. **Idempotent Data Seeding Patterns**
   - **Question**: How to safely run seed script multiple times without duplicates?
   - **Approach**: PostgreSQL `INSERT ... ON CONFLICT` with UNIQUE constraints

2. **Error Handling Strategy**
   - **Question**: How to continue execution on errors and provide summary report?
   - **Approach**: Try-catch per record, accumulate errors, display summary at end

3. **Sample Data Variety**
   - **Question**: How to ensure sufficient variety in character stats, equipment, and statuses?
   - **Approach**: Define distribution targets (33% healthy/infected/cured, 25% per location)

4. **Existing Image Asset Inventory**
   - **Question**: Which images exist and how to map them to characters?
   - **Status**: ✅ RESOLVED - 14 images in `public/images/` directory
   - **Approach**: Rotate through available images for character avatars

5. **Tweet Media URLs**
   - **Question**: Where to get sample video/image URLs for tweets?
   - **Approach**: Mix of existing images + public sample video URLs (e.g., sample-videos.com)

### Technical Decisions

1. **Script Execution Method**
   - **Decision**: Use `ts-node` to execute TypeScript directly
   - **Rationale**: Simpler than build step, familiar to contributors
   - **Alternative Rejected**: Compile to JS first (unnecessary complexity)

2. **Service Role Key vs Anon Key**
   - **Decision**: Use SUPABASE_SERVICE_ROLE_KEY
   - **Rationale**: Seed script needs to bypass RLS policies for data insertion
   - **Alternative Rejected**: Anon key (insufficient permissions for INSERT)

3. **Character Token IDs**
   - **Decision**: Use sequential IDs 1-50 for simplicity
   - **Rationale**: Easy to reference, test, and remember
   - **Alternative Rejected**: Random IDs (harder to test specific characters)

4. **Test Wallet Addresses**
   - **Decision**: Use 3 fixed test addresses with valid Ethereum format
   - **Rationale**: Sufficient for testing ownership filters, easy to remember
   - **Alternative Rejected**: Many random addresses (unnecessary complexity)

5. **Error Logging Format**
   - **Decision**: Console output with colors + final summary table
   - **Rationale**: Immediate feedback, easy to parse, no external logging service
   - **Alternative Rejected**: File logging (overkill for dev tool)

---

## Phase 1: Data Model & Contracts

### Data Model

See [data-model.md](./data-model.md) for complete structure.

**Summary**:
- **Characters**: 50 records with token_id (1-50), name, image_url, owner_address (3 test wallets), D&D stats (STR/DEX/CON/INT/WIS/CHA), level (1-5), class (Warrior/Mage/Rogue/Cleric), HP, equipment (JSONB), infection_status (healthy/infected/cured), staking_status (unstaked/staked), location_id
- **Tweets**: 60 records with tweet_id (UUID), text, author_username (@WAGDIE_ETH), media_type (none/image/video), media_url, video_url, created_at (spread over past 30 days), is_reply (false), is_retweet (false)
- **Character Concords**: 10 records linking characters to Concord #15 (already seeded)
- **Locations**: Already seeded in migration (The Ruins, Crossroads, Dark Forest, Haven)
- **Concords**: Already seeded in migration (Concord #15 - Strange Mushroom)

### Contracts

N/A - This feature does not create API endpoints or contracts. It populates data for existing API routes.

### Quickstart

See [quickstart.md](./quickstart.md) for complete instructions.

**Summary**:
```bash
# 1. Ensure migrations are applied
npx supabase db push

# 2. Set environment variable
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 3. Run seed script
npm run seed
# or
npx ts-node scripts/seed-database.ts

# 4. Verify data
# Visit http://localhost:3000/characters (should show 50 characters)
# Visit http://localhost:3000/lore (should show 60 tweets)
# Visit http://localhost:3000/characters/1 (should show character #1 details)

# 5. Re-run safely (idempotent)
npm run seed
# Output: "Skipping X existing records, inserted Y new records"
```

---

## Implementation Phases

### Phase 0: Research (COMPLETE)
- ✅ Analyzed existing migrations and database schema
- ✅ Inventoried available image assets (14 images in public/images/)
- ✅ Researched idempotent seeding patterns (INSERT ON CONFLICT)
- ✅ Defined error handling strategy (try-catch per record, summary report)
- ✅ Determined character/tweet distribution targets

### Phase 1: Design (COMPLETE)
- ✅ Created data-model.md with complete sample data structure
- ✅ Created quickstart.md with usage instructions
- ✅ No contracts needed (feature populates existing tables)
- ⏸️ Agent context update (deferred to implementation time)

### Phase 2: Task Breakdown
- ⏸️ To be completed by `/speckit.tasks` command
- Will break down seed script implementation into atomic tasks
- Will define verification steps for each user story

---

## Open Questions

None - All clarifications resolved in spec.md clarification session.

---

## Success Metrics (from spec)

- **SC-001**: All database migrations execute successfully ✅ (pre-existing)
- **SC-002**: Character browse page loads with 20+ characters within 2 seconds
- **SC-003**: Character detail page displays complete stats within 1 second
- **SC-004**: Lore page loads with 30+ tweets within 2 seconds
- **SC-005**: All filter tabs return correct results
- **SC-006**: Character edit workflow completes successfully
- **SC-007**: Spread page displays mock token balances
- **SC-008**: 100% of characters have valid stat values (1-20, hp≤max_hp)
- **SC-009**: 100% of images reference valid existing assets
- **SC-010**: Seed script is idempotent (no duplicates on re-run)
- **SC-011**: All features demonstrable with sample data
- **SC-012**: Sufficient variety for testing all UI states
- **SC-013**: Equipment displays correctly (full/partial/none)
- **SC-014**: Mock transactions show 1-2 second loading states
- **SC-015**: Seed script displays summary report (successes/failures/errors)

---

## Next Steps

1. Run `/speckit.tasks` to generate atomic task breakdown
2. Implement seed script per tasks
3. Run seed script and verify all pages load correctly
4. Update CLAUDE.md with completion notes
5. Commit and push to 005-mock-data-integration branch
