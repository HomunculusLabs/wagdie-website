# Investigation: Has Sheet Filter Not Working

## Summary
The `/characters` "Has Sheet" filter is wired correctly from the UI through the API, but the repository predicate is not a valid "has sheet" test. It ORs over fields that are populated/defaulted for ordinary no-sheet characters (`name.not.is.null` and `str.not.is.null`), so `hasSheet=true` can include nearly the whole imported collection instead of only characters with sheet data.

## Symptoms
- The "Has Sheet" filter does not produce the expected filtered character list.
- Verified likely failure mode: the filter is too broad and returns many/no-sheet characters, not that the UI drops the filter.

## Background / Prior Research
No external research was needed; the issue is contained to workspace UI/API/repository/data-model logic.

## Investigator Findings

### End-to-end filter plumbing is present
- URL parsing reads `hasSheet=true` into `filters.hasSheet` (`hooks/useCharacterBrowseFilters.ts:77`).
- URL building emits `hasSheet=true` when the toggle is enabled (`hooks/useCharacterBrowseFilters.ts:95`), and the toggle handler updates that URL state (`hooks/useCharacterBrowseFilters.ts:199-200`).
- `/characters` passes `hasSheet` into the data hook and passes the same state/handler into `FilterSidebar` (`app/characters/page.tsx:80-84`, `app/characters/page.tsx:127-128`).
- `useCharacters` includes `hasSheet` in the React Query key and forwards it to `api.characters.getCharacters()` (`hooks/useCharacters.ts:45-55`).
- The API client serializes `hasSheet` into `/api/characters` params (`lib/api/endpoints.ts:20-36`).
- The shared API handler parses `searchParams.get('hasSheet') === 'true'` and forwards `hasSheet: hasSheet || undefined` to `getCharacters()` (`lib/api/handlers/character-list.ts:49`, `lib/api/handlers/character-list.ts:76-88`).

**Conclusion:** UI/API forwarding is not the root cause.

### Repository predicate is wrong
`applyHasSheetFilter()` applies this OR predicate when `filters.hasSheet` is true:

```ts
return query.or(
  'name.not.is.null,' +
  'str.not.is.null,' +
  'level.gt.1,' +
  'background_story.not.is.null'
)
```

Evidence: `lib/repositories/character/character-query-repository.ts:131-141`; it is part of normal non-trait filtering at `lib/repositories/character/character-query-repository.ts:186-192`.

This predicate does not mean "has a character sheet":
- `name.not.is.null` matches ordinary NFT metadata names.
- `str.not.is.null` matches defaulted stat rows.
- `level.gt.1` and `background_story.not.is.null` may be useful signals, but they are masked by the always/usually-true terms above.

### Import/schema behavior makes those terms too broad
- The migration generator sets `sheet = token.get('sheet', {}) or {}` and `raw_metadata = token.get('rawMetadata', {}) or {}` (`scripts/generate_migration.py:92-94`).
- It sets `name = sheet.get('name') or raw_metadata.get('name')`, so even tokens without sheets receive a normal NFT name when raw metadata has one (`scripts/generate_migration.py:113-114`).
- Missing stats are clamped/defaulted to 10, while missing HP/level/experience are defaulted to 10/1/0 (`scripts/generate_migration.py:116-133`).
- The insert writes those derived/defaulted values for every character row (`scripts/generate_migration.py:141-149`).
- The generated `wagdie_characters` schema also declares stat defaults such as `str INTEGER DEFAULT 10`, other core stats default 10, `level INTEGER DEFAULT 1`, and `experience INTEGER DEFAULT 0` (`scripts/generate_migration.py:231-257`).
- The older `characters` migration path also adds `str INTEGER DEFAULT 10` and related default stat columns (`supabase/migrations/20251028000000_page_wireframes_schema.sql:65-75`).

### Local metadata confirms sheet vs no-sheet is a real distinction
- A no-sheet sample still has a regular top-level NFT `name`: `public/metadata/characters/2833.json:1-5`.
- A sheet-bearing sample has a top-level `sheet` object: `public/metadata/characters/10.json:1-26`.
- Local count from `public/metadata/characters/*.json`: 6,667 files total; 1,564 have top-level `sheet`; 5,103 do not.

**Conclusion:** `metadata.sheet` is the clear imported-sheet marker. `name IS NOT NULL` and `str IS NOT NULL` cannot distinguish the 1,564 sheet-bearing tokens from ordinary no-sheet tokens.

### Existing UI copy and editor behavior create one semantic caveat
- The toggle title says: "Show only characters with custom name, stats, level, or backstory" (`components/characters/SheetToggle.tsx:22-24`).
- Detail/card/editor code uses DB columns plus metadata fallbacks: character name falls back to `metadata.name` (`app/characters/[tokenId]/page.tsx:51`, `components/characters/CharacterCard.tsx:36-39`), level has metadata fallbacks in some views (`components/characters/detail/CharacterSheetLayout.tsx:95`, `components/characters/detail/CharacterSheetPanel.tsx:51`), and the editor initializes name/story from DB columns or metadata (`hooks/useCharacterEditor.ts:100-119`).
- The update-diff treats DB columns as editable state but compares name/story against metadata fallbacks (`lib/domain/character/update-diff.ts:13-21`).

**Conclusion:** A pure `metadata->sheet` filter matches imported sheets. If product intent includes "user customized this no-sheet character later," the app needs an explicit persisted marker or carefully chosen non-default DB-field fallbacks. Name-only customization is not safely inferable today because ordinary NFT metadata already populates `name`.

