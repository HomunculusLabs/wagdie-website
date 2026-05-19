# Investigation: /characters 17 Filter Not Working

## Summary
The `/characters` “17” filter is the `The 17` metadata-trait dropdown, not token ID search. The dropdown cannot populate because `/api/characters/traits/The%2017` is rejected by a hard-coded trait-type allowlist that omits `The 17`; the downstream URL/list/repository filtering path is otherwise wired for exact named trait values such as `Luta the Beacon`.

## Symptoms
- On `/characters`, selecting or using the “17” filter does not produce the expected filtered character list.
- Exact intended semantics of “17” are not yet confirmed from the report; likely a filter value/category exposed in the characters UI.

## Background / Prior Research
- Existing related report `docs/investigations/my-characters-filter-2026-04-30.md` documents the `/characters` filtering flow for the “My Characters”/owned tab and identifies wallet/data normalization as likely causes for owned-filter issues. This issue may be separate unless “17” refers to that prior owned-filter path.
- No external research identified yet; the issue appears contained to workspace UI/API/filtering logic and local git/data behavior.

## Investigator Findings
<!-- Pair investigator appends structured analysis here (file:line refs, evidence, conclusions). -->

### 2026-05-18 - End-to-end trace of `The 17` / `the17` filter

**Scope:** traced the `/characters` dropdown, URL state, API client/list serialization, trait-count endpoint validation, repository/local metadata filtering, local metadata samples, and relevant tests. This pass was read-only except for appending these findings. Three narrow explore probes were started but timed out without results and were cancelled; the evidence below comes from direct file reads/searches.

#### 1. UI/dropdown flow for `The 17` options and selected value
- `/characters` imports and calls `useThe17Traits()`, then passes `the17Traits` and `the17Loading` into `FilterSidebar` as `availableThe17`/`the17Loading` (`app/characters/page.tsx:19`, `app/characters/page.tsx:65-66`, `app/characters/page.tsx:138-142`).
- `FilterSidebar` exposes dedicated `the17Filter`, `availableThe17`, and `onThe17Change` props (`components/characters/FilterSidebar.tsx:43-47`) and renders a generic `TraitDropdown` labeled `The 17` with those props (`components/characters/FilterSidebar.tsx:347-354`).
- `TraitDropdown` selects/display-matches by exact `option.value === value`; if no matching option exists, it displays `All ${label}` (`components/characters/TraitDropdown.tsx:43-44`). It calls `onChange(option.value)` when a user selects an option (`components/characters/TraitDropdown.tsx:120-124`) and renders `No the 17 options available` if the options array is empty (`components/characters/TraitDropdown.tsx:144-148`).
- `ActiveFilters` includes `the17` in active-filter counting and renders/removes it as `The 17: ${filters.the17}` (`components/characters/ActiveFilters.tsx:40-42`, `components/characters/ActiveFilters.tsx:88-93`).
- Storybook mock data demonstrates intended UX semantics: `The 17` option values are named characters such as `Luta the Beacon`, not the numeric value `17` (`components/characters/FilterSidebar.stories.tsx:24-29`, `components/characters/FilterSidebar.stories.tsx:122-126`).

#### 2. URL state and API client/list request serialization for `the17`
- URL parsing reads `the17` from the query string into filter state (`hooks/useCharacterBrowseFilters.ts:78-82`).
- URL building writes non-null `params.the17` back to `?the17=...` (`hooks/useCharacterBrowseFilters.ts:95-100`). `handleThe17Change` updates that URL state with the selected string and resets pagination via shared `updateFilters` (`hooks/useCharacterBrowseFilters.ts:196-202`, `hooks/useCharacterBrowseFilters.ts:214-217`).
- `useCharacters` includes `the17` in the React Query key and passes it to `api.characters.getCharacters` (`hooks/useCharacters.ts:39-58`).
- The API endpoint client serializes `the17: params.the17` into `/api/characters` params (`lib/api/endpoints.ts:23-39`). The lower-level client appends all non-null/non-undefined params with `url.searchParams.append(key, String(value))`, so strings like `Luta the Beacon` are preserved/encoded normally (`lib/api/client.ts:97-106`).
- The server list handler reads `searchParams.get('the17') || undefined` and passes it through to `getCharacters` (`lib/api/handlers/character-list.ts:50-59`, `lib/api/handlers/character-list.ts:78-91`).
- Existing hook tests cover parse/build serialization for `the17=Luta` and `the17=Luta the Beacon`, including expected URL encoding as `the17=Luta+the+Beacon` (`tests/hooks/useCharacterBrowseFilters.test.tsx:51-61`, `tests/hooks/useCharacterBrowseFilters.test.tsx:84-95`).

