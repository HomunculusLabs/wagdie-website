## Final Prompt
<taskname="API Fetch Plan"/>
<task>Create a staged implementation plan for standardizing API/fetch handling in the Next.js WAGDIE app. The plan should standardize client-side fetch/error handling first, then opportunistically align server route response helpers without forcing a risky full API contract migration. Do not implement code; produce a concrete plan with helper APIs, compatibility strategy, files to touch, migration stages, and verification steps.</task>

<architecture>
- `lib/api/client.ts`: existing `ApiClient` wrapper with `ApiError`, query param support, JSON/text parsing, and raw-response return semantics. It is only partially used through `lib/api/endpoints.ts`.
- `lib/api/client-response.ts`: small `readApiData<T>(response, fallback)` helper for `{ success, data, error, details }` envelope responses. It is used by lore submission UI only.
- `lib/api/responses.ts`: server response helpers split between raw JSON (`jsonRaw`, `jsonRawError`, `jsonNoStore`, `jsonNoStoreError`) and envelope helpers (`jsonOk`, `jsonCreated`, `jsonDeleted`, `jsonError`, etc.). This is the core compatibility boundary.
- `lib/api/endpoints.ts`: typed facade with mixed styles: some methods still call `fetch()` directly and return raw route shapes; others use `apiClient`.
- `lib/api/auth.ts`, `lib/api/errors.ts`, `lib/api/params.ts`, `lib/api/handlers/*`: route-side auth, service error mapping, parameter parsing, and character handlers using mixed raw/NextResponse/helper styles.
- API routes are not uniform. Some routes intentionally return raw domain payloads (`/api/characters`, `/api/auth/me`, metadata-like endpoints, searing/staking sync shapes), while lore submission/admin location routes use the `{ success, data }` envelope.
</architecture>

<selected_context>
API helpers and facades:
- `lib/api/client.ts`: current generic fetch client and `ApiError` behavior.
- `lib/api/client-response.ts`: envelope-only client reader.
- `lib/api/responses.ts`: raw and envelope server response helpers; no-store and dev-detail behavior.
- `lib/api/endpoints.ts`: typed API facade with direct fetch and `apiClient` mixed together.
- `lib/api/auth.ts`, `lib/api/errors.ts`, `lib/api/params.ts`, `lib/api/handlers/character-list.ts`, `lib/api/handlers/character-update.ts`: server helper dependencies and representative shared handlers.

Client call sites with direct fetch/error handling:
- `components/admin/lore-canonization/LoreCanonizationAdminContainer.tsx`: direct fetches to non-envelope admin canonization routes, custom `extractErrors` behavior.
- `components/admin/lore-submissions/*` and `components/lore/submissions/*`: direct fetch plus `readApiData` against envelope lore submission routes.
- `hooks/map/useLocationApi.ts`: CRUD against envelope `/api/locations` routes; repeated response parsing.
- `hooks/map/useMapData.ts`, `hooks/useOwnedCharacters.ts`, `hooks/useCharacterDetailData.ts`, `hooks/useCharacterSave.ts`, `hooks/useCharacterTxHistory.ts`: character raw route consumers.
- `hooks/useAICharacter.ts`, `hooks/useConversations.ts`, `hooks/useCharacterChat.ts`, `hooks/useElizaAuth.ts`, `hooks/useKnowledgeUpload.ts`, `hooks/map/useLocationRoom.ts`: Eliza API consumers with raw `{ error, message }`, streamed/plain response, or domain-specific payloads.
- `hooks/useSearingConcords.ts`, `components/searing-map-editor/SearingMapEditorContainer.tsx`, `components/searing/SearingPageClient.tsx`, `hooks/useStakingStatuses.ts`, `hooks/staking/post-transaction-sync.ts`: searing/concord/staking raw payload consumers with custom errors.
- `hooks/useCurrentUser.ts`: `/api/auth/me` raw response consumer with special 401 handling.

Representative route families:
- `app/api/lore/submissions/**` and `app/api/admin/lore/submissions/**`: envelope-style routes using `jsonOk`/`jsonCreated` and shared lore submission error helpers.
- `app/api/locations/**`: envelope-style CRUD routes using `jsonOk` and service error helpers.
- `app/api/admin/lore/canonization/**`: raw `NextResponse.json({ event })` style with local error shared helper.
- `app/api/auth/**`: mixed auth routes; `me`/`verify` use raw helpers, `nonce`/`logout` still use direct `NextResponse.json`.
- `app/api/characters/**` plus `app/api/character/**`: character list/detail/filter/staking/searing routes with raw payloads, raw helpers, and some direct `NextResponse.json`.
- `app/api/concords/**`: raw route shapes consumed by searing map editor/concord hooks.
- `app/api/eliza/**`: broad raw/error-message family, including auth, chat, conversations, character import/export/knowledge, and location-room routes.
- `app/api/sync/staking/route.ts`, `app/api/sync/eliza-location-rooms/route.ts`: sync routes with no-store/raw domain result bodies.

