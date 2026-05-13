# Investigation: Eliza Character Sheets

## Summary
WAGDIE Eliza character sheets are WAGDIE-owned AI persona DTOs mapped into permissive Eliza-compatible `AgentCharacter` records keyed by WAGDIE token ID as `externalId`. The system supports a practical subset of ElizaOS character conventions—especially bio/lore/style/examples/knowledge—with explicit bridges for legacy and version-drift fields, but it does not provide full native ElizaOS character-file parity.

## Symptoms
- User requested an investigation into how Eliza character sheets are made.
- Repository includes Eliza-related API routes, editor UI, specs, and an `services/elizaos/src/characters` area that may contain concrete sheets.

## Background / Prior Research

### External ElizaOS character-sheet format research
- Official docs identify ElizaOS character sheets as `Character` configuration objects, commonly TypeScript exports for advanced projects and JSON for portable/static sheets.
- Current docs/source references surfaced by explore agents:
  - Character Interface: https://docs.elizaos.ai/agents/character-interface
  - Plugin/API `Character` reference: https://docs.elizaos.ai/plugins/reference#character-interface
  - ElizaOS monorepo: https://github.com/elizaos/eliza
  - Standalone characterfile schema: https://github.com/elizaOS/characterfile
  - Characterfile JSON schema: https://raw.githubusercontent.com/elizaOS/characterfile/main/schema/character.schema.json
  - Characterfile sample JSON: https://raw.githubusercontent.com/elizaOS/characterfile/main/examples/example.character.json
  - Archived starter JSON/TS examples: https://raw.githubusercontent.com/elizaOS/eliza-starter/main/characters/eliza.character.json and https://raw.githubusercontent.com/elizaOS/eliza-starter/main/src/character.ts
- Docs-level minimal ElizaOS character: `name` + `bio`, with optional `plugins`, `settings`, `secrets`, `lore`, `knowledge`, `messageExamples`, `postExamples`, `adjectives`, `topics`, `style`, `system`, `templates`, and social/client fields depending on version.
- The standalone `characterfile` JSON schema is stricter: required `name`, `bio`, `lore`, `messageExamples`, `postExamples`, `adjectives`, `topics`, and `style`; optional `knowledge` items include `id`, `path`, and `content`.
- Common expression patterns:
  - `bio`: short identity/personality snippets, often sampled for variation.
  - `lore`: backstory/world facts.
  - `knowledge`: strings, file/directory references, or embedded document objects depending on version/tooling.
  - `style`: split into `all`, `chat`, and `post` instruction arrays.
  - `messageExamples`: 2D array of conversations; older examples use message `user`, newer docs may use `name`; `content.text` is the stable core.
  - `plugins/settings/secrets`: TS examples favor environment-variable-based conditional plugin/secrets loading; JSON examples use static arrays/settings and should avoid committed secrets.
- Compatibility caveat: older samples include fields like `modelProvider`, `clients`, and `messageExamples[].user`; newer docs emphasize `plugins`, `settings`, `secrets`, TypeScript `Character`, and sometimes `messageExamples[].name`.


## Investigator Findings
<!-- Pair investigator appends structured analysis here with file:line refs, evidence, and conclusions. -->

### App-facing model vs Eliza-facing record
- **Conclusion: hypothesis mostly proven.** The browser/editor-facing shape is the WAGDIE `AICharacter` DTO: `externalId` is the WAGDIE token id, with WAGDIE/editor fields such as `bio`, `lore`, `topics`, `adjectives`, `style`, `postExamples`, `systemPrompt`, `exampleMessages`, and `knowledge` (`types/eliza.ts:62-83`). Update payloads expose the same editor fields but omit `externalId`/timestamps/knowledge content (`types/eliza.ts:127-147`).
- The Eliza-facing persisted shape is `AgentCharacter`, keyed inside a `CharacterRecord` whose `externalId` is nullable and whose `character` is the Eliza payload (`lib/eliza/sdk-types.ts:25-55`). The gateway contract exposes `getRecordByExternalId`, `createRecord({ externalId, character })`, and `replaceRecord(id, { character })` (`lib/eliza/gateway/types.ts:99-111`).
- The central resolver explicitly treats WAGDIE token ids as canonical external ids and calls `characters.getRecordByExternalId(trimmedId)` (`lib/eliza/characterResolver.ts:58-82`). The raw gateway implements that lookup via `/characters/external/{externalId}`, creates records with `POST /characters`, and replaces full records with `PUT /characters/{id}` (`lib/eliza/gateway/client.ts:156-165`).

