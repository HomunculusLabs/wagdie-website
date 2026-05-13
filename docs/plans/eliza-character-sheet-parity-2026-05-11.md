# Eliza Character Sheet Parity: Plan

## Goal

Bring WAGDIE character import/export and editor persistence closer to ElizaOS character-sheet parity while keeping backend-owned concerns—plugins, secrets, provider/model credentials, runtime/service configuration, and official migration metadata—out of user-managed sheets.

## Background

- WAGDIE character sheets are authored through `AICharacter` DTOs and mapped into permissive Eliza-compatible `AgentCharacter` records keyed by token ID as `externalId` (`docs/investigations/eliza-character-sheets-2026-05-11.md:37-40`, `docs/investigations/eliza-character-sheets-2026-05-11.md:79-81`).
- The editor save path is `AIPersonaTab` → `useAIPersonaEditor.getUpdateInput()` → `useAICharacter.saveAICharacter()` → `PUT /api/eliza/characters/[tokenId]` → `agent-character-mapper` → gateway record (`components/characters/ai-editor/AIPersonaTab.tsx:77-96`, `hooks/useAIPersonaEditor.ts:278-293`, `app/api/eliza/characters/[tokenId]/route.ts:120-164`).
- Import/export is an explicit allowlist today: export emits selected fields; import selectively merges supported non-empty fields, ignores `name`, skips `knowledge`, and bridges `messageExamples.user` ↔ `messageExamples.name` (`app/api/eliza/characters/[tokenId]/export/route.ts:63-82`, `app/api/eliza/characters/[tokenId]/import/route.ts:110-203`, `lib/eliza/eliza-export-mapper.ts:7-34`).
- Prior migration plans require WAGDIE route contracts, tokenId-centric persona behavior, import/export DTOs, and knowledge UX to stay canonical across legacy, dual, and official ElizaOS modes (`docs/plans/official-eliza-package-migration-2026-05-10.md:30-34`, `docs/plans/official-eliza-package-migration-2026-05-10.md:95-101`).

## Decisions

- Add parity through the existing mapper/import/export/editor seams; do not replace the gateway or editor architecture.
- Treat `system` as the canonical Eliza field. Keep `systemPrompt` as a compatibility alias on import/export and existing UI wiring.
- Make `backstory` user-managed after creation. WAGDIE `background_story` is a create-time default only.
- Keep knowledge import separate in this increment. Export may include existing `knowledge` for backup, but import continues to skip it with the current warning.
- Use explicit clear semantics:
  - omitted field = preserve existing value
  - arrays: `[]` clears
  - objects/maps: `{}` clears the user-owned object/map
  - nullable scalars: `null` clears; empty string is validated like any other string and may be normalized only by existing field-specific trimming rules

## User-Managed Field Policy

Add `lib/eliza/character-sheet-policy.ts` as the source of truth for user-managed fields, backend-owned paths, safe settings handling, and import/export warnings.

### User-managed fields

First-class user-managed fields after this work:

- existing: `bio`, `lore`, `topics`, `adjectives`, `style`, `messageExamples`, `postExamples`, `systemPrompt`
- add: `username`, canonical `system`, `backstory`, `templates`, `settings.avatar`, `settings.metadata.wagdieUser`
- export-only / route-managed: `name`, `knowledge`

`name` remains WAGDIE-owned: export it, ignore imported names with a warning, and do not expose it as an editable sheet field.

### Backend-owned fields

The policy module should encode backend-owned fields as exact key paths and path prefixes, not fuzzy substring matches. Examples:

- exact top-level paths: `plugins`, `secrets`, `modelProvider`, `clients`, `id`, `externalId`
- nested exact/prefix paths: `settings.secrets`, `settings.wagdie`, `settings.metadata.officialAgentId`, `settings.metadata.legacyCharacterId`
- provider/runtime prefixes as explicit paths only when they are known persisted fields

Route behavior:

- PUT rejects backend-owned paths with `400`.
- Import skips backend-owned paths with warnings.
- Export omits backend-owned paths.
- Normal mapper updates preserve backend-owned paths already stored on a record.

### Safe settings merge

Only these settings paths are user-managed:

```ts
settings.avatar?: string | null
settings.metadata.wagdieUser?: Record<string, string | number | boolean | null>
```

Merge depth is intentionally limited:

- merge top-level `settings`
- merge `settings.metadata`
- replace only `settings.metadata.wagdieUser` as a whole
- never recursively merge arbitrary nested metadata values
- preserve `settings.secrets`, `settings.wagdie`, and all non-user `settings.metadata.*` keys

## Approach

1. **Create a policy stub, then lock behavior with tests.** Add the policy module shape first so tests can target stable helpers without implementing all logic upfront.
2. **Normalize shared DTOs and schemas.** Extend `types/eliza.ts` and `lib/eliza/validation.ts` for approved parity fields, nullable clear values, `system`, templates, and safe settings.
3. **Route PUT/import/export through the policy.** Replace duplicated route allowlists with policy helpers while preserving current authorization, tokenId ownership, message-example conversion, and dual/official sync behavior.
4. **Harden mapper semantics.** Extend `agent-character-mapper` for new fields, explicit clears, safe settings merge, and backstory/lore behavior that does not overwrite user lore on save.
5. **Expand editor UI after API behavior is stable.** Add approved fields only; keep backend-owned fields invisible and uneditable.
6. **Update specs and docs to match behavior.** Fix `specs/017-eliza-persona-editor/contracts/api.yaml` after route behavior settles.

