# elizaOS Persona Assistant: Plan

## Goal

Add a chat-first assistant inside `/characters/[tokenId]` that helps an owner generate editable elizaOS AI persona boilerplate for their WAGDIE character. The assistant should produce only user-managed persona values, show a review/apply step, and save approved values through the existing AI persona editor/API path.

## Orchestration Progress

- [x] Phase A — Backend assistant contract, policy, completion helper, service, and owner-gated route (plan items 1–4).
- [x] Phase B — Editor snapshot/apply support and assistant client hook (plan items 5–6).
- [x] Phase C — Assistant UI and `AIPersonaTab` integration (plan items 7–8).
- [x] Phase D — API spec, focused tests, and final validation (plan items 9–10).

## Background

- User direction from the up-front checkpoint: the assistant belongs on `/characters/[tokenId]`; it should be chat-first, generate boilerplate users can edit, and edit the actual AI persona values only after the user approves the character. Scope is user-managed persona fields only, not backend/admin-owned fields.
- The character detail page parses `tokenId`, loads both the base WAGDIE character and the linked AI persona, derives owner/admin permissions, and renders `CharacterSheetLayout`; the existing chat button opens `ChatDock` with `tokenId`, `characterName`, and `aiCharacter?.id` at `app/characters/[tokenId]/page.tsx:35-49` and `app/characters/[tokenId]/page.tsx:142-169`.
- `CharacterSheetLayout` already has an `ai-persona` tab and a chat action prop. It renders `AIPersonaTab` with `tokenId`, `isOwner`, `characterName`, and `characterBackstory`, making the AI persona tab the natural entry point for a persona-writing assistant: `components/characters/detail/CharacterSheetLayout.tsx:20-56` and `components/characters/detail/CharacterSheetLayout.tsx:229-264`.
- `AIPersonaTab` owns the AI persona editor lifecycle: it loads `useAICharacter(tokenId)`, initializes `useAIPersonaEditor(tokenId, aiCharacter, isLoading)`, coordinates knowledge uploads, builds the save payload with `editor.getUpdateInput()`, calls `saveAICharacter(updateData)`, and clears the local draft after a successful save: `components/characters/ai-editor/AIPersonaTab.tsx:40-89`.
- `useAIPersonaEditor` centralizes editable persona state for identity, behavior, examples, advanced fields, local draft persistence under `wagdie-ai-draft-${tokenId}`, field setters, and conversion to `UpdateAICharacterInput`: `hooks/useAIPersonaEditor.ts:18-24`, `hooks/useAIPersonaEditor.ts:28-68`, and `hooks/useAIPersonaEditor.ts:270-364`.
- `useAICharacter` persists approved edits through `PUT /api/eliza/characters/${tokenId}` and requires a connected wallet before saving: `hooks/useAICharacter.ts:40-109`.
- `PUT /api/eliza/characters/[tokenId]` authorizes owner/admin mutation, validates the payload with `validatePutCharacterSheetUpdate`, merges into an existing Eliza record or creates a new record with WAGDIE defaults, then returns an `AICharacter` DTO: `app/api/eliza/characters/[tokenId]/route.ts:78-217`.
- `character-sheet-policy` is the write boundary the assistant must respect. Backend-owned paths include IDs, plugins, secrets, model provider/client fields, and migration metadata; user-managed top-level fields include `name`, `username`, `personality`, `backstory`, `system`/`systemPrompt`, `templates`, `settings`, `bio`, `lore`, `topics`, `adjectives`, `style`, `messageExamples`, `postExamples`, and `knowledge`. Safe settings are limited to avatar and `settings.metadata.wagdieUser`: `lib/eliza/character-sheet-policy.ts:24-66` and `lib/eliza/character-sheet-policy.ts:183-238`.
- The app-facing `AICharacter` / `UpdateAICharacterInput` shape already models the elizaOS persona fields the assistant can draft: identity, bio/lore/topics/adjectives/style, message examples, post examples, templates, safe settings, and knowledge metadata: `types/eliza.ts:67-166`.
- Existing chat infrastructure streams authenticated messages through `/api/eliza/chat`, resolves or creates the character record, and normalizes provider output into SSE `token`, `complete`, and `error` events: `app/api/eliza/chat/route.ts:45-214`. The Venice/OpenAI-compatible gateway builds prompts from persona fields and normalizes streaming chunks in `lib/eliza/gateway/venice.ts:109-312`.
- Prior art: `docs/plans/eliza-character-sheet-parity-2026-05-11.md:11-14` documents the existing save path (`AIPersonaTab` → `useAIPersonaEditor.getUpdateInput()` → `useAICharacter.saveAICharacter()` → `PUT /api/eliza/characters/[tokenId]` → mapper/gateway), and `docs/plans/eliza-character-sheet-parity-2026-05-11.md:34-65` records the backend-owned vs user-managed field split.
- Prior art: `docs/investigations/eliza-character-sheets-2026-05-11.md:42-63` summarizes the current app DTO ↔ Eliza-compatible record mapping and notes the current import/export subset behavior.
- Prior art: `specs/016-character-editor-chat/contracts/api.yaml:96-126` defines the existing chat SSE contract, and `specs/017-eliza-persona-editor/contracts/api.yaml:25-55` defines the character upsert contract.
- External elizaOS format research: current elizaOS character/persona config centers on the `Character` interface in `@elizaos/core`; `name` and `bio` are the minimum persona fields, while `system`, `adjectives`, `topics`, `messageExamples`, `postExamples`, `style`, `knowledge`, `plugins`, `settings`, and `secrets` are common extended fields. This project should keep WAGDIE’s user-managed/backend-owned split even though elizaOS itself supports broader character files.

