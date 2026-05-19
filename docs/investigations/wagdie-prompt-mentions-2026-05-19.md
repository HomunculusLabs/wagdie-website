# Investigation: WAGDIE Prompt Mentions in Character Creation

## Summary
The unwanted non-immersive wording is caused by hardcoded project/universe branding in live model-facing prompt builders and default persona seed text. The exact `WAGDIE universe` phrase comes from regular character chat prompt construction, while the owner-facing persona assistant also injects `WAGDIE` wording that can bias generated character/persona help.

## Symptoms
- Character creation assistance includes prompt text about the character being from the WAGDIE universe.
- User-facing or model-facing character creation should avoid explicit mentions of "WAGDIE" and "WAGDIE UNIVERSE" because they break immersion.

## Background / Prior Research
No external research required; this appears to be an in-repository prompt/content issue.

## Investigator Findings
<!-- Pair investigator appends structured findings here with file:line refs, evidence, and conclusions. -->

### Phase 3 - Pair Investigator Verification (2026-05-19)

**Scope / method:** Read-only source investigation plus focused searches across `app/`, `lib/`, `components/`, `hooks/`, and tests, excluding docs/archive/generated outputs where relevant. Source code was not modified.

#### Flow 1: owner-facing persona assistant generation/chat
- UI entry point is owner-only: `components/characters/ai-editor/AIPersonaTab.tsx:305-315` renders `PersonaAssistantPanel` only when `isOwner` is true and passes `tokenId`, `editor.getAssistantSnapshot`, and `editor.applyAssistantDraft`.
- The panel imports/calls the assistant hook at `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:5` and `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:31`; chat submit calls `assistant.sendMessage(...)` at `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:35-47`, and generate calls `assistant.generateDraft(...)` at `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:49-56` / `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:180-188`.
- The hook builds the assistant request with `mode`, transcript `messages`, and `editorSnapshot` at `hooks/usePersonaAssistant.ts:116-124`, then posts only to `/api/eliza/characters/${tokenId}/persona-assistant` at `hooks/usePersonaAssistant.ts:127-134`.
- The route authorizes/validates and calls `runPersonaAssistant(authorization, parsed.data)` at `app/api/eliza/characters/[tokenId]/persona-assistant/route.ts:44-85`.
- The model-facing prompt is built in `lib/eliza/persona-assistant.ts`. Confirmed WAGDIE mentions:
  - `lib/eliza/persona-assistant.ts:92-95` system prompt says it drafts `WAGDIE persona boilerplate`.
  - `lib/eliza/persona-assistant.ts:113-121` user prompt labels the metadata block `Untrusted WAGDIE character context`.
  - `lib/eliza/persona-assistant.ts:129-130` generate-mode instruction says `Preserve WAGDIE identity`.
  - `lib/eliza/persona-assistant.ts:422-437` sends those messages to `completeOpenAICompatibleChat(...)` with JSON response format.

**Conclusion for Flow 1:** The owner-facing assistant can directly expose/project the unwanted wording because explicit WAGDIE text is in model-facing prompt builders, not in the React composer copy.

#### Flow 2: regular character chat / persona prompt construction
- Regular character chat is a separate UI path: `components/chat/ChatSidebar.tsx:15` imports `useCharacterChat`, and `components/chat/ChatSidebar.tsx:60-68` calls `useCharacterChat(tokenId)`.
- `hooks/useCharacterChat.ts:73-113` posts chat messages to `/api/eliza/chat`, not the persona-assistant endpoint.
- `/api/eliza/chat` resolves the character and passes the resolved record into `serverClient.chat.sendMessageStream(...)` at `app/api/eliza/chat/route.ts:92-111` and `app/api/eliza/chat/route.ts:167-181`.
- The gateway client uses the OpenAI-compatible builder at `lib/eliza/gateway/client.ts:175-199`, specifically `messages: buildMessagesForCharacter(character, input.message)`.
- `lib/eliza/gateway/venice.ts:140-166` builds the regular chat system message. Confirmed WAGDIE mentions:
  - `lib/eliza/gateway/venice.ts:144` fallback name is `WAGDIE character`.
  - `lib/eliza/gateway/venice.ts:145-147` frames the persona as being in the `WAGDIE universe`.