#### 3. Trait-count endpoint behavior/validation for `The 17`
- `useThe17Traits()` requests `useTraitCounts('The 17')` (`hooks/useTraitCounts.ts:61-63`). `useTraitCounts` delegates to `api.characters.getTraitCounts(traitType)` (`hooks/useTraitCounts.ts:26-32`).
- The API client calls `/api/characters/traits/${encodeURIComponent(traitType)}`, so `The 17` is routed as `/api/characters/traits/The%2017` (`lib/api/endpoints.ts:58-63`).
- The route validates against `VALID_TRAIT_TYPES = ['Armor', 'Back', 'Mask', 'Body', 'Hair', 'Background', 'Class', 'Health']` (`app/api/characters/traits/[traitType]/route.ts:12-13`). Because `The 17` is omitted, the route returns a 400 `Invalid trait type` before calling the repository (`app/api/characters/traits/[traitType]/route.ts:22-31`).
- This confirms the current hypothesis: the dropdown options fetch for `The 17` is rejected by the allowlist, leaving `availableThe17` empty/error-driven even though the rest of the UI can represent a selected value.
- Additional validation inconsistency: the UI has a first-class Alignment dropdown, but `Alignment` is also omitted from this generic trait allowlist (`app/api/characters/traits/[traitType]/route.ts:12-13`). Alignment currently uses a separate endpoint/hook, so it is not this bug, but it shows the generic route allowlist is manually curated and easy to drift.

#### 4. Repository/local metadata filtering behavior for `the17`; numeric `17` vs token ID
- `CharacterFilters` defines `the17?: string` as a special named-character trait filter (`types/character.ts:134-136`).
- The Supabase fallback path exact-matches JSON metadata against `{ trait_type: 'The 17', value: filters.the17 }` (`lib/repositories/character/character-query-repository.ts:144-162`).
- The local metadata acceleration path maps filter key `the17` to trait type `The 17` (`lib/services/assets/character-local-assets.ts:42-48`). The local index stringifies attribute values and stores exact value -> token-id sets (`lib/services/assets/character-local-assets.ts:221-250`), then `getTokenIdsForTraitFilters` exact-matches the raw selected value for each active filter and intersects token-id sets (`lib/services/assets/character-local-assets.ts:303-338`).
- `findMany` prefers the local trait-token-id constraint when any trait filter is active, then fetches those token IDs and intentionally does **not** re-apply metadata JSONB trait filters when local IDs were available (`lib/repositories/character/character-query-repository.ts:328-369`). This path should work for `the17` if the selected value is one of the exact local trait values.
- Local metadata contains `trait_type: "The 17"` entries. Examples: token `1250` has value `Luta the Beacon` (`public/metadata/characters/1250.json:2-13`); token `375` has value `She who Smiles` (`public/metadata/characters/375.json:27-36`).
- Workspace search found 18 local metadata files with `trait_type: "The 17"` and no attributes whose value is numeric/string `17`. A local read-only count script found 18 occurrences and 17 unique values because `She who Smiles` appears twice (tokens 375 and 3886). Tokens with `The 17`: 319, 375, 416, 833, 1250, 1353, 1843, 1851, 3077, 3886, 4369, 4449, 4485, 4701, 5150, 5734, 6179, 6218.
- Token `17` exists as a normal NFT/token ID (`public/metadata/characters/17.json:2-4`) but its attributes include normal Armor/Back/Body/etc. traits and no `The 17` trait (`public/metadata/characters/17.json:6-68`). Therefore numeric `17` is a token ID/search input concern, not a valid `The 17` trait value.

#### 5. Tests / missing regression coverage
- Existing tests only cover URL helper behavior for `the17`; they do not cover the trait-count route allowlist, `useThe17Traits`, the generic trait-count endpoint, local asset trait indexing, or repository filtering with a `The 17` value (`tests/hooks/useCharacterBrowseFilters.test.tsx:51-61`, `tests/hooks/useCharacterBrowseFilters.test.tsx:84-95`).
- Search found only a repository facade test for `getTraitCounts('Armor')`, not `The 17` (`tests/repositories/character-repository.test.ts:89-107`).
- No tests were found for `app/api/characters/traits/[traitType]/route.ts` or for the route accepting every trait requested by UI hooks. A focused regression test should assert `/api/characters/traits/The%2017` is accepted and returns `traitType: 'The 17'` with named-character values.

#### Eliminated hypotheses
- **URL/query serialization broken:** unlikely. `the17` is parsed, built, included in query keys, and serialized to both browser URL and `/api/characters` request params with tests covering encoded spaces.
- **List/repository path lacks `the17`:** unlikely. Both Supabase JSONB filtering and local metadata token-id filtering explicitly map `the17` to `trait_type: 'The 17'` with exact string matching.
- **The filter should use numeric `17`:** unsupported by metadata. `17` is a token ID/search term, while `The 17` trait values are names (e.g., `Luta the Beacon`). There are no local metadata attributes with value `17`.

