# Investigation: My Characters Filter Not Showing Wallet Characters

## Summary
The `/characters` "My Characters" filter is wired to send the connected wallet and query the API correctly, but it does not check chain ownership live. It filters cached Supabase fields (`owner_address` or `staker_address`), so the most likely explanation is stale/mis-normalized ownership data: mixed-case/checksummed rows missed by lowercase equality, missing `staker_address` for staked NFTs, or a stale/wrong production table.

## Symptoms
- On `/characters`, filtering for "my characters" does not show characters the connected wallet owns.
- User reports they have a few characters in their wallet, but the filtered list is empty or missing them.

## Background / Prior Research
No external research identified yet; initial issue appears contained to workspace filtering/ownership logic.

## Investigator Findings

### 2026-04-30 Read-only trace

#### 1. UI flow: URL tab -> wallet-gated `useCharacters` request
- `FilterSidebar` defines the `owned` tab label as `My Characters`, and its vertical `Tabs` calls `onTabChange(id as CharacterFilterTab)` when selected (`components/characters/FilterSidebar.tsx:61`, `components/characters/FilterSidebar.tsx:259-264`).
- `/characters` derives `tab` directly from `useSearchParams()` defaulting to `all`, so `/characters?tab=owned` makes `tab === 'owned'` (`app/characters/page.tsx:29-31`).
- The page intentionally passes a wallet only for `tab === 'owned'` and disables the query until `address` exists: `walletForQuery = tab === 'owned' ? address : undefined`; `canQuery = tab !== 'owned' || !!address` (`app/characters/page.tsx:123-126`).
- `useCharacters` includes `wallet` and `enabled` in the React Query call and forwards the wallet to `api.characters.getCharacters` (`hooks/useCharacters.ts:35-55`). The endpoint client serializes `wallet` only when present (`lib/api/endpoints.ts:16-36`).
- The page also uses `owner_address || staker_address` client-side for showing the searing link, which is consistent with the intended ownership model (`app/characters/page.tsx:248-253`).

**Conclusion:** The main browse UI is not dropping a connected wallet before the hook; if the wallet hook has an address, the API request should include `wallet=<address>`. The empty state for a disconnected wallet is intentional (`app/characters/page.tsx:320-329`).

#### 2. API guard behavior for `tab=owned` and `wallet`
- `/api/characters` parses `tab`, `wallet`, pagination, sort, and filter params, validates them, and returns `{ characters: [], hasMore: false, totalCount: 0 }` without calling the service when `tab === 'owned' && !wallet` (`app/api/characters/route.ts:34-83`).
- With a wallet present, the route forwards `tab`, `wallet`, and all other filters to `getCharacters` (`app/api/characters/route.ts:86-101`).
- Test coverage exists for the no-wallet guard and asserts the service is not called (`tests/api/characters-route.test.ts:67-77`).

**Conclusion:** The API likely returns empty for `/api/characters?tab=owned` without `wallet`; that is by design and covered. Missing coverage: no test asserts that `?tab=owned&wallet=...` is forwarded to `getCharacters` with the wallet.