### 1. Creation/update flow: editor payload → PUT route → mapper → gateway record
- The editor collects tab state from `useAIPersonaEditor`, then `AIPersonaTab` calls `editor.getUpdateInput()`, adds WAGDIE `name` and `backstory` props, and invokes `saveAICharacter(data)` (`components/characters/ai-editor/AIPersonaTab.tsx:77-96`). The tabs cover identity (`bio`/`lore`), behavior (`topics`/`adjectives`/`style`), examples, and advanced (`systemPrompt`/knowledge UI) (`components/characters/ai-editor/AIPersonaTab.tsx:322-366`).
- `getUpdateInput()` trims empty array entries and emits `bio`, `lore`, `topics`, `adjectives`, optional non-empty `style`, optional `exampleMessages`, `postExamples`, and `systemPrompt`; it does **not** include knowledge documents because knowledge is handled by separate routes (`hooks/useAIPersonaEditor.ts:278-292`).
- `saveAICharacter()` sends that payload as JSON to `PUT /api/eliza/characters/{tokenId}` with credentials (`hooks/useAICharacter.ts:83-105`). The route authorizes the token id, wallet owner/staker/admin status, and obtains the WAGDIE `Character` plus canonical `externalId` (`app/api/eliza/characters/[tokenId]/route.ts:78-118`; `lib/eliza/routeAuth.ts:19-58`).
- For an existing record, the PUT route looks up by external id, applies `applyWagdieUpdateToAgentCharacter(existing.character, body)`, and writes a full replacement via `replaceRecord(existing.id, { character: merged })` (`app/api/eliza/characters/[tokenId]/route.ts:120-130`). The mapper builds a partial Eliza patch from editor fields: `systemPrompt -> system`, `bio` or legacy `personality -> bio`, `exampleMessages -> messageExamples`, `backstory -> backstory + lore[]`, plus `lore`, `adjectives`, and `postExamples` as permissive/custom keys (`lib/eliza/agent-character-mapper.ts:91-149`). `mergeAgentCharacter()` preserves unknown keys, ignores `undefined`, overwrites arrays only when explicitly provided, and shallow-merges `style`/`settings` (`lib/eliza/agent-character-mapper.ts:158-196`).
- For a missing record, the route builds defaults and calls `toAgentCharacterFromAICharacter(...)`, then `createRecord({ externalId, character })` (`app/api/eliza/characters/[tokenId]/route.ts:131-164`). Tests prove the same flow: existing PUT replaces `record-123` (`tests/api/eliza/character-record.test.ts:72-113`) and missing PUT creates with `externalId: '123'` (`tests/api/eliza/character-record.test.ts:203-242`).
- After PUT, dual/official ElizaOS modes sync or record the official agent link (`app/api/eliza/characters/[tokenId]/route.ts:166-178`). Dual mode shadow-writes through `syncOfficialPersonaShadow`; official mode records the returned official id (`tests/api/eliza/character-record.test.ts:115-201`).