**Conclusion for Flow 2:** The exact `WAGDIE universe` symptom is rooted in the regular chat OpenAI-compatible system prompt, not the persona-assistant route. Owner-facing generated persona content may then reinforce it if the assistant prompt has already directed the model to preserve WAGDIE identity.

#### Other live WAGDIE prompt-adjacent strings found
- Auto-created default personas include `world of WAGDIE` in two live server paths:
  - `lib/eliza/characterResolver.ts:36-55` builds a default character for `resolveCharacterByTokenId(...)`; `lib/eliza/characterResolver.ts:44` sets default personality to `A mysterious character from the world of WAGDIE...`.
  - `app/api/eliza/characters/[tokenId]/route.ts:157-169` uses the same default personality when creating a new AI character on PUT; see `app/api/eliza/characters/[tokenId]/route.ts:163`.
- `lib/eliza/agent-character-mapper.ts:98-101` maps `personality` into `bio` when explicit `bio` is absent, so the `world of WAGDIE` default can become part of persona data later included by `buildMessagesForCharacter(...)` as a Bio section.

#### Eliminated / out-of-scope WAGDIE mentions
- Persona assistant UI copy itself does not mention WAGDIE. Relevant checked copy is in `components/characters/ai-editor/assistant/PersonaAssistantPanel.tsx:87-166` and `components/characters/ai-editor/assistant/AssistantTranscript.tsx:20-31`.
- The owner-facing persona assistant UI does not call the regular chat hook or `/api/eliza/chat`; targeted search in `components/characters/ai-editor/`, `components/characters/ai-editor/assistant/`, and `hooks/usePersonaAssistant.ts` found no `useCharacterChat` or `/api/eliza/chat` references.
- `components/home/HomeCard.stories.tsx:45` contains `WAGDIE universe`, but it is Storybook story copy, not live assistant/model-facing prompt construction.
- Several API-domain/internal strings mention WAGDIE but are not the root assistant prompt issue: `WAGDIE character not found` errors in `app/api/eliza/characters/[tokenId]/persona-assistant/route.ts:33-36`, `app/api/eliza/characters/[tokenId]/route.ts:103-106`, and `app/api/eliza/chat/route.ts:92-97`; policy/user warnings such as `WAGDIE backend` in `lib/eliza/character-sheet-policy.ts:266-267`, `lib/eliza/character-sheet-policy.ts:370-371`, and `lib/eliza/character-sheet-policy.ts:429-440`; internal metadata key `settings.metadata.wagdieUser` in assistant/editor code.

#### Tests likely affected by a fix
- No test directly asserts the persona assistant internal WAGDIE prompt strings or the `WAGDIE universe` wording.
- `tests/api/eliza/openai-compatible.test.ts:15-44` verifies the regular prompt builder shape and inclusion of character fields; update only if new assertions are added or system prompt structure changes materially.
- `tests/api/eliza/openai-compatible.test.ts:47-58` covers legacy personality/backstory fallback inclusion.
- `tests/api/eliza/gateway-client.test.ts:144-177` exercises the Venice-backed chat path indirectly but does not inspect the generated request body messages.
- `tests/hooks/usePersonaAssistant.test.tsx:56-70` and `tests/api/eliza/persona-assistant-route.test.ts:194-198` verify routing/payload pass-through, not prompt wording.
- Tests with WAGDIE policy/error wording, such as `tests/api/eliza/persona-assistant-route.test.ts:161-165` and `tests/lib/eliza/persona-assistant-policy.test.ts:65-83`, are likely unrelated unless policy/user-visible import warnings are intentionally renamed.