#### 3. Repository owned-filter query and case sensitivity risk
- `CharacterService.getCharacters()` delegates directly to the repository (`lib/services/character-service.ts:19-22`), and `CharacterRepository.findMany()` delegates to `CharacterQueryRepository.findMany()` (`lib/repositories/character-repository.ts:69-72`).
- `CharacterQueryRepository.findMany()` has a second owned-without-wallet guard returning empty (`lib/repositories/character/character-query-repository.ts:225-227`).
- The owned wallet filter lowercases the input wallet and forms a Supabase/PostgREST OR string exactly as `owner_address.eq.<walletLower>,staker_address.eq.<walletLower>` (`lib/repositories/character/character-query-repository.ts:61-73`). For non-owned tabs with a wallet, it filters only `owner_address.eq.<walletLower>` (`lib/repositories/character/character-query-repository.ts:72`).
- The table columns are plain `TEXT`/`VARCHAR`, not `citext`: `owner_address TEXT` in the generated `wagdie_characters` schema (`scripts/generate_migration.py:232-237`), `staker_address TEXT` in the migration (`supabase/migrations/20251228000000_add_staker_address.sql:5-10`), and no `citext`/case-insensitive column definition was found in migrations. A plain SQL equality filter on text is case-sensitive under normal PostgreSQL semantics, so `.eq.<lowercase-wallet>` will miss mixed-case/checksummed rows.
- Most current sync/write paths lower-case stored addresses: ownership bulk/single updates store `owner_address: ...toLowerCase()` (`lib/repositories/character/character-ownership-repository.ts:84-92`, `lib/repositories/character/character-ownership-repository.ts:126-134`); the transfer indexer lowercases `to` before writing (`scripts/indexer/event-handler.ts:52-59`, `scripts/indexer/event-handler.ts:185-193`); staking state sync lowercases `staker_address` (`lib/services/sync/staking-state-sync.ts:79-84`, `lib/services/sync/staking-state-sync.ts:448-466`).
- Legacy/import paths can plausibly have mixed-case rows: migration utilities intentionally normalized `ownerAddress` to EIP-55 checksummed format (`scripts/migration/src/services/transform-service.ts:93-131`; `scripts/migration/src/utils/address-normalizer.ts:24-52`, `scripts/migration/src/utils/address-normalizer.ts:120-134`).

**Conclusion:** The repository includes both unstaked and staked ownership fields, but it relies on persisted lowercase data. Mixed-case/checksummed `owner_address` or `staker_address` rows are a credible root cause for missing wallet-owned characters unless those rows have since been rewritten by sync/indexer.

#### 4. Ownership/staking sync paths and staked-character inclusion
- Ownership sync reads all token IDs from the configured characters table, gets `ownerOf` from the WAGDIE ERC721, lowercases comparisons, then writes changed `owner_address` values through `bulkUpdateOwnership()` (`lib/services/sync/ownership-sync-service.ts:52-121`, `lib/services/sync/ownership-sync-service.ts:139-167`; `lib/repositories/character/character-ownership-repository.ts:84-92`).
- `ownerOf` returns the ERC721 owner. For staked NFTs this may be the staking/world contract rather than the user's wallet; repository comments elsewhere explicitly note that when staked, `owner_address` becomes the staking contract and `staker_address` tracks the wallet (`app/map/page.tsx:190-193`; `supabase/migrations/20251228000000_add_staker_address.sql:1-3`).
- Staking state sync reads `wagdieWorld.wagdieIdToInfo(tokenId)` and stores `info.owner` as normalized `staker_address`; unstaked tokens clear `location_id` and `staker_address` (`lib/services/sync/staking-state-sync.ts:120-133`, `lib/services/sync/staking-state-sync.ts:349-365`, `lib/services/sync/staking-state-sync.ts:418-466`).
- The staking event handler records events, then calls `syncStakingState()` for affected token IDs after upserting staking events (`scripts/indexer/staking-event-handler.ts:340-366`). There is also a full backfill script to sync all `location_id` and `staker_address` from chain state (`scripts/backfill-staking-state.ts:1-36`).
- The `/api/sync/staking` route exposes the same shared sync for explicit token batches but caps requests at 50 token IDs (`app/api/sync/staking/route.ts:9-19`, `app/api/sync/staking/route.ts:75-86`).

**Conclusion:** Staked characters should be included by the owned filter only if `staker_address` has been populated by staking sync/backfill. If `owner_address` correctly contains the staking contract but `staker_address` is null/stale, the owned tab will miss staked wallet characters.

#### 5. Tests and missing coverage
- Existing API tests cover invalid params, the `owned` no-wallet empty response, and a generic service response (`tests/api/characters-route.test.ts:20-97`).
- Repository facade tests verify delegation only; they do not exercise `CharacterQueryRepository.applyWalletFilter()`, the Supabase `.or()` string, staked `staker_address` matching, case normalization, or mixed-case row behavior (`tests/repositories/character-repository.test.ts:64-115`).
- Search found no component/hook tests for `/characters?tab=owned`, `walletForQuery`, `enabled: canQuery`, or `useCharacters` query params; Storybook stories only demonstrate visual `owned` tab state (`components/characters/FilterSidebar.stories.tsx:128-133`).
- Sync route tests mock `syncStakingState()` but do not test `staker_address` persistence or backfill behavior (`tests/api/sync-staking-route.test.ts:78-119`; search results also show `characters-staking-status-route.test.ts` only mocks the sync call).

