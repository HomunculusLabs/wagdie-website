# Lore Real Data Transition Plan

## Goal

Move `/lore` from static seed arrays to database-backed base lore reads without changing the public lore domain contracts or the existing published-overlay behavior.

This phase should make the core archive data real and migration-safe. It should not add a broad CMS or admin editing workflow yet.

## Background

- Public archive reads already flow through `getEffectiveArchiveItems()` (`app/lore/page.tsx:19-36`). The effective event list currently composes static `loreEvents`, published canonization overrides, and published community submissions (`lib/lore/effective-query.ts:64-107`).
- Character and location pages still resolve base entities, images, sources, seasons, and filter metadata from static exports in `@/lib/lore` (`app/lore/characters/[slug]/page.tsx:4-13`, `app/lore/locations/[slug]/page.tsx:4-12`).
- `lib/lore/query.ts` is the static data seam: it imports `lib/lore/data/*`, builds in-memory maps, and resolves related entities against static records (`lib/lore/query.ts:1-31`, `lib/lore/query.ts:58-201`).
- The public shapes to preserve are already explicit: `LoreEvent`, `LoreCharacter`, `LoreLocation`, `LoreSeason`, `SourceRecord`, and `LoreMedia` (`lib/lore/types.ts:72-158`).
- DB-backed lore-adjacent flows already exist for canonization overrides and community submissions (`supabase/migrations/20260509000000_create_lore_canonization_overrides.sql:4`, `supabase/migrations/20260509010000_create_lore_submissions.sql:4`). Tests already lock in effective-query behavior for overrides and published submissions (`tests/unit/lore-effective-query.test.ts:66-207`).
- Prior plans favor static fallback plus published DB overlays through shared seams, not page-specific composition (`docs/plans/admin-panel-workflows-2026-05-09.md`, `docs/plans/community-lore-media-submissions-2026-05-09.md`).

## Approach

Migrate the full base lore read dataset together: events, characters, locations, seasons, sources, and media. Migrating only events would keep entity resolution split and fragile because related entities, profile pages, media, and filters still depend on static lookups.

Use this composition order for public reads:

1. Load a base lore dataset from DB, with static arrays as fallback.
2. Apply published canonization overrides.
3. Adapt and append published community submissions.
4. Resolve sources, media, characters, locations, and related entities from the same effective context.

Keep static data in place for rollback and non-migrated call sites. Treat `lib/lore/query.ts` as the synchronous static compatibility layer; do not convert it to async in this phase.

## Work Items

### 1. Add read-only base lore tables

Create `supabase/migrations/<timestamp>_create_lore_base_tables.sql` for six base tables:

- `lore_seasons`
- `lore_media`
- `lore_sources`
- `lore_locations`
- `lore_characters`
- `lore_events`

Map columns directly to the existing TypeScript shapes in `lib/lore/types.ts:72-158`, using snake_case in SQL and preserving existing ids/slugs. Store event `entityRefs` and canon paths as JSONB, keep array relationships as `text[]`, and follow existing lore-table RLS/service-role conventions from the May 9 migrations.

Use `is_published boolean not null default true` only on first-class public records that can disappear from navigation (`lore_events`, `lore_characters`, `lore_locations`). Seasons, sources, and media should publish through the records that reference them unless a standalone publishing need appears later.

Do not add admin editing tables or draft tables here.

### 2. Add a base dataset abstraction

Add `lib/lore/base-dataset.ts` with a shared `LoreBaseDataset` shape containing events, characters, locations, seasons, sources, media, and a source marker (`database` or `static`).

Responsibilities:

- Build the static fallback dataset from `lib/lore/data/*`.
- Build indexes by id/slug for all entity types.
- Centralize sort order for events, characters, locations, and seasons.
- Validate duplicate ids/slugs and broken references before a DB dataset can be used.

Validation should catch event references to missing characters, locations, seasons, sources, and media; source references to missing media; location image/source references; character `firstAppearanceEventId`; and malformed canon paths.

### 3. Add the DB repository and fallback selector

Add `lib/repositories/lore-base-repository.ts` to load all `is_published = true` rows from the six base tables and map them into the existing lore domain types. This repository should not apply canonization overrides or community submissions.

Add `lib/lore/base-query.ts` to choose the active base source:

- `LORE_BASE_SOURCE=static`: always use static arrays.
- `LORE_BASE_SOURCE=auto`: try DB, validate it, and fall back to static once with a warning.

Default to `auto` during rollout. Keep the base dataset memoized per server request/render context when possible, with a short process-level cache only if profiling shows repeated full-table loads are expensive. The cache must be easy to bypass for tests, seed verification, and admin write validation.

### 4. Refactor effective-query around one context

Update `lib/lore/effective-query.ts` so it no longer imports base `loreCharacters`, `loreEvents`, `loreLocations`, `loreSources`, or `loreMedia` directly (`lib/lore/effective-query.ts:1-4`). Instead, load the active base dataset and build one effective context.

Preserve the existing exported helper behavior:

- `getAllEffectiveLoreEvents()`
- `getEffectiveArchiveItems()`
- `getEffectiveEventsForCharacter()`
- `getEffectiveEventsForLocation()`
- `getEffectiveSourcesForEvent()`
- `getEffectiveMediaForEvent()`

Add only the async helpers needed by current route call sites:

- effective character/location lookup by slug
- all effective characters/locations/seasons for archive/profile filters
- related entity resolution for event detail pages
- location source/media resolution

This also fixes repeated submission refetches in source/media helpers by resolving base records and adapted submission records from the same context.

### 5. Make write-side validation dataset-aware

`lib/lore/canonization-overrides.ts` currently validates event/source references against static data. Add a dataset-aware validator that checks the active base dataset while preserving the current static-compatible API.

Update write paths that need canonical lore references before public reads can cut over, including `lib/services/lore-canonization-service.ts` and `lib/services/lore-submission-service.ts`. DB-only base events should be valid targets for canonization and submission relationships once the base dataset is active.

### 6. Migrate public `/lore` routes atomically

Update the public lore routes together so they do not mix static and DB-backed reads:

- `app/lore/page.tsx`
- `app/lore/characters/[slug]/page.tsx`
- `app/lore/locations/[slug]/page.tsx`
- `app/lore/events/[slug]/page.tsx`
- `app/lore/community/[slug]/page.tsx`

The archive should load filters, items, seasons, locations, and characters from the effective/base helpers. Character and location pages should stop importing static entity/media/source helpers from `@/lib/lore`. Event detail pages should resolve related entities from the effective context instead of static `getRelatedEntitiesForEvent()`.

### 7. Audit remaining static lore consumers

Before turning on DB-backed reads, audit non-route consumers that import `@/lib/lore` or `@/lib/lore/data/*`, including `lib/services/lore-canonization-service.ts:1`, `lib/services/lore-submission-service.ts:3`, `app/admin/lore/submissions/[submissionId]/page.tsx:4`, `components/admin/lore-canonization/CanonizationPreview.tsx:3`, `components/lore/LoreTimeline.tsx:2`, and `components/lore/story-data.ts:11`.

For each consumer, choose one explicit outcome:

- migrate to the new async effective/base helpers in this phase;
- keep on `lib/lore/query.ts` as static compatibility with a comment explaining why; or
- move to a later plan if it is not part of public `/lore` correctness.

This prevents `query.ts` from becoming an accidental second source of truth.

### 8. Add seed and parity tooling

Add `scripts/lore/seed-base-lore.ts` to upsert current static arrays into the new base tables, preserving ids/slugs. It should not delete rows by default; an explicit prune/archive option can mark missing first-class records unpublished later.

Add one parity check, either as `scripts/lore/verify-base-lore-parity.ts` or as a Jest test against a seeded test DB. It should compare normalized static output against DB output and fail on missing/extra published rows, id/slug drift, broken references, or changed archive ordering.

### 9. Expand tests around the migration seam

Extend `tests/unit/lore-effective-query.test.ts` and add focused unit tests for the base dataset layer.

Required coverage:

- valid DB base data is used when selected
- invalid or unavailable DB data falls back to static in `auto`
- published canonization overrides still apply to DB-backed base events
- published submissions still merge into archive results
- source/media resolution combines base records and submission records
- related entity resolution works for DB-backed events
- slug/id collisions from submissions do not override base lore

## Implementation Progress

- [x] Item 1 — Foundation: schema, base dataset abstraction, repository, fallback selector, seed/parity tooling.
- [x] Item 2 — Composition and validation: effective-query context refactor plus dataset-aware write validation.
- [x] Item 3 — Public route migration, static-consumer audit, and test expansion.

## Rollout

1. Land schema, dataset utilities, repository, seed/parity tooling, and dataset-aware validation while `LORE_BASE_SOURCE=static` or `auto`.
2. Seed local Supabase from static arrays and run parity.
3. Refactor `effective-query.ts`, audit remaining static consumers, and migrate public `/lore` routes in one coordinated change.
4. Deploy with `LORE_BASE_SOURCE=auto` so static fallback protects production.
5. Seed production and run parity before treating DB as authoritative.
6. Keep static arrays for at least one release cycle as rollback data.

Rollback is an environment change: set `LORE_BASE_SOURCE=static`.

## Open Questions

None blocking. This plan deliberately chooses full read-only base-lore migration and defers CMS/admin editing.

## References

- `app/lore/page.tsx:19-36`
- `app/lore/characters/[slug]/page.tsx:4-13`
- `app/lore/locations/[slug]/page.tsx:4-12`
- `lib/lore/effective-query.ts:64-107`
- `lib/lore/query.ts:1-31`
- `lib/lore/query.ts:58-201`
- `lib/lore/types.ts:72-158`
- `tests/unit/lore-effective-query.test.ts:66-207`
- `supabase/migrations/20260509000000_create_lore_canonization_overrides.sql:4`
- `supabase/migrations/20260509010000_create_lore_submissions.sql:4`
- `docs/plans/admin-panel-workflows-2026-05-09.md`
- `docs/plans/community-lore-media-submissions-2026-05-09.md`