## Approach

Build a targeted, owner-gated persona builder assistant inside the existing AI persona tab. The assistant should use a distinct builder-assistant endpoint rather than `/api/eliza/chat`: the existing chat route is for character roleplay, resolves/creates character records, and streams conversational responses as the character. The new assistant is owner-facing, should produce structured draft data, and must not mutate a persona until the owner explicitly approves the proposal.

The core lifecycle is:

```text
Owner chats with persona assistant
  → owner clicks Generate draft
  → server returns validated proposal with user-managed fields only
  → UI shows proposal in a review card
  → owner clicks Apply to editor
  → proposal is staged in useAIPersonaEditor state only
  → owner reviews normal editor fields
  → owner clicks existing Save AI Persona
  → useAICharacter.saveAICharacter()
  → PUT /api/eliza/characters/[tokenId]
  → validatePutCharacterSheetUpdate()
  → applyWagdieUpdateToAgentCharacter()
  → Eliza-compatible record replace/create
```

This preserves the current authorization, validation, mapper, local draft, and save boundaries. It also keeps the assistant reversible: before **Apply to editor**, generated data is only a pending proposal; after **Apply to editor**, generated data is only an unsaved editor draft; persistence remains the existing explicit save action.

### Assistant contract

Add a new route:

```text
POST /api/eliza/characters/[tokenId]/persona-assistant
```

Use a JSON contract with two modes:

- `mode: 'chat'`: returns a natural-language assistant message and no proposal.
- `mode: 'generate'`: returns a concise assistant message plus a validated `proposal`; the proposal remains pending until the owner applies it.

Initial response shape should stay simple and type-safe:

```ts
type PersonaAssistantMode = 'chat' | 'generate'

type PersonaAssistantMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

type PersonaAssistantEditableDraft = {
  username?: string | null
  backstory?: string | null
  system?: string | null
  bio?: string[]
  lore?: string[]
  topics?: string[]
  adjectives?: string[]
  style?: StyleConfig
  exampleMessages?: ExampleMessage[]
  postExamples?: string[]
  templates?: CharacterTemplates
  settings?: SafeCharacterSettings
}

type PersonaAssistantRequest = {
  mode: PersonaAssistantMode
  messages: PersonaAssistantMessage[]
  editorSnapshot: PersonaAssistantEditableDraft
}

type PersonaAssistantResponse = {
  assistantMessage: PersonaAssistantMessage
  proposal?: PersonaAssistantEditableDraft
  warnings: string[]
}
```

Prefer non-streaming JSON for the first implementation. Structured proposal validation is more important than token-by-token UX, and a single response avoids fragile streamed JSON parsing. Streaming can be added later without changing the review/apply/save lifecycle.

### Assistant field policy