Tests and verification references:
- `package.json`: scripts (`test`, `build`, `lint`) and Jest/Next versions.
- `tests/api/lore-submissions-route.test.ts`, `tests/api/admin-lore-canonization-route.test.ts`, `tests/api/characters-route.test.ts`, `tests/api/character-nested-routes.test.ts`: existing route contract coverage.
- `tests/api/eliza/auth-routes.test.ts`, `tests/api/eliza/knowledge-routes.test.ts`, `tests/api/eliza/conversations.test.ts`, `tests/api/eliza/location-room-routes.test.ts`: Eliza route contract coverage.
- `tests/hooks/useKnowledgeUpload.test.ts`, `tests/hooks/useLocationRoom.test.tsx`, `tests/hooks/useStakingStatuses.test.tsx`, `tests/components/admin/lore-canonization-admin-container.test.tsx`: client-side fetch behavior coverage.
</selected_context>

<relationships>
- Client-side split: direct `fetch()` call sites either manually parse raw JSON, use `readApiData` for envelope responses, or call `apiClient` via `lib/api/endpoints.ts`.
- Server-side split: envelope routes return `ApiResponse<T>` via `jsonOk/jsonError`; raw routes return domain payloads or `{ error, message? }` via `jsonRaw/jsonRawError` or direct `NextResponse.json`.
- `readApiData` only works with envelope responses; using it on raw routes like `/api/characters`, `/api/eliza/*`, `/api/concords/*`, or `/api/auth/me` would break existing contracts.
- `ApiClient` currently treats any non-OK response as `{ error?, message? }` and returns the parsed body as `T` for OK responses. It does not distinguish raw vs envelope success bodies.
- `lib/api/endpoints.ts` is a natural client-side facade, but many hooks/components bypass it and encode endpoint-specific error handling inline.
- `jsonRaw/jsonRawError/jsonNoStore*` are already compatibility helpers for raw routes, so server migration can be opportunistic and mechanical without wrapping every response in `{ success, data }`.
- Route response helper standardization must preserve public/domain shapes for current consumers and tests, especially Eliza, character, concord, searing, staking, auth session, and metadata-like raw responses.
</relationships>

<plan_requirements>
The next model should produce a staged plan, not code. Cover:
- Proposed client helper API(s): likely a common response parser that can handle raw responses and envelope responses explicitly, plus typed request helpers/options for fallback messages, credentials/cache/signal, body serialization, and expected response shape.
- Compatibility strategy: preserve existing route body contracts; do not convert all routes to `{ success, data }`; make envelope vs raw an explicit client option or separate helper.
- Migration stages: start with helper design/tests, migrate low-risk repeated client call sites, then consolidate `lib/api/endpoints.ts`, then opportunistically replace direct `NextResponse.json` with `jsonRaw/jsonRawError/jsonNoStore*` or envelope helpers where the existing shape already matches.
- Concrete file groups to edit in each stage, based on selected files.
- Verification: targeted Jest suites from selected tests, plus broader `npm test`, `npm run build`, and route contract checks. Include safeguards for special cases like 401 auth handling, file upload/form data, no-store routes, streaming/chat, and raw domain payloads.
</plan_requirements>

<ambiguities>
- The requested output is a plan; no implementation should be performed unless the user later asks for code changes.
- Some routes intentionally use raw shapes because external/domain consumers expect them. Treat raw-vs-envelope as a contract classification task, not as technical debt to eliminate wholesale.
- Search found additional direct fetches in server-side/external-service code (`lib/eliza/*`, image utilities). They are not selected because this task focuses on app client/API route standardization; mention them as out-of-scope unless the plan intentionally defines a separate server-to-external fetch policy.
</ambiguities>

## Selection
- Files: 111 total (111 full)
- Total tokens: 112665 (Auto view)
- Token breakdown: full 112665

