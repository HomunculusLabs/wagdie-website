# ElizaOS Dev Validation Runbook

This runbook is for the dev-server validation path in `docs/plans/elizaos-dev-infrastructure-setup-2026-05-10.md` and the remaining cutover gates in `docs/plans/elizaos-cutover-remaining-work-2026-05-10.md`.
It prepares live validation against a deployed dev target without hardcoding secrets.
Do not run it against production until the dev-server pass is complete and the promotion gate is approved.

## Dev target assumptions

- Runtime: Docker Compose on the dev host, using root `docker-compose.yml`, unless ops replaces it with an equivalent provider manifest.
- ElizaOS service URL from host shell: `http://localhost:3001`.
- ElizaOS service URL from the WAGDIE app container: `http://elizaos:3001`.
- WAGDIE Supabase migration validation target label: `dev` via `ELIZA_DB_VALIDATION_TARGET_ENV=dev`.
- WAGDIE Supabase project ref: not committed here. If known, set `ELIZA_DB_VALIDATION_EXPECT_SUPABASE_REF=<dev-project-ref>` so validation refuses mismatched URLs.
- Approved mutable route-parity token: `3157` for dev validation only.

## Dev Compose service startup

Keep service-side secrets in the dev host secret store or an untracked root `.env` consumed by Compose. Do not put `VENICE_API_KEY`, `SERVER_API_KEY`, or `WAGDIE_KNOWLEDGE_INGESTION_TOKEN` in `.env.docker`, because `.env.docker` is also loaded by the WAGDIE app container.

Required Compose secret/env contract:

```bash
export ELIZA_POSTGRES_USER="elizaos"
export ELIZA_POSTGRES_PASSWORD="<elizaos-postgres-password>"
export ELIZA_POSTGRES_DB="elizaos"
export ELIZA_SERVER_AUTH_TOKEN="<long-random-service-auth-token>"
export WAGDIE_KNOWLEDGE_INGESTION_TOKEN="<separate-long-random-ingestion-token>"
export SERVER_API_KEY="<separate-elizaos-runtime-secret>"
export VENICE_API_KEY="<venice-provider-key>"
```

Start and validate the service artifact:

```bash
docker compose up -d elizaos-db elizaos
curl -fsS http://localhost:3001/api/server/health
```

When starting the WAGDIE app in Compose during Work Items 1-4, root `docker-compose.yml` keeps `ELIZA_INTEGRATION_MODE=legacy` by default while still wiring `ELIZAOS_BASE_URL=http://elizaos:3001` and mapping app `ELIZAOS_API_KEY` from service `ELIZA_SERVER_AUTH_TOKEN`. Set `ELIZA_INTEGRATION_MODE=official` only for Work Item 5 after direct ElizaOS smoke passes.

## Required live environment

### WAGDIE app route parity

```bash
export WAGDIE_DEV_BASE_URL="https://<dev-wagdie-app>"
export WAGDIE_ROUTE_PARITY_PRIVATE_KEY="<disposable-test-wallet-private-key>"
export WAGDIE_ROUTE_PARITY_TOKEN_ID="<token-id-owned-by-test-wallet-or-admin-accessible>"
```

Optional route parity env:

- `WAGDIE_ROUTE_PARITY_WALLET_ADDRESS` — expected address derived from the private key; script fails if it does not match.
- `WAGDIE_ROUTE_PARITY_SECOND_PRIVATE_KEY` — optional Wallet B private key for cross-wallet conversation get/delete isolation checks.
- `WAGDIE_ROUTE_PARITY_MUTATE=true` — enables character PUT/import and knowledge upload/delete checks. Only use with a disposable or explicitly approved test token.
- `WAGDIE_ROUTE_PARITY_CONFIRM_MUTATION_TARGET=true` — required with mutation checks to acknowledge persona/import mutations are not automatically reverted.
- `WAGDIE_ROUTE_PARITY_SKIP_CHAT=true` — skips provider-backed `/api/eliza/chat` SSE checks.
- `WAGDIE_ROUTE_PARITY_CLEANUP=true` — deletes the conversation created by the route parity chat check.
- `WAGDIE_ROUTE_PARITY_RUN_ID` — stable marker used in disposable payloads.
- `WAGDIE_ROUTE_PARITY_TIMEOUT_MS` — request timeout; default `30000`.
- `WAGDIE_ROUTE_PARITY_FAIL_ON_SKIPPED=true` — treats skipped optional checks as failures.