#### Conclusion
The immediate regression is the generic trait-count route allowlist. The UI requests `The 17` options via `/api/characters/traits/The%2017`, but `app/api/characters/traits/[traitType]/route.ts` rejects `The 17` because `VALID_TRAIT_TYPES` omits it. As a result, the dropdown cannot populate the exact named values that the already-wired `the17` URL/list/repository filter expects.

#### Recommendations
1. Add `The 17` to the trait-count route allowlist (`app/api/characters/traits/[traitType]/route.ts:12-13`). Consider adding `Alignment` too or deriving the allowlist from the same metadata trait/filter mapping to avoid future drift.
2. Add a route-level regression test for `/api/characters/traits/The%2017` accepting the trait and returning named values/counts.
3. Add a contract/unit test ensuring every UI trait-count hook (`useArmorTraits`, `useBackTraits`, `useMaskTraits`, `useThe17Traits`) requests a trait type accepted by the route allowlist.
4. Add local asset/repository coverage for `the17: 'Luta the Beacon'` returning token `1250` (or an equivalent fixture) and clarify in UI copy/docs that `The 17` values are names, while numeric `17` should be handled by the search/token-id input.


## Investigation Log

### Phase 1 - Initial Assessment
**Hypothesis:** The “17” filter likely maps to a specific UI filter option or URL/query parameter whose value may be dropped, mis-typed, rejected by API validation, or not implemented in repository filtering.
**Findings:** Created report scaffold and noted an existing related `/characters` filter investigation for wallet-owned filtering.
**Evidence:** User report; `docs/investigations/my-characters-filter-2026-04-30.md`.
**Conclusion:** Proceed to broad workspace context gathering before direct reconnaissance.

## Root Cause
The immediate root cause is trait-count API validation drift.

`/characters` requests dropdown options for the `The 17` filter through `useThe17Traits()` (`hooks/useTraitCounts.ts:61-63`), and the API client turns that into `/api/characters/traits/The%2017` (`lib/api/endpoints.ts:58-63`). The route then validates the requested trait against `VALID_TRAIT_TYPES`, which currently contains only `Armor`, `Back`, `Mask`, `Body`, `Hair`, `Background`, `Class`, and `Health` (`app/api/characters/traits/[traitType]/route.ts:12-13`). Because `The 17` is absent, the route returns `400 Invalid trait type` before the repository can return counts (`app/api/characters/traits/[traitType]/route.ts:22-31`).

That leaves `availableThe17` empty/error-driven in the UI even though `FilterSidebar` renders a dedicated `TraitDropdown` labeled `The 17` (`components/characters/FilterSidebar.tsx:347-354`) and `/characters` passes `the17Traits` into it (`app/characters/page.tsx:65-66`, `app/characters/page.tsx:138-142`).

The rest of the selected-value path is not the blocker: URL state parses/serializes `the17`, `useCharacters` sends it to `/api/characters`, the list handler forwards it, and repository/local metadata filtering maps `the17` to exact metadata matches for `trait_type: 'The 17'` (`lib/repositories/character/character-query-repository.ts:144-162`; `lib/services/assets/character-local-assets.ts:42-48`).

Important semantic finding: numeric `17` is not a valid `the17` trait value. Local metadata shows `The 17` values are names, e.g. token `1250` has `{ trait_type: 'The 17', value: 'Luta the Beacon' }` (`public/metadata/characters/1250.json:11-14`). Token `17` is simply NFT/token ID 17 and has no `The 17` trait (`public/metadata/characters/17.json:1-71`).

## Recommendations
1. Add `The 17` to `VALID_TRAIT_TYPES` in `app/api/characters/traits/[traitType]/route.ts:12-13` so `/api/characters/traits/The%2017` returns counts instead of `400`.
2. Prefer centralizing/deriving accepted trait types from shared filter metadata used by UI hooks, local asset mapping, and repository filtering, rather than manually maintaining a route-only allowlist.
3. Add a route-level regression test for `GET /api/characters/traits/The%2017` asserting status `200`, `traitType: 'The 17'`, and named values such as `Luta the Beacon`.
4. Add a contract test that every UI trait-count hook (`useArmorTraits`, `useBackTraits`, `useMaskTraits`, `useThe17Traits`) requests a trait accepted by the trait-count route.
5. Add repository/local asset coverage for `the17: 'Luta the Beacon'` returning token `1250` or an equivalent fixture-backed character.
6. Clarify UI/product semantics if users may expect numeric `17`: `The 17` filters named special trait values; token ID `17` should be found through search/token-id handling.

## Preventive Measures
- Keep trait filter definitions in one shared module consumed by UI hooks, API validation, local metadata indexing, and repository metadata filtering.
- Test non-equipment metadata traits in addition to common equipment traits.
- Add an end-to-end or integration path covering dropdown load → select `The 17` value → URL `the17=...` → list results.
- Document that `the17` query values are exact metadata values, not numeric token IDs.
