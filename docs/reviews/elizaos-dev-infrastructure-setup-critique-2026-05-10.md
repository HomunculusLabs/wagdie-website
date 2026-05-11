# Critique: ElizaOS Dev Infrastructure Setup Plan (2026-05-10)

**Plan:** `docs/plans/elizaos-dev-infrastructure-setup-2026-05-10.md`
**Mode:** Tightening pass. Prefer deletion or clarification.

## 1. Top under-specified seams

1. **Secret-name truth table is missing.** WI #2 says "`ELIZAOS_API_KEY` in the app must match the service auth token," but the service consumes *three* distinct secrets — `ELIZA_SERVER_AUTH_TOKEN`, `SERVER_API_KEY`, and `WAGDIE_KNOWLEDGE_INGESTION_TOKEN` (`services/elizaos/src/startup-env.ts:3-10`, `83-103`). The plan never names which of these `ELIZAOS_API_KEY` (app) maps to. This is the single most likely misconfiguration trap (silent 401). Add a 4-line table; do not add new prose.

2. **App↔service network wiring in Compose is unspecified.** Existing `app` runs on `default` + `homelab_homelab` networks (`docker-compose.yml:159-167`) and reads env from `.env.docker`. WI #1 says "app-to-service network wiring" but does not say whether `ELIZAOS_BASE_URL` is `http://elizaos:3001` (in-network) or an exposed host port. This determines where smoke and route-parity scripts are executed (in-container vs developer laptop) and therefore the contents of `.env.docker`.

3. **WI #4 migration target and command are undefined.** "Apply missing migrations to dev" lists three `supabase/migrations/2026051*` files but names no command (Supabase CLI? `psql`? `npx supabase db push`?) and no target (the in-Compose `db:` Postgres at `:5442`, or remote `wagdie-api.runiverse.ai`?). Compare to WI #5, which names `bun run elizaos:smoke` precisely. Either name the command and DSN, or fold this work item into ops's existing migration runbook.

## 2. Contradictions / missing dependencies

- **WI #1 and WI #3 overlap.** Both list `docker-compose.yml` and both add/configure `elizaos-db`. Merge them, or split cleanly: WI #1 = service definition + healthcheck; WI #3 = persistence + DSN/credentials only.
- **Validation Sequence step 1 ordering is ambiguous.** It places "relevant tests for Eliza auth, chat, conversations, knowledge sync, official client" *before* dev deploy. If any of those tests require a live ElizaOS service, the order breaks. Mark these explicitly as unit tests, or move to after WI #5.
- **Open Questions are gates, not questions.** Open Question #1 ("Is the dev server actually Compose-based?") must be answered before WI #1 starts; the plan only treats it as a sub-bullet "decision gate." Promote to a precondition above the Work Items list.

## 3. Over-planning to cut or simplify

- **Minimum matrix table duplicates WI #5 + WI #7 exit criteria.** Same proofs, two places. Delete the matrix and let the exit criteria stand.
- **"Production Hardening Gates" section overlaps WI #8.** Only one substantive gate is unique (Eliza PUT staker/admin parity). Fold that bullet into WI #8 and delete the section.
- **"Observability" is launch-quality scope for a dev validation milestone.** First-token latency, log redaction policy, mapping insert/update/delete metrics belong in the prod cutover plan that already exists (`docs/plans/elizaos-cutover-remaining-work-2026-05-10.md`). Trim dev observability to: ElizaOS `/api/server/health`, container restart count, `/api/eliza/chat` 5xx rate.
- **Non-goals list is mostly defensive scope-locking.** Schema redesign, per-user canary flags, frontend-direct calls are not at risk. Keep only the two that gate ordering: "do not remove legacy path" and "do not change browser-facing `/api/eliza/*` contracts."

## 4. Questions whose answers would change implementation order

1. **Are the three `eliza_*_2026051*` migrations already applied to dev WAGDIE Supabase?** If yes, WI #4 is a 5-minute validation. If no, it must precede WI #6 by enough lead time that the app's official-mode startup does not reference missing tables. Changes whether WI #4 is trivial or gating.
2. **Which Supabase is "dev" — the in-Compose `db:` or remote `wagdie-api.runiverse.ai`?** Indexers point at the remote (`docker-compose.yml:175-176`); the app points at local Kong (`:159-166`). WI #3's "keep separate from WAGDIE Supabase" is unverifiable until this is named.
3. **Is `ELIZAOS_BASE_URL` a Compose-internal hostname or an exposed port?** Dictates whether smoke (WI #5) and route parity (WI #7) run inside the Compose network or from a host shell, and therefore who owns running them.
4. **`ELIZAOS_API_KEY` ↔ `ELIZA_SERVER_AUTH_TOKEN` vs `SERVER_API_KEY`?** Resolving this may move WI #2 ahead of WI #1 — provisioning the secret store before standing up the service is cheaper than a rebuild on first 401.

## Recommendation

Plan is sound in shape and grounded in real seams. The shortest path to "ready to execute" is **subtractive**: cut the matrix, observability, hardening, and most non-goals; replace them with a 4-line secret-mapping table and explicit answers to the four ordering questions above. Do not add new sections.
