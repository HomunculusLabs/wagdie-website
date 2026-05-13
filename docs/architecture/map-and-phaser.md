# Map and Phaser Architecture

The world map is a client-only subsystem that keeps React state and Phaser rendering separate. React owns data fetching, wallet-aware selection, layer UI, and sidebars. Phaser owns the canvas, map image, camera, markers, pointer input, and animations.

## Key files

- `app/map/page.tsx` — page composition, data hooks, layer controls, staking sidebar, and Phaser bridge mount.
- `hooks/map/useMapData.ts` — loads locations and staked characters for the map UI.
- `hooks/map/useMapPageMarkers.ts` — turns staked character rows into EventBus character/event payloads.
- `hooks/map/useMapPageSelection.ts` — stores the selected marker and staking sidebar state.
- `hooks/map/useMapPageEventBridge.ts` — emits React state changes into Phaser through EventBus.
- `game/PhaserGame.tsx` — creates/destroys the Phaser game and translates Phaser-originated events to React callbacks.
- `game/EventBus.ts` — typed singleton event channel between React and Phaser.
- `game/main.ts` — Phaser game configuration and `createGame()` factory.
- `game/scenes/MapScene.ts` — main Phaser scene.
- `game/scenes/map/event-bindings.ts` — binds EventBus events to `MapScene` handlers and returns cleanup.

## High-level flow

```text
app/map/page.tsx
  ├─ loads map data and wallet address
  ├─ derives layer, marker, and sidebar state
  ├─ dynamically imports game/PhaserGame.tsx with ssr: false
  └─ calls useMapPageEventBridge(...)
        ↓ emits React → Phaser events
game/EventBus.ts
        ↓
game/scenes/MapScene.ts
  ├─ renders map image and markers
  ├─ handles zoom, pan, marker click/hover, and editor pointer actions
  └─ emits Phaser → React events
        ↓
game/PhaserGame.tsx
        ↓ React callbacks in app/map/page.tsx
```

## Why the bridge is dynamic

`app/map/page.tsx` is a client component, but Phaser still depends on browser-only APIs. The page imports `PhaserGame` with `next/dynamic({ ssr: false })` so the canvas and Phaser runtime are created only in the browser. `game/PhaserGame.tsx` still guards its effect with `typeof window === 'undefined'` before creating the game.

## React responsibilities

`app/map/page.tsx` composes the user experience around the canvas:

- `useMapData()` loads `locations` and `stakedCharacters`. It reads locations through `LocationRepository` and fetches staked characters from `/api/characters?tab=staked`.
- `useMapLayers()` owns layer visibility toggles for locations, characters, burns, deaths, and fights.
- `useMapPageMarkers()` builds EventBus-compatible character markers and event payloads from staked character rows.
- `useMapPageSelection()` owns selected marker state, staking location selection, and sidebar visibility.
- `MapLayerControls` and `MapStakingSidebar` stay in React DOM outside the Phaser canvas.

React should not directly manipulate Phaser game objects. It should publish state changes through `EventBus` or call intentionally exposed scene/game refs.

## Phaser lifecycle

`game/PhaserGame.tsx` is the React bridge component. On mount it:

1. Creates a unique DOM container id.
2. Calls `createGame(containerId)` from `game/main.ts`.
3. Subscribes to Phaser-originated EventBus events.
4. Exposes `{ game, scene }` through `IRefPhaserGame`.

On unmount it removes EventBus listeners, destroys the Phaser game, and clears refs. Keep new bridge-level subscriptions in this component so cleanup remains paired with game lifecycle.

`game/main.ts` configures Phaser with resize scaling, the `MapScene`, mouse-wheel handling, touch capture, and WebGL/canvas auto-detection.

## EventBus contract

`game/EventBus.ts` defines payload types and event names. Treat it as the API boundary between React and Phaser.

### React → Phaser events

| Event | Purpose | Typical emitter |
| --- | --- | --- |
| `SET_LAYER_VISIBILITY` | Toggle marker categories. | `useMapPageEventBridge()` |
| `UPDATE_LOCATIONS` | Replace/update location marker data. | `useMapPageEventBridge()` |
| `UPDATE_CHARACTERS` | Replace/update wallet/staked character markers. | `useMapPageEventBridge()` |
| `UPDATE_EVENTS` | Replace/update burn/death/fight event markers. | `useMapPageEventBridge()` |
| `FLY_TO_LOCATION` | Pan/zoom to a map coordinate. | `useMapPageEventBridge()` initial fly-to behavior |
| `EDITOR_MODE_CHANGED`, `LOCATION_DELETED` | Map editor coordination. | map editor flows |

### Phaser → React events

| Event | Purpose | Typical subscriber |
| --- | --- | --- |
| `SCENE_READY` | Exposes `MapScene` once Phaser has created it. | `PhaserGame` |
| `MAP_READY` | Emits map dimensions and initial zoom. | `PhaserGame` |
| `MARKER_CLICKED` | Opens/selects the React sidebar state. | `PhaserGame` → `app/map/page.tsx` callback |
| `MARKER_HOVERED`, `MARKER_UNHOVERED` | Supports hover interactions. | `PhaserGame` callbacks |
| `CAMERA_CHANGED` | Reports camera scroll/zoom changes. | `PhaserGame` callback |
| `MAP_CLICKED`, `MARKER_DRAGGED` | Editor-mode click/drag results. | map editor flows |

When adding events, update `EventBus.ts` payload types first, then bind/cleanup in the specific React or Phaser owner.

## MapScene responsibilities

`game/scenes/MapScene.ts` owns canvas behavior:

- Preloads `/images/wagdiemap.png` and marker icons under `/images/mapicons/*`.
- Creates the map background and camera bounds using `game/scenes/map/coords` constants.
- Installs `MapMarkerManager` and `TooltipController`.
- Binds EventBus handlers through `bindMapSceneEvents()`.
- Handles wheel zoom, pointer panning, touch pinch zoom, create-mode map clicks, and marker dragging.
- Emits camera, marker hover, marker click, map click, and marker drag events back to React.

`MapScene` registers cleanup for Phaser scene shutdown/destroy and calls the unbind function returned from `bindMapSceneEvents()`. This prevents stale EventBus listeners after remounts.

## Data shape and coordinates

EventBus payloads are normalized for map rendering:

- `MapLocationData` carries location id/name plus optional metadata such as `center`, `bounds`, and `coordinates`.
- `MapCharacterData` carries character token id, optional name/wallet, and a joined location summary.
- `MapEventsData` groups burns, deaths, and fights.
- `MarkerPayload` is the cross-boundary interaction shape used for selection.

Map coordinates are converted in `MapScene` using `COORD_SCALE`. React emits domain-level coordinate payloads; Phaser converts them to world coordinates for display and returns domain coordinates for editor drag/click results.

## Sidebar and resizing

When the staking sidebar opens, `app/map/page.tsx` shifts the map content area on desktop. `useMapPageEventBridge()` dispatches a browser resize event and calls `game.scale.resize(width, height)` when possible so the Phaser canvas tracks the updated container size.

## Guardrails

- Do not import Phaser into server components or shared modules that may run during SSR.
- Keep React DOM state outside Phaser; use `EventBus` for cross-boundary messages.
- Always pair EventBus subscriptions with cleanup.
- Emit empty marker/event arrays when data becomes empty so Phaser can remove stale markers.
- Keep operational map-editor procedures outside this page; this page documents the runtime boundary only.