Preconditions:

- WAGDIE dev app is deployed with `ELIZA_INTEGRATION_MODE=official` and points at the hosted dev ElizaOS service validated by Work Items 1-4.
- The test wallet can complete WAGDIE app SIWE through `/api/auth/nonce` and `/api/auth/verify`.
- The WAGDIE auth user persistence path is working in the dev database.
- `WAGDIE_ROUTE_PARITY_TOKEN_ID` exists in the WAGDIE dev database.
- For chat and conversations, the token must resolve/create an official ElizaOS character and provider-backed chat must be available.
- For mutation checks, the test wallet must own the token or be configured as an admin test wallet, and the token must be safe for disposable persona/import/knowledge edits.


### ElizaOS service smoke

```bash
export ELIZAOS_BASE_URL="http://localhost:3001"
export ELIZAOS_API_KEY="<matches ELIZA_SERVER_AUTH_TOKEN>"
# Required by hosted service startup. The smoke client may omit this only if
# the ingestion token intentionally equals ELIZAOS_API_KEY.
export WAGDIE_KNOWLEDGE_INGESTION_TOKEN="<knowledge-ingestion-token>"
```

Optional smoke env:

- `ELIZAOS_HEALTH_PATH` — defaults to `/api/server/health`.
- `ELIZAOS_SMOKE_RUN_ID` — set a stable value if you want deterministic artifact names/ids.
- `ELIZAOS_SMOKE_STATE_PATH` — defaults to `tmp/elizaos-official-smoke-state.json`.
- `ELIZAOS_SMOKE_SKIP_CHAT=true` — skips provider-backed SSE checks if Venice/provider validation is temporarily unavailable.
- `ELIZAOS_SMOKE_TOKEN_ID` — token id used in knowledge smoke payloads; defaults to `0` and is persisted in the smoke state artifact for post-restart cleanup.
- `ELIZAOS_SMOKE_CLEANUP=true` — deletes the persisted smoke session after post-restart validation.
- `ELIZAOS_SMOKE_FAIL_ON_SKIPPED=true` — makes skipped optional checks fail the run.

### Supabase migration/role validation

This validates the WAGDIE app Supabase database, not the dedicated `elizaos-db` Postgres used by the ElizaOS service. The script now requires an explicit target label and rejects `prod`/`production`/`live` unless a production override is set.

```bash
export ELIZA_DB_VALIDATION_TARGET_ENV="dev"
# Required for remote dev/staging targets once ops names the dev Supabase project ref:
export ELIZA_DB_VALIDATION_EXPECT_SUPABASE_REF="<dev-project-ref>"
# If ops has not named the dev project ref yet, set this intentionally instead:
# export ELIZA_DB_VALIDATION_ALLOW_UNVERIFIED_TARGET="true"
export SUPABASE_DB_URL="postgres://<direct-dev-supabase-db-url>"
export SUPABASE_URL="https://<dev-project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<dev-service-role-key>"
export SUPABASE_ANON_KEY="<dev-anon-key>"
```

Optional DB env:

- `ELIZA_DB_VALIDATION_EXPECT_SUPABASE_REF` or `WAGDIE_DEV_SUPABASE_PROJECT_REF` — expected dev project ref; when set, both the REST URL and direct DB URL must contain it.
- `ELIZA_DB_VALIDATION_ALLOW_UNKNOWN_TARGET=true` — allows a non-production target label that is not in the script’s built-in non-production list.
- `ELIZA_DB_VALIDATION_ALLOW_UNVERIFIED_TARGET=true` — allows a remote non-production target without the project-ref guard; use only while ops has not named the dev project ref.
- `ELIZA_DB_VALIDATION_ALLOW_PRODUCTION=true` — production override for a separately approved promotion drill only; do not use for dev validation.
- `SUPABASE_AUTHENTICATED_JWT` — real authenticated user JWT for REST-level authenticated denial checks. Without it, the script still verifies the `authenticated` database role has no table privileges via direct SQL.
- `ELIZA_DB_VALIDATION_TOKEN_ID` — disposable token id used for server-role write probes. Defaults to `6666`; set to an unused token id if that row already exists in migration-link tables.
- `ELIZA_DB_VALIDATION_RUN_ID` — stable run id for repeatable cleanup.
- `ELIZA_DB_VALIDATION_FAIL_ON_SKIPPED=true` — fail if optional authenticated REST probes are skipped.
- `PGSSLMODE=disable` — for local Postgres only; TLS is enabled by default.

## WAGDIE route parity

After Work Items 1-4 pass and the WAGDIE dev app is deployed in official mode, run with the approved dev mutation target:

```bash
export WAGDIE_ROUTE_PARITY_TOKEN_ID="3157"
export WAGDIE_ROUTE_PARITY_MUTATE="true"
export WAGDIE_ROUTE_PARITY_CONFIRM_MUTATION_TARGET="true"
```

Then run:

```bash
bun run elizaos:routes:validate
```

Default checks are non-mutating except for creating a chat conversation through `/api/eliza/chat` when chat is not skipped. They cover:

- unauthenticated 401 shape for protected Eliza routes;
- WAGDIE app SIWE nonce/verify and Eliza app-gate nonce/verify;
- `/api/eliza/characters/[tokenId]` read and `/export` response shape;
- `/api/eliza/chat` browser SSE event contract (`token`, `complete`, optional `error`) and `complete.conversationId`;
- `/api/eliza/conversations` list and `/api/eliza/conversations/[conversationId]` get;
- optional conversation delete with `WAGDIE_ROUTE_PARITY_CLEANUP=true`;
- optional Wallet B get/delete isolation with `WAGDIE_ROUTE_PARITY_SECOND_PRIVATE_KEY`;
- knowledge list shape.

Set `WAGDIE_ROUTE_PARITY_MUTATE=true` and `WAGDIE_ROUTE_PARITY_CONFIRM_MUTATION_TARGET=true` only for an owned/admin disposable token. Character PUT/import mutations are not automatically reverted. This additionally validates:

- `PUT /api/eliza/characters/[tokenId]`;
- `POST /api/eliza/characters/[tokenId]/import`;
- knowledge upload, document get, and delete.

Do not run mutation checks against a collector/user token unless the owner has explicitly approved disposable AI persona and knowledge edits.

## Pass 1: freshly migrated dev DB

1. Confirm these env vars point at the WAGDIE dev Supabase target, not production and not `elizaos-db`:

   ```bash
   test "${ELIZA_DB_VALIDATION_TARGET_ENV:-$WAGDIE_SUPABASE_TARGET_ENV}" = "dev"
   printf '%s\n' "${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
   printf '%s\n' "${SUPABASE_DB_URL:-${DATABASE_URL:-$POSTGRES_URL}}"
   ```

2. Apply the three Supabase migrations to the dev DB if they are not already present:
   - `20260510000000_create_eliza_persona_migration_links.sql`
   - `20260510010000_create_eliza_knowledge_sync_states.sql`
   - `20260510020000_create_eliza_official_conversation_links.sql`
3. Validate migration tables and access posture:

   ```bash
   bun run elizaos:db:validate
   ```

4. Run the ElizaOS service smoke suite:

   ```bash
   bun run elizaos:smoke
   ```

   The fresh phase writes a state artifact used for restart persistence checks. Preserve `ELIZAOS_SMOKE_STATE_PATH` and `ELIZAOS_SMOKE_RUN_ID` for the post-restart phase.

## Restart gate

Restart only the hosted ElizaOS service/container. Do not wipe the ElizaOS database or Supabase migration tables.

Record:

- restart timestamp;
- deployed ElizaOS image/commit;
- state artifact path;
- `ELIZAOS_SMOKE_RUN_ID` if manually provided.