#### Root cause
Explicit project/universe branding is hardcoded in live model-facing prompt construction in two places: the owner-facing persona assistant prompt builder (`lib/eliza/persona-assistant.ts:92-130`) and the regular chat OpenAI-compatible message builder (`lib/eliza/gateway/venice.ts:140-147`). Additional default persona seed text in `lib/eliza/characterResolver.ts:44` and `app/api/eliza/characters/[tokenId]/route.ts:163` can persist similar branding into character data.

#### Recommended fix locations
1. Replace or remove project-branded wording in `lib/eliza/persona-assistant.ts:92-130`; use neutral phrasing like “character persona fields”, “character metadata”, and “preserve established identity/name” rather than WAGDIE-specific copy.
2. Replace the regular chat system framing in `lib/eliza/gateway/venice.ts:144-147`; avoid `WAGDIE character` fallback and `WAGDIE universe` in model-facing text.
3. Replace default persona seed text in `lib/eliza/characterResolver.ts:44` and `app/api/eliza/characters/[tokenId]/route.ts:163` so newly auto-created personas do not store `world of WAGDIE` in bio/personality.
4. Add/adjust tests around `buildMessagesForCharacter(...)` and, if exported/testable, persona assistant prompt construction to assert absence of `WAGDIE`, `WAGDIE universe`, and `world of WAGDIE` in model-facing messages while preserving internal/API-domain identifiers.

## Investigation Log

### Phase 2 - Context Builder Assessment
**Hypothesis:** The unwanted project/universe wording originates in model-facing prompt builders rather than frontend UI copy.
**Findings:** Context Builder selected the persona assistant flow and character chat flow. It identified likely model-facing strings in `lib/eliza/persona-assistant.ts` and `lib/eliza/gateway/venice.ts`:
- `buildSystemPrompt()` references `WAGDIE persona boilerplate`.
- `buildUserPrompt()` labels `Untrusted WAGDIE character context`.
- Generate-mode instruction says `Preserve WAGDIE identity...`.
- `buildMessagesForCharacter()` uses fallback name `WAGDIE character` and system framing `AI persona in the WAGDIE universe`.
**Evidence:** Context Builder chat `prompt-mentions-1CF614`; selected files include the persona assistant route/hook/panel, `lib/eliza/persona-assistant.ts`, `lib/eliza/gateway/venice.ts`, chat route/client, validation/policy, and related tests.
**Conclusion:** Proceed to pair investigator to verify exact line refs, flow impact, and whether other live assistant-generated prompt copy needs changes.

### Phase 1 - Initial Assessment
**Hypothesis:** The issue is caused by hardcoded prompt copy in the character/persona assistant flow, likely in app/components/lib files related to Eliza, persona assistant, character sheets, or prompt generation.
**Findings:** Existing repo convention stores investigation reports in `docs/investigations/<topic>-<YYYY-MM-DD>.md`. This report was created at `/Users/t3rpz/projects/wagdie-simplified/docs/investigations/wagdie-prompt-mentions-2026-05-19.md`.
**Evidence:** User report specifically mentions the assistant helping make a character and inserting "WAGDIE universe" language.
**Conclusion:** Proceed to broad workspace context discovery.

### Phase 4 - Oracle Synthesis
**Hypothesis:** The pair evidence is sufficient to define a targeted fix scope and rule out unrelated internal identifiers.
**Findings:** Oracle agreed the root cause is not broad leakage from every `WAGDIE` identifier, but a small set of model-facing prompt strings and default persona seed text that directly shape assistant/persona output.
**Evidence:** Oracle chat `prompt-mentions-1CF614` reviewed the refreshed selection containing `lib/eliza/persona-assistant.ts`, `lib/eliza/gateway/venice.ts`, `lib/eliza/characterResolver.ts`, `app/api/eliza/characters/[tokenId]/route.ts`, flow files, and tests.
**Conclusion:** Target model-facing prompt copy and persisted default persona seed text. Leave internal/API-domain identifiers alone unless product requests a broader rename.

