# Eliza Package Migration: Plan

## Goal

Replace WAGDIE's checked-in local `@eliza/sdk` package with an app-owned gateway for the custom Eliza API contract, while routing all LLM inference through Venice and preserving the public `/api/eliza/*` proxy contracts, wallet SIWE flow, character/persona editor behavior, conversations, and knowledge/import-export workflows.

## Background

- The app currently depends on a vendored package path: `"@eliza/sdk": "file:eliza-sdk-master"` (`package.json:26`).
- `lib/eliza/client.ts` is the main SDK client factory for server/API-key and user-token clients (`lib/eliza/client.ts:6-47`), but direct `@eliza/sdk` leaks also exist in SIWE, error, type, and resolver code (`app/api/eliza/auth/nonce/route.ts:16`, `lib/eliza/sdkAdapter.ts:8`, `types/eliza.ts:18`, `lib/eliza/characterResolver.ts:10`).
- The local SDK exposes the namespaces the app relies on: `auth`, `characters`, `chat`, `conversations`, and `nft` (`eliza-sdk-master/src/client/ElizaClient.ts:34-99`).
- WAGDIE depends on custom character record methods: `createRecord`, `replaceRecord`, and `getRecordByExternalId` (`eliza-sdk-master/src/characters/index.ts:110-127`, `lib/eliza/characterResolver.ts:66-122`). These are not represented in the ambient `CharactersAPI` declaration (`types/eliza-sdk.d.ts:229-236`), which is the current type-drift risk.
- Chat is WAGDIE-owned at the route boundary: `/api/eliza/chat` validates wallet/session state, resolves token id to Eliza record id, and emits the browser-facing SSE contract (`app/api/eliza/chat/route.ts:30-188`). Upstream Eliza/Venice stream parsing is a separate internal concern.
- The frontend auth hook assumes WAGDIE owns the SIWE proxy sequence: status check, nonce, wallet signature, verify (`hooks/useElizaAuth.ts:95-170`).
- Prior contracts assume this proxy architecture for chat/persona/knowledge/import-export (`specs/016-character-editor-chat/contracts/api.yaml`, `specs/017-eliza-persona-editor/contracts/api.yaml`).
- The deployed `ELIZA_API_URL` should be treated as a custom local-SDK contract, not as an `@elizaos/api-client`-compatible server.
- Venice is the intended LLM provider for all inference. The custom Eliza API remains useful for auth/session token exchange, character/persona records, knowledge embedded in character records, and conversation metadata/history only if WAGDIE chooses to keep it there.

## Recommendation

Do **not** make `@elizaos/api-client` the runtime target for this migration. The API WAGDIE is consuming is custom, so installing an official ElizaOS package would not remove the need for a compatibility layer.

1. Introduce a WAGDIE-owned gateway interface for the custom Eliza contract.
2. Replace the vendored local SDK runtime with app-owned HTTP calls to the existing custom `ELIZA_API_URL` endpoints.
3. Make Venice the only LLM inference path for chat and future AI generation.
4. Keep Eliza custom API calls limited to non-inference responsibilities: SIWE nonce/verify, character/persona records, knowledge stored on records, and conversation persistence if retained.
5. Do not adopt `@elizaos/core` or `@elizaos/server` in this migration; those would change WAGDIE into an Eliza runtime/server host.

The key rule: no route, hook, or domain module should import an Eliza package directly. Routes call WAGDIE gateway modules; gateway modules call either the custom Eliza API or Venice.

## Compatibility Validation

Before removing `eliza-sdk-master`, validate the deployed `ELIZA_API_URL` as the custom local-SDK contract and validate Venice as the inference provider. Add an opt-in compatibility suite, for example `tests/compat/eliza-gateway-compat.test.ts`, gated by explicit env vars such as `ELIZA_COMPAT_TESTS=1`, `ELIZA_API_URL`, `ELIZA_API_KEY`, `ELIZA_TEST_ACCESS_TOKEN`, `ELIZA_TEST_EXTERNAL_ID`, `VENICE_API_KEY`, and `VENICE_MODEL`.

