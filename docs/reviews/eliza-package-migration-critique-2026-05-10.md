# Critique: Eliza Package Migration Plan (2026-05-10)

**Source plan:** `docs/plans/eliza-package-migration-2026-05-10.md`
**Scope:** under-specified seams, contradictions, over-planning, ordering questions. No scope expansion.

## 1. Top 3 under-specified seams

1. **Knowledge document path is missing from the gateway.** Step 2 lists only `auth`, `characters`, `chat`, `conversations` on `WagdieElizaClient`, but knowledge endpoints are real WAGDIE routes (`app/api/eliza/characters/[tokenId]/knowledge/[documentId]/route.ts:1-49`, plus `export/route.ts`, `import/route.ts`). They reach Eliza through `lib/eliza/knowledge`, which the plan never names. Either add `knowledge.list/get/upload/delete` to the gateway, or explicitly declare `lib/eliza/knowledge` an app-owned module that talks to the gateway's character methods. Today the plan validates knowledge in baseline tests but never wires it to Step 4.
2. **`ElizaError` is a runtime value, not just a type.** It is re-exported from `lib/eliza/sdkAdapter.ts:8` and `types/eliza.ts:18`. Routes likely use `instanceof ElizaError` for normalization. Step 5 ("Replace types at the boundary") treats this as a type swap; the plan needs a concrete decision: introduce `WagdieElizaError` (subclass or replacement), and define when sdkAdapter stops re-exporting the SDK class. Without that, deleting `types/eliza-sdk.d.ts` (Step 6) breaks runtime behavior, not just types.
3. **Two different SSE layers are conflated.** Step 3 puts "upstream SSE normalization" in `lib/eliza/gateway/stream.ts`, while `app/api/eliza/chat/route.ts:30-188` emits a separate WAGDIE→browser SSE contract. The plan never says which format `gateway/stream.ts` parses (local SDK callback shape vs. raw upstream `token/content/done`) or which it emits. Pick one boundary, name it, and pin event names.

## 2. Contradictions / missing dependencies

- **"Single SDK entrypoint" claim is wrong.** Background says `lib/eliza/client.ts` is the only entrypoint, but six files import `@eliza/sdk`: `client.ts`, `characterResolver.ts:10`, `sdkAdapter.ts:8`, `types/eliza.ts:18`, `app/api/eliza/auth/nonce/route.ts:16` (`createSIWEMessage`), and `types/eliza-sdk.d.ts`. Wrapping `client.ts` alone (Step 2) does **not** create a "no-behavior-change seam" — `createSIWEMessage` and `ElizaError` still leak. Step 3 partially fixes SIWE; the plan should explicitly enumerate every non-`client.ts` import as an exit task before declaring Step 2 done.
- **Step 5 / Step 3 ordering inconsistency.** Step 5 says "delete `types/eliza-sdk.d.ts` only after no app code imports `@eliza/sdk`," but Step 3 keeps `sdkAdapter.ts` as a facade — and that file currently imports `ElizaError` from `@eliza/sdk`. Either the facade must move to gateway-owned types in Step 3, or Step 5's deletion gate is unreachable.
- **"Temporary local-SDK gateway wrapper" appears in Step 6 / Rollback** but Step 2 doesn't label the initial wrapper as temporary. Tag it explicitly so it isn't preserved as architecture.

## 3. Over-planning to cut or simplify

- **`ELIZA_CLIENT_BACKEND` env selector (Work Items 6).** The gateway interface already isolates the swap; a runtime backend toggle adds two-prod-paths risk and a permanent dead-code branch. Cut it; rely on branch + canary instead.
- **Compatibility Validation table vs. Work Item 5 vs. Stop Conditions.** Three sections describe the same compat matrix. Collapse into one: a single matrix with stop-condition rows.
- **Open Question #2** (`@elizaos/server` hosting) is explicitly out of scope per Recommendation #2. Delete it from this plan.
- **Step 2's "legacy list/get/create/update/delete as needed" hedge.** Either WAGDIE uses these or it doesn't — grep first, then list the exact methods. The hedge invites scope creep.

## 4. Questions whose answers change implementation order

1. **Does `@elizaos/api-client` expose `createRecord` / `replaceRecord` / `getRecordByExternalId`?** If no, raw-HTTP record support becomes a Phase-1 prerequisite, not Step 4 fallback. This is the single biggest order-changing unknown.
2. **Does `@elizaos/api-client` ship a SIWE helper, or only `/auth/nonce` + `/auth/verify`?** If the latter, app-owned `lib/eliza/siwe.ts` (Step 3) must land **before** the gateway impl (Step 4), not in parallel. If it ships one, snapshot its message format against the local SDK before committing.
3. **Does `@elizaos/api-client` expose an `ElizaError`-equivalent class?** If not, error normalization (`WagdieElizaError`) must precede route migration to avoid silent `instanceof` regressions.
4. **Should knowledge go through the gateway at all, or stay in `lib/eliza/knowledge` calling the gateway's character methods?** Answer determines whether Step 2's interface grows a `knowledge` namespace and whether knowledge tests block Step 4.

---
**Bottom line:** the plan is structurally sound but over-segmented. Fix the "single entrypoint" framing, explicitly enumerate the non-`client.ts` SDK leaks (SIWE, `ElizaError`, knowledge), and resolve Q1–Q3 before Step 2 starts — the answers reorder phases. Cut the env selector and one of the three compat sections.