### Test coverage gap
- URL helper tests already cover `hasSheet` parsing/building (`tests/hooks/useCharacterBrowseFilters.test.tsx:34-90`).
- API route tests cover `hasElizaProfile` forwarding but do not include a corresponding `hasSheet` forwarding test (`tests/api/characters-route.test.ts:104-123`).
- No selected test covers the repository predicate or prevents regressions like `name.not.is.null` / `str.not.is.null` being used as sheet evidence.

## Investigation Log

### Phase 1 - Initial Assessment
**Hypothesis:** The issue likely lives in character filtering flow: UI filter state, API query params, repository query construction, or mismatch between filter key and stored sheet-related data.
**Findings:** Created this report and confirmed the repository has prior character-filter investigations for analogous filter/API/data mismatches.
**Evidence:** `docs/investigations/my-characters-filter-2026-04-30.md` documents the `/characters` filter flow and prior repository/API ownership filter behavior.
**Conclusion:** Workspace investigation required; no external research needed.

### Phase 2 - Context Builder / Initial Oracle Assessment
**Hypothesis:** Broad workspace discovery would identify whether the filter is dropped in the UI/API path or mishandled in repository logic.
**Findings:** Context discovery selected the `/characters` page, filter components, hook, API client/handler, repository query builder, character types, migration script, specs, and tests. Initial oracle assessment identified `applyHasSheetFilter()` as the suspicious implementation.
**Evidence:** `lib/repositories/character/character-query-repository.ts:131-141`.
**Conclusion:** UI/API flow likely wired; backend predicate needed verification.

### Phase 3 - Pair Investigator Attempt
**Hypothesis:** A pair investigator could independently trace the flow and append findings.
**Findings:** Two pair sessions were attempted. The first stalled during nested reconnaissance; the second stalled during direct file search. Both were cancelled and cleaned up to avoid dangling agents.
**Evidence:** RepoPrompt sessions `952301EE-AE50-4E8C-BCCF-7A8E1EE3B52A` and `BF71238C-C724-43A7-B8C0-8F12292359DC` were cancelled/cleaned up.
**Conclusion:** Proceeded with direct spot-checks and oracle synthesis using the context_builder-curated selection.

### Phase 4 - Direct Verification and Oracle Synthesis
**Hypothesis:** The repository predicate is too broad because imported no-sheet rows still have `name` and default stats.
**Findings:** Confirmed. The migration/import code populates `name` from raw metadata when no sheet exists and writes/defaults stats for every row. Local metadata has 1,564 top-level sheet objects and 5,103 files without sheets, so the current predicate collapses this distinction.
**Evidence:** `scripts/generate_migration.py:92-149`, `scripts/generate_migration.py:231-257`, `public/metadata/characters/10.json:1-26`, `public/metadata/characters/2833.json:1-5`.
**Conclusion:** Root cause confirmed.

## Root Cause
The backend `hasSheet` predicate in `CharacterQueryRepository.applyHasSheetFilter()` is semantically incorrect. It currently tests whether any of `name`, `str`, `level > 1`, or `background_story` exists/matches (`lib/repositories/character/character-query-repository.ts:131-141`).

That is wrong for this data model because imports populate `name` from ordinary raw NFT metadata and default stats like `str` to 10 for every row (`scripts/generate_migration.py:113-149`). Therefore no-sheet characters can satisfy both `name.not.is.null` and `str.not.is.null`. The filter is not broken in transit; it is broken at the database predicate layer.

## Recommendations
1. **Immediate fix:** replace the repository predicate in `lib/repositories/character/character-query-repository.ts:131-141` with one based on `metadata->sheet` existence and remove `name.not.is.null` / `str.not.is.null`.
   - If "Has Sheet" means imported sheet only, use only the JSON sheet marker, e.g. `metadata->sheet.not.is.null` (verify Supabase/PostgREST JSON-path syntax in a focused test or against Supabase).
   - If "Has Sheet" means imported sheet or later user-created sheet/customization, use `metadata->sheet` plus non-default sheet-field fallbacks such as `background_story.not.is.null`, `level.gt.1`, `experience.gt.0`, and stat inequality checks (`str.neq.10`, `dex.neq.10`, etc.). Do not include `name.not.is.null` unless a true original-name/custom-name marker is added.
2. **Best durable fix:** add an explicit indexed `has_sheet` (or `sheet_created_at`) column, backfill it from `metadata ? 'sheet'` plus chosen custom-field semantics, and set it on future editor saves. Then `hasSheet` becomes `query.eq('has_sheet', true)` instead of a fragile OR predicate.
3. **Clarify product copy:** update `components/characters/SheetToggle.tsx:22-24` if the filter is intended to mean "imported character sheet" rather than "custom name, stats, level, or backstory."
4. **Add focused tests:**
   - API route test beside the `hasElizaProfile` forwarding test to assert `?hasSheet=true` reaches `getCharacters({ hasSheet: true })` (`tests/api/characters-route.test.ts`).
   - Repository predicate test (export a predicate constant or test query-builder behavior) asserting it includes `metadata->sheet` and does not include `name.not.is.null` or `str.not.is.null`.
   - Optional fixture/regression test using one sheet metadata sample and one no-sheet sample to lock the expected distinction.

## Preventive Measures
- Avoid deriving boolean product concepts from nullable/defaulted display fields when imports also populate those fields for normal records.
- Prefer explicit normalized read-model flags for filters that users depend on.
- When adding a filter, add tests at all layers: URL/controller, API forwarding, repository predicate, and at least one representative data fixture.
