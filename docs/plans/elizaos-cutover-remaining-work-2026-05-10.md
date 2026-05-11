# ElizaOS Cutover Remaining Work: Plan

## Goal

Finish the operational work required to run WAGDIE characters on the hosted official ElizaOS service in production, with users able to edit characters and chat through the existing WAGDIE app routes.

## Current State

- The in-repo official ElizaOS implementation is complete through adapter, auth bridge, persona sync, knowledge indexing, and conversation mapping (`docs/plans/official-eliza-package-migration-2026-05-10.md:70-156`).
- `legacy` remains default; `dual` is legacy-visible; `official` switches to the official adapter through `lib/eliza/client.ts:55-62` and `lib/eliza/client.ts:91-104`.
- Hosted service deployment is still a skeleton: `services/elizaos/README.md:43-56`, `services/elizaos/Dockerfile:1-18`.
- Current smoke coverage is health/list only: `scripts/elizaos-official-smoke.ts:45-50`.
- Production cutover still needs deployed-service proof for streaming, knowledge index/delete, session reuse/delete, cross-wallet isolation, persistence, rollback, and observability.

## Recommended Approach

Use a dev-server-first cutover:

1. Deploy the hosted ElizaOS service and WAGDIE app in the dev server environment with `ELIZA_INTEGRATION_MODE=official`.
2. Prove all route contracts and user workflows there: auth, character editing, knowledge upload/delete, chat streaming, conversation reuse/delete, and rollback.
3. Promote the same configuration to production only after dev validation passes.

This avoids extra production canary machinery. The production switch is the normal dev-to-prod promotion; rollback remains setting production back to `legacy` or reverting the deployment.

## Work Items

### 1. Provision the dev server ElizaOS target

- **Owner surface:** ops/service.
- **Objective:** Stand up the hosted ElizaOS service in the dev server environment.
- **Depends on:** `services/elizaos/` skeleton.
- **Decision gate:** no production work until dev has persistent DB, auth token, Venice key, and health endpoints.
- **Exit criteria:** dev health passes `/healthz`, `/health`, `/api/server/health`, and `/api/messaging/sessions/health`; persistence survives service restart; WAGDIE dev points at the dev ElizaOS base URL.

### 2. Harden service startup and auth posture

- **Owner surface:** service/ops.
- **Objective:** fail closed outside local-only development.
- **Depends on:** dev deployment target.
- **Decision gate:** service cannot run in dev/prod without required secrets.
- **Implementation locus:** `services/elizaos/src/server.ts` should import a startup env validator before `AgentServer.start()`.
- **Exit criteria:** hosted dev/prod require `ELIZA_SERVER_AUTH_TOKEN`, `WAGDIE_KNOWLEDGE_INGESTION_TOKEN`, `SERVER_API_KEY`, `VENICE_API_KEY`, and `DATABASE_URL`/`POSTGRES_URL`; `WAGDIE_KNOWLEDGE_ALLOW_UNAUTHENTICATED_LOCAL=true` is rejected outside local-only development; service logs do not print tokens, keys, SIWE signatures, or full private prompts.
- **Local-code status (2026-05-10):** complete for service startup env validation in `services/elizaos/src/server.ts`, shared local-environment gating for the WAGDIE knowledge plugin, docs/comment cleanup, and local validator tests. Live dev-server deployment/secret provisioning remains pending and was not attempted.

### 3. Expand live smoke coverage

- **Owner surface:** app/service/QA.
- **Objective:** turn `scripts/elizaos-official-smoke.ts` into a contract-level validation suite.
- **Depends on:** dev ElizaOS deployment.
- **Decision gate:** no production promotion until the smoke matrix below passes twice: once on a freshly migrated dev DB and once after an ElizaOS service restart.
- **Exit criteria:** smoke script or runbook records both runs and cleans up disposable test data.
- **Local-code status (2026-05-10):** script/runbook readiness complete. `scripts/elizaos-official-smoke.ts` now covers health, service auth rejection/acceptance, disposable agent create/update, direct official SSE/session reuse/delete checks, WAGDIE knowledge plugin index/delete, state artifact recording, agent/session post-restart readback, and knowledge post-restart invalidation instructions. Live dev-server execution remains pending credentials and deployment.