#### Eliminated / narrowed hypotheses
- **UI not sending wallet:** mostly disproven for connected wallets; page passes `address` only for owned and gates until present (`app/characters/page.tsx:123-149`). Still worth browser-network verification against the user's actual wallet connection state.
- **API accidentally returning all or empty with wallet:** empty without wallet is intentional; with wallet, the route forwards to service (`app/api/characters/route.ts:81-101`).
- **Repository ignores staked ownership:** disproven; owned query ORs `owner_address` and `staker_address` (`lib/repositories/character/character-query-repository.ts:67-69`).
- **Staked rows missing `staker_address`:** not disproven; this remains a strong candidate if affected NFTs are staked and staking sync/backfill has not populated rows (`lib/services/sync/staking-state-sync.ts:448-466`; `scripts/backfill-staking-state.ts:1-36`).
- **Case-sensitive mismatch:** not disproven; this remains credible for legacy/checksummed DB rows because query lowercases input but uses case-sensitive equality against TEXT columns (`lib/repositories/character/character-query-repository.ts:67-69`; `scripts/migration/src/utils/address-normalizer.ts:24-52`).
- **Wrong/stale table:** code defaults to `wagdie_characters`, with env overrides only if configured (`lib/db/tables.ts:1-13`). No code evidence proves the wrong table is used, but environment values should be checked in deployment.

#### Recommended fixes / verification steps
1. Run production DB diagnostics for the affected wallet using both exact lowercase and case-insensitive comparisons, e.g. compare counts for `owner_address = lower(wallet) OR staker_address = lower(wallet)` vs `lower(owner_address) = lower(wallet) OR lower(staker_address) = lower(wallet)`, and inspect whether matched rows are staked (`location_id` non-null) with null `staker_address`.
2. If mixed-case rows exist, backfill address columns to lowercase or change the owned query to use case-insensitive matching/normalized generated columns. Prefer DB normalization because current write paths already store lowercase.
3. If staked rows have `staker_address` null/stale, run `scripts/backfill-staking-state.ts` or call `/api/sync/staking` for affected token IDs, then verify the owned filter returns them.
4. Add tests for: `/api/characters?tab=owned&wallet=...` forwarding; `CharacterQueryRepository` owned filter OR including `staker_address`; mixed-case stored address behavior; and page/hook behavior that disables owned queries until wallet address exists.

## Investigation Log

### Phase 1 - Initial Assessment
**Hypothesis:** The `/characters` page filter likely depends on wallet address ownership fields, API query params, or a client-side ownership hook that may not align with stored data.
**Findings:** Report scaffold created. Proceeding to context discovery.
**Evidence:** User symptom report; no code evidence yet.
**Conclusion:** Needs workspace investigation.

## Root Cause
The owned tab is a database-cache filter, not a live wallet/on-chain ownership check.

Evidence:
- The page only passes the wallet for `tab === 'owned'` and disables the query until a wallet address exists (`app/characters/page.tsx:123-126`).
- `useCharacters` forwards that wallet to `api.characters.getCharacters()` (`hooks/useCharacters.ts:35-55`), and the client serializes it as `wallet=<address>` when present (`lib/api/endpoints.ts:19-36`).
- `/api/characters` only returns an empty owned response when `tab === 'owned' && !wallet`; otherwise it forwards `wallet` to `getCharacters()` (`app/api/characters/route.ts:41-101`).
- The repository lowercases the request wallet and applies a case-sensitive Supabase equality OR: `owner_address.eq.<walletLower>,staker_address.eq.<walletLower>` (`lib/repositories/character/character-query-repository.ts:62-72`).
- Ownership sync writes lowercase `owner_address` (`lib/repositories/character/character-ownership-repository.ts:88-92`, `lib/repositories/character/character-ownership-repository.ts:130-134`), but historical migration tooling normalized addresses to EIP-55/checksummed format (`scripts/migration/src/utils/address-normalizer.ts:24-58`). Plain text equality can miss those rows.
- Staked characters need `staker_address`: ownership sync updates `owner_address` from ERC721 `ownerOf` only (`lib/services/sync/ownership-sync-service.ts:52-121`), while staking sync reads `wagdieIdToInfo`, derives `stakerAddress`, and only writes staked updates when location mapping succeeds (`lib/services/sync/staking-state-sync.ts:120-169`, `lib/services/sync/staking-state-sync.ts:349-365`, `lib/services/sync/staking-state-sync.ts:440-464`). If a token is staked and `staker_address` is null/stale, it will not appear under "My Characters".