Use a narrower assistant allowlist than the general `PUT` route. The general route can accept compatibility fields, imports, and other user-managed data; the assistant should draft only fields that are safe and useful for boilerplate generation.

Allowed assistant proposal fields:

- `username`
- `backstory`
- canonical `system`
- `bio`
- `lore`
- `topics`
- `adjectives`
- `style`
- `exampleMessages`
- `postExamples`
- `templates`
- `settings.avatar`
- `settings.metadata.wagdieUser`

Excluded from assistant proposals:

- `name` — keep WAGDIE display identity separate.
- `personality` — deprecated compatibility field; use `bio`/`backstory`/`system` instead.
- `knowledge` — upload-managed, not generated by chat.
- `systemPrompt` — UI/internal compatibility alias; assistant emits canonical `system`, and the editor maps it internally.
- All backend-owned fields: IDs, external IDs, plugins, secrets, model providers, clients, runtime config, and migration metadata.

Validation should fail closed with explicit semantics: backend-owned fields and hard-excluded assistant fields (`name`, `personality`, `knowledge`, IDs, plugins, secrets, providers, clients, runtime/migration metadata) invalidate the proposal after at most one corrective retry; do not silently return them. Compatibility aliases may be normalized with warnings only when unambiguous: `systemPrompt` can map to canonical `system` if no `system` exists, and Eliza-style `messageExamples` can map to app-facing `exampleMessages` only if it matches the supported structure. Unknown non-alias fields should be rejected rather than stripped silently so tests and UI warnings stay predictable.

### Server design

Add a focused service, likely `lib/eliza/persona-assistant.ts`, that builds prompts from authorized WAGDIE character context, the current editor snapshot, the assistant transcript, field limits, and the assistant allowlist. The route should pass the successful `authorizeElizaCharacterMutation(tokenId)` result into the service — especially `authorization.character`, `authorization.externalId`, `authorization.tokenId`, `authorization.address`, and `authorization.isAdmin` from `lib/eliza/routeAuth.ts:5-14` and `lib/eliza/routeAuth.ts:45-58` — so implementers do not have to guess whether to reload WAGDIE character context. The service should call an OpenAI-compatible completion helper, parse model output, validate/sanitize the proposal, and return only safe fields.

Add a non-streaming completion helper to `lib/eliza/gateway/venice.ts` (or the adjacent gateway layer) that reuses existing inference config, URL construction, headers, timeout/abort behavior, and error parsing. If inference is not configured, the route should return `503` with an `ASSISTANT_UNAVAILABLE` error rather than falling back to character chat.

The route should authorize with the same ownership/admin boundary as persona mutation (`authorizeElizaCharacterMutation(tokenId)`), but it should not create, replace, or mutate Eliza records. It only returns assistant chat text and an optional pending proposal.

### Client design

Add `hooks/usePersonaAssistant.ts` to manage assistant transcript, pending proposal, loading/error state, and endpoint calls. Keep assistant state ephemeral for the first pass: in-memory state is sufficient, and `sessionStorage` can be added only if it stays small and does not complicate tests. Do not add durable assistant history or any direct persona mutation. The hook should not call `useAICharacter` or save persona data.

Extend `useAIPersonaEditor` with two assistant-facing methods: `getAssistantSnapshot()` and `applyAssistantDraft(draft)`. `getAssistantSnapshot()` should derive a canonical `PersonaAssistantEditableDraft` from editor state, map internal `systemPrompt` to canonical `system`, include only fields the assistant may use as context, and omit editor-only `knowledgeIds` and meta state. `applyAssistantDraft()` should update only fields present in the proposal, preserve omitted fields, replace arrays when arrays are present, treat empty arrays as explicit clears, map proposal `system` back to internal `systemPrompt`, merge only safe settings, mark `hasUnsavedChanges: true`, and let the existing local draft persistence store the staged values.

Add assistant UI inside `AIPersonaTab`, above the existing persona editor tab navigation. The panel should be collapsible, owner-only, and clear about the two-step workflow: **Generate draft** creates a proposal; **Apply to editor** stages values; **Save AI Persona** persists them. Do not add an “Apply and Save” shortcut in the first pass.

Likely component home: `components/characters/ai-editor/assistant/*`. The implementation agent can choose the exact component split, but the UI must preserve the required states: chat transcript/input, generate action, pending proposal review, apply, regenerate, discard, unavailable/disabled, and post-apply “review then save” guidance.