### Files
### Selected Files
/Users/t3rpz/projects/wagdie-simplified/
├── app/
│   └── api/
│       ├── admin/
│       │   └── lore/
│       │       ├── canonization/
│       │       │   ├── [eventId]/
│       │       │   │   ├── publish/
│       │       │   │   │   └── route.ts — 206 tokens (full)
│       │       │   │   └── route.ts — 389 tokens (full)
│       │       │   ├── route.ts — 171 tokens (full)
│       │       │   └── shared.ts — 230 tokens (full)
│       │       └── submissions/
│       │           ├── [submissionId]/
│       │           │   ├── canonize/
│       │           │   │   └── route.ts — 138 tokens (full)
│       │           │   ├── decanonize/
│       │           │   │   └── route.ts — 139 tokens (full)
│       │           │   ├── publish/
│       │           │   │   └── route.ts — 138 tokens (full)
│       │           │   ├── review/
│       │           │   │   └── route.ts — 118 tokens (full)
│       │           │   ├── unpublish/
│       │           │   │   └── route.ts — 139 tokens (full)
│       │           │   ├── action-route.ts — 385 tokens (full)
│       │           │   └── route.ts — 378 tokens (full)
│       │           └── route.ts — 393 tokens (full)
│       ├── auth/
│       │   ├── logout/
│       │   │   └── route.ts — 264 tokens (full)
│       │   ├── me/
│       │   │   └── route.ts — 218 tokens (full)
│       │   ├── nonce/
│       │   │   └── route.ts — 232 tokens (full)
│       │   └── verify/
│       │       └── route.ts — 712 tokens (full)
│       ├── character/
│       │   ├── [tokenId]/
│       │   │   ├── concords/
│       │   │   │   └── route.ts — 242 tokens (full)
│       │   │   └── route.ts — 243 tokens (full)
│       │   └── route.ts — 114 tokens (full)
│       ├── characters/
│       │   ├── [tokenId]/
│       │   │   ├── concords/
│       │   │   │   └── route.ts — 242 tokens (full)
│       │   │   ├── events/
│       │   │   │   └── route.ts — 521 tokens (full)
│       │   │   ├── searing/
│       │   │   │   ├── preview/
│       │   │   │   │   └── route.ts — 740 tokens (full)
│       │   │   │   ├── sync/
│       │   │   │   │   └── route.ts — 559 tokens (full)
│       │   │   │   └── route.ts — 478 tokens (full)
│       │   │   ├── staking/
│       │   │   │   └── route.ts — 457 tokens (full)
│       │   │   └── route.ts — 219 tokens (full)
│       │   ├── alignments/
│       │   │   └── route.ts — 157 tokens (full)
│       │   ├── origins/
│       │   │   └── route.ts — 153 tokens (full)
│       │   ├── staking-status/
│       │   │   └── route.ts — 1,193 tokens (full)
│       │   ├── traits/
│       │   │   └── [traitType]/
│       │   │       └── route.ts — 342 tokens (full)
│       │   └── route.ts — 92 tokens (full)
│       ├── concords/
│       │   ├── owned/
│       │   │   └── route.ts — 1,811 tokens (full)
│       │   └── searing-map/
│       │       ├── [concordId]/
│       │       │   └── route.ts — 638 tokens (full)
│       │       └── route.ts — 704 tokens (full)
│       ├── eliza/
│       │   ├── auth/
│       │   │   ├── nonce/
│       │   │   │   └── route.ts — 956 tokens (full)
│       │   │   ├── verify/
│       │   │   │   └── route.ts — 1,413 tokens (full)
│       │   │   └── route.ts — 334 tokens (full)
│       │   ├── characters/
│       │   │   └── [tokenId]/
│       │   │       ├── export/
│       │   │       │   └── route.ts — 477 tokens (full)
│       │   │       ├── import/
│       │   │       │   └── route.ts — 1,135 tokens (full)
│       │   │       ├── knowledge/
│       │   │       │   ├── [documentId]/
│       │   │       │   │   └── route.ts — 1,305 tokens (full)
│       │   │       │   └── route.ts — 1,620 tokens (full)
│       │   │       └── route.ts — 1,906 tokens (full)
│       │   ├── chat/
│       │   │   └── route.ts — 1,997 tokens (full)
│       │   ├── conversations/
│       │   │   ├── [conversationId]/
│       │   │   │   └── route.ts — 1,480 tokens (full)
│       │   │   └── route.ts — 1,113 tokens (full)
│       │   └── location-rooms/
│       │       └── [locationId]/
│       │           ├── tick/
│       │           │   └── route.ts — 625 tokens (full)
│       │           └── route.ts — 240 tokens (full)
│       ├── locations/
│       │   ├── [id]/
│       │   │   └── route.ts — 567 tokens (full)
│       │   └── route.ts — 348 tokens (full)
│       ├── lore/
│       │   └── submissions/
│       │       ├── [submissionId]/
│       │       │   └── route.ts — 407 tokens (full)
│       │       ├── route.ts — 322 tokens (full)
│       │       └── shared.ts — 696 tokens (full)
│       └── sync/
│           ├── eliza-location-rooms/
│           │   └── route.ts — 495 tokens (full)
│           └── staking/
│               └── route.ts — 450 tokens (full)
├── components/
│   ├── admin/
│   │   ├── lore-canonization/
│   │   │   ├── LoreCanonizationAdminContainer.tsx — 1,557 tokens (full)
│   │   │   └── types.ts — 259 tokens (full)
│   │   └── lore-submissions/
│   │       ├── LoreSubmissionAdminDetail.tsx — 2,217 tokens (full)
│   │       ├── LoreSubmissionCurationForm.tsx — 2,537 tokens (full)
│   │       ├── LoreSubmissionPublishControls.tsx — 878 tokens (full)
│   │       ├── LoreSubmissionReviewLog.tsx — 431 tokens (full)
│   │       ├── LoreSubmissionReviewPanel.tsx — 921 tokens (full)
│   │       ├── LoreSubmissionsAdminQueue.tsx — 1,781 tokens (full)
│   │       └── types.ts — 72 tokens (full)
│   ├── lore/
│   │   └── submissions/
│   │       ├── LoreSubmissionForm.tsx — 3,355 tokens (full)
│   │       ├── MarkdownEditor.tsx — 565 tokens (full)
│   │       ├── MarkdownPreview.tsx — 145 tokens (full)
│   │       ├── SourceUrlListEditor.tsx — 1,556 tokens (full)
│   │       ├── SubmissionStatusBadge.tsx — 348 tokens (full)
│   │       ├── UserSubmissionDetail.tsx — 2,294 tokens (full)
│   │       └── UserSubmissionsList.tsx — 1,420 tokens (full)
│   ├── searing/
│   │   └── SearingPageClient.tsx — 5,374 tokens (full)
│   └── searing-map-editor/
│       └── SearingMapEditorContainer.tsx — 4,066 tokens (full)
├── hooks/
│   ├── map/
│   │   ├── useLocationApi.ts — 863 tokens (full)
│   │   ├── useLocationRoom.ts — 1,656 tokens (full)
│   │   └── useMapData.ts — 1,492 tokens (full)
│   ├── staking/
│   │   └── post-transaction-sync.ts — 1,232 tokens (full)
│   ├── useAICharacter.ts — 1,644 tokens (full)
│   ├── useCharacterChat.ts — 1,901 tokens (full)
│   ├── useCharacterDetailData.ts — 327 tokens (full)
│   ├── useCharacterSave.ts — 553 tokens (full)
│   ├── useCharacterTxHistory.ts — 1,072 tokens (full)
│   ├── useConversations.ts — 2,527 tokens (full)
│   ├── useCurrentUser.ts — 335 tokens (full)
│   ├── useElizaAuth.ts — 1,917 tokens (full)
│   ├── useKnowledgeUpload.ts — 869 tokens (full)
│   ├── useOwnedCharacters.ts — 1,273 tokens (full)
│   ├── useSearingConcords.ts — 1,773 tokens (full)
│   └── useStakingStatuses.ts — 1,679 tokens (full)
├── lib/
│   └── api/
│       ├── handlers/
│       │   ├── character-list.ts — 803 tokens (full)
│       │   └── character-update.ts — 1,590 tokens (full)
│       ├── auth.ts — 333 tokens (full)
│       ├── client-response.ts — 170 tokens (full)
│       ├── client.ts — 913 tokens (full)
│       ├── endpoints.ts — 1,161 tokens (full)
│       ├── errors.ts — 267 tokens (full)
│       ├── index.ts — 90 tokens (full)
│       ├── params.ts — 1,475 tokens (full)
│       └── responses.ts — 1,129 tokens (full)
├── tests/
│   ├── api/
│   │   ├── eliza/
│   │   │   ├── auth-routes.test.ts — 1,852 tokens (full)
│   │   │   ├── conversations.test.ts — 3,567 tokens (full)
│   │   │   ├── knowledge-routes.test.ts — 2,582 tokens (full)
│   │   │   └── location-room-routes.test.ts — 2,450 tokens (full)
│   │   ├── admin-lore-canonization-route.test.ts — 1,195 tokens (full)
│   │   ├── character-nested-routes.test.ts — 1,392 tokens (full)
│   │   ├── characters-route.test.ts — 1,573 tokens (full)
│   │   └── lore-submissions-route.test.ts — 2,508 tokens (full)
│   ├── components/
│   │   └── admin/
│   │       └── lore-canonization-admin-container.test.tsx — 600 tokens (full)
│   └── hooks/
│       ├── useKnowledgeUpload.test.ts — 2,311 tokens (full)
│       ├── useLocationRoom.test.tsx — 532 tokens (full)
│       └── useStakingStatuses.test.tsx — 1,262 tokens (full)
└── package.json — 980 tokens (full)


