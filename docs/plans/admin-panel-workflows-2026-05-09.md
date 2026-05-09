# Admin Panel Workflows Plan

## Goal

Build a unified `/admin` surface for three operational workflows:

1. Concord searing mappings.
2. Map location pins.
3. Lore canonization progression.

The plan should consolidate existing editor/admin behavior first, then add canonization administration without forcing a full lore-data migration.

## Background

Existing admin surfaces are split across specialized routes:

- `/map-editor` gates `MapEditorContainer` with `AdminGate` (`app/map-editor/page.tsx:8-15`).
- `/searing-map-editor` gates `SearingMapEditorContainer` with the same gate pattern (`app/searing-map-editor/page.tsx:3-15`).
- Admin identity is wallet-list based in `lib/auth/admin.ts:7-24`; mutating APIs also call `requireAdmin`, e.g. searing map writes (`app/api/concords/searing-map/route.ts:71-89`) and location writes (`app/api/locations/route.ts:31-49`).

Two workflows already have persistence and working editor stacks:

- Searing mappings flow through `/api/concords/searing-map`, `parseConcordSearingMapUpsert`, `concordSearingMapService`, and `concordSearingMapRepository` (`app/api/concords/searing-map/route.ts:30-90`, `app/api/concords/searing-map/[concordId]/route.ts:24-76`).
- Map pins flow through `/api/locations`, `LocationService`, `LocationRepository`, and map-editor hooks/forms (`app/api/locations/route.ts:22-49`, `app/api/locations/[id]/route.ts:43-79`). Pin position is stored in location metadata and normalized before persistence/rendering.

Canonization is different: it is currently curated static lore data. Stages and progress live in `lib/lore/canonization.ts:30-187`; static event canon state lives in `lib/lore/data/events.ts`; consistency checks live in `lib/lore/validate.ts:66-114`.

## Approach

### 1. Add a lightweight admin shell

Create the preferred admin routes:

- `/admin`
- `/admin/searing-map`
- `/admin/map-locations`
- `/admin/lore-canonization`

Add only the shared pieces needed now:

- `components/admin/AdminGate.tsx`
- `components/admin/AdminShell.tsx`
- `components/admin/AdminNav.tsx`

Do not add dashboard summary widgets yet. Three section links do not justify extra dashboard infrastructure.

Move the editor experience into `/admin/*`. Keep `/map-editor` and `/searing-map-editor` only as compatibility redirects to `/admin/map-locations` and `/admin/searing-map` after the admin routes are stable.

### 2. Reuse existing searing and map editors

Mount existing containers inside the admin shell:

- `/admin/searing-map` renders `SearingMapEditorContainer`.
- `/admin/map-locations` renders `MapEditorContainer`.

Do not rewrite their data flows. Their existing APIs, validation, Phaser bridge, and service/repository paths are already the stable seams.

### 3. Add canonization admin as a database-backed override workflow

A deployed admin UI cannot edit `lib/lore/data/events.ts`. Add a narrow Supabase table for canonization overrides instead of moving the whole lore archive into the database.

The override changes the complete `event.canon` object for a specific event:

- `status`
- `stageId`
- `note`
- `path`

Static lore remains the fallback. If an override is deleted, the event returns to its static canonization state.

### 4. Keep public lore integration as a deliberate publish decision

Canonization changes should be editable as drafts in admin, then explicitly published by an admin. Public lore pages should read only the static state plus the latest published override. Unpublished drafts remain admin-only.

## Work Items

### 1. Shared admin shell

**Goal:** Introduce a consistent admin frame without changing existing editor behavior.

**Files/modules:**

- `app/admin/page.tsx`
- `components/admin/AdminGate.tsx`
- `components/admin/AdminShell.tsx`
- `components/admin/AdminNav.tsx`
- `components/map-editor/AdminGate.tsx`

**Details:**

- Move or wrap the existing `AdminGate` into `components/admin/AdminGate.tsx`.
- Preserve `components/map-editor/AdminGate.tsx` as a compatibility re-export or unchanged wrapper.
- Keep wallet-list authorization for this phase.
- Keep server-side `requireAdmin` as the real write boundary.

**Done when:**

- `/admin` renders section navigation for admin wallets.
- Non-admins are blocked by the gate.
- Existing `/map-editor` and `/searing-map-editor` redirect to the matching `/admin/*` section after the new routes are stable.

### 2. Searing map admin section

**Goal:** Expose existing Concord searing map CRUD inside `/admin`.

**Files/modules:**

- `app/admin/searing-map/page.tsx`
- `components/searing-map-editor/SearingMapEditorContainer.tsx`
- Existing APIs under `app/api/concords/searing-map/*`

**Details:**

- Render `SearingMapEditorContainer` inside `AdminShell`.
- Avoid API contract changes.
- Keep character searing preview/sync outside this CRUD workflow; those belong to the materialization pipeline (`app/api/characters/[tokenId]/searing/preview/route.ts`, `app/api/characters/[tokenId]/searing/sync/route.ts`, `lib/services/searing-materialization-service.ts`).

**Done when:**

- Admins can list, create, update, and delete searing map entries from `/admin/searing-map`.
- `/searing-map-editor` redirects to `/admin/searing-map` once the admin route is stable.

### 3. Map location pin admin section

**Goal:** Expose existing map location editing inside `/admin`.

**Files/modules:**

- `app/admin/map-locations/page.tsx`
- `components/map-editor/MapEditorContainer.tsx`
- `hooks/map/editor/*`
- Existing APIs under `app/api/locations/*`

**Details:**

- Render `MapEditorContainer` inside `AdminShell`.
- Preserve click-to-create, move-existing, edit-existing, delete, marker drag/click bridge, and coordinate normalization.
- Keep all writes behind `LocationService`; do not bypass location validation or repository metadata normalization.

