# Critique: Map Page Improvements Plan (2026-05-11)

Plan: `docs/plans/map-page-improvements-2026-05-11.md`
Scope of this review: under-specified seams, contradictions, over-planning, ordering questions. No scope expansion.

## 1. Top 3 under-specified seams

1. **Tab state ownership (Work Item 6).** `activeTab` lives in `useMapStakingPanel`; the sidebar consumes it as `panel.activeTab` / `panel.setActiveTab` (`components/map/MapStakingSidebar.tsx:48-53`, `:135-141`). The plan says “default to `staked-here` on new marker selection, keyed by marker id, in `MapStakingSidebar`, not inside staking business logic.” But the state lives inside the hook today. The plan does not say whether to (a) call `setActiveTab` from a `useEffect` in the sidebar keyed by `selectedMarker.id`, (b) pass an `initialTab` prop into the hook, or (c) lift state. Pick one before WI5/WI6 land.
2. **`refetch` only reloads staked characters, not locations (`hooks/map/useMapData.ts:163-179`).** WI2 hedges: “if reload remains, label it ‘Reload map’.” “Reload map” overstates what `refetch` actually does. Either expand `refetch` to reload locations + staked, or keep the label scoped (e.g., “Reload characters”). Decide, don’t defer.
3. **`StakingGuideCard` insertion point (Work Item 5).** When no marker is selected the sidebar currently falls into the `your-characters || !isLocationMarker` branch (`MapStakingSidebar.tsx:178-244`), which renders `WalletGate` or the owned-character flow. The plan says “render above the current flow” without saying whether it replaces, prepends to, or sits inside that branch — and whether it shows when disconnected, connected with zero owned, or both. Pin this down with one sentence.

## 2. Contradictions / missing dependencies

- WI2 says “Use the staged loading data already exposed by `useMapData` **if available** in the hook contract.” It is available — `loadingProgress`, `loadingStage`, `loadingStages` are already returned (`useMapData.ts:181-191`). Drop the hedge; the conditional reads as the author not having checked.
- WI3 requires “only HUD controls capture pointer events” but says nothing about z-index/positioning vs. the existing `MapLayerControls` overlay. Without a layout rule, HUD + LayerControls can fight on mobile. Either share a single overlay container or specify quadrants per breakpoint.
- WI6 introduces tab-defaulting on marker selection, but Validation Gates require “room tab behavior remains unchanged.” If a user has the Room tab open and clicks a different location marker, defaulting back to `staked-here` is a behavior change. Either call this out as intended, or scope the default to “first selection only.”

## 3. Over-planning — cut or simplify

- **WI1 (“Lock map architecture guardrails”)** restates the Goal/Background and the Validation Gates. Delete it; the same constraints already appear at the top.
- **WI8 (“Validate responsive layout”)** duplicates the Validation Gates checklist. Merge into Validation Gates and remove the work item.
- **References section** lists seven hooks and five game files when only `MapStakingSidebar`, `MapLayerControls`, `app/map/page.tsx`, and the new HUD/Guide files are actually edited. Trim to files touched; the rest is reading material, not plan scope.
- Per-WI repetition of “keep X unchanged / preserve Y” — already stated in Approach. One global guardrail line is enough.
- Net effect: this plan is ~127 lines and should be ~70.

## 4. Questions that would change implementation order

1. **Where does `activeTab` live after WI6?** If state must move out of `useMapStakingPanel` (e.g., to an `initialTab` prop), do that refactor *first* so WI5 and WI6 don’t both touch the hook surface twice.
2. **Does the no-location `StakingGuideCard` replace or augment the existing wallet/character flow when no marker is selected?** Replace → WI5 is a refactor of the `!isLocationMarker` branch. Augment → WI5 is a small additive insert. The answer changes effort and test surface.
3. **Is the HUD a sibling of `MapLayerControls` or a parent that contains it?** If parent, WI3 and WI4 should land together; if sibling, WI4 can ship first and stand alone.
4. **Should `useMapData.refetch` reload locations too?** If yes, that ships before WI2 copy changes; if no, WI2’s “Reload map” label should be downgraded before any copy is written.

---
Recommendation: answer Q1 and Q2 in a 2-line addendum, delete WI1 and WI8, trim References, and remove the “if available” hedge in WI2. No other expansion needed.