## Root Cause
Explicit project/universe branding is hardcoded in live model-facing character assistance paths:

1. **Owner-facing persona assistant prompt builder** — `lib/eliza/persona-assistant.ts:92-130` tells the model it drafts `WAGDIE persona boilerplate`, labels context as `Untrusted WAGDIE character context`, and says to `Preserve WAGDIE identity`. These messages are sent to the model at `lib/eliza/persona-assistant.ts:422-437`, so they can bias both chat-mode assistance and generated draft proposals.
2. **Regular character chat prompt builder** — `lib/eliza/gateway/venice.ts:140-147` uses fallback name `WAGDIE character` and frames the model as `an AI persona in the WAGDIE universe`. This is the exact source of the reported `WAGDIE universe` phrase. The gateway sends these messages in `lib/eliza/gateway/client.ts:175-199`.
3. **Default persona seed text** — `lib/eliza/characterResolver.ts:44` and `app/api/eliza/characters/[tokenId]/route.ts:163` seed new/default personas with `A mysterious character from the world of WAGDIE...`. Through `lib/eliza/agent-character-mapper.ts:98-101`, that personality can become bio/persona data later included in prompts.

Eliminated hypotheses:
- Persona assistant React UI copy is not the source; checked `PersonaAssistantPanel.tsx` and `AssistantTranscript.tsx`.
- `usePersonaAssistant` does not construct prompt copy; it posts to `/api/eliza/characters/${tokenId}/persona-assistant`.
- The owner-facing persona assistant does not call `/api/eliza/chat`; regular chat is a separate path through `useCharacterChat`.
- Storybook copy contains `WAGDIE universe` but is not live assistant/model-facing prompt construction.
- Internal/API-domain names like `wagdieUser`, `WagdieElizaError`, config comments, and `WAGDIE character not found` errors are not the prompt root cause.

## Recommendations
1. In `lib/eliza/persona-assistant.ts:92-130`, replace branded prompt wording with neutral immersive language, e.g. “immersive elizaOS-compatible persona fields,” “Untrusted character context,” and “Preserve the established character identity.” Add a model-facing guard such as: “Keep generated copy immersive. Do not introduce app, project, collection, brand, or universe names unless the owner explicitly asks for that wording.”
2. In `lib/eliza/gateway/venice.ts:140-147`, remove the project/universe framing. Use a neutral fallback like `an unnamed character` and a system line like `You are ${name}.` while keeping the concise immersive voice instruction.
3. In `lib/eliza/characterResolver.ts:44` and `app/api/eliza/characters/[tokenId]/route.ts:163`, replace `world of WAGDIE` default persona seed text with neutral character wording or derive only from available character name/background.
4. Add regression coverage:
   - `tests/api/eliza/openai-compatible.test.ts`: assert `buildMessagesForCharacter()` system messages do not include `WAGDIE`, `WAGDIE universe`, or `world of WAGDIE`, including unnamed fallback behavior.
   - Persona assistant route/unit coverage: mock `completeOpenAICompatibleChat()` or expose test-only prompt helpers to assert model messages avoid project/universe branding while still allowing internal field keys like `settings.metadata.wagdieUser` if necessary.
   - Default persona seed tests around `resolveCharacterByTokenId()` and character PUT/create behavior.

## Preventive Measures
- Add a narrow regression test or lint-like assertion over model-facing prompt builders/default persona seeds rather than banning `WAGDIE` repo-wide.
- Maintain an allowlist for internal/API identifiers (`wagdieUser`, `WagdieElizaError`, gateway/config names) so legitimate backend contracts are not broken.
- When adding new AI prompt builders, require an immersion check: no app/project/collection/universe labels in generated character-facing copy unless explicitly user-requested.