Most likely production causes, in order:
1. The affected wallet's rows exist but are stored with mixed-case/checksummed `owner_address` or `staker_address`, so lowercase `.eq` misses them.
2. The user's NFTs are staked, making `owner_address` the staking/world contract while `staker_address` is null/stale because staking sync/backfill has not populated it.
3. The deployed app is pointed at a stale/different characters table via `NEXT_PUBLIC_CHARACTERS_TABLE` / `CHARACTERS_TABLE` (`lib/db/tables.ts:1-13`), or ownership sync has not run since transfers.

Eliminated or narrowed:
- Broken tab label/id mapping is unlikely; `FilterSidebar` defines `owned` as "My Characters" and sends that tab id.
- UI dropping the wallet is unlikely for connected sessions; the code gates the query until `address` exists.
- API returning empty despite a wallet is unlikely from code; the early empty response only happens when `wallet` is missing.
- Repository ignoring staked ownership is ruled out; it includes both `owner_address` and `staker_address` in the owned OR query.

Remaining uncertainty requires production verification: confirm the browser request includes `wallet=0x...`, identify whether affected tokens are staked, inspect `owner_address`/`staker_address` casing and freshness, and confirm deployment table env vars.

## Recommendations
1. Verify the failing browser request in DevTools. It should look like `/api/characters?tab=owned&wallet=0x...&page=1&perPage=50...`. If `wallet` is absent, the issue is wallet connection/session state, not DB filtering.
2. Run production DB diagnostics for the affected wallet:

   ```sql
   -- What the intended logical match should find
   select token_id, owner_address, staker_address, location_id, updated_at
   from wagdie_characters
   where lower(owner_address) = lower('<wallet>')
      or lower(staker_address) = lower('<wallet>')
   order by token_id;

   -- What the current query effectively matches
   select token_id, owner_address, staker_address, location_id, updated_at
   from wagdie_characters
   where owner_address = lower('<wallet>')
      or staker_address = lower('<wallet>')
   order by token_id;
   ```

   If the first query returns rows and the second does not, address casing is confirmed as the break.
3. Inspect user-reported token IDs directly:

   ```sql
   select token_id, owner_address, staker_address, location_id, staking_status, updated_at
   from wagdie_characters
   where token_id in (...);
   ```

   If `owner_address` is a staking/world contract and `staker_address` is null/stale, run staking sync/backfill.
4. Normalize existing address data to lowercase, matching current write paths:

   ```sql
   update wagdie_characters
   set owner_address = lower(owner_address)
   where owner_address is not null;

   update wagdie_characters
   set staker_address = lower(staker_address)
   where staker_address is not null;
   ```

5. Run staking backfill or targeted staking sync for affected tokens (`scripts/backfill-staking-state.ts` or `/api/sync/staking`) if staked rows are missing `staker_address`.
6. Add regression tests for: `/api/characters?tab=owned&wallet=...` forwarding; `CharacterQueryRepository` owned filter ORing `owner_address` and `staker_address`; mixed-case address data behavior; and staked rows matching via `staker_address`.
7. Harden input handling by trimming/validating `wallet` at the API boundary. Prefer DB normalization over `ilike` for the main fix because normalization preserves index-friendly equality and matches current write paths.

## Preventive Measures
- Treat address casing as a data invariant: all stored wallet-like address columns should be lowercase or use a case-insensitive/generated normalized column consistently.
- Add an automated ownership/staking sync health check that compares chain state against `owner_address`/`staker_address` freshness for sampled tokens.
- Add monitoring or an admin diagnostic endpoint for "why is token X not in wallet Y's owned list?" showing owner, staker, table, and updated timestamp.
- Keep owned-filter test coverage at UI/hook, API, and repository layers so wallet-gated empty states and staked ownership cannot regress silently.
