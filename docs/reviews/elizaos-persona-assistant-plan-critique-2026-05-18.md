# elizaOS Persona Assistant Plan — Bounded Critique

## 1. Top 3 under-specified seams

1. **Editor snapshot shape and source.** The plan requires `editorSnapshot` in the request (`docs/plans/elizaos-persona-assistant-2026-05-18.md:90-91`) and says the hook/panel submit or receive “the current editor snapshot” (`:283`, `:329`), but it does not define how to derive that snapshot from `useAIPersonaEditor`. Spot-check: the editor return exposes `state` with internal `systemPrompt`, not canonical `system` (`hooks/useAIPersonaEditor.ts:171-173`, `:195`), while the assistant excludes `systemPrompt` and emits `system` (`docs/plans/elizaos-persona-assistant-2026-05-18.md:128`, `:263`). Implementer must guess whether to add `getAssistantSnapshot()`, build it in `AIPersonaTab`, or let `usePersonaAssistant` normalize it.
2. **Route-to-service character context handoff.** The service must build prompts from “authorized WAGDIE character context” (`docs/plans/elizaos-persona-assistant-2026-05-18.md:135`, `:215`), and the route must authorize through `authorizeElizaCharacterMutation` (`:239`). The original export explicitly said to “Load WAGDIE character context from authorization result” (`prompt-exports/oracle-plan-2026-05-18-175549-persona-assistant-pl-dc35.md:618`), but the final route item dropped that handoff. Spot-check: the auth result does include `character` on success (`lib/eliza/routeAuth.ts:7-14`), so the plan should specify this rather than leaving implementers to reload or reshape context.
3. **Sanitizer strip-vs-reject semantics.** The plan says unsupported fields are “strip or reject” while backend-owned fields are hard-rejected (`docs/plans/elizaos-persona-assistant-2026-05-18.md:131`, `:174`). That leaves important behavior ambiguous: should `name`, `personality`, `knowledge`, `messageExamples`, and `systemPrompt` be warnings, 422s, or corrected output? This affects API tests, UX warnings, retry behavior, and whether model mistakes block draft generation.

## 2. Specificity balance

- **Over-specified:** the recommended component split (`docs/plans/elizaos-persona-assistant-2026-05-18.md:149-316`) may be too tactical for the implementation agent. The plan should preserve required UX states but let the agent choose file/component boundaries.
- **Over-specified:** stale response handling (`:284`) is a good quality bar, but it prescribes hook internals; it could be a testable behavior instead.
- **Dropped useful framing:** the export emphasized the existing editor field UI as reusable for identity, behavior, examples, advanced fields, arrays, counters, templates, safe settings, and knowledge (`prompt-exports/oracle-plan-2026-05-18-175549-persona-assistant-pl-dc35.md:12`, `:30`). The final plan still says drafts remain editable, but it loses that implementation-framing reminder.

## 3. Contradictions or missing dependencies

- Item 6 depends only on Item 4 (`docs/plans/elizaos-persona-assistant-2026-05-18.md:292`) but also needs Item 1 for shared assistant types and likely Item 5 or an agreed snapshot helper for `editorSnapshot`.
- Item 2 depends on Item 1 “for response expectations” (`:204`), but a generic non-streaming gateway helper should not depend on assistant response types. This may encourage coupling gateway code to persona-assistant concerns.
- The plan says there are no blocking open questions (`:395-397`), but snapshot derivation, sanitizer behavior, and context handoff can change implementation order and tests.

## 4. Risk of over-planning

Cut or simplify: the long background/prior-art citations (`docs/plans/elizaos-persona-assistant-2026-05-18.md:18-22`, `:399+`), the exact component list, and Item 9’s instruction to update the plan itself (`:352`, `:357`). Keep the endpoint contract, policy boundary, review/apply/save lifecycle, and focused test requirements.

## 5. Questions whose answers would change implementation order

1. Should `useAIPersonaEditor` expose `getAssistantSnapshot()` alongside `applyAssistantDraft`, making Item 5 precede Item 6?
2. Are excluded assistant fields always hard errors, or are compatibility aliases like `systemPrompt`/`messageExamples` normalized with warnings?
3. Should the route pass `authorization.character` directly into the service, or should the service load canonical character context independently?
4. Is `sessionStorage` required for the first pass, or can ephemeral in-memory state ship first to reduce client/test scope?