---

## Generated Plan

## Chat Send ✅
- **Chat**: `api-fetch-plan-FC8EE0` | **Mode**: plan

### Response
## 1. **Summary**

Standardize API/fetch handling with a targeted, staged refactor: first introduce explicit client-side response/request helpers that distinguish **raw route contracts** from `{ success, data }` **envelope contracts**, then migrate repeated client fetch call sites by route family, consolidate `lib/api/endpoints.ts`, and only afterward opportunistically replace server-side `NextResponse.json(...)` calls with existing response helpers where the response body shape stays identical. This avoids a risky full API contract migration while reducing duplicated parsing, inconsistent error messages, and ad hoc fetch handling.

---

## 2. **Current-state analysis**

### Relevant architecture

- `lib/api/responses.ts` is the server compatibility boundary:
  - Raw helpers: `jsonRaw`, `jsonRawError`, `jsonNoStore`, `jsonNoStoreError`.
  - Envelope helpers: `jsonOk`, `jsonCreated`, `jsonDeleted`, `jsonError`, etc.
- Route contracts are intentionally mixed:
  - Envelope routes:
    - `app/api/lore/submissions/**`
    - `app/api/admin/lore/submissions/**`
    - `app/api/locations/**`
  - Raw routes:
    - `app/api/characters/**`, `app/api/character/**`
    - `app/api/concords/**`
    - `app/api/eliza/**`
    - `app/api/auth/**`
    - `app/api/sync/**`
    - `app/api/admin/lore/canonization/**`