### 2. Default generation from WAGDIE name/background metadata
- Creation defaults come from the authorized WAGDIE `Character`: fallback name is `wagdieCharacter.name || Character #token`, default personality is a fixed WAGDIE sentence, and default backstory is `body.backstory ?? wagdieCharacter.background_story ?? null` (`app/api/eliza/characters/[tokenId]/route.ts:136-145`). The WAGDIE `Character` type has both direct `name`/`background_story` fields and a `metadata` object with `name`, `description`, traits, and `background_story` (`types/character.ts:12-30`, `types/character.ts:39-66`).
- The reusable resolver has the same default-generation logic: choose WAGDIE default name or `Character #tokenId`, use the fixed mysterious WAGDIE personality, use `wagdieDefaults.backgroundStory`, and pass the result through the same AgentCharacter mapper (`lib/eliza/characterResolver.ts:29-57`). If invoked via `resolveCharacterByTokenId`, it creates the gateway record with `externalId: tokenId` (`lib/eliza/characterResolver.ts:107-125`).
- The mapper converts the default/edited WAGDIE fields into Eliza shape: trimmed `name`, `systemPrompt -> system`, `personality -> bio[]`, `backstory -> custom backstory + lore[]`, `topics`, `style`, `adjectives`, `postExamples`, and canonical `messageExamples` (`lib/eliza/agent-character-mapper.ts:46-78`). Tests verify those exact default/mapping semantics, including trimmed name and backstory mirrored into lore (`tests/api/eliza/sdkAdapter.test.ts:18-52`).
- **Caveat:** I did not find Eliza creation code that mines NFT metadata traits/lore into Eliza `topics`, `adjectives`, or `lore`. Metadata is hydrated onto WAGDIE characters (`lib/repositories/character/character-query-repository.ts:274-295`; `lib/services/assets/character-local-assets.ts:249-267`), but Eliza default creation uses only the direct WAGDIE `name` and `background_story` fields plus the fixed WAGDIE personality (`app/api/eliza/characters/[tokenId]/route.ts:136-154`).

### 3. Import/export conversion and ElizaOS JSON compatibility
- The export DTO is a deliberately limited Eliza-compatible JSON shape: required `name`, `bio`, `lore`; optional `topics`, `adjectives`, `style`, `messageExamples` using `{ user, content: { text } }`, `postExamples`, `systemPrompt`, and `knowledge` objects with `id/path/content` (`types/eliza.ts:238-260`; validation schema at `lib/eliza/validation.ts:108-131`). It does not expose full ElizaOS `plugins`, `settings`, `secrets`, `templates`, or direct `system`.
- Export route loads by external token id, converts stored canonical `messageExamples` via `toElizaExportMessageExamples`, copies supported arrays/fields, maps `system` or legacy `systemPrompt` to export `systemPrompt`, and maps stored knowledge documents to `id/path/content` (`app/api/eliza/characters/[tokenId]/export/route.ts:35-83`). The mapper converts canonical `{ name, content }` messages to export `{ user, content }` (`lib/eliza/eliza-export-mapper.ts:7-18`). Tests verify `name -> user` conversion and exported knowledge path/content (`tests/api/eliza/import-export.test.ts:105-159`).
- Import route validates the export shape, selectively imports non-empty `bio`, `lore`, `topics`, `adjectives`, non-empty `style`, `messageExamples`, `postExamples`, and `systemPrompt`, then merges directly into the existing `record.character` and calls `replaceRecord` (`app/api/eliza/characters/[tokenId]/import/route.ts:82-170`, `app/api/eliza/characters/[tokenId]/import/route.ts:188-203`). `fromElizaExportMessageExamples` converts export `{ user }` entries back to canonical stored `{ name }` entries (`lib/eliza/eliza-export-mapper.ts:23-33`). Tests cover route-level message content preservation and direct mapper round-trip (`tests/api/eliza/import-export.test.ts:354-387`; `tests/api/eliza/message-examples.test.ts:71-86`).
- Imported `name` is intentionally ignored: the route adds a warning that WAGDIE owns/syncs names and never writes `importData.name` into `updateData` (`app/api/eliza/characters/[tokenId]/import/route.ts:181-185`). Tests assert that a name warning is produced (`tests/api/eliza/import-export.test.ts:409-426`).
- Imported `knowledge` is explicitly skipped with a warning because documents must be uploaded through the knowledge endpoints (`app/api/eliza/characters/[tokenId]/import/route.ts:173-179`). Tests assert `skipped` contains `knowledge` (`tests/api/eliza/import-export.test.ts:389-406`).
- **Compatibility caveat:** Import writes canonical `messageExamples` directly into `record.character` using a generic `Record<string, unknown>` rather than routing through `toAgentCharacterPatchFromUpdate`, because `UpdateAICharacterInput` calls the editor field `exampleMessages` while persisted Eliza uses `messageExamples` (`types/eliza.ts:91-96`, `types/eliza.ts:127-147`; `app/api/eliza/characters/[tokenId]/import/route.ts:151-158`, `app/api/eliza/characters/[tokenId]/import/route.ts:195-203`).