## Pass 2: after ElizaOS restart

Run the post-restart phase against the same service and state artifact:

```bash
ELIZAOS_SMOKE_PHASE=post-restart bun run elizaos:smoke
# or
bun run elizaos:smoke:post-restart
```

This verifies the previously created disposable agent and session/messages can be read after restart, then exercises the knowledge delete/invalidation path for the persisted knowledge marker. The current service delete response treats missing memory as already invalidated, so this validates post-restart delete compatibility but does not by itself prove the memory row existed before deletion.

## Coverage notes

The local scripts cover these Work Item 3-4 surfaces once credentials are provided:

- health endpoints;
- service auth rejection for missing/bad `X-API-KEY`;
- service auth acceptance with configured key;
- disposable official agent create/update;
- direct official messaging SSE chunk/done compatibility and route-safe error behavior;
- session create, reuse, delete, and post-restart readback;
- WAGDIE knowledge plugin auth rejection plus index/delete;
- post-restart knowledge delete/invalidation path for a persisted marker;
- migration table existence, required columns, RLS enabled, `update_updated_at_column()` triggers;
- service-role read/write through Supabase REST;
- anon denial through Supabase REST and SQL privilege checks;
- authenticated role privilege denial through SQL, with optional REST denial when `SUPABASE_AUTHENTICATED_JWT` is supplied.

Browser-facing WAGDIE route parity is covered by `bun run elizaos:routes:validate` once the WAGDIE dev app URL and disposable test wallet/token details are provided.

## Required env vars for the next live step

Minimum Work Item 5 route parity validation:

- `WAGDIE_DEV_BASE_URL` or `WAGDIE_APP_BASE_URL`
- `WAGDIE_ROUTE_PARITY_PRIVATE_KEY` or `WAGDIE_TEST_WALLET_PRIVATE_KEY`
- `WAGDIE_ROUTE_PARITY_TOKEN_ID` or `WAGDIE_TEST_TOKEN_ID`

Minimum Work Items 1-4 dev validation:

- `ELIZAOS_BASE_URL` (`http://localhost:3001` from host shell; `http://elizaos:3001` from app container)
- `ELIZAOS_API_KEY` or `ELIZA_SERVER_AUTH_TOKEN` (same value)
- `WAGDIE_KNOWLEDGE_INGESTION_TOKEN` (hosted service must set it; smoke client can rely on `ELIZAOS_API_KEY` only if both tokens intentionally match)
- `ELIZA_DB_VALIDATION_TARGET_ENV=dev` or `WAGDIE_SUPABASE_TARGET_ENV=dev`
- `ELIZA_DB_VALIDATION_EXPECT_SUPABASE_REF` or `WAGDIE_DEV_SUPABASE_PROJECT_REF` for remote dev Supabase targets, unless `ELIZA_DB_VALIDATION_ALLOW_UNVERIFIED_TARGET=true` is set intentionally
- `SUPABASE_DB_URL` or direct `DATABASE_URL`/`POSTGRES_URL` for the WAGDIE dev Supabase DB
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` for the WAGDIE dev Supabase REST API
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_KEY` or `SERVICE_ROLE_KEY` for the WAGDIE dev Supabase target
- `SUPABASE_ANON_KEY` or `ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` for the WAGDIE dev Supabase target

Optional but recommended:

- `SUPABASE_AUTHENTICATED_JWT`
- `ELIZAOS_SMOKE_RUN_ID`
- `ELIZAOS_SMOKE_STATE_PATH`
- `ELIZAOS_SMOKE_TOKEN_ID`
- `ELIZA_DB_VALIDATION_TOKEN_ID`
- `WAGDIE_ROUTE_PARITY_WALLET_ADDRESS`
- `WAGDIE_ROUTE_PARITY_SECOND_PRIVATE_KEY`
- `WAGDIE_ROUTE_PARITY_MUTATE=true`
- `WAGDIE_ROUTE_PARITY_CONFIRM_MUTATION_TARGET=true`
- `WAGDIE_ROUTE_PARITY_CLEANUP=true`