- `lib/api/client-response.ts` currently only supports envelope responses through `readApiData<T>()`.
- `lib/api/client.ts` has an `ApiClient`, but:
  - It returns parsed response bodies as-is.
  - It only treats HTTP non-OK as errors.
  - It does not understand envelope `success: false`.
  - It always sets `Content-Type: application/json`, which is unsafe for `FormData`.
- Client components/hooks mostly bypass `ApiClient` and duplicate fetch/error logic.

### Blocking issue

The app cannot safely switch all APIs to `{ success, data }` because many selected tests and consumers assert raw domain bodies, for example:

- `/api/characters` returns `{ characters, hasMore, totalCount }`.
- `/api/auth/me` returns raw session data or raw `{ error }`.
- `/api/concords/searing-map` returns `{ searingMap, total, count, ... }`.
- `/api/eliza/*` returns raw domain/error bodies and includes streaming/blob endpoints.
- `/api/sync/staking` returns `{ results, error? }`.

Therefore, response shape must be an **explicit client option**, not inferred or globally changed.

### Reusable code

Reuse and extend:

- `ApiResponse<T>` and envelope conventions from `lib/api/responses.ts`.
- Existing `ApiError` concept from `lib/api/client.ts`.
- Existing `readApiData<T>()` behavior for lore components, but rename/alias it into a more explicit envelope reader.
- Existing route helpers rather than adding new server response abstractions.

---

## 3. **Design**

### 3.1 Targeted refactor, not broad contract migration

This is best solved as a targeted compatibility refactor because route response shapes are existing contracts and are covered by tests. A broad migration to envelopes would require coordinated updates across characters, Eliza, searing, staking, auth, sync, and tests, with high breakage risk and little immediate user-facing value.

The standard becomes:

| Route type | Server response | Client reader |
|---|---|---|
| Raw JSON/domain | Existing raw body | `readApiRaw<T>()` / `apiFetchRaw<T>()` |
| Envelope JSON | `{ success, data, error, details }` | `readApiEnvelope<T>()` / `apiFetchEnvelope<T>()` |
| Empty/envelope delete | `{ success, message }` | envelope helper with `requireData: false` |
| Blob/download | Custom fetch or `apiFetchBlob()` |
| SSE/stream | Custom fetch; do not use JSON helper |
| FormData upload | `apiFetchRaw()` with `body: FormData`, no JSON content type |

---

### 3.2 Client helper API

#### Modify `lib/api/client-response.ts`

Expand it from an envelope-only reader into the canonical client response parser.

Add/standardize these concepts:

```ts
type ApiResponseShape = 'raw' | 'envelope'

interface ApiReadOptions {
  fallbackMessage: string
  requireData?: boolean
}
```

Planned exported helpers:

```ts
readApiRaw<T>(
  response: Response,
  fallbackMessage: string
): Promise<T>

readApiEnvelope<T>(
  response: Response,
  fallbackMessage: string,
  options?: { requireData?: boolean }
): Promise<T>

readApiData<T>(
  response: Response,
  fallbackMessage: string
): Promise<T>
```

Compatibility:

- Keep `readApiData<T>()` as an alias/wrapper around `readApiEnvelope<T>()`.
- Existing lore UI imports keep working during early stages.

Error extraction rules:

1. If body has `details` array, join with `\n`.
2. Else if body has string `details`, use it.
3. Else if body has string `error`, use it.
4. Else if body has string `message`, use it.
5. Else if body is plain text, use text.
6. Else use `fallbackMessage`.

Envelope success rules:

- Throw if `!response.ok`.
- Throw if `body.success !== true`.
- Throw if `requireData !== false` and `body.data === undefined`.
- Return `body.data` when data is required.
- Return `undefined as T` when `requireData: false`.

Raw success rules:

- Throw if `!response.ok`.
- Return parsed JSON body for JSON responses.
- Return text for non-JSON responses when typed as `string`.
- Throw fallback error if JSON parsing fails for a JSON response.

#### Add shared error type

Prefer adding a small shared file:

`lib/api/client-errors.ts`

Shape:

```ts
class ApiError extends Error {
  status: number
  statusText: string
  data?: unknown
}
```

Then:

- Move or re-export the existing `ApiError` from `lib/api/client.ts`.
- `readApiRaw` and `readApiEnvelope` throw `ApiError`.
- UI can still display `error.message`.

This preserves current catch behavior while enabling status-specific handling, especially for `401`.

---

### 3.3 Request helper API

#### Modify `lib/api/client.ts`

Keep `ApiClient` but make it explicitly shape-aware.

Extend `RequestConfig`:

```ts
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>
  responseShape?: 'raw' | 'envelope'
  fallbackMessage?: string
  requireData?: boolean
  json?: unknown
  parseAs?: 'json' | 'text' | 'blob' | 'response'
}
```

Behavior:

- Default `responseShape` remains `'raw'` for backward compatibility.
- `json` serializes to JSON and sets `Content-Type: application/json`.
- Existing `body` is passed through unchanged.
- If `body` is `FormData`, do **not** set `Content-Type`.
- `parseAs: 'response'` returns the raw `Response` for streaming/manual handling.
- `parseAs: 'blob'` supports export/download flows.
- `fallbackMessage` defaults to `'Request failed'`.

