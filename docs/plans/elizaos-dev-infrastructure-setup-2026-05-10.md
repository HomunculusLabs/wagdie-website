# ElizaOS Dev Infrastructure Setup: Plan

## Goal

Stand up the dev-server infrastructure required to run WAGDIE characters through the official ElizaOS service, then validate the WAGDIE app in `official` mode before promoting the same pattern to production.

Token `3157` is the approved mutable dev validation target. Production ownership and permission hardening remains a required promotion gate, not a blocker for dev validation.

## Decisions

- Use an actual dev deployment from this repo, not runbook-only validation.
- Use an environment-level switch: dev runs `ELIZA_INTEGRATION_MODE=official`; production stays `legacy` until dev passes.
- Do not add per-user feature flags for this wave.
- Keep all keys and wallet private keys in env/secrets management only. Do not commit or document raw secrets.
- Treat Docker Compose on the dev host as the default deployable artifact unless ops names a different container runtime before implementation starts.

## Background

- The ElizaOS service skeleton already exists under `services/elizaos/`; its Dockerfile starts the service on port `3001` with `DISABLE_WEB_UI=true` (`services/elizaos/Dockerfile:1-18`).
- The service registers Venice and WAGDIE knowledge plugins, validates startup env before `AgentServer.start()`, and requires service auth, knowledge ingestion token, server key, Venice key, and Postgres outside local mode (`services/elizaos/src/server.ts:20-57`, `services/elizaos/src/startup-env.ts:3-10`, `services/elizaos/src/startup-env.ts:83-103`).
- The app-side official mode is already configured through `ELIZA_INTEGRATION_MODE`, `ELIZAOS_BASE_URL`, `ELIZAOS_API_KEY`, and `ELIZAOS_HEALTH_PATH` (`lib/eliza/config.ts:11-18`, `lib/eliza/config.ts:118-123`, `lib/eliza/client.ts:55-62`).
- Dev validation tooling exists for service smoke, migration posture, and route parity (`scripts/elizaos-official-smoke.ts`, `scripts/validate-elizaos-migrations.ts`, `scripts/elizaos-route-parity.ts`, `docs/runbooks/elizaos-dev-validation.md`).
- The current infra gap is concrete: root `docker-compose.yml` has no ElizaOS service, env examples are incomplete for a full dev deployment, no provider-specific deploy artifact exists, and the dev database/rollback owner are not named.
- Token `3157` exists in static metadata and assets (`public/metadata/characters/3157.json:2-70`, `public/metadata/characters/manifest.json:28422-28426`) and can be used for explicit dev mutation checks.

## Preconditions Before Build

These must be answered before implementation starts because they change the first work item:

1. Confirm the dev runtime: Compose-on-host or a named managed container platform. If it is not Compose, Work Item 1 should produce the equivalent provider manifest instead of editing root Compose.
2. Name the dev WAGDIE Supabase target and DSN used by migration validation. Do not run migration validation against production.
3. Choose ElizaOS persistence: local Compose `elizaos-db` or a managed dev Postgres. Either way, keep it separate from WAGDIE Supabase.
4. Name the dev/prod rollback owner for environment flips.

## Approach

Use a dev-server-first deployment:

1. Add a long-running ElizaOS service and dedicated ElizaOS Postgres resource to the dev stack.
2. Wire the ElizaOS service with server-side secrets only.
3. Validate ElizaOS directly while the WAGDIE app still runs `legacy`.
4. Switch the WAGDIE dev app to `official`, pointed at the dev ElizaOS service.
5. Run WAGDIE route parity against token `3157`, including mutation checks.
6. Promote to production only after dev passes and the production hardening gates in Work Item 7 are closed.

## Implementation Progress

- 2026-05-10: Work Items 1-3 implemented for the Compose-on-dev-host default. Root Compose now defines `elizaos` plus dedicated `elizaos-db` Postgres, app-to-service internal URL wiring, service healthcheck/restart behavior, and persistent volumes. Env examples document the `ELIZAOS_API_KEY` ⇄ `ELIZA_SERVER_AUTH_TOKEN` mapping and keep Venice/provider secrets service-side. Migration validation now requires an explicit non-production target label and can enforce an expected dev Supabase project ref.
- Remaining unknowns to fill in the host secret store/runbook before live validation: exact dev Supabase project ref/DSN and named rollback owner.
- Local readiness note: `cd services/elizaos && bun run typecheck` requires service dependencies to be installed first (`bun install --frozen-lockfile`). The Compose/Docker runtime path installs dependencies during image build from `services/elizaos/bun.lock`.

## Work Items

### 1. Add the dev ElizaOS runtime and persistence artifact