### 4. Apply and validate database migrations

- **Owner surface:** DB/app.
- **Objective:** apply required migrations where missing, then prove table access matches integration assumptions.
- **Depends on:** dev DB for initial validation; production DB must exist before production promotion.
- **Decision gate:** official mode cannot be enabled in an environment if any migration table is missing or client-writable.
- **Exit criteria:** `eliza_persona_migration_links`, `eliza_knowledge_sync_states`, and `eliza_official_conversation_links` exist in dev and prod; server role can read/write; `anon` and `authenticated` cannot; `update_updated_at_column()` trigger exists.
- **Local-code status (2026-05-10):** validation tooling complete in `scripts/validate-elizaos-migrations.ts` with package script `bun run elizaos:db:validate`. The script verifies table/column presence, RLS, `update_updated_at_column()` triggers, revoked anon/authenticated table privileges, service-role read/write, anon REST denial, and optional authenticated REST denial when `SUPABASE_AUTHENTICATED_JWT` is provided. Actual dev/prod DB validation remains pending Supabase DB URL and keys.

### 5. Run dev route parity against ElizaOS

- **Owner surface:** app/QA.
- **Objective:** prove existing WAGDIE routes work in `official` mode against deployed ElizaOS on the dev server.
- **Depends on:** work items 1–4.
- **Decision gate:** no production deploy until dev route parity passes.
- **Exit criteria:** `/api/eliza/auth/*`, `/api/eliza/chat`, `/api/eliza/conversations/*`, character edit/import/export, and knowledge upload/delete preserve existing response shapes and status behavior.
- **Local-code status (2026-05-10):** route parity readiness complete in `scripts/elizaos-route-parity.ts` with package script `bun run elizaos:routes:validate` and runbook coverage in `docs/runbooks/elizaos-dev-validation.md`. The script is ready to validate a deployed WAGDIE dev app in `official` mode once a disposable test wallet/private key and owned/admin-accessible token id are provided. Live route parity remains pending WAGDIE dev deployment URL, SIWE-capable test wallet, and token ownership/admin preconditions.

### 6. Deploy production ElizaOS and promote WAGDIE configuration

- **Owner surface:** ops/app/service.
- **Objective:** create production ElizaOS infra if it does not already exist, then move the dev-validated WAGDIE configuration to production.
- **Depends on:** dev validation complete; production DB and secrets available.
- **Decision gate:** production deploy proceeds only after full dev smoke, manual user workflow checks, migration validation, and named rollback owner are complete.
- **Exit criteria:** production ElizaOS is deployed with persistent DB and required secrets; production WAGDIE runs `ELIZA_INTEGRATION_MODE=official`; production ElizaOS health, auth rejection, provider-backed chat, knowledge plugin index/delete, session persistence, and restart persistence pass; rollback to `legacy` is tested and timed.

### 7. Stabilization gate

- **Owner surface:** ops/app/support.
- **Objective:** monitor production before legacy cleanup is considered.
- **Depends on:** production promotion complete.
- **Exit criteria:** no critical auth/chat/knowledge/conversation regressions for 7 days or 100 production chats, whichever comes first; runbooks and known issues are updated from production findings.

## Live Smoke Matrix