### 4. Knowledge upload/list/delete storage and official sync behavior
- Knowledge is stored separately from editor saves but still embedded in the AgentCharacter record as `character.knowledge`: stored docs are `{ id, path, content? }`, and `replaceKnowledgeDocuments()` does a full `replaceRecord(record.id, { character: { ...record.character, knowledge: documents } })` (`lib/eliza/knowledge.ts:5-9`, `lib/eliza/knowledge.ts:42-48`, `lib/eliza/knowledge.ts:102-115`).
- List/get routes load the character record by token/external id and derive summaries or full responses from the embedded `character.knowledge` array (`app/api/eliza/characters/[tokenId]/knowledge/route.ts:42-68`; `app/api/eliza/characters/[tokenId]/knowledge/[documentId]/route.ts:28-64`). Tests confirm list returns `{ documents: [{ id, path, preview, size }] }` and get returns full content (`tests/api/eliza/knowledge-routes.test.ts:51-66`, `tests/api/eliza/knowledge-routes.test.ts:168-190`).
- Upload validates owner/staker/admin via the same mutation authorization, accepts multipart files, allows `.txt/.md/.json/.csv` by extension/type server-side, enforces 50KB and max doc count, reads text content, appends a random UUID doc, writes the character record, then attempts official sync (`app/api/eliza/characters/[tokenId]/knowledge/route.ts:82-193`, `app/api/eliza/characters/[tokenId]/knowledge/route.ts:195-215`). Client UI is stricter than the server and only accepts `.txt/.md` (`components/characters/ai-editor/editors/KnowledgeEditor.tsx:41-54`, `app/api/eliza/characters/[tokenId]/knowledge/route.ts:24-36`).
- Delete similarly authorizes, loads the record, removes the doc from embedded `knowledge`, writes the record, then attempts official deletion (`app/api/eliza/characters/[tokenId]/knowledge/[documentId]/route.ts:78-160`). Tests verify upload/delete update the gateway record (`tests/api/eliza/knowledge-routes.test.ts:68-95`, `tests/api/eliza/knowledge-routes.test.ts:191-203`).
- Official knowledge sync is mode-dependent: legacy mode returns `{ attempted: false, ok: true }`; dual/official modes resolve an official agent id, hash content, upsert pending sync state, call hosted `/wagdie-knowledge/index`, then mark `indexed` with `officialMemoryId` (`lib/eliza/knowledgeSync.ts:129-195`; official client paths at `lib/eliza/official/knowledge-client.ts:3-31`). Delete reads prior sync state, calls hosted delete when it has an official memory/agent id, and marks `deleted` (`lib/eliza/knowledgeSync.ts:220-274`). Sync state is durable in `eliza_knowledge_sync_states` with token/document ids, official ids, content hash, source pointer, status, and error fields (`supabase/migrations/20260510010000_create_eliza_knowledge_sync_states.sql:1-21`; repository at `lib/eliza/knowledgeSyncRepository.ts:67-148`).
- **Risk: non-atomic dual writes.** Upload/delete mutate the local character record before official sync. In `official` mode, a later sync failure returns 502 but does not roll back the already-written local record (`app/api/eliza/characters/[tokenId]/knowledge/route.ts:190-209`; `app/api/eliza/characters/[tokenId]/knowledge/[documentId]/route.ts:151-170`). Tests cover sync state success/error behavior but not route-level rollback/split-brain cases (`tests/api/eliza/knowledge-sync.test.ts:77-170`, `tests/api/eliza/knowledge-routes.test.ts:68-95`).
- **Risk: knowledge shape mismatch.** The app-facing `KnowledgeDocument` requires `filename`, `mimeType`, and `uploadedAt` (`types/eliza.ts:48-57`), but stored knowledge only requires `id` and `path`, with optional content (`lib/eliza/knowledge.ts:5-9`, `lib/eliza/knowledge.ts:33-48`). POST returns `id/path/filename/content/size` but not `mimeType` or `uploadedAt` (`app/api/eliza/characters/[tokenId]/knowledge/route.ts:217-228`), and the route contract expects a bare array for list while implementation returns `{ documents }` (`specs/017-eliza-persona-editor/contracts/api.yaml:86-94`; `app/api/eliza/characters/[tokenId]/knowledge/route.ts:65-68`).