**Done when:**

- Admins can perform the same map-editor operations from `/admin/map-locations`.
- `/map-editor` redirects to `/admin/map-locations` once the admin route is stable.

### 4. Canonization override persistence

**Goal:** Make canonization progression editable as admin drafts and publishable at runtime while preserving static lore as fallback.

**Files/modules:**

- `supabase/migrations/*_create_lore_canonization_overrides.sql`
- `lib/lore/canonization-overrides.ts`
- `lib/repositories/lore-canonization-repository.ts`
- `lib/services/lore-canonization-service.ts`

**Schema:**

`lore_canonization_overrides`

- `event_id text primary key`
- `status text not null`
- `stage_id text not null`
- `note text null`
- `path jsonb not null default '[]'::jsonb`
- `publication_status text not null default 'draft'` (`draft` or `published`)
- `updated_by text not null`
- `published_by text null`
- `published_at timestamptz null`
- `updated_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`

`updated_by` is the admin wallet address for this phase. Do not block this work on role-record auth.

**Validation:**

- `event_id` must exist in static lore events.
- `status` and `stage_id` must be compatible with `lib/lore/canonization.ts` rules.
- `path` must contain exactly one current step.
- Current step stage must match `stage_id`.
- Referenced source IDs must exist.

**Done when:**

- The service can return static canonization plus draft/published override metadata.
- Invalid override states are rejected before persistence.
- Publishing an override records `published_by` and `published_at`.
- Deleting an override restores static canonization.

### 5. Canonization admin API

**Goal:** Expose admin-only endpoints for canonization override management.

**Files/modules:**

- `app/api/admin/lore/canonization/route.ts`
- `app/api/admin/lore/canonization/[eventId]/route.ts`
- `lib/services/lore-canonization-service.ts`

**Endpoints:**

- `GET /api/admin/lore/canonization`
  - returns all lore events with static canon, draft override, published override, and metadata.
- `PATCH /api/admin/lore/canonization/[eventId]`
  - upserts a draft override after validation.
- `POST /api/admin/lore/canonization/[eventId]/publish`
  - validates and marks the current draft override as published.
- `DELETE /api/admin/lore/canonization/[eventId]`
  - deletes override and falls back to static canonization.

`PATCH` is the create/update draft operation. Publish is explicit and separate.

**Done when:**

- All endpoints require `requireAdmin`.
- Save/reset behavior is deterministic and test-covered.

### 6. Canonization admin UI

**Goal:** Provide a previewable editor for canonization progression.

**Files/modules:**

- `app/admin/lore-canonization/page.tsx`
- `components/admin/lore-canonization/LoreCanonizationAdminContainer.tsx`
- `components/admin/lore-canonization/CanonizationEventList.tsx`
- `components/admin/lore-canonization/CanonizationEditor.tsx`
- `components/admin/lore-canonization/CanonizationPreview.tsx`
- Existing `components/lore/CanonizationPath.tsx`
- Existing `components/lore/CanonWorkflowSummary.tsx`

**Details:**

- Event list filters: kind, status, stage, has override, keyword.
- Editor fields: status, stage, note, path steps, source IDs.
- Preview uses the same public lore components to avoid divergent display logic.
- Include save draft, publish, and reset-to-static actions.

**Done when:**

- Admins can select an event, edit canonization state, preview it, save a draft, publish it, and reset it.
- Validation errors are visible without losing draft changes.
- Public state does not change until publish.

### 7. Published public effective-query layer

**Goal:** Publish admin-approved canonization overrides to public lore pages only after explicit publish.

**Files/modules:**

- `lib/lore/effective-query.ts`
- Candidate public lore routes:
  - `app/lore/page.tsx`
  - `app/lore/events/[slug]/page.tsx`
  - `app/lore/community/[slug]/page.tsx`
  - `app/lore/characters/[slug]/page.tsx`
  - `app/lore/locations/[slug]/page.tsx`

**Details:**

- Start from static query results.
- Fetch published canonization overrides server-side.
- Replace only `event.canon` where a published override exists.
- Ignore draft overrides in public reads.
- Keep static query helpers pure and testable.

**Done when:**

- Published overrides appear on public lore pages.
- Draft overrides do not appear publicly.
- Deleting an override restores static canonization display.

### 8. Verification and tests

**Goal:** Prove admin consolidation did not break existing workflows and canonization writes are safe.

**Test targets:**

- Admin gate rendering and blocked states.
- `/admin/searing-map` mounts existing editor successfully.
- `/admin/map-locations` mounts existing editor successfully.
- `/api/admin/lore/canonization` auth, validation, save, and reset.
- `lore-canonization-service` static/override merge behavior.
- Effective-query fallback, draft isolation, and published override behavior.

**Commands:**

- `bun run test -- tests/unit/lore-domain.test.ts --runInBand`
- focused API/service tests for new admin endpoints
- `NEXT_TELEMETRY_DISABLED=1 bun run build`

## Decisions

- Canonization edits are drafts until an admin explicitly publishes them.
- Public lore pages only consume published canonization overrides.
- `/map-editor` and `/searing-map-editor` become compatibility redirects into `/admin/map-locations` and `/admin/searing-map` after the admin routes are stable.

## Open Questions

None blocking this plan.

## References

- `app/map-editor/page.tsx:8-15`
- `app/searing-map-editor/page.tsx:3-15`
- `lib/auth/admin.ts:7-24`
- `app/api/concords/searing-map/route.ts:30-90`
- `app/api/concords/searing-map/[concordId]/route.ts:24-76`
- `app/api/locations/route.ts:22-49`
- `app/api/locations/[id]/route.ts:43-79`
- `lib/lore/canonization.ts:30-187`
- `lib/lore/validate.ts:66-114`
