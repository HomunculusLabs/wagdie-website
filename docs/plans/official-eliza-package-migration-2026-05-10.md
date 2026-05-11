# Official Eliza Package Migration: Plan

## Goal

Move WAGDIE from the current custom Eliza/Venice gateway to a WAGDIE-hosted official ElizaOS service while preserving the existing `/api/eliza/*` route contracts, wallet-gated UX, SSE chat stream, persona import/export, knowledge documents, and conversation history behavior.

## Decisions

- WAGDIE will host the official ElizaOS service.
- The hosted ElizaOS service owns the Venice API key and model/provider configuration.
- WAGDIE remains the wallet/SIWE auth authority; ElizaOS is called server-to-server.
- WAGDIE remains canonical for knowledge documents, and WAGDIE will push/index those documents into official ElizaOS memory with durable source pointers.

## Background

- Current app code depends on `lib/eliza/client.ts:1-61`, which builds a `WagdieElizaClient` backed by app-owned raw HTTP plus direct Venice inference.
- The route-facing contract is `WagdieElizaClient` in `lib/eliza/gateway/types.ts:109-143`: auth, characters, chat streaming, and conversations.
- Chat currently requires wallet session plus an Eliza user token, then streams through `serverClient.chat.sendMessageStream()` and maps callbacks to browser SSE events (`app/api/eliza/chat/route.ts:36-43`, `app/api/eliza/chat/route.ts:118-130`).
- Knowledge is embedded in character records and exposed through helper mappers, not an official memory API (`lib/eliza/knowledge.ts:42-47`).
- Official ElizaOS separates concerns differently: `@elizaos/server` provides REST/WebSocket server infrastructure, `@elizaos/api-client` is the typed client for that server, and `@elizaos/core` is the runtime framework.

## Recommendation

Create a separate hosted ElizaOS service and add an official adapter behind the existing `WagdieElizaClient` seam. Do not import official Eliza runtime/server packages directly inside Next.js route handlers.

The first implementation target is not “replace every route.” It is: keep WAGDIE’s public routes stable, switch their internal client implementation from custom gateway/direct Venice to the official ElizaOS service, and retain a controlled legacy fallback until canary traffic passes.

## Architecture

### WAGDIE Next.js app

- Continues to own `/api/eliza/*`, frontend hooks, wallet sessions, tokenId-centric persona behavior, import/export DTOs, and knowledge document UX.
- Calls `getElizaClient()` / `createUserClient()` as today.
- Switches those factories behind a server-side mode flag to either legacy gateway or official adapter.

### Hosted ElizaOS service

- Runs official ElizaOS server/runtime outside the Next.js request lifecycle.
- Owns Venice credentials and provider configuration.
- Exposes official agents, rooms/messages, memory, health, and streaming APIs.
- Trusts WAGDIE server-to-server identity metadata rather than exposing ElizaOS credentials to the browser.

### Official adapter in WAGDIE

- Lives under `lib/eliza/official/*`.
- Implements the existing `WagdieElizaClient` interfaces, especially `WagdieElizaChatGateway.sendMessageStream()`.
- Normalizes official ElizaOS errors into the existing WAGDIE route-safe error model.
- Maps tokenId/persona state to official agent ids through migration links.
- Maps conversation ids to official room/message ids only if official APIs support per-call user identity or equivalent metadata isolation.

## Required Spike Before Build

Answer these before production-path implementation begins:

1. **Streaming:** Does official ElizaOS expose token-by-token streaming with a stable enough wire format to preserve WAGDIE `token`, `complete`, and `error` SSE events?
2. **User identity:** Does `@elizaos/api-client` or the server API accept per-call user identity/metadata when called with a service credential? If not, conversations must stay WAGDIE-canonical.
3. **Knowledge:** Verify the official memory API supports WAGDIE push/index with durable source pointers and delete/invalidate behavior.
4. **Deployment:** Where does the hosted ElizaOS service run, how are Venice secrets injected/rotated, and what health endpoint gates WAGDIE cutover?

Spike result recorded from Work Item 1:

- `services/elizaos/` now contains a WAGDIE-hosted ElizaOS service skeleton using official packages.
- `lib/eliza/official/service-client.ts` provides a server-only `@elizaos/api-client` factory and health helper.
- `ELIZA_INTEGRATION_MODE=legacy|dual|official` is defined in `lib/eliza/config.ts`; default remains `legacy`.
- Streaming is compatible in principle, but the official API client does not consume SSE; the WAGDIE adapter must use raw server-side `fetch` for official stream events.
- Service auth, health checks, and Venice provider ownership are compatible with the plan.
- Memory push/index is not solved by stock `@elizaos/api-client@1.7.2`; production knowledge sync needs an official create/index endpoint or a custom ElizaOS-side ingestion route before cutover.

## Work Items

1. **Capability spike and deployment skeleton** ✅
   - Stand up the WAGDIE-hosted ElizaOS service using official packages.
   - Install/use `@elizaos/api-client` from WAGDIE server code against that service.
   - Verify official agents, rooms/messages, streaming, memory/delete, service auth, provider configuration, and health checks.
   - Define the server deployment target, env vars, secrets ownership, and mode flag location.

