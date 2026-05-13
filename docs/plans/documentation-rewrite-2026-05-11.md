# Documentation Rewrite Plan

## Goal
Rewrite WAGDIE Simplified's documentation into a small, durable docs system that lets a new contributor answer three questions quickly:

1. How do I run and verify the app?
2. How is the current system put together?
3. Which docs are current guidance versus historical records?

The rewrite should reduce top-level sprawl, make `docs/` the canonical documentation home, and preserve stable compatibility pointers for old entry points.

## Background
The current docs are useful but overlapping and unevenly current:

- `README.md` is doing too much: capabilities, tech stack, quick start, full setup, command inventory, routes, API areas, project structure, architecture notes, testing, deployment, docs index, and contributing guidance (`README.md:1-218`).
- `SETUP.md` duplicates onboarding/setup material and still includes older Supabase setup language that does not represent the app's expanded schema and domain surface (`SETUP.md:25-120`).
- Runtime and command truth are split across `.nvmrc:1`, `package.json:5-36`, and repository guidance: Node is pinned to `23.3.0`; Bun is the preferred package-runner; exact script inventory belongs in `package.json`.
- Storybook docs should be rewritten from actual config: Vite/`@storybook/react-vite`, story globs, addons, aliases, and mocks in `.storybook/main.ts:1-70`; providers, Wagmi/React Query/MSW setup, backgrounds, and `mockState` toolbar in `.storybook/preview.tsx:1-134`.
- Architecture docs need to reflect real seams. The map page dynamically imports the Phaser bridge and wires map hooks/state (`app/map/page.tsx:1-70`); `game/PhaserGame.tsx` owns Phaser lifecycle and EventBus subscriptions (`game/PhaserGame.tsx:1-125`); `game/EventBus.ts` defines the typed React↔Phaser event contract (`game/EventBus.ts:1-201`).
- Eliza docs should describe durable route/gateway contracts, not copy migration plans. The chat route preserves the browser SSE contract while gating through session/auth, character lookup, resolver, and gateway layers (`app/api/eliza/chat/route.ts:1-130`); the server client switches between legacy/custom and official modes in `lib/eliza/client.ts:1-114`.
- `docs/` mixes evergreen references, runbooks, investigations, plans, reviews, audits, completion reports, and archive material. There is no `docs/README.md` lifecycle map.