### 5. External ElizaOS fields: represented, preserved, or omitted
- Local `AgentCharacter` can carry external ElizaOS fields such as `username`, `plugins`, `system`, `style`, `settings.secrets`, `knowledge`, `templates`, and arbitrary unknown keys (`lib/eliza/sdk-types.ts:25-48`). The editor DTO and update input do **not** expose `plugins`, `settings`, `secrets`, `templates`, `username`, `modelProvider`, or `clients`; they expose `systemPrompt` instead of direct `system` and only the `style.all/chat/post` subset (`types/eliza.ts:62-83`, `types/eliza.ts:127-147`).
- Existing unknown fields are preserved on normal PUT because mapper/merge only patches provided fields and keeps unknown keys (`lib/eliza/agent-character-mapper.ts:158-196`), with tests proving a `customKey` survives (`tests/api/eliza/sdkAdapter.test.ts:96-121`). However, creating a new WAGDIE character from the editor will not generate plugins/settings/secrets/templates unless downstream adapters add them (`lib/eliza/agent-character-mapper.ts:46-78`).
- Official ElizaOS adapter adds required WAGDIE plugins (`@elizaos/plugin-bootstrap`, `@elizaos/plugin-venice`), preserves any existing `officialCharacter.plugins`, and stores WAGDIE external id/backstory/lore under `settings.wagdie` while stripping top-level custom `backstory`/`lore` from official payloads (`lib/eliza/official/client.ts:40-40`, `lib/eliza/official/client.ts:108-137`). The spike character demonstrates external plugin/style/system support in a hand-authored TS sheet (`services/elizaos/src/characters/wagdie-spike-character.ts:1-16`).
- Chat/runtime prompt construction uses only a subset of the persisted record: `name`, `system`/`systemPrompt`, legacy `personality`/`backstory`, `bio`, `lore`, `topics`, `adjectives`, `style.all/chat`, and up to four `messageExamples`; it does not include plugins/settings/secrets/templates directly in the Venice prompt (`lib/eliza/gateway/venice.ts:71-146`).

### Overall conclusion
- WAGDIE character sheets are not authored as full native ElizaOS sheets in the app UI. They are authored as app-facing `AICharacter`/editor DTOs, mapped into gateway `AgentCharacter` records keyed by WAGDIE `tokenId`/`externalId`, with import/export bridges for a limited Eliza-compatible JSON shape and separate upload/list/delete handling for knowledge documents.
- The main mismatches to track are: limited import/export surface vs full ElizaOS fields, knowledge response/schema drift, server/client accepted file-type drift, direct import merging that bypasses the normal WAGDIE update mapper, and non-atomic official knowledge sync after local record mutation.

## Investigation Log

### Phase 1 - Initial Assessment
**Hypothesis:** Eliza character sheets likely follow ElizaOS `Character` schema and this repo may provide WAGDIE-specific generation/edit/export flows.
**Findings:** Report scaffold created. External docs/examples needed because Eliza character-sheet format is defined outside this repo.
**Evidence:** Repo file map shows `app/api/eliza/**`, `lib/eliza/**`, `components/characters/ai-editor/**`, `specs/017-eliza-persona-editor`, and `services/elizaos/src/characters`.
**Conclusion:** Proceeding to external fact-gathering, then workspace context building.