Expose convenience methods without breaking existing calls:

```ts
apiClient.get<T>(endpoint, config?)
apiClient.post<T>(endpoint, body?, config?)
apiClient.patch<T>(endpoint, body?, config?)
apiClient.delete<T>(endpoint, config?)

apiClient.getEnvelope<T>(endpoint, config?)
apiClient.postEnvelope<T>(endpoint, body?, config?)
```

The envelope convenience methods are additive; existing raw default behavior stays intact.

---

### 3.4 Client migration strategy

#### Stage A — envelope routes first

Migrate call sites already expecting envelopes:

- Lore submission user/admin UI.
- Location CRUD hook.

Use `apiClient.*Envelope()` or `apiFetchEnvelope()` equivalent.

Important edge case:

- `DELETE /api/locations/[id]` returns `jsonDeleted()`, which has no `data`.
- Use `requireData: false`.

#### Stage B — low-risk raw JSON routes

Migrate repeated raw JSON patterns:

- Character list/detail/save/history hooks.
- Current user session hook.
- Staking status hook.
- Searing concord and map-editor hooks/components.
- Admin lore canonization UI.

Keep route body contracts unchanged.

#### Stage C — special raw routes

Handle carefully or leave custom:

- `hooks/useKnowledgeUpload.ts`
  - Use helper only after `fetch()`.
  - Preserve `FormData`.
- `hooks/useAICharacter.ts`
  - Use raw helper for JSON APIs.
  - Keep export blob flow custom or use `parseAs: 'blob'`.
- `hooks/useCharacterChat.ts`
  - Keep streaming request custom.
  - Only non-OK JSON error parsing may use shared error extraction.
- `components/searing/SearingPageClient.tsx`
  - Keep existing `readSearingSyncResponse()` unless verified compatible, because it maps domain-specific searing sync statuses.

---

### 3.5 Server route helper alignment

Server changes must preserve body shapes.

Rules:

- Do **not** convert raw routes to envelopes.
- Replace direct `NextResponse.json(body, init)` with:
  - `jsonRaw(body, init)` when cache headers are unchanged.
  - `jsonNoStore(body, init)` for session/user/chain/sync/dynamic data.
  - `jsonRawError(error, status)` or `jsonNoStoreError(error, status)` when current body is exactly `{ error }`.
- Keep envelope routes using `jsonOk`, `jsonCreated`, `jsonDeleted`, `jsonError`.
- Do not touch binary/streaming responses except for error paths where shape is already `{ error }`.

---

## 4. **File-by-file impact**

### Core helpers

| File | Changes | Why | Depends on |
|---|---|---|---|
| `lib/api/client-errors.ts` | Add shared `ApiError` class and error-message extraction utility. | Avoid duplicating error behavior between `ApiClient` and response readers. | None |
| `lib/api/client-response.ts` | Add `readApiRaw`, `readApiEnvelope`; keep `readApiData` alias. Use shared `ApiError`. | Explicit raw/envelope parsing. | `client-errors.ts` |
| `lib/api/client.ts` | Support `responseShape`, `fallbackMessage`, `requireData`, `json`, `parseAs`, FormData-safe headers, envelope convenience methods. | Central typed request path. | `client-response.ts`, `client-errors.ts` |
| `lib/api/endpoints.ts` | Replace direct fetches with `apiClient`; classify every method as raw or envelope. Fix/validate `getCharacterConcords` return shape. | Make facade consistent. | Updated `ApiClient` |
| `lib/api/responses.ts` | Add comments documenting raw vs envelope helper policy; no contract changes. | Prevent future accidental wrapping. | None |

---

### Envelope client call sites

| File | Changes |
|---|---|
| `hooks/map/useLocationApi.ts` | Replace repeated fetch/JSON/error logic with envelope client calls. Use `requireData: false` for `remove()`. |
| `components/lore/submissions/LoreSubmissionForm.tsx` | Switch from `readApiData` to explicit `readApiEnvelope` or `apiClient` envelope helper. Preserve UI messages. |
| `components/lore/submissions/UserSubmissionDetail.tsx` | Same; keep mounted guard. |
| `components/lore/submissions/UserSubmissionsList.tsx` | Same; preserve authenticated-only fetch. |
| `components/admin/lore-submissions/LoreSubmissionAdminDetail.tsx` | Same. |
| `components/admin/lore-submissions/LoreSubmissionCurationForm.tsx` | Same for PATCH. |
| `components/admin/lore-submissions/LoreSubmissionPublishControls.tsx` | Same for action POSTs. |
| `components/admin/lore-submissions/LoreSubmissionReviewPanel.tsx` | Same for review POST. |
| `components/admin/lore-submissions/LoreSubmissionsAdminQueue.tsx` | Same for admin list. |

---

### Raw client call sites