| Area | Provider | Must validate | Stop condition |
|---|---|---|---|
| Auth nonce | Custom Eliza API | `GET /auth/nonce` returns `{ nonce, sessionId }` | Nonce/session flow cannot be reproduced over raw HTTP |
| Auth verify | Custom Eliza API | `POST /auth/verify` accepts `{ message, signature, sessionId }` and returns token fields | SIWE verification cannot be preserved |
| API-key auth | Custom Eliza API | `Authorization: Bearer <apiKey>` works for server record operations | Character/persona records cannot be managed |
| User-token auth | Custom Eliza API | `Authorization: Bearer <accessToken>` works where user-scoped persistence is retained | Conversation persistence cannot be retained |
| Character external lookup | Custom Eliza API | `GET /characters/external/{externalId}` supports found and missing cases | Token id to record id mapping breaks |
| Character create | Custom Eliza API | `POST /characters` accepts `{ externalId, character }` and preserves unknown keys | Persona creation cannot be preserved |
| Character replace | Custom Eliza API | `PUT /characters/{id}` preserves record linkage and unknown keys | Persona/knowledge updates cannot be preserved |
| Venice chat completion | Venice API | Chat completions stream tokens for a character prompt | LLM inference cannot move fully to Venice |
| Conversation persistence | Decide per product | Either custom Eliza conversations remain valid or WAGDIE adds its own durable store | Venice chats remain stateless unintentionally |
| Errors | Both | 401, 404, 429, and 5xx normalize to route-safe errors | Routes cannot keep stable error behavior |

Stop the migration if a required non-inference Eliza behavior cannot be preserved over raw HTTP or Venice cannot satisfy the streaming inference contract.

## Approach

### 1. Lock the current behavior

Add or expand tests before changing the dependency. The behavior source of truth is the local SDK source plus WAGDIE route contracts, not `types/eliza-sdk.d.ts`.

Focus on:

- SIWE nonce/verify session state and expiry normalization.
- Chat SSE `token`, `complete`, and `error` events, with Venice as the upstream inference stream.
- Token id to Eliza record id resolution.
- `createRecord`, `replaceRecord`, `getRecordByExternalId` behavior.
- Knowledge document list/upload/get/delete behavior. `lib/eliza/knowledge.ts:82-115` should remain app-owned and call gateway character record methods rather than introduce a new upstream knowledge API unless the deployed API already provides one.
- Import/export conversion and the existing "skip knowledge on import" warning.
- Conversation list/filter/get/delete behavior.

### 2. Introduce an app-owned gateway seam

Add `lib/eliza/gateway/` with app-owned types and a `WagdieElizaClient` interface shaped around the behavior routes actually use:

- `auth.getNonce()` and `auth.verify()`
- `characters.getRecordByExternalId()`, `getRecord()`, `createRecord()`, `replaceRecord()`, and any legacy character methods still used after grep
- `chat.sendMessageStream()` backed by Venice for inference; keep non-streaming only if a route still needs it
- `conversations.list()`, `listForCharacter()`, `get()`, `delete()`

Keep knowledge as an app-owned helper over `characters.getRecordByExternalId()` and `characters.replaceRecord()` unless compatibility tests prove a real upstream knowledge endpoint should replace it.

Update `lib/eliza/client.ts` to return `WagdieElizaClient` while initially wrapping the existing local SDK. Label this wrapper temporary; it exists only to create a no-behavior-change migration seam.

### 3. Move SDK-owned helper behavior into WAGDIE and Venice

Remove direct route dependency on SDK helpers that may not exist in the installable package:

- Move SIWE message construction from `createSIWEMessage` into an app-owned helper such as `lib/eliza/siwe.ts`, then snapshot the exact string format used by `/api/eliza/auth/nonce`.
- Replace runtime `ElizaError` re-exports (`lib/eliza/sdkAdapter.ts:8`, `types/eliza.ts:18`) with an app-owned `WagdieElizaError` or normalized error shape before deleting the SDK.
- Promote `lib/eliza/openai-compatible.ts` or a renamed `lib/eliza/venice.ts` into the primary inference adapter.
- Move/adapt upstream stream parsing into the Venice adapter. That parser emits gateway callbacks; `/api/eliza/chat` remains the only layer that emits browser SSE events named `token`, `complete`, and `error`.
- Remove the old Eliza-native chat stream path after Venice compatibility and conversation-persistence decisions are settled.

### 4. Build the final gateway implementation

Add a final gateway implementation that uses app-owned HTTP clients rather than an ElizaOS package runtime.

Responsibilities:

- Normalize custom Eliza base URL and auth headers for non-inference endpoints.
- Normalize Venice base URL, auth headers, model, timeout, temperature, and max-token settings for inference.
- Preserve `elizaConfig.timeout` and retry behavior where applicable.
- Normalize upstream errors into route-safe errors.
- Use raw HTTP for all required custom Eliza methods.
- Route all chat inference through Venice.

### 5. Replace types at the boundary

Make app-owned gateway types the source of truth.

- Keep public DTOs in `types/eliza.ts` stable.
- Replace every direct `@eliza/sdk` import with gateway/app-owned code: `client.ts`, `characterResolver.ts`, `sdkAdapter.ts`, `types/eliza.ts`, and `app/api/eliza/auth/nonce/route.ts`.
- Keep `lib/eliza/sdkAdapter.ts` as the facade for mappers, but source its types from the gateway type file.
- Delete `types/eliza-sdk.d.ts` only after no app code imports `@eliza/sdk`.