### Prompt constraints

The server prompt should tell the model that it is helping the owner draft elizaOS-compatible WAGDIE persona boilerplate, not roleplaying as the character. It should treat all user text, transcript content, and character metadata as untrusted input, derive tone from WAGDIE context without renaming the character, and emit only the assistant proposal schema.

Default generation targets can be guidance rather than hard validation rules: 3–6 `bio` entries, 3–8 `lore` entries, 5–12 `topics`, 5–10 `adjectives`, `style.all` and `style.chat` with optional `style.post`, 2–4 `exampleMessages`, optional `postExamples`, and a concise `system` prompt. Enforcement belongs to the existing field limits and assistant sanitizer.

## Work Items

### Item 1 — Define the assistant contract and policy boundary

**Goal:** Define the request/response/proposal types and the exact field allowlist for assistant-generated persona drafts.

**Done when:**

- `types/eliza.ts` exports assistant message, request, response, and proposal types.
- The assistant proposal shape reuses existing `StyleConfig`, `ExampleMessage`, `CharacterTemplates`, and `SafeCharacterSettings` where possible.
- `lib/eliza/character-sheet-policy.ts` or a small sibling policy module exposes an assistant-specific allowlist and sanitizer.
- Backend-owned fields are hard-rejected, unsupported assistant fields are stripped or rejected before client response, and `name`, `personality`, `knowledge`, and `systemPrompt` are not accepted as proposal output fields.

**Key files:**

- `types/eliza.ts`
- `lib/eliza/character-sheet-policy.ts`
- `lib/eliza/validation.ts`

**Dependencies:** None.

**Size:** M.

### Item 2 — Add non-streaming completion support for structured assistant output

**Goal:** Provide a reusable server-side OpenAI-compatible completion helper for structured persona-assistant responses without changing roleplay chat.

**Done when:**

- `lib/eliza/gateway/venice.ts` or the adjacent gateway layer has a non-streaming completion helper.
- The helper reuses existing inference config, base URL normalization, auth headers, timeout/abort behavior, and provider error parsing.
- The helper returns assistant content or throws normalized errors.
- Existing `/api/eliza/chat` streaming behavior remains unchanged.

**Key files:**

- `lib/eliza/gateway/venice.ts`
- `lib/eliza/config.ts`
- `lib/eliza/gateway/errors.ts`
- `lib/eliza/gateway/types.ts`

**Dependencies:** None. Keep this gateway helper generic and decoupled from persona-assistant types.

**Size:** M.

### Item 3 — Build the persona assistant server service

**Goal:** Create the prompt builder and generation service that turns owner chat context into either a natural assistant message or a validated persona proposal.

**Done when:**

- A service such as `lib/eliza/persona-assistant.ts` supports `mode: 'chat'` and `mode: 'generate'`.
- The service builds prompts from authorized WAGDIE character context, current editor snapshot, assistant transcript, field limits, and the assistant allowlist.
- `generate` mode parses model output, retries once or fails closed on invalid JSON/forbidden fields, normalizes only supported aliases with warnings, and returns only a sanitized proposal.
- The service never creates, replaces, or mutates persona records.

**Key files:**

- `lib/eliza/persona-assistant.ts`
- `lib/eliza/character-sheet-policy.ts`
- `lib/eliza/validation.ts`
- `lib/eliza/gateway/venice.ts`
- `types/eliza.ts`

**Dependencies:** Items 1 and 2.

**Size:** L.

### Item 4 — Add the owner-gated persona assistant API route

**Goal:** Expose the assistant under the character route while preserving the project’s owner/admin authorization boundary.

**Done when:**

- `POST /api/eliza/characters/[tokenId]/persona-assistant` exists.
- The route validates `tokenId` and request JSON.
- The route authorizes through `authorizeElizaCharacterMutation(tokenId)` or an equivalent shared owner/admin check.
- The route passes the successful authorization result into the service, using `authorization.character` as the canonical WAGDIE character context for prompting.
- Unauthenticated users receive `401`, non-owners receive `403`, missing characters receive `404`, invalid assistant payloads receive `422`/`400`, and unconfigured inference receives `503` with `ASSISTANT_UNAVAILABLE`.
- Successful responses match the assistant contract and perform no persona persistence.