## Decisions
- `docs/` becomes the canonical home for durable documentation.
- `README.md` stays as a short project portal, not the full manual.
- `SETUP.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and `STORYBOOK-QUICKSTART.md` become permanent compatibility pointers after their durable content moves.
- A compatibility pointer is one short banner, one sentence naming the replacement doc, and one link. Do not keep duplicate procedural content in pointer files.
- `package.json`, `.storybook/*`, `supabase/migrations/`, `app/api/*`, and relevant subsystem code remain source of truth; docs summarize and link to them.
- Plans, reviews, investigations, and archives are time-bound records unless promoted into evergreen docs.
- Use lifecycle headers on runbook and historical index pages where currency is the reader's main question; do not require them on every evergreen onboarding/architecture page.

## Approach
Rewrite by authority boundary: onboarding first, then architecture, development, operations, reference, and historical indexes. Before writing prose, lock the command policy in `docs/README.md`: examples are Bun-first, Node `23.3.0` is mandatory, and exact scripts defer to `package.json`.

Recommended lifecycle header for runbook and historical index pages:

```md
> Lifecycle: Runbook | Historical
> Last validated: YYYY-MM-DD
> Canonical sources: package.json, .storybook/main.ts, app/api/*
```

Classification rule: if a document describes a one-time change and that change has merged or been superseded, it is historical. If it describes a repeatable operational procedure, it is a runbook. If it describes current architecture or contributor workflow, promote the durable facts into evergreen docs instead of linking the dated record as current guidance.

## Target Documentation Structure

```text
README.md                         Short portal: what this is, fastest start, docs map
SETUP.md                          Compatibility pointer to docs/onboarding/*
ARCHITECTURE.md                   Compatibility pointer to docs/architecture/overview.md
DESIGN_SYSTEM.md                  Compatibility pointer to docs/development/design-system.md
STORYBOOK-QUICKSTART.md           Compatibility pointer to docs/development/storybook.md

docs/
  README.md                       Docs index, lifecycle policy, source-of-truth rules
  storybook-guide.md              Compatibility pointer or archive candidate

  onboarding/
    quickstart.md                 UI-dev quickstart using deployed API proxy
    local-development.md          Full local setup, Supabase, env, migrations
    environment.md                Env var families by workflow/environment
    troubleshooting.md            Common setup/runtime failures

  architecture/
    overview.md                   System map: App Router, API, data, auth, scripts, tests
    map-and-phaser.md             React↔Phaser bridge, EventBus, map scene
    eliza-and-backend.md          API route pattern, Supabase/service layers, Eliza gateway

  development/
    design-system.md              Visual/component conventions
    components.md                 Component ownership, naming, story/test expectations
    storybook.md                  Vite Storybook, providers, mocks, MSW, globals
    testing.md                    Jest, Storybook, subsystem validation guidance

  operations/
    deployment.md                 Vercel/env/deploy expectations
    data-sync-and-assets.md       Import, sync, image, searing, lore workflows
    elizaos-validation.md         Curated operational runbook or pointer

  reference/
    routes-and-apis.md            Maintained route/API area index

  plans/README.md                 Plan lifecycle/status policy, then inventory
  reviews/README.md               Review lifecycle/status policy, then inventory
  investigations/README.md        Investigation lifecycle/status policy, then inventory
  runbooks/README.md              Runbook validation policy, then inventory
  archive/README.md               Historical/immutable material index
```

`components/README.md` remains adjacent to code but should shrink to local notes and point to `docs/development/components.md`.

## Content Requirements

### Onboarding
- Keep `README.md` short: project summary, capabilities, Node/Bun expectation, fastest UI-only start, link to `docs/README.md`, and contributing pointers.
- Move detailed setup out of `README.md`/`SETUP.md` into `docs/onboarding/*`.
- Preserve the deployed API proxy quickstart from `README.md:41-70` and `SETUP.md:25-52`.
- Full setup should reference `supabase/migrations/` as schema truth; do not hardcode table counts.
- Show only common commands, then point to `package.json:8-36` for the full inventory.

### Architecture
- `overview.md` should give the current system map: Next.js App Router, API routes, React components, Supabase/Postgres, blockchain/SIWE, scripts, and tests.
- `map-and-phaser.md` should document the React↔Phaser boundary: `app/map/page.tsx:22-70` → `game/PhaserGame.tsx:64-118` → `game/EventBus.ts:166-199` ↔ `game/scenes/MapScene.ts`.
- `eliza-and-backend.md` should cover the representative route-handler/service/gateway pattern, using `/api/eliza/chat` as the main example (`app/api/eliza/chat/route.ts:44-130`) and `lib/eliza/client.ts:1-114` for gateway mode selection.
- Keep data/persistence and blockchain/auth as sections in `overview.md` unless they grow enough to justify dedicated pages later.

### Development
- Replace `STORYBOOK-QUICKSTART.md` and `docs/storybook-guide.md` with one `docs/development/storybook.md` grounded in `.storybook/main.ts` and `.storybook/preview.tsx`.
- Do not document exact story counts unless generated by a command.
- Move durable design guidance from `DESIGN_SYSTEM.md` into `docs/development/design-system.md`.
- Update or shorten `components/README.md`; it should point to `docs/development/components.md` and only keep local component-folder notes that are truly adjacent to code.
- `testing.md` should explain when to run Jest, Storybook, build, and subsystem validation scripts without duplicating every command.

### Operations and Reference
- Split operational procedures from architecture. Deployment, sync jobs, asset imports, searing materialization, lore seed/parity, and Eliza validation belong under `docs/operations/`.
- `docs/reference/routes-and-apis.md` should be an index of route/API areas, not per-route generated docs.
- Do not create a separate scripts reference page. Fold any necessary script categories into onboarding or operations docs and defer exact names to `package.json`.

### Historical Material
- Inventory existing dated or report-style docs before writing detailed historical indexes.
- Mark plans/reviews/investigations as time-bound. They may inform evergreen docs, but should not be linked as current behavior without a dated caveat.
- Keep existing Eliza migration plans and critiques as historical planning records; promote only durable facts into `docs/architecture/eliza-and-backend.md` and `docs/operations/elizaos-validation.md`.

## Work Items

1. **Create the docs policy and command/stub rules**
   - Add `docs/README.md` with the target IA, lifecycle definitions, source-of-truth rules, Bun-first command policy, and compatibility-pointer format.
   - Exit criteria: writers know how to format stubs, how to classify docs, and where command truth lives before rewriting prose.

2. **Inventory and classify existing docs**
   - Inventory root-level `docs/*.md`, `docs/plans`, `docs/reviews`, `docs/investigations`, `docs/runbooks`, and `docs/archive`.
   - Classify each as evergreen candidate, runbook, historical, archive, or superseded using the rule above.
   - Add or update category README files with lifecycle policy first; enumerate files only after inventory.
   - Exit criteria: historical reports cannot be mistaken for current guidance.

3. **Rewrite onboarding and top-level entry points**
   - Reduce `README.md` to a portal.
   - Move detailed setup into `docs/onboarding/quickstart.md`, `local-development.md`, `environment.md`, and `troubleshooting.md`.
   - Convert `SETUP.md` to the standard compatibility pointer.
   - Exit criteria: no duplicated full setup path across `README.md` and `SETUP.md`; no obsolete hardcoded Supabase table checklist.

4. **Rewrite architecture docs around real seams**
   - Convert `ARCHITECTURE.md` to the standard compatibility pointer.
   - Create `docs/architecture/overview.md`, `map-and-phaser.md`, and `eliza-and-backend.md`.
   - Exit criteria: the map and Eliza/backend flows can be understood from docs using the actual file refs above.

5. **Consolidate developer docs**
   - Move durable design guidance into `docs/development/design-system.md`; convert `DESIGN_SYSTEM.md` to a pointer.
   - Create `docs/development/components.md` and update `components/README.md` to avoid stale tree examples.
   - Replace Storybook docs with one config-grounded `docs/development/storybook.md`; convert `STORYBOOK-QUICKSTART.md` and `docs/storybook-guide.md` to pointers or archive candidates based on the inventory.
   - Add `docs/development/testing.md`.
   - Exit criteria: Storybook docs match `.storybook/main.ts`/`preview.tsx`; examples are Bun-first unless they intentionally invoke `npx` inside a package script.

6. **Add operations and route reference pages**
   - Create deployment, data-sync/assets, and ElizaOS validation pages under `docs/operations/`.
   - Create `docs/reference/routes-and-apis.md`.
   - Exit criteria: operational procedures are not mixed into architecture pages, and script details defer to canonical sources.

7. **Final consistency pass**
   - Verify all command, Storybook, schema, runtime, and compatibility-link claims against canonical sources before merge.

## Orchestration Progress
- [x] Item A — Docs policy, command/stub rules, and historical inventory/indexes
- [x] Item B — Onboarding docs and top-level README/SETUP entry points
- [x] Item C — Architecture docs and ARCHITECTURE pointer
- [x] Item D — Developer, operations, and route-reference docs
- [x] Final verification — command, Storybook, schema, runtime, and compatibility-link claims

## Risks and Guardrails

- **Link breakage:** keep permanent top-level compatibility pointers for old entry points.
- **Command drift:** keep command examples minimal and point to `package.json` for complete scripts.
- **Schema drift:** reference `supabase/migrations/`; avoid table-count checklists.
- **Storybook drift:** cite config files as source of truth; never hardcode story counts.
- **Historical confusion:** every plan/review/investigation index should say records are dated and may not describe current behavior.
- **Over-planning:** do not write exhaustive API docs. Favor route-area indexes and file refs over generated dumps.

## Open Questions
- Which root-level `docs/*.md` reports should move to `docs/archive/` versus remain indexed in place? Decide during Work Item 2 after inventory.

## References
- `.nvmrc:1`
- `README.md:1-218`
- `SETUP.md:25-120`
- `package.json:5-36`
- `.storybook/main.ts:1-70`
- `.storybook/preview.tsx:1-134`
- `app/map/page.tsx:1-70`
- `game/PhaserGame.tsx:1-125`
- `game/EventBus.ts:1-201`
- `app/api/eliza/chat/route.ts:1-130`
- `lib/eliza/client.ts:1-114`
- `docs/plans/eliza-package-migration-2026-05-10.md`
- `docs/plans/official-eliza-package-migration-2026-05-10.md`
- `docs/reviews/official-eliza-package-migration-critique-2026-05-10.md`
- `docs/reviews/documentation-rewrite-critique-2026-05-11.md`
- `docs/runbooks/elizaos-dev-validation.md`
