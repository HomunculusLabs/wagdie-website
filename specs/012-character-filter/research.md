# Research: Character Filter Enhancement

**Feature**: 012-character-filter
**Date**: 2025-11-30

## Overview

Research conducted to resolve technical unknowns and establish best practices for the character filtering feature.

---

## Research Task 1: Alignment System Definition

### Question
What alignment system should be used for character filtering - traditional D&D alignments, WAGDIE-specific system, or something else?

### Investigation
Analyzed the existing data in `wagdie.json` to understand available alignment-like data:

1. **NFT Metadata "Body" trait**: ~50 distinct character archetype values
   - Examples: Pilgrim, Stranger, Wormkin Elite, Simple Vagabond, Garolin Champion, etc.
   - Present in the `attributes` array with `trait_type: "Body"`

2. **Character Sheet "origin" field**: Same archetypes stored in character sheets
   - May differ from Body trait if character sheet was customized
   - Present in `origin` field of character sheet data

3. **No traditional D&D alignment**: The data does not contain Lawful Good, Neutral Evil, etc.

### Decision
**Use WAGDIE Origin/Body traits as the "alignment" filter system**

### Rationale
- Data already exists - no schema changes needed
- ~50 meaningful categories provide rich filtering options
- Thematically appropriate for WAGDIE lore (character archetypes matter)
- Consistent with existing character presentation in the UI

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| D&D 9-point alignment | Would require adding new data field; doesn't match WAGDIE lore |
| Good/Neutral/Evil only | Too simplistic; loses the rich archetype diversity |
| Custom user-defined | Too complex; requires additional data model |

---

## Research Task 2: Character Sheet Detection Logic

### Question
How do we determine if a character "has a character sheet"?

### Investigation
Examined `wagdie.json` character sheet entries and Character type definition:

- Character sheets in Firebase have: `name`, `origin`, `attributes`, `equipment`, `background_story`, `hit_points`, `level`, etc.
- In Supabase `characters` table: `name`, `str/dex/con/int/wis/cha`, `background_story`, `equipment` columns exist
- Base NFT data only has `metadata` JSONB with NFT attributes (image, traits)

### Decision
**A character "has sheet" if any of these conditions are true:**
1. `name` field is not null (custom name set)
2. Any stat field (`str`, `dex`, `con`, `int`, `wis`, `cha`) is not null
3. `background_story` field is not null

### Rationale
- These fields only have values when owner has customized the character
- Base NFT metadata doesn't set these fields
- Simple SQL: `name IS NOT NULL OR str IS NOT NULL OR background_story IS NOT NULL`

### Alternatives Considered
| Alternative | Why Rejected |
|-------------|--------------|
| Check only `name` | Misses characters with stats but no custom name |
| Check all 6 stats | Over-complicated; one stat is sufficient indicator |
| Check `metadata` changes | Metadata is NFT data, not sheet data |

---

## Research Task 3: Filter URL Persistence Pattern

### Question
How should new filters integrate with existing URL parameter system?

### Investigation
Reviewed current implementation in `app/characters/page.tsx`:
- Uses `useSearchParams` for reading URL
- Uses `router.push` for updating URL
- Current params: `tab`, `sort`, `page`, `search`
- Pattern: empty/default values are omitted from URL

### Decision
**Add two new URL parameters:**
- `hasSheet=true` (omitted when false/not set)
- `origin=<value>` (omitted when not filtering by origin)

### Rationale
- Follows existing pattern of omitting default values
- Clean URLs for sharing
- Backward compatible - existing URLs continue to work

---

## Research Task 4: Origin/Body Data Extraction

### Question
Where does origin data come from in the current database?

### Investigation
Checked database schema and data flow:
- Characters table has `metadata` JSONB column
- NFT metadata stored as: `{"attributes": [{"trait_type": "Body", "value": "Pilgrim"}, ...]}`
- Character sheets may have separate `origin` field (in migration)

### Decision
**Extract origin from metadata JSONB for filtering:**
```sql
metadata->'attributes'->>'Body'
-- or use JSON path extraction
```

For performance, consider:
1. Computed column/index on origin extraction
2. Or extract origin to dedicated column during data import

### Rationale
- Data already exists in metadata
- Supabase supports JSONB operators
- May need index optimization for performance

---

## Research Task 5: Performance Considerations

### Question
How to ensure <1s filter response with 6,666 characters?

### Investigation
Current pagination uses 50 items per page. Database has indexes on:
- `token_id` (primary)
- `owner_address`
- `infection_status`
- `staking_status`

### Decision
**Add database indexes for new filter columns:**
```sql
CREATE INDEX idx_characters_has_sheet
  ON characters ((name IS NOT NULL OR str IS NOT NULL OR background_story IS NOT NULL));

-- For origin filtering (JSONB path)
CREATE INDEX idx_characters_origin
  ON characters USING gin ((metadata->'attributes'));
```

### Rationale
- B-tree index for boolean sheet filter
- GIN index for JSONB attribute searching
- Combined queries can use multiple indexes

---

## Summary of Decisions

| Topic | Decision |
|-------|----------|
| Alignment System | Use Body/Origin traits (~50 WAGDIE archetypes) |
| Has Sheet Logic | `name OR str OR background_story IS NOT NULL` |
| URL Parameters | Add `hasSheet` and `origin` params |
| Data Source | Extract from `metadata` JSONB or dedicated column |
| Performance | Add indexes for new filter conditions |