**Key files:**

- `app/api/eliza/characters/[tokenId]/persona-assistant/route.ts`
- `lib/eliza/routeAuth.ts`
- `lib/eliza/persona-assistant.ts`
- `types/eliza.ts`

**Dependencies:** Item 3.

**Size:** M.

### Item 5 — Add bulk assistant apply support to persona editor state

**Goal:** Let the assistant read a safe editor snapshot and stage approved proposals atomically into existing editable persona state.

**Done when:**

- `useAIPersonaEditor` exposes `getAssistantSnapshot()` and `applyAssistantDraft(draft)`.
- `getAssistantSnapshot()` returns canonical assistant context: internal `systemPrompt` becomes `system`, assistant-excluded fields are omitted, and editor-only/meta fields such as `knowledgeIds`, `hasUnsavedChanges`, and `initialized` are not included.
- Applying a proposal updates only fields present in the draft and preserves omitted fields.
- Arrays replace corresponding editor arrays; empty arrays explicitly clear those arrays.
- Proposal `system` maps to the editor’s internal `systemPrompt` state.
- Safe settings merge conservatively, `hasUnsavedChanges` becomes `true`, and existing `getUpdateInput()` / save behavior remains unchanged.

**Key files:**

- `hooks/useAIPersonaEditor.ts`
- `types/eliza.ts`

**Dependencies:** Item 1.

**Size:** M.

### Item 6 — Add the assistant client hook

**Goal:** Manage the chat transcript, pending proposal, loading/error state, and API calls without saving persona data.

**Done when:**

- `hooks/usePersonaAssistant.ts` exists and supports `sendMessage`, `generateDraft`, `discardProposal`, and `clearConversation`.
- The hook keeps transcript/proposal ephemeral in the first pass; `sessionStorage` is optional, not required, and no durable conversation storage is added.
- The hook submits `mode: 'chat'` and `mode: 'generate'` requests to the new route with the snapshot from `editor.getAssistantSnapshot()`.
- Out-of-order responses cannot overwrite newer assistant state.
- The hook never calls `useAICharacter` or the persona save API.

**Key files:**

- `hooks/usePersonaAssistant.ts`
- `types/eliza.ts`

**Dependencies:** Items 1, 4, and 5.

**Size:** M.

### Item 7 — Build the assistant UI and review/apply flow

**Goal:** Add a chat-first assistant panel and pending-proposal review card inside the AI persona editor experience.

**Done when:**

- Owners see an interactive assistant panel inside the AI persona tab; non-owners do not get an interactive assistant.
- If the wallet/session is not connected, the panel shows a disabled state explaining that connection is required.
- The user can chat, click **Generate draft**, review the returned proposal, apply it to the editor, regenerate, or discard it.
- The proposal review UI does not change editor fields until **Apply to editor** is clicked.
- After apply, the UI explicitly tells the user to review the fields below and click **Save AI Persona** to persist.
- The UI does not include an “Apply and Save” shortcut in the first pass.

**Key files:**

- `components/characters/ai-editor/assistant/*`
- Existing UI primitives used by `components/characters/ai-editor/**` and `components/chat/**`

**Dependencies:** Items 5 and 6.

**Size:** L.

### Item 8 — Integrate the assistant into `AIPersonaTab`

**Goal:** Mount the assistant in the existing editor location without disturbing save, discard, import/export, knowledge upload, or tabbed field editing.

**Done when:**

- `AIPersonaTab` renders `PersonaAssistantPanel` above the existing persona tab navigation.
- The panel receives `tokenId`, `isOwner`, `editor.getAssistantSnapshot`, `editor.applyAssistantDraft`, and relevant loading/saving state.
- Existing save, discard, import, export, knowledge upload/delete, and editor tabs continue to work.
- Applying a proposal stages values into normal editor controls so the user can edit them before saving.

**Key files:**

- `components/characters/ai-editor/AIPersonaTab.tsx`
- `components/characters/ai-editor/index.ts`
- `hooks/useAIPersonaEditor.ts`

**Dependencies:** Item 7.

**Size:** S.

### Item 9 — Update API spec and documentation