| File | Changes |
|---|---|
| `components/admin/lore-canonization/LoreCanonizationAdminContainer.tsx` | Replace local `extractErrors` with raw helper/error extraction while preserving `{ events }`, `{ event }`, `{ error, details }` contract. |
| `hooks/useOwnedCharacters.ts` | Use raw helper for `/api/characters`; keep abort behavior and defensive wallet filter. |
| `hooks/useCharacterDetailData.ts` | Use raw helper for `/api/characters/[tokenId]`; preserve toast behavior. |
| `hooks/useCharacterSave.ts` | Use raw helper for PATCH; preserve validation-details display. |
| `hooks/useCharacterTxHistory.ts` | Use raw helper for `/events`; keep request ID race protection. |
| `hooks/useCurrentUser.ts` | Use raw helper but keep special `401 => user null` behavior by checking status before throwing. |
| `hooks/useStakingStatuses.ts` | Use raw helper for `/staking-status`; preserve abort handling and `result.error` semantic. |
| `hooks/staking/post-transaction-sync.ts` | Centralize raw response parsing but preserve custom partial-failure logic around `results`. |
| `hooks/useSearingConcords.ts` | Use raw helper for searing map and owned balances; preserve bigint conversion. |
| `components/searing-map-editor/SearingMapEditorContainer.tsx` | Use raw helper for load/save/delete; preserve editor-specific validation. |
| `hooks/map/useLocationRoom.ts` | Use shared raw error extraction for public room and tick responses; keep polling/abort logic. |
| `hooks/useAICharacter.ts` | Use raw helper for JSON GET/PUT/import error paths; keep blob export flow custom or `parseAs: 'blob'`. |
| `hooks/useKnowledgeUpload.ts` | Keep manual `fetch` with `FormData`; use raw reader for JSON success/error. |
| `hooks/useConversations.ts` | Use raw helper for list/detail/delete; preserve pagination state. |
| `hooks/useElizaAuth.ts` | Use raw helper for nonce/verify/status JSON; preserve status-specific 401 handling. |
| `hooks/useCharacterChat.ts` | Do not convert streaming body; optionally reuse shared error extraction only for non-OK response JSON. |

---

### Server helper alignment candidates

| File | Changes |
|---|---|
| `app/api/admin/lore/canonization/shared.ts` | Use `jsonRawError` for existing `{ error, details? }` shapes where compatible. |
| `app/api/admin/lore/canonization/route.ts` | Replace success `NextResponse.json({ events, count })` with `jsonRaw`. |
| `app/api/admin/lore/canonization/[eventId]/route.ts` | Replace success responses with `jsonRaw`. |
| `app/api/admin/lore/canonization/[eventId]/publish/route.ts` | Replace success response with `jsonRaw`. |
| `app/api/auth/nonce/route.ts` | Replace direct success/error responses with `jsonRaw`/`jsonRawError`; preserve `{ nonce }`. |
| `app/api/auth/logout/route.ts` | Replace direct success/error responses with `jsonRaw`/`jsonRawError`; preserve `{ success: true }`. |
| `app/api/characters/alignments/route.ts` | Replace direct responses with raw helpers. |
| `app/api/characters/origins/route.ts` | Same. |
| `app/api/characters/traits/[traitType]/route.ts` | Same. |
| `app/api/characters/[tokenId]/concords/route.ts` | Same; preserve `{ concords }`. |
| `app/api/character/[tokenId]/concords/route.ts` | Same; preserve alias behavior. |
| `app/api/concords/owned/route.ts` | Replace direct JSON with raw/no-store helper if desired; preserve `{ balances, count }`. |
| `app/api/concords/searing-map/route.ts` | Replace direct JSON with raw helpers; preserve `{ searingMap, total, count, ... }`. |
| `app/api/concords/searing-map/[concordId]/route.ts` | Replace direct JSON with raw helpers; preserve `{ searingMap }` / `{ message }`. |
| `app/api/sync/eliza-location-rooms/route.ts` | Replace direct JSON with `jsonRaw`; preserve sync body. |

Do not initially modify:

- `app/api/eliza/chat/route.ts` streaming response.
- `app/api/eliza/characters/[tokenId]/export/route.ts` blob/download response.
- Any route where helper replacement would require reshaping typed union responses.

---

## 5. **Risks and migration**

### Main risks

1. **Accidentally reading raw routes as envelopes**
   - Mitigation: helper requires explicit raw/envelope mode.
   - Tests: route contract tests for characters, Eliza, lore, canonization.

2. **Breaking `FormData` uploads**
   - Mitigation: request helper must not set `Content-Type` for `FormData`.
   - Tests: `tests/hooks/useKnowledgeUpload.test.ts`.

3. **Breaking stream/blob routes**
   - Mitigation: keep chat streaming and export download custom in first migration.

4. **Changing route body shapes during server cleanup**
   - Mitigation: only replace `NextResponse.json` with helper calls that emit identical bodies.
   - Tests: existing route contract suites.

5. **Auth 401 behavior**
   - Mitigation: hooks like `useCurrentUser`, `useElizaAuth`, and conversations must still branch on `response.status` where 401 is a valid state.

### No persistence migration

No database schemas, stored data, or serialized domain records change.

---

## 6. **Implementation order**