### 6. Swap dependency after parity is proven

Only after tests and compatibility checks pass:

- Remove `"@eliza/sdk": "file:eliza-sdk-master"` without adding `@elizaos/api-client` as a runtime dependency unless a later non-runtime type/tooling use is justified.
- Remove direct `@eliza/sdk` imports.
- Remove the temporary local-SDK gateway wrapper.
- Delete `types/eliza-sdk.d.ts`.
- Delete `eliza-sdk-master/**` after a rollback window.

## Work Items

1. **Baseline tests** ✅ complete
   - Added/updated focused Eliza tests for chat, SIWE, gateway HTTP/client, Venice streaming, auth routes, character records, knowledge routes, conversations, and import/export-adjacent behavior.

2. **Gateway interface** ✅ complete
   - Created `lib/eliza/gateway/types.ts` with `WagdieElizaClient` and stable app-owned Eliza types.
   - Replaced the temporary local-SDK wrapper with the final app-owned gateway in `lib/eliza/client.ts`.
   - Updated `lib/eliza/client.ts` and `lib/eliza/characterResolver.ts` to depend on `WagdieElizaClient`.
   - Removed non-client SDK leaks for SIWE and `ElizaError`; final search shows no `@eliza/sdk` references in app/package/test paths.

3. **Helper extraction** ✅ foundation complete
   - Added `lib/eliza/siwe.ts` for app-owned SIWE message construction.
   - Added `lib/eliza/gateway/venice.ts` for Venice/OpenAI-compatible streaming callbacks.
   - Kept `lib/eliza/openai-compatible.ts` as a compatibility re-export.

4. **Final gateway implementation** ✅ complete
   - Implemented `lib/eliza/gateway/client.ts`, `http.ts`, `venice.ts`, and `errors.ts`.
   - Custom Eliza auth/records/conversations now use raw HTTP through the app-owned gateway.
   - Chat inference now uses Venice through the gateway.
   - Note: Venice-generated chat messages are not durably persisted yet; existing conversation endpoints still expose custom Eliza conversation data.

5. **Compatibility suite** ✅ local coverage added; live compat pending credentials
   - Added local gateway/route tests for auth, character records, knowledge, conversations, and Venice streaming.
   - Live opt-in tests against real `ELIZA_API_URL`/Venice credentials are still pending.

6. **Rollout / cleanup** ✅ package cleanup complete; live rollout still pending
   - Removed the local `@eliza/sdk` file dependency from package metadata and lockfiles.
   - Deleted `types/eliza-sdk.d.ts` after confirming app runtime code no longer imports `@eliza/sdk`.
   - Deleted `eliza-sdk-master/` after dependency and lockfile references were removed.
   - Targeted local Eliza tests pass.
   - Still needs live smoke testing with real `ELIZA_API_URL` and Venice credentials: wallet auth, character GET/PUT, chat stream, conversation list/detail/delete, import/export, and knowledge upload/delete.

## Rollback and Gating

- **After dependency removal:** rollback by reverting the migration commit or redeploying the previous artifact.

Stop conditions:

- Raw HTTP cannot preserve the custom `ELIZA_API_URL` auth/record behavior.
- Raw HTTP cannot preserve `createRecord`, `replaceRecord`, `getRecordByExternalId`, or unknown `AgentCharacter` keys.
- Venice streaming cannot produce the gateway callbacks needed for the existing WAGDIE SSE contract.
- SIWE message format changes in a way that invalidates existing Eliza verification.
- Error normalization cannot replace runtime `ElizaError` checks safely.

## Open Questions

- Venice-generated chat messages are not durably persisted yet. Decide whether to store them through custom Eliza conversation endpoints if available, or add WAGDIE-owned conversation/message persistence.

## References

- Current local dependency: `package.json:26`
- Current client factory: `lib/eliza/client.ts:6-47`
- Former local SDK namespaces: `eliza-sdk-master/src/client/ElizaClient.ts:34-99` (deleted during cleanup)
- Former local character record methods: `eliza-sdk-master/src/characters/index.ts:110-127` (deleted during cleanup)
- Character resolver dependency on record APIs: `lib/eliza/characterResolver.ts:66-122`
- Former ambient declaration drift: `types/eliza-sdk.d.ts:229-244` (deleted during cleanup)
- Chat route contract: `app/api/eliza/chat/route.ts:30-188`
- Frontend auth flow: `hooks/useElizaAuth.ts:95-170`
- Specs: `specs/016-character-editor-chat/contracts/api.yaml`, `specs/017-eliza-persona-editor/contracts/api.yaml`
- Venice chat completions: https://docs.venice.ai/api-reference/endpoint/chat/completions
- Venice API docs: https://docs.venice.ai/
- ElizaOS package context, not recommended as runtime target here: https://github.com/elizaos/eliza