## Work Items

1. **Policy stub and tests**
   - Create `lib/eliza/character-sheet-policy.ts` with exported allow/deny path sets and placeholder helper signatures.
   - Extend `tests/api/eliza/import-export.test.ts` for approved-field export/import, backend-owned skipped warnings, backend-owned export omission, `system` over conflicting `systemPrompt`, and explicit clears.
   - Extend `tests/api/eliza/character-record.test.ts` for PUT rejection of backend-owned paths and preservation of stored backend-owned fields.
   - Extend `tests/api/eliza/sdkAdapter.test.ts` for mapper support of `username`, `backstory`, `templates`, safe settings, explicit clears, and backstory/lore non-overwrite behavior.

2. **Types and validation**
   - Update `types/eliza.ts` with user-managed settings/metadata, `username`, canonical `system`, `templates`, and export parity fields.
   - Update `UpdateAICharacterInput` and export/import types to allow clear values where needed (`null`, `[]`, `{}`).
   - Update `lib/eliza/validation.ts` with schemas for new fields, safe settings, exact/path-prefix backend-owned detection support, and `systemPrompt` alias compatibility.

3. **Policy implementation**
   - Implement backend-owned path analysis using exact paths and explicit prefixes.
   - Implement import normalization returning safe patch input plus `imported`, `skipped`, and `warnings`.
   - Implement export construction that includes only user-managed/export-only fields and omits backend-owned paths.
   - Keep the policy module pure: it returns structured results; routes decide HTTP status/response shape.

4. **Mapper and merge behavior**
   - Extend `lib/eliza/agent-character-mapper.ts` to map approved parity fields both directions.
   - Add a system accessor: read `character.system` first, then legacy `character.systemPrompt`; write canonical `system`.
   - Stop `backstory` from overwriting `lore` during normal saves. Mirror backstory into lore only on create or when existing lore is empty and no explicit lore update is present.
   - For legacy records where `extractBackstory()` falls back to `lore[0]`, keep the fallback on read but do not de-mirror or mutate existing lore without explicit user input.
   - Implement bounded settings merge exactly as described above.

5. **PUT/import/export routes**
   - In `app/api/eliza/characters/[tokenId]/route.ts`, validate update payloads, reject backend-owned paths with `400`, and keep existing authorization/persistence/sync flow.
   - In `app/api/eliza/characters/[tokenId]/import/route.ts`, replace manual `updateData` construction with policy normalization plus `mergeAgentCharacter()`; skip `knowledge` with the current warning; skip unknown/backend-owned fields with warnings.
   - In `app/api/eliza/characters/[tokenId]/export/route.ts`, replace inline export construction with the shared export mapper and omit backend-owned fields.

6. **Editor state and UI**
   - Extend `hooks/useAIPersonaEditor.ts` and `DraftAIPersona` with `username`, user-managed `backstory`, `templates`, and safe settings.
   - Stop `AIPersonaTab` from injecting `characterBackstory` into every save; let the server use WAGDIE background only for create defaults.
   - Add `username` and `backstory` to the Identity tab.
   - Add `templates`, avatar, and safe public metadata to the Advanced tab.
   - Use a simple key/value text-area pattern for `templates`: template name → template body. Do not add a full JSON editor in the first pass.
   - Add client-side schema guards so the editor cannot submit backend-owned fields to PUT.

7. **Spec and documentation alignment**
   - Update `specs/017-eliza-persona-editor/contracts/api.yaml` with final fields, clear semantics, import response shape, backend-owned exclusions, and `system`/`systemPrompt` compatibility.
   - Add a short JSDoc compatibility matrix in `character-sheet-policy.ts`: first-class, transformed, export-only, skipped, backend-owned.

8. **Focused validation**
   - `bun run test -- tests/api/eliza/import-export.test.ts tests/api/eliza/character-record.test.ts tests/api/eliza/sdkAdapter.test.ts`
   - Run UI/component tests for `AIPersonaTab` and any new editors.
   - Run `bun run lint` and the project typecheck/build command before handoff.

## Deferred Follow-ups

- Normalize knowledge route/UI document shapes (`KnowledgeDocument`, stored `{ id, path, content }`, list summaries) in a separate PR unless implementation of this plan directly touches those payloads.
- Decide whether exported `knowledge` should remain in sheet files long term if import intentionally skips it.
- Consider a richer settings metadata UI only after there is a concrete product use case; first pass can support import/export plus a minimal key/value editor.

## References

- Investigation: `docs/investigations/eliza-character-sheets-2026-05-11.md`
- Persona editor spec: `specs/017-eliza-persona-editor/contracts/api.yaml`
- Current mapper: `lib/eliza/agent-character-mapper.ts`
- Current import/export routes: `app/api/eliza/characters/[tokenId]/import/route.ts`, `app/api/eliza/characters/[tokenId]/export/route.ts`
- Current editor state: `hooks/useAIPersonaEditor.ts`, `components/characters/ai-editor/AIPersonaTab.tsx`
- Prior plan: `docs/plans/official-eliza-package-migration-2026-05-10.md`
- Prior plan: `docs/plans/eliza-package-migration-2026-05-10.md`