2. **Official adapter behind the existing client seam** ✅
   - Add `lib/eliza/official/*` implementing `WagdieElizaClient` from `lib/eliza/gateway/types.ts:109-143`.
   - Keep `app/api/eliza/*` route contracts unchanged.
   - Make `getElizaClient()` / `createUserClient()` choose `legacy` or `official` via a server-only flag.
   - Preserve the existing direct-Venice path as legacy fallback until official streaming passes.
   - Added `OfficialWagdieElizaClient` with official agent CRUD mapping and raw-fetch SSE streaming normalization for new official sessions.
   - `legacy` remains default; `dual` remains legacy user-visible; only `official` selects the official adapter.
   - Blockers carried forward: official knowledge push/index remains Work Item 5 because stock memory APIs do not expose direct create/index; official conversation list/get/delete and caller-provided conversation ids remain blocked until Work Item 6 adds wallet-scoped official session mapping.

3. **Auth bridge and token semantics** ✅
   - Keep WAGDIE SIWE/session behavior and `/api/eliza/auth/*` responses stable.
   - In official mode, `/api/eliza/auth/nonce` now creates WAGDIE-owned SIWE state and does not call official ElizaOS auth.
   - In official mode, `/api/eliza/auth/verify` verifies the SIWE signature in WAGDIE and issues an opaque `wagdie_eliza_*` app authorization token, not an ElizaOS credential.
   - `requireElizaUserToken()` remains the route-level Eliza gate; in official mode it requires an official-mode WAGDIE app token and rejects stale legacy/mismatched wallet tokens.
   - Chat passes the current wallet-derived official user id into the official adapter for new ElizaOS session creation; the adapter now rejects official chat without that identity.
   - Official ElizaOS API keys/tokens remain server-only and are not returned by auth routes.
   - Blockers carried forward: official conversation history/list/delete still need Work Item 6 wallet-scoped session mapping before enabling official sessions beyond new chat streams.

4. **Persona migration links and shadow writes** ✅
   - Added locked-down `eliza_persona_migration_links` to track `token_id`, legacy/custom character id, official agent id, sync status, last error, and last synced time.
   - Added server-only persona migration repository/helper code for idempotent official agent create/update and route-safe failure recording.
   - In `dual` mode, character PUT and import remain legacy-visible but shadow-write the resulting canonical WAGDIE persona snapshot to official ElizaOS.
   - In `official` mode, character PUT/import use the official adapter directly and record the tokenId ↔ official agent link after success.
   - WAGDIE persona DTOs and import/export snapshots remain canonical; official metadata is not treated as the source of truth for round-trip fields.
   - Blockers carried forward: no knowledge push/index in this item; no official conversation/history cutover; dual-write retries/backfill UI are still future operational work.

5. **Knowledge integration** ✅
   - WAGDIE knowledge documents remain canonical on character records; list/get/export response shapes are unchanged.
   - Added locked-down `eliza_knowledge_sync_states` to track `token_id`, `document_id`, `official_agent_id`, `official_memory_id`, content hash/version, source pointer, sync status, last error, and delete state.
   - In `dual`/`official`, upload/update now records a pending sync, calls the hosted service to index a `DOCUMENT` memory, and records indexed/error state. `dual` sync failures are logged/recorded and do not break the legacy-visible upload path; `official` mode returns a route-safe 502 on sync failure.
   - Delete/tombstone now preserves canonical WAGDIE delete behavior and invalidates official memory when a tracked `official_memory_id` exists, falling back to deterministic `(official_agent_id, token_id, document_id)` invalidation when possible; missing memory ids/agent ids are recorded as deleted but block official knowledge cutover for those rows.
   - Because stock `@elizaos/api-client@1.7.2` still has no direct memory create/index, `services/elizaos/src/wagdie-knowledge-plugin.ts` adds an authenticated WAGDIE-owned route: `POST /wagdie-knowledge/index` and `POST /wagdie-knowledge/delete`.
   - Blockers carried forward: no conversation history/list/delete cutover; production cutover requires service deployment smoke tests proving plugin route registration, embedding queue behavior, and delete invalidation against the deployed official ElizaOS database.

