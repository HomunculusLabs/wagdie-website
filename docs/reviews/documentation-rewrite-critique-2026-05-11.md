# Documentation Rewrite Plan — Critique

> Lifecycle: Historical (dated critique)
> Plan reviewed: `docs/plans/documentation-rewrite-2026-05-11.md`
> Date: 2026-05-11

Scope: Surface only what would slow or misdirect execution. Not a rewrite.

## 1. Top 3 under-specified seams

1. **"Compatibility stub" shape is undefined.** Used in WI 2, 3, 4 and four top-level files (`SETUP.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `STORYBOOK-QUICKSTART.md`), but the plan never says whether a stub is a one-line pointer, a deprecation banner + brief summary, or a copy of the first paragraph plus a link. This decision drives review-time consistency across ~4 PRs. Pick one shape (recommend: 3-line front matter + single pointer link) and put it in `docs/README.md`'s lifecycle policy.
2. **Lifecycle header ownership.** The plan recommends `Lifecycle / Last validated / Canonical sources` but defines no trigger for refreshing `Last validated`, no owner, and no policy for what happens when the header goes stale. Without that, every page will be stale within a quarter and the header becomes noise. Either bind it to a CI check against canonical sources or drop it from non-runbook pages.
3. **WI 6 classification criteria.** "Inventory and classify each as evergreen, runbook, historical, archive, or superseded" — but no rule for borderline cases (e.g., a 2026-05-10 plan whose decisions shipped). Two contributors will classify the same file differently. Add one sentence: e.g., "If the document describes a one-time change and that change has merged, it is historical."

## 2. Contradictions / missing dependencies

- **Bun vs Node mismatch.** WI 4 exit criteria says "all examples are Bun-first unless a script itself uses npx", but the Background section anchors command truth in `package.json` (Node 23.3.0) and Bun is never introduced as the chosen runtime. Resolve this *before* WI 2 (onboarding), because every code block in `quickstart.md` / `local-development.md` depends on it.
- **`docs/storybook-guide.md` is orphaned.** WI 4 says "Replace Storybook docs with one … `docs/development/storybook.md`" but the Target Structure tree does not list `docs/storybook-guide.md` at all — the disposition (delete? stub? move to archive?) is unstated.
- **`components/README.md` is also outside the tree** but mutated by WI 4. Same issue.
- **WI 1 vs WI 6 ordering gap.** WI 1 creates `docs/plans/README.md`, `docs/reviews/README.md`, etc. *before* WI 6 inventories what's in them. The index will be written from speculation, then revisited. Either fold the index pages into WI 6 or make WI 1 produce empty-shell indexes only.

## 3. Over-planning to cut/simplify

- **Six architecture pages is too many** for a "small, durable docs system." Recommend collapsing to three: `overview.md`, `map-and-phaser.md`, and `eliza-and-backend.md`. `nextjs-and-api.md`, `data-and-persistence.md`, and `blockchain-and-auth.md` can each be a section of `overview.md` with file refs; they do not yet have enough durable surface area to justify their own pages.
- **Delete `docs/reference/scripts.md`.** The plan explicitly says `package.json` is canonical and "do not maintain a second full script registry." A categorized index that immediately defers to `package.json` is exactly that registry, half-built. Fold script categories into `docs/onboarding/local-development.md` or skip entirely.
- **WI 7 (Final consistency pass)** lists five verification bullets that mostly restate the Risks section. Cut to one sentence: "Verify all command/Storybook/schema/runtime claims against canonical sources before merge."
- **Lifecycle header on every new `docs/` page** is heavier than the system needs. Restrict it to `runbooks/`, `plans/`, `reviews/`, and `investigations/` indexes — places where "is this current?" is the actual reader question. Architecture/onboarding pages can rely on git history.

## 4. Questions that would change implementation order

1. **Is Bun or Node canonical for contributor commands?** If Bun, WI 2 cannot start until that's confirmed against `.nvmrc` / `package.json` / `AGENTS.md`. WI 7's verification step is too late.
2. **Are compatibility stubs temporary (one release) or permanent?** If temporary, don't invest in stub formatting; if permanent, the stub shape (seam #1) must be locked first. Resolves Open Question 2.
3. **Do `docs/plans/README.md` and siblings need to enumerate existing files, or only describe lifecycle policy?** If enumerate → WI 1 depends on WI 6 inventory and the two should swap order. If policy-only → WI 1 stays trivial.
4. **Is "new contributor in 30 minutes" the success bar, or "any contributor can find current truth"?** The plan implies both. If the former, onboarding (WI 2) is the only critical path and architecture pages (WI 3) can ship later. If the latter, WI 3 unblocks more readers and should arguably come first.

## Bottom line

The plan is sound in shape but spends budget on structure (six architecture pages, a script reference, a five-point final pass, a header on every page) that the stated goal ("small, durable") argues against. Resolve Bun-vs-Node and stub-shape before writing prose, collapse architecture to three pages, and swap WI 1 ↔ WI 6 ordering for the historical indexes.