1. **Add core client parsing tests**
   - Add tests for:
     - raw success
     - raw `{ error }`
     - raw `{ message }`
     - envelope success
     - envelope `success: false`
     - envelope `details: string[]`
     - `requireData: false`
     - malformed JSON fallback
     - `ApiError.status`

2. **Implement helper layer atomically**
   - Add `lib/api/client-errors.ts`.
   - Expand `lib/api/client-response.ts`.
   - Update `lib/api/client.ts`.
   - Keep `readApiData()` compatibility export.

3. **Migrate envelope UI call sites**
   - Location CRUD first.
   - Lore user/admin components second.
   - Run:
     - `npm test -- tests/api/lore-submissions-route.test.ts`
     - relevant component tests.

4. **Migrate low-risk raw hooks**
   - Character hooks.
   - Current user hook.
   - Staking/searing concord hooks.
   - Preserve abort/request ID guards.
   - Run:
     - `npm test -- tests/api/characters-route.test.ts`
     - `npm test -- tests/api/character-nested-routes.test.ts`
     - `npm test -- tests/hooks/useStakingStatuses.test.tsx`

5. **Migrate Eliza JSON clients carefully**
   - Conversations, AI character, Eliza auth, knowledge upload.
   - Leave chat stream custom.
   - Run:
     - `npm test -- tests/api/eliza/auth-routes.test.ts`
     - `npm test -- tests/api/eliza/conversations.test.ts`
     - `npm test -- tests/api/eliza/knowledge-routes.test.ts`
     - `npm test -- tests/hooks/useKnowledgeUpload.test.ts`

6. **Consolidate `lib/api/endpoints.ts`**
   - Use `apiClient` consistently.
   - Fix any discovered facade type mismatches without changing route contracts.

7. **Opportunistic server helper cleanup**
   - Start with admin canonization and simple metadata routes.
   - Then auth nonce/logout and concord routes.
   - Do not touch streaming/blob responses.
   - Run route contract tests after each family.

8. **Final verification**
   - `npm test`
   - `npm run build`
   - `npm run lint` if currently supported by project config.
   - Manually verify:
     - wallet auth/sign-in flow
     - lore submission create/revise/admin action
     - character list/detail/save
     - searing concord loading
     - Eliza auth/conversations/knowledge upload
     - location room public read/manual tick.


---

## Orchestrator Progress

- [x] Item 1: Core API helper layer and targeted tests implemented.
  - Added shared `ApiError`/error extraction, raw/envelope response readers, expanded `ApiClient`, compatibility alias `readApiData`, and response-helper policy comments.
  - Verified by sub-agent with `bun run test -- tests/unit/api-client-response.test.ts` passing.
  - Full `tsc --noEmit` still has unrelated pre-existing failures noted by the agent.
- [x] Item 2: Migrate envelope route client call sites.
  - Migrated location CRUD and lore submission user/admin UI to `apiClient.*Envelope` while leaving the intentional `checkStakedCharacters` fallback fetch unchanged.
  - Verified no remaining `fetch(` / `readApiData` in targeted lore submission files.
  - Sub-agent verified `bun run test -- tests/api/lore-submissions-route.test.ts tests/components/admin/lore-submission-publish-controls.test.tsx tests/unit/api-client-response.test.ts` passing.
- [x] Item 3: Migrate low-risk raw route client call sites.
  - Migrated character/current-user/staking-sync/searing-concord/map-editor raw JSON parsing to `readApiRaw`/raw helper flow while preserving route body shapes.
  - Preserved `401 => user null`, abort/request guards, bigint conversions, and staking sync partial-failure handling.
  - Sub-agent verified `bun run test -- tests/api/characters-route.test.ts tests/api/character-nested-routes.test.ts tests/hooks/useStakingStatuses.test.tsx tests/unit/api-client-response.test.ts` passing.
- [x] Item 4: Migrate Eliza/special-case JSON clients while preserving stream/blob/FormData behavior.
  - Migrated Eliza JSON parsing/error paths in AI character, conversations, auth, knowledge upload, location rooms, and chat error handling to raw helpers.
  - Preserved SSE chat stream, blob export, FormData upload, polling/abort/no-store behavior, and status-specific auth branches.
  - Sub-agent verified targeted Eliza/hook tests plus API helper tests passing (`64/64`).
- [x] Item 5: Consolidate `lib/api/endpoints.ts` and opportunistically align server route response helpers without changing contracts.
  - Consolidated `lib/api/endpoints.ts` onto `apiClient` and replaced direct `NextResponse.json` in scoped simple raw route families with `jsonRaw`/`jsonRawError`/no-store helpers where shape-identical.
  - Verified scoped search found no remaining `NextResponse.json` / facade `fetch()` in item-5 target files.
  - Oracle review found one P1 raw error-message precedence issue; fixed by making raw readers prefer human `message` over machine `error` while preserving envelope precedence.
  - Final targeted verification passed: 13 suites, 114 tests.

> 💡 Continue this plan conversation with ask_oracle(chat_id: "api-fetch-plan-FC8EE0", new_chat: false)