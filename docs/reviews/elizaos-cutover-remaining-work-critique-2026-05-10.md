# Critique: ElizaOS Cutover Remaining Work (2026-05-10)

**Source plan:** `docs/plans/elizaos-cutover-remaining-work-2026-05-10.md`
**Scope:** under-specified seams, contradictions, over-planning, ordering questions. The chosen rollout (dev-server-first → prod promotion, no canary) is treated as fixed.

## 1. Top 3 under-specified seams

1. **"Fail closed" has no implementation locus.** Work Item 2 says production must require `ELIZA_SERVER_AUTH_TOKEN`, `WAGDIE_KNOWLEDGE_INGESTION_TOKEN`, `SERVER_API_KEY`, `VENICE_API_KEY`, `DATABASE_URL`/`POSTGRES_URL` and reject unauthenticated local knowledge ingestion outside dev — but doesn't name a file, function, or boot-time check. The Cleanup section also says "add strict production env validation around service startup," duplicating the same gap. Pin a single owner: e.g. an env-validation module imported from `services/elizaos/src/index.ts` (or wherever the service entry actually is) that throws when `NODE_ENV=production` and any required var is missing. Without that, "fail closed" is aspirational.
2. **The dev → prod env-flip target is unnamed.** Work Item 1 exit says "WAGDIE dev points at the dev ElizaOS base URL"; Work Item 6 says "promote the configuration." The plan never names the variable (`ELIZA_OFFICIAL_BASE_URL`? `ELIZA_API_URL`?) nor whether `ELIZA_INTEGRATION_MODE` is build-time or runtime-tunable. Rollback timing (Item 7) hinges on this — a runtime env flip is seconds; a build-time flip is a redeploy.
3. **"Restart persistence" / "fresh DB and after restart" is operationally vague.** Item 3 demands smokes pass twice — fresh DB and after restart — but doesn't say whether the smoke script orchestrates the restart, who runs it, or how "fresh DB" is reset (truncate, re-migrate, recreated container?). Either teach `scripts/elizaos-official-smoke.ts` two flags (`--reset`, `--post-restart`) or write a two-step runbook. Right now it's neither.

## 2. Contradictions / missing dependencies

- **No item owns running migrations on prod.** Item 4 ("Validate production schema") depends on "migrations applied" but no work item applies them. Either fold migration application into Item 4 or add it as Item 4a; otherwise Item 4 can fail at gate time with no recovery owner named.
- **Item 6 silently bundles "deploy ElizaOS to prod."** It's described only as "promote dev-validated configuration," but prod ElizaOS infra (DNS, secrets, DB, service container) is first mentioned here. Either rename Item 6 to "Deploy prod service + promote configuration" or add an explicit prod-infra item. As written, the dependency chain implies prod service magically exists.
- **Cleanup vs. Item 2 duplicate env validation.** "Add strict production env validation around service startup" (Cleanup) is the same exit criterion as Item 2. Pick one home; delete the other line.
- **Open Question #1 is also a decision gate.** Item 6's gate ("production deploy proceeds only after…") and rollback in Item 7 both presume a named rollback executor, but Open Question #1 leaves that owner TBD. Decide before Item 6 starts.

## 3. Over-planning — cut or simplify

- **Observability list is gold-plated for dev-first.** Eight metrics + structured-log fields enumerated. For a first cutover, four signals carry the load: health, 5xx rate, stream errored count, knowledge sync errors. Cut first-token latency, stream-duration, session-create/delete failures, and Supabase mapping write counters until prod stabilization actually surfaces a need.
- **Smoke matrix duplicates Item 3 exit criteria.** The matrix is the better artifact; trim Item 3's bullet list to "smoke matrix below passes twice (fresh DB, post-restart)."
- **Item 7 is a paragraph, not a work item.** "Don't remove legacy paths in this wave" is a Non-goal already implied. Demote to a single bullet under Rollout, or merge into Non-goals. The depends-on chain it creates adds bureaucracy with no execution content.
- **Open Question #2 ("exact dev-server validation checklist?") is self-answering.** It is the smoke matrix. Delete the question.
- **Open Question #3 ("how long is stabilization?") is a decision, not research.** Pick a window (e.g. 7 days or 100 production chats, whichever first) inline; don't leave it open.
- **Cleanup comment-update bullet** (`lib/eliza/config.ts`, `lib/eliza/official/service-client.ts`, `lib/eliza/official/client.ts`, `app/api/eliza/chat/route.ts`) names files but not what's stale. Either spell out the diff target or cut it from this plan and file as a follow-up issue.

## 4. Questions whose answers change implementation order

- **Is the prod ElizaOS service infra already deployed, or does it land in Item 6?** If the latter, prod-infra work must precede Item 4 (schema validation against prod DB) — current order has Item 4 running before any prod service exists.
- **Do dev and prod share one ElizaOS Postgres, or separate?** If separate, Item 4 cannot run until prod DB exists (couples to the question above). If shared, "restart persistence" testing in Item 3 risks touching prod data.
- **Is `ELIZA_INTEGRATION_MODE` runtime-tunable or build-time baked?** If build-time, the rollback runbook must include a redeploy step and Item 7's "rollback is tested" exit needs a measured recovery time, not just a doc.
- **Are the three `eliza_*` tables already on prod, or applied as part of cutover?** Determines whether Item 4 is a verification step (assertion-only) or includes the migration apply itself — different ownership, different gate behavior.
- **Does the dev WAGDIE env share the prod Supabase project?** If yes, Item 5 route parity is touching prod data, which is a non-trivial scope expansion the plan doesn't acknowledge.