- **Owner surface:** ops/service/db.
- **Files:** `docker-compose.yml`, `services/elizaos/Dockerfile`, `services/elizaos/package.json`, `services/elizaos/README.md`.
- **Objective:** make the dev server able to run ElizaOS as a separate long-running service from this repo.
- **Plan:** add `elizaos` and `elizaos-db` services, persistent DB volume, service healthcheck, restart policy, and network wiring. If the app runs inside Compose, `ELIZAOS_BASE_URL` should be `http://elizaos:3001`; if validation runs from a host shell, expose a host URL for smoke scripts.
- **Decision gate:** if the dev host is not Compose-based, replace this with the equivalent provider manifest before continuing.
- **Exit criteria:** the dev host can build and start ElizaOS from `services/elizaos/Dockerfile`; `/api/server/health` is reachable; ElizaOS agents/sessions/memories survive service restart.

### 2. Lock down the dev env/secrets contract

- **Owner surface:** ops/app/service.
- **Files:** `.env.example`, `.env.docker`, `services/elizaos/.env.example`, deployment secret store.
- **Objective:** define the exact env required for dev without committing secrets.
- **Plan:** document and provision app env (`ELIZA_INTEGRATION_MODE=official`, `ELIZAOS_BASE_URL`, `ELIZAOS_API_KEY`, `ELIZAOS_HEALTH_PATH`) and service env (`ELIZA_SERVER_AUTH_TOKEN`, `WAGDIE_KNOWLEDGE_INGESTION_TOKEN`, `SERVER_API_KEY`, `VENICE_API_KEY`, `DATABASE_URL`/`POSTGRES_URL`).
- **Secret mapping:**

  | App/runtime value | Must map to | Purpose |
  |---|---|---|
  | `ELIZAOS_API_KEY` | `ELIZA_SERVER_AUTH_TOKEN` | WAGDIE app authenticates to ElizaOS service. |
  | `SERVER_API_KEY` | separate service secret | ElizaOS runtime/server API key; do not reuse in the app unless the service explicitly requires it. |
  | `WAGDIE_KNOWLEDGE_INGESTION_TOKEN` | separate ingestion secret | Service/plugin ingestion guard and smoke tooling. |
  | `VENICE_API_KEY` | Venice secret, service-only | Model/provider calls; never expose to Next.js/browser. |

- **Exit criteria:** dev secrets exist in the host secret store; no raw API keys or wallet private keys are committed; startup fails closed when required hosted env is missing.

### 3. Validate WAGDIE Supabase migration posture in dev

- **Owner surface:** db/app.
- **Files:** `supabase/migrations/20260510000000_create_eliza_persona_migration_links.sql`, `supabase/migrations/20260510010000_create_eliza_knowledge_sync_states.sql`, `supabase/migrations/20260510020000_create_eliza_official_conversation_links.sql`, `scripts/validate-elizaos-migrations.ts`.
- **Objective:** prove WAGDIE-side link/state tables are present and server-only writable.
- **Plan:** apply missing migrations to the named dev WAGDIE Supabase using the project’s existing migration path, then run `bun run elizaos:db:validate` with `SUPABASE_DB_URL`, `SUPABASE_URL`, service-role key, and anon key for that dev target.
- **Decision gate:** official mode cannot be enabled if any migration table, RLS posture, trigger, or service-role write path fails validation.
- **Exit criteria:** migration validation passes in dev.

### 4. Run direct ElizaOS service smoke in dev

- **Owner surface:** service/QA.
- **Files:** `scripts/elizaos-official-smoke.ts`, `docs/runbooks/elizaos-dev-validation.md`.
- **Objective:** validate the hosted ElizaOS service before WAGDIE depends on it.
- **Plan:** run the fresh smoke pass, restart only ElizaOS, then run the post-restart smoke pass.
- **Decision gate:** provider-backed chat may not be skipped for promotion readiness; skipped chat is acceptable only for intermediate infrastructure debugging.
- **Exit criteria:** health, service auth reject/accept, agent create/update, SSE, knowledge index/delete, and restart persistence checks pass.

### 5. Switch WAGDIE dev app to official mode

- **Owner surface:** app/ops.
- **Files:** app deployment env, `lib/eliza/config.ts`, `lib/eliza/client.ts`.
- **Objective:** make the dev app route `/api/eliza/*` through official ElizaOS while preserving browser-facing contracts.
- **Plan:** set dev app `ELIZA_INTEGRATION_MODE=official`, point `ELIZAOS_BASE_URL` at the dev ElizaOS service, and restart/redeploy the app.
- **Decision gate:** assume env changes require restart/redeploy unless the host proves runtime env mutation.
- **Exit criteria:** dev app health passes and official client initialization succeeds without exposing ElizaOS credentials to the browser.

### 6. Run WAGDIE route parity with token `3157`

- **Owner surface:** app/QA.
- **Files:** `scripts/elizaos-route-parity.ts`, `docs/runbooks/elizaos-dev-validation.md`.
- **Objective:** prove user-facing auth, editing, chat, conversations, and knowledge workflows work in official mode.
- **Plan:** run `bun run elizaos:routes:validate` against the dev app with `WAGDIE_ROUTE_PARITY_TOKEN_ID=3157`, mutation checks enabled, and the test wallet private key supplied only via env.
- **Decision gate:** token `3157` is approved for dev mutation; production ownership policy still needs hardening before prod promotion.
- **Exit criteria:** nonce/verify, unauthorized 401 shape, character read/export, character PUT/import, knowledge upload/get/delete, chat SSE `token|complete|error`, conversation list/get/delete, and cross-wallet isolation all pass.

