# Critique: Official Eliza Package Migration Plan (2026-05-10)

**Source plan:** `docs/plans/official-eliza-package-migration-2026-05-10.md`
**Scope:** under-specified seams, contradictions, over-planning, ordering questions. No scope expansion.

## 1. Top 3 under-specified seams

1. **The `serverClient.chat.sendMessageStream` adapter target is unnamed.** Today, `app/api/eliza/chat/route.ts:118-130` calls Venice directly via the gateway and maps callbacks to SSE `token`/`complete`/`error` (route lines 89-117). The plan keeps the route, mentions `lib/eliza/official/chat.ts` for stream normalization (Step 7), and tells routes to "continue calling `getElizaClient()` / `createUserClient()`" (Step 2). It never says whether the official adapter implements the existing `WagdieElizaClient.chat` interface (so the route is untouched) or replaces `getElizaClient()` behind a flag. Pick one and pin it to a method/file before Step 2.
2. **`requireElizaUserToken` survives but its meaning is unspecified.** `app/api/eliza/chat/route.ts:36-43` requires an Eliza SIWE user token, then `void`s it (line 41). Step 6 keeps `/api/eliza/auth/*` response shape and says ElizaOS credentials stay server-only. So: does the user-token requirement stay (and who issues it once the bridge is server-to-server), or do `useElizaAuth`-driven 401 paths change? The plan doesn't decide, and existing tests gate on this.
3. **Knowledge "controlled server-side read/index path" is one bullet covering two architectures.** Step 5 offers either an ElizaOS-pulls-from-WAGDIE data API or a WAGDIE-pushes-to-official-memory index, with very different ACL/transport/ownership shapes. `lib/eliza/knowledge.ts:42-47` shows knowledge currently lives inside `character.knowledge`, so dual-writing requires a contract before any code lands. Open Question #1 acknowledges this — but Work Item 4 expects the work to begin without it.

## 2. Contradictions / missing dependencies

- **Migration modes have no flag substrate.** Five modes (`legacy` → `official-only`) but no env var, DB column, or controller is named, and the three crosswalk tables don't carry a mode field. Either name the flag location or fold it into one of the link tables.
- **Step 4 contradicts Step 1's go/no-go.** Step 1 demands "explicit go/no-go per domain" before changing production paths; Step 4 already includes a fallback ("keep WAGDIE's persona snapshot canonical and generate official agent config from it") that pre-resolves a no-go. Either Step 1 is binding (delete the fallback from Step 4) or Step 1 is advisory (say so).
- **Step 6 server-to-server identity vs. Step 8 per-user dedup.** If WAGDIE calls hosted ElizaOS with a single service credential, all official rooms are owned by that service identity, and Step 8's per-wallet dedup via `eliza_official_conversation_links` depends on whether `@elizaos/api-client` accepts per-call user identity. Resolve before designing the link table.
- **Hosted ElizaOS deployment owner is undeclared.** Recommendation says "WAGDIE-hosted." Step 7 says it owns the Venice key. Nothing in Work Items names the deploy target, secrets rotation, or who operates it — that is a Phase-0 dependency, not a Step 7 sub-task.
- **Step 7 says "direct Venice as a temporary rollback fallback,"** but the *current* path is already Venice-direct, not a fallback. The plan should reframe this as "preserve the existing direct-Venice path until official streaming passes," not introduce it.

## 3. Over-planning to cut or simplify

- **Compatibility Matrix + Test Strategy + Rollout Stop Conditions overlap.** Collapse to one table with stop-condition columns; the current three lists drift.
- **Five rollout modes are too many** for a plan with no flag mechanism. Three is enough: `legacy`, `dual`, `official`, plus a per-tokenId allowlist for canarying.
- **Three crosswalk tables before the spike** pre-commits schema. Name one canonical "official link" concept; defer per-domain tables until Step 1 returns field requirements.
- **Step 2 / Step 4 / Step 7 each name `lib/eliza/official/*` separately.** Group adapter scaffolding into one work item; don't fragment "the adapter" across phases.
- **Open Question #2 (Venice model/parameter defaults)** is operational config, not a migration design question. Drop from this plan.
- **Non-goals list duplicates Recommendation guardrails.** Keep one.

## 4. Questions whose answers change implementation order

1. **Does the official ElizaOS messaging API expose token-by-token streaming with a stable wire format?** If no, Step 7 cannot keep the SSE contract without staying on direct Venice, and `official-only` (mode 5) is unreachable. Answer **before** Step 2 — it determines whether the adapter's chat surface even exists.
2. **Does `@elizaos/api-client` accept per-call user identity, or only a single service credential?** Determines whether conversations (Step 8) can move to official rooms at all. If service-only, conversations stay WAGDIE-canonical and Steps 8/3-c crosswalk shrink dramatically.
3. **Where does the hosted ElizaOS service run, and who owns Venice secrets?** Self-host vs. remote changes Step 5's knowledge contract (internal RPC is only available if WAGDIE-hosted) and pulls deployment work into Phase 0. This is the single biggest ordering unknown after Q1.
4. **Does the official memory/knowledge API support delete/invalidate?** Step 5's stop condition assumes it does. If not, knowledge must stay WAGDIE-canonical with zero official-side index, and Work Item 4's "dual-write knowledge" disappears entirely.

---
**Bottom line:** the plan picks the right architecture (boundary-stable, hosted official service, WAGDIE-canonical persona/knowledge) but over-segments work that depends on Step 1 spike answers. Pin the chat adapter seam, decide the user-token semantics, and answer Q1–Q3 before Step 2. Cut two of the three overlapping compat lists, two of the five rollout modes, and the operational open question.
