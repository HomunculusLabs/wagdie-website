# Research: Mock Data Integration & Testing Setup

**Feature**: 005-mock-data-integration
**Date**: 2025-10-29

## Research Findings

### 1. Idempotent Data Seeding in PostgreSQL

**Question**: How do we ensure the seed script can be run multiple times without creating duplicates?

**Decision**: Use `INSERT ... ON CONFLICT DO NOTHING` with UNIQUE constraints

**Rationale**:
- All tables have UNIQUE constraints (characters on `contract_address + token_id`, tweets on `tweet_id`)
- `ON CONFLICT DO NOTHING` skips records that already exist
- Simple, built-in PostgreSQL feature (no external libraries)
- Deterministic behavior (same input always produces same result)

**Implementation**:
```typescript
await supabase.from('characters').insert(characterData).onConflict('token_id, contract_address').ignore();
```

**Alternatives Considered**:
- `UPSERT` (ON CONFLICT DO UPDATE): Rejected because we don't want to overwrite existing data
- Check existence before insert (SELECT then INSERT): Rejected due to race conditions and extra queries
- Delete all then insert: Rejected because it loses user modifications to sample data

---

### 2. Error Handling Strategy for Seed Script

**Question**: How should the script behave when it encounters errors (constraint violations, network timeouts, etc.)?

**Decision**: Continue execution, skip failed records, log errors, display summary report