### 7. Close production gates before promotion

- **Owner surface:** app/service/db/ops.
- **Files:** `docs/plans/elizaos-cutover-remaining-work-2026-05-10.md`, route permission surfaces, deployment runbooks.
- **Objective:** prevent a dev-only success from becoming an unsafe production cutover.
- **Plan:** name rollback owner, validate prod migrations and production ElizaOS service, verify legacy rollback, and close permission gaps found during seam mapping.
- **Required hardening:** align Eliza character PUT with WAGDIE owner/staker/admin semantics; review Eliza import and knowledge mutation routes for explicit ownership/admin gates; keep dev and prod ElizaOS/Postgres/Supabase resources separate.
- **Decision gate:** no production switch until ownership hardening is complete for mutation routes and rollback is tested.
- **Exit criteria:** production can be switched to `official` and rolled back to `legacy` with known owner, known command/path, and measured rollback time.

## Validation Sequence

1. **Before dev deploy:** run local/unit regression tests that do not require a live ElizaOS service: Eliza auth, chat contract, conversations, knowledge sync, official client, and startup env validation.
2. **Service-only dev smoke:** run `bun run elizaos:smoke` against ElizaOS, restart ElizaOS only, then run `bun run elizaos:smoke:post-restart`.
3. **WAGDIE dev official mode:** redeploy/restart the app with `ELIZA_INTEGRATION_MODE=official`.
4. **Route parity:** run `bun run elizaos:routes:validate` against dev with token `3157` and mutation confirmation enabled.
5. **Manual user path:** edit token `3157` through the app UI and chat with it through the app UI.
6. **Promotion review:** compare results against Work Item 7 before touching production.

## Rollout and Rollback

- **Dev rollout:** deploy ElizaOS first while WAGDIE remains `legacy`; switch WAGDIE dev to `official` only after direct service smoke passes.
- **Production rollout:** deploy production ElizaOS while production WAGDIE remains `legacy`; run non-destructive smoke; switch production app env to `official` only after dev route parity, prod service smoke, migration validation, and rollback drill pass.
- **Rollback trigger:** broken SSE contract, cross-wallet access, sustained official service outage, systematic knowledge invalidation failure, provider/secret leakage, mapping DB write failure, or elevated `/api/eliza/*` 5xx rate.
- **Rollback action:** set production `ELIZA_INTEGRATION_MODE=legacy`, restart/redeploy WAGDIE, leave ElizaOS data and mapping rows intact for analysis, then verify legacy chat and character paths.

## Observability

For the dev milestone, track only the signals needed to decide whether to proceed:

- ElizaOS `/api/server/health` status.
- ElizaOS container restart count.
- WAGDIE `/api/eliza/chat` 5xx/error rate.

Production dashboards and latency SLOs belong in the production cutover work after dev validation succeeds.

## Non-goals

- Do not remove the legacy/custom Eliza path in this wave.
- Do not change browser-facing `/api/eliza/*` contracts.
- Do not commit secrets or wallet private keys.

## Implementation Status

- [x] Work Items 1-2: Compose dev runtime, ElizaOS Postgres persistence, service healthcheck, and env/secret mapping artifacts are in place.
- [x] Work Item 3: migration validation target safety and runbook instructions are in place; live validation still needs dev Supabase credentials.
- [ ] Work Item 4: direct ElizaOS service smoke requires live dev secrets and Venice API key.
- [ ] Work Item 5: WAGDIE dev app official-mode switch requires deployed dev service.
- [ ] Work Item 6: route parity with token `3157` requires WAGDIE dev URL and the approved test wallet private key via env.
- [x] Work Item 7 code hardening: mutating character/import/knowledge routes now use shared owner/staker/admin authorization; production rollout still requires live rollback ownership.

## Open Questions

- Which exact dev runtime will host ElizaOS: Compose-on-host or a named managed container platform?
- Which exact dev WAGDIE Supabase target should migration validation use?
- Who is the named rollback owner for dev and production environment flips?

## References

- Current cutover plan: `docs/plans/elizaos-cutover-remaining-work-2026-05-10.md`
- Official package migration plan: `docs/plans/official-eliza-package-migration-2026-05-10.md`
- Dev validation runbook: `docs/runbooks/elizaos-dev-validation.md`
- ElizaOS service skeleton: `services/elizaos/`
- ElizaOS health endpoint docs: https://docs.elizaos.ai/rest-reference/system/health-check-endpoint
- ElizaOS environment docs: https://docs.elizaos.ai/projects/environment-variables
- Venice plugin package: https://www.npmjs.com/package/@elizaos/plugin-venice
