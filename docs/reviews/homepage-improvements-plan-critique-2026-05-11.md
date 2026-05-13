# Critique: Homepage Improvements Plan (2026-05-11)

Reviewing `docs/plans/homepage-improvements-2026-05-11.md`. Scope kept tight: seams, contradictions, over-planning, ordering questions.

## 1. Top under-specified seams

1. **Consent modal swap (Work Item 2) vs. `components/ui/Modal.tsx` API.** `Modal` exposes a single `onClose` callback and a default footer that renders **Close + Accept** — both wired to `onClose` (`components/ui/Modal.tsx:166-172`). The plan says Escape, backdrop, *and* close-button must persist `'denied'` to the year-long `wagdie_video_consent` cookie. That's implementable only if implementation supplies a **custom `footer`** with an explicit allow action and treats every other dismissal as `denied`. The plan never says this, and never confronts the UX cost: a stray Escape press locks autoplay off for a year. Either say "Escape/backdrop are ephemeral (no cookie write)" or extend `Modal` with an explicit `onDismiss`/`onConfirm` split. Today's behavior is the same as the proposed: dismiss without persisting — silently degrading that needs to be intentional, not incidental.

2. **`next/image` migration target shape (Work Item 6).** `FeatureCard` currently uses a fixed `h-48` container with `<img class="object-cover">` (`app/page.tsx:91-99`). The plan simultaneously suggests "`next/image` where practical" *and* "Preserve stable image regions via `AspectRatio`." `AspectRatio` is already imported but never wraps the card image — choosing one or the other (not both) decides whether the change is `<img>→<Image fill>` inside the existing `h-48 relative` box or a structural swap to `AspectRatio`. Pick one. Also: `next.config.js:15` already declares `remotePatterns`, but the plan never names which card images are local vs. remote, so the migration's true cost is unknown.

3. **"Always-visible cards for ... Searing (`/searing`)" before route verification.** The Approach (page shape) promotes `/searing` and `/spread` to first-class always-visible cards, but Work Item 1 is "Verify `/characters`, `/map`, `/spread`, `/searing`, `/videos` are valid homepage destinations." If `/searing` or `/spread` isn't shippable in production, the entire section 2/3 layout collapses — and Work Item 5 forbids placeholder cards. Verification must precede design, not run alongside it.

## 2. Contradictions / missing dependencies

- **Fallback card has no destination.** Approach §3 calls for a "verified community/internal fallback" when lore is off; Work Item 5 says "Add a non-lore fallback card" and also "no disabled or placeholder homepage cards." No candidate route is named. This is a blocker masquerading as a copy decision.
- **"None blocking" Open Questions** contradicts the two unverified routes (`/searing`, `/spread`) and the un-named fallback above. The section should either list these or be cut.
- **Cookie-preservation contract vs. dismiss-as-denial.** Work Item 2 says preserve the existing cookie shape; mapping every dismiss path to `'denied'` *changes* the effective contract (today, dismissing the overlay is impossible without choosing). Flag the semantic change explicitly.

## 3. Over-planning — cut or simplify

- **References block (13 lines).** Decorative; the Background already cites every relevant path with line numbers. Delete.
- **Background § (9 bullets).** Trim to 3: consent contract, lore flag, Phaser isolation. The rest is restating files the reader will open anyway.
- **Validation gate "Confirm homepage does not import `PhaserGame`, map hooks, `game/EventBus.ts`, or wallet-only flows."** Nothing in the plan proposes adding them; this guards against a non-threat. Cut.
- **Validation gate "invalid cookie values behave like no cookie."** Already enforced by `readVideoConsent` (`app/page.tsx:13-16`). Not a new gate.
- **Work Item 7 nested-`<main>` check.** One-line verification, not a refactor — fold into Work Item 5 or drop. `Layout` already owns the landmark.
- **Work Item 8 (final copy pass).** Right intent, wrong granularity for a plan. Collapse into Work Item 4.

## 4. Questions whose answers reorder implementation

1. **Is dismiss-as-denial persistent or ephemeral?** If ephemeral, the custom overlay stays and Work Item 2 is gated on a Modal-API extension (or dropped). If persistent, Modal swap is straightforward — but needs a custom `footer` with an explicit Allow button. This decision lives **before** any UI code.
2. **Do `/searing` and `/spread` exist as homepage-eligible routes today?** If no, Work Item 1 must complete before Work Item 5 — section shape depends on the answer. Currently Items 1 and 5 are listed as peers.
3. **Which route fills the non-lore fallback card?** Until this is named, Work Item 5 cannot finish. Candidates: `/videos`, `/characters` (duplicate of primary CTA — likely wrong), or a Discord card from Work Item 1's external-link audit.
4. **Are any feature-card images remote-hosted?** If yes, `next.config.js` `remotePatterns` work precedes Work Item 6; if all local, it's a leaf change. Either way it shifts Work Item 6's effort estimate.

---

**Recommendation:** Answer Q1–Q3 before sequencing; cut References, half of Background, and the two unnecessary validation gates; pick one of `<img fill>`-in-`h-48` *or* `AspectRatio` for card media. Plan is ~30% over-specified and ~10% under-specified — net shorter, but the under-specified seams are the load-bearing ones.