**Rationale**:
- Maximizes successful data insertion (don't fail everything if one record is bad)
- Provides visibility into what failed and why
- Allows developers to fix issues incrementally
- Matches industry best practices for ETL/data loading scripts

**Implementation Pattern**:
```typescript
const results = {
  characters: { success: 0, failed: 0, errors: [] },
  tweets: { success: 0, failed: 0, errors: [] }
};

for (const char of characters) {
  try {
    await supabase.from('characters').insert(char);
    results.characters.success++;
  } catch (error) {
    results.characters.failed++;
    results.characters.errors.push({ record: char.token_id, error: error.message });
  }
}

// Display summary
console.table(results);
```

**Alternatives Considered**:
- Stop on first error: Rejected (too fragile, blocks all subsequent inserts)
- Retry with exponential backoff: Rejected (overkill for local dev script)
- Silent skip: Rejected (no visibility into problems)

---

### 3. Sample Character Data Distribution

**Question**: How do we ensure variety in character stats, equipment, and statuses for comprehensive UI testing?

**Decision**: Define explicit distribution targets and allocate characters accordingly

**Distribution Targets**:
- **Infection Status**: 33% healthy (17 chars), 33% infected (17 chars), 33% cured (16 chars)
- **Staking Status**: 50% unstaked (25 chars), 50% staked across 4 locations (6-7 per location)
- **Ownership**: 60% owned by 3 test wallets (20 each), 40% unowned (20 chars)
- **Equipment**: 40% full set (20 chars), 30% partial (15 chars), 30% none (15 chars)
- **Classes**: 25% per class (12-13 each: Warrior, Mage, Rogue, Cleric)
- **Levels**: Random 1-5 with normal distribution (more level 2-3, fewer level 1 and 5)

**Rationale**:
- Ensures all UI states are testable (infected filters, staked filters, ownership badges)
- Provides realistic variety (not all characters identical)
- Balanced distribution avoids edge cases (e.g., all infected or all unowned)

**Alternatives Considered**:
- Completely random: Rejected (may miss edge cases, inconsistent across runs)
- Hardcoded specific characters: Rejected (tedious to maintain, inflexible)
- Procedural generation: Rejected (adds unnecessary complexity)

---

### 4. Existing Image Assets Inventory

**Question**: Which images are available in the project and how do we map them to characters?

**Finding**: 14 images in `public/images/` directory:
- `community-1.png`, `community-2.png`, `community-3.png` (16-17KB each)
- `cta-characters.png`, `cta-discord.png` (8-9KB each)
- `interactive-1.png` (485KB), `interactive-2.png` (1.4MB), `interactive-3.png` (3.0MB)
- `story-1.png` (164KB), `story-2.png` (1.5MB), `story-3.png` (2.8MB)
- `og-image.png` (22KB)
- `video-preview.png` (60KB)
- `wagdie-logo.png` (60KB)

**Decision**: Rotate through suitable character images for avatars

**Suitable for Character Avatars**:
- `interactive-1.png`, `interactive-2.png`, `interactive-3.png` (game art style)
- `story-1.png`, `story-2.png`, `story-3.png` (character/scene art)
- 6 images total → cycle through them for 50 characters (each image used 8-9 times)

**Not Suitable**:
- Logo, OG image, CTA images (UI elements, not character art)
- Video preview (too generic)

**Implementation**:
```typescript
const characterImages = [
  '/images/interactive-1.png',
  '/images/interactive-2.png',
  '/images/interactive-3.png',
  '/images/story-1.png',
  '/images/story-2.png',
  '/images/story-3.png'
];

// Rotate through images
const imageUrl = characterImages[tokenId % characterImages.length];
```

**Alternatives Considered**:
- Use placeholder service (Lorem Picsum, Placehold.co): Rejected per clarification (reuse existing images)
- Generate procedural avatars: Rejected (unnecessary complexity)
- Use same image for all: Rejected (boring, doesn't test image variety)

---

### 5. Tweet Media URLs

**Question**: Where do we source sample video/image URLs for tweets?

**Decision**: Mix of existing project images + public domain sample videos

**Image Tweets** (30% of tweets):
- Reuse existing images from `public/images/` (community, interactive, story series)
- Each image used 2-3 times across different tweets

**Video Tweets** (20% of tweets):
- Use public sample videos from reliable sources:
  - `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`
  - `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`
  - Other Creative Commons licensed videos
- Alternative: Use project's own video if available

**Text-Only Tweets** (50% of tweets):
- No media URLs, just text content

**Rationale**:
- Tests all media types without external dependencies (except video hosting)
- Sample video URLs are stable and free to use
- Variety in content types tests filtering functionality

**Alternatives Considered**:
- Only text tweets: Rejected (doesn't test image/video rendering)
- Random external URLs: Rejected (unreliable, may break over time)
- Host own videos in project: Rejected (increases repository size unnecessarily)

---

### 6. Character Naming Strategy

**Question**: How do we generate realistic dark fantasy names for 50 characters?

**Decision**: Use thematic name generator with dark fantasy vocabulary

**Name Pattern**: `[Title/Descriptor] [Name] [Suffix/Epithet]`

**Examples**:
- "Grim Theron the Cursed"
- "Elara Nightshade"
- "Kael the Forsaken"
- "Morgath Shadowbane"
- "Lyra of the Wastes"

**Name Components**:
- **Titles**: Grim, Dark, Shadow, Fallen, Lost, Cursed, Forgotten
- **Names**: Theron, Elara, Kael, Morgath, Lyra, Vex, Rook, Ash
- **Epithets**: the Cursed, the Forsaken, Nightshade, Shadowbane, of the Wastes, the Wanderer

**Implementation**: Hardcode array of 50 names (maintainable, explicit, no randomness)

**Rationale**:
- Maintains dark fantasy WAGDIE theme (assumption #7 in spec)
- Explicit names are easier to debug/test than generated ones
- Each name is unique and memorable
- No external library dependencies

**Alternatives Considered**:
- Procedural generation: Rejected (can produce nonsensical names, adds complexity)
- Generic names (Character 1, Character 2): Rejected (not realistic, doesn't test display)
- Real historical names: Rejected (doesn't match dark fantasy theme)

---

### 7. TypeScript Execution Method

**Question**: How do we run the TypeScript seed script without a build step?

**Decision**: Use `ts-node` for direct TypeScript execution

**Setup**:
```json
// package.json
{
  "scripts": {
    "seed": "ts-node scripts/seed-database.ts"
  },
  "devDependencies": {
    "ts-node": "^10.9.1"
  }
}
```

**Rationale**:
- `ts-node` is already in project dependencies (used by Next.js tooling)
- No compile step needed (simpler workflow)
- Familiar to TypeScript developers
- Can be run directly: `npx ts-node scripts/seed-database.ts`

**Alternatives Considered**:
- Compile to JS first (`tsc && node`): Rejected (extra step, confusing for contributors)
- Use `.mjs` with Node.js ESM: Rejected (requires different import syntax)
- Bun or Deno: Rejected (introduces new runtime dependency)

---

### 8. D&D Stat Generation Algorithm

**Question**: How do we generate realistic D&D stats (STR, DEX, CON, INT, WIS, CHA) for characters?

**Decision**: Class-based stat profiles with slight randomization

**Stat Profiles by Class**:
```typescript
const statProfiles = {
  Warrior: { STR: 16, DEX: 12, CON: 14, INT: 8, WIS: 10, CHA: 10 },
  Mage:    { STR: 8, DEX: 12, CON: 10, INT: 16, WIS: 14, CHA: 10 },
  Rogue:   { STR: 10, DEX: 16, CON: 12, INT: 12, WIS: 10, CHA: 12 },
  Cleric:  { STR: 12, DEX: 10, CON: 12, INT: 10, WIS: 16, CHA: 12 }
};

// Add ±2 randomization to each stat (keeps within 1-20 range)
const randomizedStat = baseStat + (Math.random() * 4 - 2);
```

**HP Calculation**:
- Base HP by class: Warrior (30), Mage (20), Rogue (25), Cleric (25)
- Plus CON modifier × level
- Ensures `hp <= max_hp` constraint

**Rationale**:
- Creates distinct character archetypes (Warriors strong, Mages smart)
- Slight randomization adds variety (not all Warriors identical)
- Respects D&D-style stat ranges (1-20)
- Simple, deterministic, no complex algorithms

**Alternatives Considered**:
- Completely random stats: Rejected (no class identity, unrealistic)
- Hardcoded stats per character: Rejected (tedious, inflexible)
- 3d6 dice roll simulation: Rejected (overkill for mock data)

---

## Best Practices Applied

1. **PostgreSQL Idempotency**: Use `ON CONFLICT DO NOTHING` for safe re-runs
2. **Error Resilience**: Try-catch per record, accumulate errors, report summary
3. **Type Safety**: Use generated Supabase types, no `any`
4. **Data Variety**: Explicit distribution targets for comprehensive testing
5. **Asset Reuse**: Use existing project images (no external dependencies)
6. **Simple Execution**: `ts-node` for direct TypeScript execution
7. **Documentation**: Inline comments, README, clear variable names
8. **Maintainability**: Hardcoded data arrays (easy to modify) over algorithms

---

## Implementation Ready

All research questions resolved. Proceed to data-model.md for detailed schema and quickstart.md for usage instructions.