**Goal:** Record the finalized endpoint, request/response schemas, errors, and deferred choices.

**Done when:**

- `specs/017-eliza-persona-editor/contracts/api.yaml` documents `/api/eliza/characters/{tokenId}/persona-assistant`.
- Request/response schemas include assistant messages and the proposal fields.
- Error statuses include unauthorized, forbidden, missing character, invalid payload, unavailable inference, and server failure.
- The spec records that non-streaming JSON, ephemeral assistant state, separate review/apply, and separate save are first-pass decisions.

**Key files:**

- `specs/017-eliza-persona-editor/contracts/api.yaml`
- `docs/plans/elizaos-persona-assistant-2026-05-18.md`

**Dependencies:** Item 4.

**Size:** S.

### Item 10 — Add focused tests and validation coverage

**Goal:** Protect the authorization, policy, structured-output, and no-auto-mutation guarantees.

**Done when:**

- Policy tests cover backend-owned rejection, allowed proposal fields, safe settings, and excluded fields such as `name`, `personality`, `knowledge`, `plugins`, and `secrets`.
- API route tests cover unauthenticated, forbidden, invalid payload, unavailable inference, invalid model output, and successful sanitized proposal responses.
- Hook/component tests verify that proposals are not applied automatically, **Apply to editor** mutates editor state only, and persistence remains a separate save action.
- Existing test, typecheck, and lint commands pass.

**Key files:**

- Tests adjacent to `lib/eliza/character-sheet-policy.ts`
- Tests for `app/api/eliza/characters/[tokenId]/persona-assistant/route.ts`
- Tests for `hooks/usePersonaAssistant.ts`
- Tests for `hooks/useAIPersonaEditor.ts`
- Tests for `components/characters/ai-editor/assistant/*`

**Dependencies:** Items 1–8.

**Size:** L.

## Risks and Constraints

- **Invalid or unsafe model output:** validate on the server, retry once with a corrective prompt if desired, and fail closed without returning a proposal if the model still emits invalid JSON or forbidden fields.
- **Confusing generated/staged/saved states:** keep copy explicit. A proposal is not applied; an applied draft is not saved; only **Save AI Persona** persists.
- **Prompt injection:** treat transcript, user input, character metadata, and current editor values as untrusted context. The server-side sanitizer is the authority regardless of model instructions.
- **Inference unavailable:** return `ASSISTANT_UNAVAILABLE` with status `503` and show a disabled/unavailable UI state. Do not silently route through `/api/eliza/chat`.
- **Scope creep into full elizaOS character files:** keep the assistant constrained to WAGDIE user-managed fields even though elizaOS supports plugins, secrets, providers, and other full-character-file fields.
- **No persistence migration:** this feature is additive. Assistant transcript/proposal state is ephemeral client state, with no durable assistant history in the first pass; persona persistence remains the existing route.

## Open Questions

None blocking for implementation. The implementation agent can choose exact prompt phrasing, final component styling, exact assistant component boundaries, and whether the assistant policy lives inside `character-sheet-policy.ts` or a sibling module, as long as the snapshot, sanitizer, ownership, review/apply/save, and no-direct-persistence boundaries in this plan hold.

## References

- `app/characters/[tokenId]/page.tsx`
- `components/characters/detail/CharacterSheetLayout.tsx`
- `components/characters/ai-editor/AIPersonaTab.tsx`
- `hooks/useAIPersonaEditor.ts`
- `hooks/useAICharacter.ts`
- `app/api/eliza/characters/[tokenId]/route.ts`
- `app/api/eliza/chat/route.ts`
- `lib/eliza/character-sheet-policy.ts`
- `lib/eliza/gateway/venice.ts`
- `types/eliza.ts`
- `docs/plans/eliza-character-sheet-parity-2026-05-11.md`
- `docs/investigations/eliza-character-sheets-2026-05-11.md`
- `specs/016-character-editor-chat/contracts/api.yaml`
- `specs/017-eliza-persona-editor/contracts/api.yaml`
- elizaOS Character Interface: https://docs.elizaos.ai/agents/character-interface
- elizaOS Personality & Behavior: https://docs.elizaos.ai/agents/personality-and-behavior
- elizaOS CLI Agent / character file structure: https://docs.elizaos.ai/cli-reference/agent
