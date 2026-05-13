# Homepage Improvements: Plan

## Goal

Make `/` a stronger WAGDIE landing page: clearer first-time orientation, more compelling paths into live app areas, and better media/accessibility foundations without changing core app contracts or starting a broad brand redesign.

## Background

- The homepage is a client component because it owns video consent state and cookie reads/writes (`app/page.tsx:1-20`, `app/page.tsx:158-170`).
- The route defines `VideoPlayer`, `FeatureCard`, and `Section` inline, then hardcodes the hero, quote, three card sections, and final CTA (`app/page.tsx:22-155`, `app/page.tsx:194-334`).
- Lore CTAs/cards are hidden unless `NEXT_PUBLIC_SHOW_LORE_NAV === 'true'`, so the default production homepage must still feel complete when lore is unavailable (`app/page.tsx:7`, `app/page.tsx:214-218`, `app/page.tsx:238-262`, `app/page.tsx:299-305`).
- The homepage should continue linking to `/map`; Phaser stays isolated behind the map route's client-only dynamic import and EventBus bridge (`app/page.tsx:279-286`, `app/map/page.tsx:24-39`, `game/EventBus.ts:171-189`).
- The visual language should stay within the current dark gothic system: sharp edges, muted surfaces, Fraktur display type, restrained accent glows, existing Tailwind tokens, and `components/ui/` primitives (`docs/development/design-system.md:14-90`).
- Prior UI/UX planning already called out homepage CTA repair, consent-overlay accessibility, layout structure, and video overlay clarity (`docs/ui-ux-remediation-plan.md:35-118`).

## Approach

Treat this as a targeted `app/page.tsx` update. Keep the homepage client-side, preserve the current consent cookie name/values, keep native video playback, and use existing `components/ui/` primitives before adding anything new.

Recommended page shape, after route/link inventory passes:

1. **Hero / orientation** — add a stronger one-sentence WAGDIE headline, keep the intro video central, and make `/characters` the primary CTA with `/map` as the secondary CTA.
2. **Choose your path** — cards for Characters (`/characters`), World Map (`/map`), and Searing (`/searing`) if all three are confirmed homepage-eligible.
3. **Rituals and consequences** — cards for Spread (`/spread`) and Low Poly Videos (`/videos`), plus Lore (`/lore`) when `showLoreNav` is true; when lore is off, use a verified Discord/community card instead.
4. **Final CTA** — keep it focused on Explore Characters and Join Discord.

Do not embed Phaser, map hooks, wallet-only flows, or new persistence/API contracts into the homepage. The homepage should orient users and route them into the systems that already own those concerns.

## Work Items

1. **Lock the route and link inventory**
   - Verify `/characters`, `/map`, `/spread`, `/searing`, and `/videos` are valid homepage destinations in the target environment.
   - Verify `/lore` only appears when `NEXT_PUBLIC_SHOW_LORE_NAV=true`.
   - Verify Discord before using it as the lore-off fallback or final CTA; replace unverified external links with live internal routes.
   - If `/searing` or `/spread` is not homepage-eligible, revise the card layout before doing copy or media work.

2. **Replace the consent overlay with the shared modal primitive**
   - Use `components/ui/Modal.tsx` instead of the custom fixed overlay in `app/page.tsx:174-191`.
   - Provide a custom footer with explicit “Enable autoplay” and “No autoplay” actions; do not rely on the modal's default Close/Accept footer.
   - Preserve `wagdie_video_consent`, `granted` / `denied`, max age, path, and SameSite behavior for explicit choices (`app/page.tsx:9-20`).
   - Treat Escape/backdrop/close as a session-only “no autoplay” dismissal, not a year-long `denied` cookie write.

3. **Harden video states**
   - Separate persisted consent from session dismissal if needed so `null`, explicit `denied`, and explicit `granted` are distinguishable.
   - For denied or dismissed users, show the poster/static state with a clear “Enable video” action.
   - For granted users, keep muted autoplay, looping, plays-inline behavior, and the explicit unmute overlay (`app/page.tsx:39-69`).

4. **Rewrite hero and section copy**
   - Add a visible headline that explains WAGDIE before the feature-card sections.
   - Set primary CTA to `/characters`, secondary CTA to `/map`, and optional tertiary copy/link to `/videos`.
   - Keep dark-fantasy tone, but prioritize clarity over lore density.
   - Make every CTA communicate its destination and consequence.

5. **Rebuild homepage sections around verified routes**
   - Replace the current loose three-section card sequence with the Approach structure above.
   - Keep lore cards behind `showLoreNav`.
   - Use Discord/community as the named lore-off fallback only after the external link is verified.
   - Keep all cards destination-driven; no disabled or placeholder homepage cards.

6. **Improve card media reliability**
   - Convert local feature-card images from raw `<img>` to `next/image` using `Image fill` inside the current fixed-height card image region unless implementation finds a stronger reason to change layout.
   - Confirm every referenced image exists under `public/`; replace missing assets before shipping.
   - Preserve the current gothic hover treatment and stable card heights.

7. **Accessibility and responsive pass**
   - Ensure each band is a `<section>` with a visible heading.
   - Confirm keyboard order flows from header to consent/hero, CTAs, feature cards, final CTA, then footer.
   - Check visible focus on links, buttons, modal controls, and video controls.
   - Test video poster/enable controls and card grids at 375px, 768px, and 1280px.

## Validation Gates

- Run `bun run lint` and `bun run build`.
- Preview with `NEXT_PUBLIC_SHOW_LORE_NAV=false`:
  - no visible `/lore` homepage links;
  - no sparse lore-driven sections;
  - clear paths remain for characters, map, rituals, videos, and community.
- Preview with `NEXT_PUBLIC_SHOW_LORE_NAV=true`:
  - lore cards/CTAs appear;
  - `/lore` behavior matches global navigation.
- Test video consent:
  - no cookie opens the modal;
  - keyboard focus stays inside the modal;
  - explicit choices write the correct cookie;
  - Escape/backdrop/close does not write a year-long denial;
  - `granted` autoplays muted;
  - denied/dismissed state shows a non-autoplay poster with an enable option.
- Manually check internal links: `/characters`, `/map`, `/spread`, `/searing`, `/videos`, and `/lore` only when enabled.
- Verify Discord/community link before using it in the lore-off state or final CTA.

## Open Questions

None blocking for planning. Implementation should verify final copy, external links, and feature-flag behavior against the deployment environment before shipping.

## References

- Current homepage: `app/page.tsx`
- Consent modal primitive: `components/ui/Modal.tsx`
- Visual language: `docs/development/design-system.md`
- UI/UX remediation baseline: `docs/ui-ux-remediation-plan.md`
- Map/Phaser seam: `app/map/page.tsx`, `game/EventBus.ts`
