# Map Page Improvements: Plan

## Goal

Make `/map` easier to understand, navigate, and act on while preserving the current client-only React/Phaser boundary, EventBus contract, map data flow, and staking/sidebar behavior.

This is a targeted UI/IA pass. Do not rewrite Phaser, revive Leaflet, add a second map implementation, or change staking/location-room contracts.

## Background

- `/map` dynamically imports `PhaserGame` with `ssr: false`, owns readiness, wallet, data, layers, marker payloads, selection state, and the EventBus bridge (`app/map/page.tsx:8-72`).
- The route renders a full-height Phaser canvas, layer controls, an interaction hint, a “Manage Staking” toggle, and `MapStakingSidebar` (`app/map/page.tsx:115-171`).
- React owns data, wallet-aware selection, layer UI, and sidebars; Phaser owns canvas rendering, the map image, camera, markers, pointer input, and animations (`docs/architecture/map-and-phaser.md:1-15`).
- `game/EventBus.ts` is the typed React/Phaser bridge; this plan should not require new events or payload fields (`game/EventBus.ts:13-201`).
- `useMapPageEventBridge` emits layer/data updates and resizes the game when the sidebar opens or closes (`hooks/map/useMapPageEventBridge.ts:29-98`).
- `MapStakingSidebar` already decomposes UI into `components/map/staking-sidebar/`, but its route-level flow still mixes details, tabs, wallet gating, staking, room actions, approvals, errors, and pagination (`components/map/MapStakingSidebar.tsx:24-256`).
- Prior history migrated the canonical map from Leaflet/SimpleMap to Phaser; old Leaflet docs are cautionary context only (`docs/archive/MAP_REBUILD_SUMMARY.md`, commits `716ec4fa`, `d4991205`).

## Approach

Improve comprehension and action hierarchy around the existing map engine.

Serve two audiences in order:

1. **World explorers** — disconnected or first-time visitors should understand what the map shows, how to inspect locations, and why character markers depend on wallet connection.
2. **Connected stakers** — wallet users should understand that staking starts by choosing a location, then selecting/approving a character.

Keep the work on React overlays and sidebar presentation. Preserve `LayerVisibility` keys, localStorage shape, marker payloads, staking hooks, room hooks, and Phaser lifecycle.

## Work Items

1. **Improve loading and error clarity in `app/map/page.tsx`**
   - Use `loadingStage` and `loadingProgress`, which are already returned by `useMapData` (`hooks/map/useMapData.ts:31-38`, `hooks/map/useMapData.ts:181-191`).
   - Keep the full-height dark loading/error frame (`app/map/page.tsx:78-111`).
   - Keep the error action as a full page reload and label it “Reload map.” Do not wire it to `refetch`, because `refetch` only reloads staked characters (`hooks/map/useMapData.ts:163-179`).

2. **Add a lightweight `MapPageHud` overlay**
   - New file: `components/map/MapPageHud.tsx`.
   - Render it from `app/map/page.tsx` after data loads.
   - Inputs should be presentational: `mapReady`, `isSidebarOpen`, wallet connection/address, location count, staked-character count, and `onOpenStaking`.
   - Copy should explain: click a location to inspect it, connect a wallet to see your characters, and select a location before staking.
   - Layout rule: keep `MapLayerControls` top-left; place the HUD bottom-left on desktop and behind a compact “Map Guide” affordance on mobile. Only HUD controls should capture pointer events.

3. **Clarify layer controls without changing layer contracts**
   - Update `components/map/MapLayerControls.tsx` only.
   - Rename visible `Characters` copy to `Your Characters`; keep the `characters` key unchanged (`components/map/MapLayerControls.tsx:6-34`).
   - Add short expanded descriptions such as “Places you can inspect,” “Only visible when connected,” and “Fallen warriors.”
   - Preserve `LayerVisibility`, `onToggleLayer`, persisted `wagdie-map-layers` shape, icons, and EventBus emissions.

4. **Add a no-location staking guide to the sidebar**
   - New file: `components/map/staking-sidebar/StakingGuideCard.tsx`.
   - In `MapStakingSidebar`, prepend it inside the existing `panel.activeTab === 'your-characters' || !isLocationMarker` branch when `selectedMarker === null` and `selectedLocation === null` (`components/map/MapStakingSidebar.tsx:178-244`).
   - Show it for both disconnected and connected users; disconnected copy should explain that browsing works without a wallet, while staking requires connection.
   - Do not replace the existing `WalletGate` or owned-character flow.

5. **Reframe location sidebar tabs as user actions**
   - Update `components/map/staking-sidebar/LocationTabs.tsx` visible labels only:
     - `Staked Here` → `At This Location`
     - `Room` remains `Room`
     - `Your Characters` → `Stake Here`
   - Keep `LocationTab` values unchanged (`hooks/map/useMapStakingPanel.ts:18`).
   - Add a `useEffect` in `MapStakingSidebar` that calls `panel.setActiveTab('staked-here')` when `selectedMarker?.type === 'location'` and the selected marker id changes. Do not lift tab state and do not add an `initialTab` hook API.
   - This intentionally makes each newly selected location start at “At This Location”; the user can still choose Room afterward.

6. **Tighten wallet, approval, and room copy**
   - Update `WalletGate` so it distinguishes browsing the map from staking actions.
   - Update `ApprovalBanner` / `ApprovalReadyBanner` to explain approval as a one-time prerequisite and the next step after approval.
   - Update `LocationRoomPanel` copy so room activity reads as an optional location feature, not the primary staking path.
   - Keep hooks, transactions, polling, room triggers, errors, and pagination unchanged.

## Validation Gates

- Run `bun run lint` and `bun run build`.
- Disconnected visitor: map loads with orientation copy, locations can be inspected, the character layer explains wallet dependency, and opening staking without a location gives a useful next step.
- Connected visitor: clicking a location opens the sidebar on “At This Location,” “Stake Here” preserves approval/staking behavior, room tab behavior still works after selecting it, and unstaking/pagination still work.
- Interaction/regression: Phaser remains client-only and dynamically imported; no new EventBus events or marker payload fields are needed; layer localStorage shape remains compatible; sidebar open/close still resizes the canvas; overlays do not block canvas gestures outside their controls.
- Responsive check at 375px, 768px, and 1280px for HUD, layer controls, staking button, and sidebar overlap.

## Open Questions

None blocking. The plan intentionally chooses world exploration first, staking as the connected-user action path, no new EventBus events, no Phaser rewrite, and no Leaflet revival.

## References

- Route: `app/map/page.tsx`
- Architecture: `docs/architecture/map-and-phaser.md`
- Route hooks: `hooks/map/useMapData.ts`, `hooks/map/useMapPageEventBridge.ts`, `hooks/map/useMapStakingPanel.ts`
- UI touched: `components/map/MapLayerControls.tsx`, `components/map/MapStakingSidebar.tsx`, `components/map/staking-sidebar/LocationTabs.tsx`, `components/map/staking-sidebar/WalletGate.tsx`, `components/map/staking-sidebar/ApprovalBanner.tsx`, `components/map/staking-sidebar/LocationRoomPanel.tsx`
- Phaser boundary: `game/EventBus.ts`, `game/PhaserGame.tsx`, `game/scenes/MapScene.ts`
- Prior map notes: `docs/archive/MAP_REBUILD_SUMMARY.md`