| Area | Scenario | Expected result |
|---|---|---|
| Auth | No wallet/session against protected route | Existing WAGDIE 401 shape |
| Auth | Valid SIWE nonce + verify in official mode | WAGDIE app token returned; no ElizaOS credential exposed |
| Service auth | Bad/missing `X-API-KEY` on `/api/server/health` and `/wagdie-knowledge/*` | Rejected in dev/prod |
| Agent | Create/update same test character twice | Official agent updated, not duplicated |
| Chat SSE | New chat through `/api/eliza/chat` | `token` events then one `complete` with WAGDIE conversation id |
| Chat SSE | Forced official/provider failure | Route-safe `error`; no raw key/provider leak |
| Conversations | Reuse returned conversation id | Same mapped official session reused |
| Conversations | Wallet B fetch/delete Wallet A conversation | 404/forbidden without session id leakage |
| Knowledge | Upload document | WAGDIE response succeeds; sync row `indexed`; memory id recorded |
| Knowledge | Delete document | WAGDIE canonical delete plus official memory invalidation |
| Persistence | Restart ElizaOS | agents, sessions, memory, and WAGDIE links remain usable |

## Rollout and Rollback

- **Modes:** dev server `official` → production `official`; keep production `legacy` until dev passes.
- **Promotion gate:** dev server validation must pass for auth, character editing, knowledge sync, chat streaming, conversation mapping, persistence, and rollback.
- **Rollback trigger:** broken SSE contract, cross-wallet access, systematic knowledge invalidation failure, sustained official service outage, provider secret leakage, or mapping DB write failure.
- **Rollback action:** set production `ELIZA_INTEGRATION_MODE=legacy` or revert the production deployment; verify legacy chat and character edit paths still work; leave official mapping rows intact for analysis.

## Observability and Operations

Track and alert on the minimum cutover signals:

- ElizaOS health endpoint status.
- Service 4xx/5xx rate.
- Chat stream error count / completion failure rate.
- Knowledge index/delete failures and `eliza_knowledge_sync_states.status='error'` growth.

Defer first-token latency dashboards, detailed session counters, and mapping-write dashboards until stabilization unless failures require them.

Logs should include WAGDIE conversation id, official session id, official agent id, token id, non-sensitive user identifier, outcome, and duration. Logs must not include SIWE signatures, access tokens, API keys, Venice secrets, or full private user messages by default.

## Cleanup Before Cutover

- [x] Update stale comments that still say official adapter is not wired or chat/conversations are Venice-only/custom-only:
  - `lib/eliza/config.ts`
  - `lib/eliza/official/service-client.ts`
  - `lib/eliza/official/client.ts`
  - `app/api/eliza/chat/route.ts`
- [x] Document current repo-local rollback assumption for `ELIZA_INTEGRATION_MODE`: host runtime tunability is not proven here, so assume app redeploy/restart is required until ops confirms otherwise.
- [ ] Document the exact production deployment target, flag owner, and rollback executor before Work Item 6 starts.

## Non-goals

- Do not remove legacy gateway/direct-Venice fallback in this wave.
- Do not change browser-facing `/api/eliza/*` contracts.
- Do not make frontend code call ElizaOS directly.
- Do not replace WAGDIE wallet/SIWE auth authority.
- Do not redesign persona or knowledge schemas.
- Do not migrate unrelated lore/admin systems.

## Open Questions

- Is `ELIZA_INTEGRATION_MODE` runtime-tunable in the deployment platform, or does rollback require redeploy?
- Do dev and prod use separate ElizaOS/Postgres/Supabase resources, or can dev validation touch production data?
- Are the three `eliza_*` migration tables already applied in production, or must Work Item 4 apply them during cutover?

## References

- Implementation plan: `docs/plans/official-eliza-package-migration-2026-05-10.md`
- Hosted service README: `services/elizaos/README.md`
- Smoke script: `scripts/elizaos-official-smoke.ts`
- ElizaOS health docs: https://docs.elizaos.ai/rest-reference/system/health-check-endpoint
- ElizaOS streaming docs: https://docs.elizaos.ai/guides/streaming-responses
- ElizaOS env/auth docs: https://docs.elizaos.ai/projects/environment-variables
- Venice plugin: https://www.npmjs.com/package/%40elizaos/plugin-venice