6. **Chat and conversation cutover** ✅
   - Added locked-down `eliza_official_conversation_links` to map public WAGDIE conversation ids to official ElizaOS session ids by wallet address, wallet-derived official user id, token id, and official agent id.
   - Official chat now creates a WAGDIE conversation id plus official session when `conversationId` is absent, and reuses the mapped official session when a caller-provided WAGDIE `conversationId` is present.
   - The adapter preserves browser SSE `token`, `complete`, and `error` events; `complete.conversationId` remains the WAGDIE conversation id, not the official session id.
   - Official conversation list/get/delete are backed by WAGDIE mapping rows for isolation; detail messages are fetched from the mapped official session and mapped back to existing route DTOs.
   - Cross-wallet isolation is enforced by mapping lookups using the wallet-derived official user id; unknown/foreign conversation ids return route-safe not-found errors.
   - Lightweight stream logs now include WAGDIE conversation id, official session/agent ids, first-token latency, duration, and outcome. Provider/model still depend on hosted ElizaOS telemetry and are not exposed by the v1.7.2 stream payload.
   - `legacy` remains default and `dual` remains legacy-visible; no risky user-visible dual chat cutover was added.
   - Blockers carried forward: production cutover needs live smoke tests for official session reuse, delete behavior, and cross-wallet isolation against the deployed ElizaOS service/database; provider/model metrics require hosted-service telemetry or stream metadata not present in the current payload.

## Rollout Modes

Use three modes plus a canary allowlist; avoid five separate states.

| Mode | Behavior | Exit criteria | Rollback |
|---|---|---|---|
| `legacy` | Current custom gateway/direct Venice only | Hosted ElizaOS spike passes | Already current behavior |
| `dual` | Legacy user-visible; official writes/reads canary by tokenId or wallet | Persona diffs acceptable; knowledge index valid; streaming parity passes | Disable official flag and keep legacy data |
| `official` | Official adapter primary; legacy fallback retained for rollback window | Live smoke, rollback drill, and error/latency thresholds pass | Switch flag back to `legacy` |

Remove legacy/direct-Venice fallback only after a separate cleanup decision.

## Acceptance and Stop Conditions

| Area | Must preserve | Stop if |
|---|---|---|
| Auth | Existing wallet-gated route/session behavior | Browser needs ElizaOS credentials or 401/403 behavior drifts |
| Chat | `token`, `complete`, `error` SSE event contract | Official stream cannot produce compatible token/completion/error semantics |
| Persona | tokenId import/export and editor DTOs | Official agent metadata loses WAGDIE fields |
| Knowledge | Original filename/content/list/get/export | Official path cannot delete/invalidate indexed content safely |
| Conversations | Per-wallet/tokenId list/get/delete isolation | Official rooms cannot carry per-user identity or dedupe safely |
| Errors | Route-safe 401/403/404/429/5xx behavior | Official errors leak raw provider/server details |
| Rollback | One flag returns user-visible behavior to legacy | Official writes cannot be reconciled or ignored safely |

## Test Strategy

- Keep existing `tests/api/eliza/*` green in `legacy` mode.
- Add adapter unit tests for official error normalization, stream chunk normalization, persona mapping, knowledge sync/read behavior, and conversation mapping. Work Item 5 added focused knowledge sync unit coverage for legacy safety, dual success/failure recording, official agent id selection, and delete invalidation. Work Item 6 added official chat new/reuse session mapping, conversation list/get/delete, missing mapping, and route wiring coverage.
- Add route parity tests that run the same `/api/eliza/*` expectations against legacy and official adapter mocks.
- Add migration tests for idempotent tokenId → official agent linking, dual-write failure recording, fallback reads, and rollback mode.
- Add gated live tests for hosted ElizaOS health, auth, streaming, memory/delete, rooms/messages, and Venice provider configuration.

## Non-goals

- Do not change public `/api/eliza/*` contracts in the first wave.
- Do not make frontend hooks call ElizaOS directly.
- Do not embed the ElizaOS runtime/server in Next.js route handlers.
- Do not replace WAGDIE wallet auth as source of truth.
- Do not remove legacy/direct-Venice fallback during canary.
- Do not migrate unrelated lore/admin systems.

## Open Questions

- What is the implementation path for WAGDIE push/index into ElizaOS memory now that stock `@elizaos/api-client@1.7.2` does not expose direct memory create/index? Answer from Work Item 5: WAGDIE-owned authenticated ElizaOS plugin routes create/update/delete runtime `documents` memory until an official create/index API exists.
- Does official messaging support per-call user identity strongly enough to move conversations to official rooms? Answer from Work Item 6: use WAGDIE-owned mapping rows keyed by wallet-derived official user id; do not trust service-key-visible official session listing alone for isolation.
- What is the exact hosted ElizaOS deployment target and health/rollback control surface?

## References

- Current gateway plan: `docs/plans/eliza-package-migration-2026-05-10.md`
- Current gateway singleton: `lib/eliza/client.ts:1-61`
- Route-facing client contract: `lib/eliza/gateway/types.ts:109-143`
- Chat auth/SSE seam: `app/api/eliza/chat/route.ts:36-43`, `app/api/eliza/chat/route.ts:118-130`
- Knowledge helper seam: `lib/eliza/knowledge.ts:42-47`
- Official REST reference: https://docs.elizaos.ai/rest-reference
- Official core runtime docs: https://docs.elizaos.ai/runtime/core
- Official rooms API example: https://docs.elizaos.ai/api-reference/rooms/get-agent-rooms
- `@elizaos/api-client`: https://www.npmjs.com/package/@elizaos/api-client
- `@elizaos/server`: https://www.npmjs.com/package/@elizaos/server