## Root Cause
This is not a defect root cause; it is a lifecycle/format finding. WAGDIE character sheets are implemented as app-facing `AICharacter`/editor DTOs that are converted into gateway `AgentCharacter` records (`types/eliza.ts:62-83`; `lib/eliza/sdk-types.ts:25-55`). Records are looked up and persisted by WAGDIE token ID as `externalId` (`lib/eliza/characterResolver.ts:58-82`; `lib/eliza/gateway/types.ts:99-111`).

The end-to-end flow is:
1. The editor collects WAGDIE persona fields (`bio`, `lore`, `topics`, `adjectives`, `style`, `exampleMessages`, `postExamples`, `systemPrompt`) and sends them through `PUT /api/eliza/characters/[tokenId]` (`components/characters/ai-editor/AIPersonaTab.tsx:77-96`; `hooks/useAIPersonaEditor.ts:278-292`; `hooks/useAICharacter.ts:83-105`).
2. The route authorizes owner/staker/admin access, then either patches an existing record or creates a new one with WAGDIE defaults (`app/api/eliza/characters/[tokenId]/route.ts:78-164`).
3. The mapper translates app fields into Eliza-compatible fields: `systemPrompt -> system`, `bio -> bio`, legacy `personality -> bio[]`, `backstory -> backstory + lore[]`, and `exampleMessages -> messageExamples` (`lib/eliza/agent-character-mapper.ts:46-149`).
4. Import/export bridges a limited Eliza-compatible JSON shape, including `messageExamples.user` ↔ canonical `messageExamples.name`; imports intentionally ignore `name` and skip `knowledge` (`app/api/eliza/characters/[tokenId]/export/route.ts:35-83`; `app/api/eliza/characters/[tokenId]/import/route.ts:82-203`; `lib/eliza/eliza-export-mapper.ts:7-33`).
5. Knowledge is embedded as `character.knowledge = [{ id, path, content }]` but managed through separate upload/list/get/delete routes and optional official ElizaOS memory sync (`lib/eliza/knowledge.ts:5-115`; `app/api/eliza/characters/[tokenId]/knowledge/route.ts:42-228`; `lib/eliza/knowledgeSync.ts:129-274`).

The main limitations are deliberate subset compatibility plus several implementation drifts: import/export does not round-trip full ElizaOS fields (`plugins`, `settings`, `secrets`, `templates`, `clients`, `modelProvider`), exported knowledge is not re-imported, app/server knowledge document shapes differ, the API contract has response/status drift, server/client knowledge file types differ, normal `PUT` has weaker server-side validation than import, and official knowledge sync is not atomic after local mutation.

## Recommendations
1. Align `specs/017-eliza-persona-editor/contracts/api.yaml` with implemented route responses, status codes, auth expectations, and import result shape.
2. Decide whether exported knowledge is intended to be portable; either support knowledge import or clearly flag export-only knowledge in the UX/docs.
3. Normalize `KnowledgeDocument` typing across `types/eliza.ts`, route responses, hooks, and UI.
4. Add server-side validation for `PUT /api/eliza/characters/[tokenId]` using the existing Zod update schema.
5. Document the ElizaOS compatibility surface: first-class fields, transformed fields, preserved-but-not-edited fields, skipped fields, and unsupported fields.
6. Reconcile client/server accepted knowledge file types (`.txt/.md` in UI vs `.txt/.md/.json/.csv` server-side).
7. Review official-mode knowledge sync ordering, or document that local record mutation can succeed before official sync fails.

## Preventive Measures
- Add contract tests that compare implemented API responses against the spec.
- Add export → import round-trip tests that explicitly assert ignored name, skipped knowledge, and message example conversion.
- Add tests for preserving external ElizaOS fields through normal PUT where preservation is expected.
- Add schema-limit tests for the main persona PUT route.
- Add UI/API type conformance tests for knowledge documents.
- Maintain a compatibility matrix for ElizaOS character fields: first-class, preserved, transformed, skipped, unsupported.
