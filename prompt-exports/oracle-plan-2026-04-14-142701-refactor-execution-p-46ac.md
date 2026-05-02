## Final Prompt
<taskname="Refactor Execution Plan"/>
<task>Plan execution for the ranked refactor candidates in `wagdie-simplified` and prepare subagent delegation. Do not implement code in this pass. Produce a scoped, verifiable execution plan that proceeds in ROI order, preserves existing dirty-worktree changes, and defines delegation-safe work packets with clear file ownership and validation checkpoints.</task>

<architecture>
- Blockchain transaction hooks layer: `hooks/useStaking.ts`, `hooks/useSearing.ts`, `hooks/useCorpseBurning.ts`, `hooks/useCure.ts` currently duplicate transaction lifecycle logic; `hooks/useSpread.ts` + `hooks/useBlockchainTransaction.ts` show the target shared pattern.
- Map staking UI flow: `app/map/page.tsx` orchestrates marker/selection/sidebar state; `components/map/MapStakingSidebar.tsx` is a large mixed-responsibility UI+state+actions component.
- Phaser map runtime: `game/scenes/MapScene.ts` handles camera/input/tooltip/marker reconciliation/event wiring; related contracts/helpers are in `game/config/markerConfig.ts`, `game/scenes/map/*`, `game/EventBus.ts`, `game/PhaserGame.tsx`.
- API route standardization baseline: helpers in `lib/api/{responses,auth,params,errors}.ts`; mixed route styles across `app/api/*`.
- Data/repository layer: `lib/repositories/character-repository.ts` combines character querying, trait aggregations, staking-location joins, and ownership update operations.
- Asset loading stack: `hooks/useAssetLoading.ts`, `lib/services/asset-loading-service.ts`, `lib/services/asset-cache.ts`, `lib/services/asset-error-handler.ts`, plus policy/error/id modules in `lib/services/assets/*` and contracts in `types/assets.ts`.
- AI/Eliza editor + adapter: `components/characters/ai-editor/AIPersonaTab.tsx`, `hooks/useAIPersonaEditor.ts`, `hooks/useAICharacter.ts`, `hooks/useKnowledgeUpload.ts`, and mapping logic in `lib/eliza/sdkAdapter.ts` + `lib/eliza/migration.ts` with API integration in selected `app/api/eliza/characters/*` routes.
- Complexity-refactor contracts to prioritize: `specs/019-code-complexity-refactor/contracts/*`.
</architecture>

<selected_context>
wagdie-simplified/specs/019-code-complexity-refactor/contracts/useBlockchainTransaction.ts: Target contract for shared tx hook behavior.
wagdie-simplified/specs/019-code-complexity-refactor/contracts/markerConfig.ts: Map marker config contract used in MapScene decomposition.
wagdie-simplified/specs/019-code-complexity-refactor/contracts/aiPersonaReducer.ts: Reducer contract for AI persona state simplification.
wagdie-simplified/specs/019-code-complexity-refactor/contracts/useCharacterEditor.ts: Complexity-refactor pattern reference for scoped state hooks.

wagdie-simplified/hooks/useBlockchainTransaction.ts: Shared transaction executor utility and lifecycle callbacks.
wagdie-simplified/hooks/useSpread.ts: Existing adopter of shared transaction pattern (reference implementation).
wagdie-simplified/hooks/useStaking.ts: High-ROI refactor candidate with stake/unstake/approval/sync flow.
wagdie-simplified/hooks/useSearing.ts: High-ROI refactor candidate with approval/status/transaction duplication.
wagdie-simplified/hooks/useCorpseBurning.ts: High-ROI refactor candidate with duplicated tx/approval lifecycle.
wagdie-simplified/hooks/useCure.ts: High-ROI refactor candidate with duplicated tx lifecycle.
wagdie-simplified/lib/services/blockchain/{base,staking,searing,corpse,cure,spread}.ts: Service APIs consumed by transaction hooks.
wagdie-simplified/lib/store/transactions.ts: Central tx store integration used across hooks.
wagdie-simplified/types/{blockchain,contracts}.ts: Shared blockchain transaction/contracts types.

wagdie-simplified/components/map/MapStakingSidebar.tsx: ~894-line mixed UI/state/chain-actions component to split.
wagdie-simplified/app/map/page.tsx: Parent orchestrator for sidebar props, selected marker/location, map events.
wagdie-simplified/hooks/{useOwnedCharacters,useStakingStatuses}.ts: Sidebar data dependencies.

wagdie-simplified/game/scenes/MapScene.ts: Scene responsibilities to partition (input/camera/markers/events/tooltip lifecycle).
wagdie-simplified/game/config/markerConfig.ts: Existing extracted config and helper functions.
wagdie-simplified/game/scenes/map/{coords,event-bindings}.ts: Existing scene decomposition seams.
wagdie-simplified/game/{EventBus.ts,PhaserGame.tsx,main.ts}: Runtime/event bridge dependencies.

wagdie-simplified/lib/api/{responses,auth,params,errors}.ts: Standard helper foundation for API route boilerplate reduction.
wagdie-simplified/lib/api/handlers/character-update.ts: Existing shared handler pattern.
wagdie-simplified/app/api/locations/{route.ts,[id]/route.ts}: Routes already aligned with helper usage (reference style).
wagdie-simplified/app/api/characters/route.ts: Boilerplate-heavy route not yet standardized.
wagdie-simplified/app/api/characters/[tokenId]/{events,staking,searing}/route.ts: Additional routes with manual validation/response patterns.
wagdie-simplified/app/api/characters/staking-status/route.ts: Complex route with repeated response/error patterns.
wagdie-simplified/app/api/sync/staking/route.ts: Sync endpoint currently manual response/error handling.

wagdie-simplified/lib/repositories/character-repository.ts: Candidate to split query/ownership/staking concerns.
wagdie-simplified/lib/services/character-service.ts: Service boundary consuming repository.
wagdie-simplified/lib/repositories/{index.ts,activity-repository.ts}: Adjacent repository integration points.
wagdie-simplified/types/character.ts: Repository/service route output contract.

wagdie-simplified/hooks/useAssetLoading.ts: Hook facade for asset loading stack.
wagdie-simplified/lib/services/{asset-loading-service,asset-cache,asset-error-handler}.ts: Candidate split area for loading/cache/recovery concerns.
wagdie-simplified/lib/services/assets/{asset-policy,asset-errors,asset-ids}.ts: Existing modular seams.
wagdie-simplified/types/assets.ts: Asset stack interfaces/contracts.

wagdie-simplified/components/characters/ai-editor/AIPersonaTab.tsx: Main AI persona UI container.
wagdie-simplified/hooks/{useAIPersonaEditor,useAICharacter,useKnowledgeUpload}.ts: Persona state and API hooks.
wagdie-simplified/lib/eliza/{sdkAdapter,migration}.ts: Adapter/mapping layer candidate for decomposition.
wagdie-simplified/types/eliza.ts: Editor/adapter DTO contracts.
wagdie-simplified/app/api/eliza/characters/[tokenId]/{route.ts,export/route.ts,import/route.ts}: Editor API integration surface.

wagdie-simplified/AGENTS.md: Repository guardrails and dev/test conventions.
</selected_context>

<relationships>
- `useSpread` -> `useBlockchainTransaction` defines the desired refactor target pattern for `useStaking`/`useSearing`/`useCorpseBurning`/`useCure`.
- `MapStakingSidebar` -> `useStaking` + `useOwnedCharacters` + `useStakingStatuses`; `app/map/page.tsx` owns selected marker/location and passes staking callbacks.
- `MapScene` emits/consumes `MapEvents` via `EventBus`; `PhaserGame` bridges scene events to React (`app/map/page.tsx`).
- API standardization anchor is `lib/api/*`; `app/api/locations/*` shows desired usage, while selected `app/api/characters/*` + `app/api/sync/staking` show manual patterns to converge.
- `character-repository` feeds `character-service`, routes, and map data flow via `useMapData` / `app/map/page.tsx`.
- Asset hook (`useAssetLoading`) composes loading/cache/error services and policy modules.
- AI editor flow: `AIPersonaTab` -> (`useAIPersonaEditor`, `useAICharacter`, `useKnowledgeUpload`) -> `app/api/eliza/characters/*`; mapping logic centralized in `sdkAdapter`.
</relationships>

<ambiguities>
- Worktree is extremely dirty (hundreds of modified/untracked files). Plan must include explicit safeguards: no broad rewrites, no unrelated file cleanup, and per-work-item path allowlists.
- Some ranked candidates (asset services, AI/Eliza split) overlap with recently expanded areas; include a discovery checkpoint per work item before delegating edits.
- Only a focused API-route subset is selected; if planning requires project-wide route batching, call out unselected route families explicitly as follow-up scan targets.
</ambiguities>

## Selection
- Files: 65 total (65 full)
- Total tokens: 113265 (Auto view)
- Token breakdown: full 113265

### Files
### Selected Files
wagdie-simplified/
├── app/
│   ├── api/
│   │   ├── characters/
│   │   │   ├── staking-status/
│   │   │   │   └── route.ts — 1,108 tokens (full)
│   │   │   └── route.ts — 662 tokens (full)
│   │   ├── eliza/
│   │   │   └── characters/
│   │   │       └── [tokenId]/
│   │   │           ├── export/
│   │   │           │   └── route.ts — 891 tokens (full)
│   │   │           ├── import/
│   │   │           │   └── route.ts — 1,377 tokens (full)
│   │   │           └── route.ts — 1,555 tokens (full)
│   │   ├── locations/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts — 567 tokens (full)
│   │   │   └── route.ts — 348 tokens (full)
│   │   └── sync/
│   │       └── staking/
│   │           └── route.ts — 680 tokens (full)
│   └── map/
│       └── page.tsx — 4,818 tokens (full)
├── components/
│   ├── characters/
│   │   └── ai-editor/
│   │       └── AIPersonaTab.tsx — 3,346 tokens (full)
│   └── map/
│       └── MapStakingSidebar.tsx — 10,137 tokens (full)
├── game/
│   ├── config/
│   │   └── markerConfig.ts — 691 tokens (full)
│   ├── scenes/
│   │   ├── map/
│   │   │   ├── coords.ts — 128 tokens (full)
│   │   │   └── event-bindings.ts — 500 tokens (full)
│   │   └── MapScene.ts — 5,902 tokens (full)
│   ├── EventBus.ts — 1,279 tokens (full)
│   ├── PhaserGame.tsx — 1,020 tokens (full)
│   └── main.ts — 265 tokens (full)
├── hooks/
│   ├── map/
│   │   └── useMapData.ts — 1,696 tokens (full)
│   ├── useAICharacter.ts — 1,644 tokens (full)
│   ├── useAIPersonaEditor.ts — 2,963 tokens (full)
│   ├── useAssetLoading.ts — 1,887 tokens (full)
│   ├── useBlockchainTransaction.ts — 1,607 tokens (full)
│   ├── useCorpseBurning.ts — 2,296 tokens (full)
│   ├── useCure.ts — 1,557 tokens (full)
│   ├── useOwnedCharacters.ts — 1,273 tokens (full)
│   ├── useSearing.ts — 3,269 tokens (full)
│   ├── useSpread.ts — 1,867 tokens (full)
│   ├── useStaking.ts — 4,645 tokens (full)
│   └── useStakingStatuses.ts — 1,083 tokens (full)
├── lib/
│   ├── api/
│   │   ├── handlers/
│   │   │   └── character-update.ts — 2,060 tokens (full)
│   │   ├── auth.ts — 333 tokens (full)
│   │   ├── errors.ts — 267 tokens (full)
│   │   ├── index.ts — 90 tokens (full)
│   │   ├── params.ts — 464 tokens (full)
│   │   └── responses.ts — 769 tokens (full)
│   ├── eliza/
│   │   ├── migration.ts — 2,109 tokens (full)
│   │   └── sdkAdapter.ts — 4,315 tokens (full)
│   ├── repositories/
│   │   ├── activity-repository.ts — 1,349 tokens (full)
│   │   ├── character-repository.ts — 5,590 tokens (full)
│   │   └── index.ts — 63 tokens (full)
│   ├── services/
│   │   ├── assets/
│   │   │   ├── asset-errors.ts — 490 tokens (full)
│   │   │   ├── asset-ids.ts — 131 tokens (full)
│   │   │   └── asset-policy.ts — 744 tokens (full)
│   │   ├── blockchain/
│   │   │   ├── base.ts — 1,157 tokens (full)
│   │   │   ├── corpse.ts — 1,356 tokens (full)
│   │   │   ├── cure.ts — 1,389 tokens (full)
│   │   │   ├── searing.ts — 4,301 tokens (full)
│   │   │   ├── spread.ts — 1,232 tokens (full)
│   │   │   └── staking.ts — 2,374 tokens (full)
│   │   ├── asset-cache.ts — 4,308 tokens (full)
│   │   ├── asset-error-handler.ts — 1,670 tokens (full)
│   │   ├── asset-loading-service.ts — 4,426 tokens (full)
│   │   └── character-service.ts — 718 tokens (full)
│   └── store/
│       └── transactions.ts — 978 tokens (full)
├── specs/
│   └── 019-code-complexity-refactor/
│       └── contracts/
│           ├── aiPersonaReducer.ts — 922 tokens (full)
│           ├── markerConfig.ts — 574 tokens (full)
│           ├── useBlockchainTransaction.ts — 486 tokens (full)
│           └── useCharacterEditor.ts — 378 tokens (full)
├── types/
│   ├── assets.ts — 2,317 tokens (full)
│   ├── blockchain.ts — 599 tokens (full)
│   ├── character.ts — 1,177 tokens (full)
│   ├── contracts.ts — 844 tokens (full)
│   └── eliza.ts — 1,849 tokens (full)
└── AGENTS.md — 375 tokens (full)


---

## Generated Plan

## Chat Send ✅
- **Chat**: `refactor-execution-plan-43F836` | **Mode**: plan

### Response
## 1. Summary

Execute the refactor as **targeted, staged extractions rather than a broad rewrite**, because the repository is explicitly dirty and the selected code already contains several useful seams (`useBlockchainTransaction`, `markerConfig`, `event-bindings`, API helpers, reducer contracts). Proceed in ROI order: first consolidate duplicated blockchain transaction lifecycles, then split the large map staking sidebar, then standardize selected API routes without changing response bodies, then decompose `MapScene`, then split the character repository facade, and finally address lower-ROI AI/Eliza and asset-service decomposition. Each work packet below has a path allowlist, preserved public contracts, validation gates, and subagent-safe ownership boundaries.

---

## 2. Current-state analysis

### Global repository constraints

- `AGENTS.md` sets TypeScript/Next.js conventions: 2-space indentation, single quotes, semicolons, `bun` commands, Jest tests.
- The worktree is described as extremely dirty. The plan must therefore:
  - avoid broad formatting,
  - avoid cleanup outside the assigned packet,
  - preserve existing dirty changes in files before editing,
  - use narrow path allowlists per subagent,
  - keep public contracts stable unless explicitly called out.

### Blockchain transaction hooks

Relevant files:

- Shared pattern:
  - `hooks/useBlockchainTransaction.ts`
  - `hooks/useSpread.ts`
  - `specs/019-code-complexity-refactor/contracts/useBlockchainTransaction.ts`
- Duplicated candidates:
  - `hooks/useStaking.ts`
  - `hooks/useSearing.ts`
  - `hooks/useCorpseBurning.ts`
  - `hooks/useCure.ts`
- Services:
  - `lib/services/blockchain/base.ts`
  - `staking.ts`, `searing.ts`, `corpse.ts`, `cure.ts`, `spread.ts`
- Store/types:
  - `lib/store/transactions.ts`
  - `types/blockchain.ts`
  - `types/contracts.ts`

Current data/control flow:

1. UI calls a domain hook method, for example `stakeWagdie`, `searConcords`, `burnCorpse`, `cureCharacter`.
2. Hook checks wallet/client readiness using `wagmi`.
3. Hook creates a service instance and calls `service.initialize()`, which reads chain ID and selects addresses.
4. Hook performs operation-specific prechecks.
5. Hook manually:
   - sets `isXxx` booleans,
   - sets `error`,
   - sets `txHash`,
   - sets `txStatus`,
   - creates a transaction ID via `lib/store/transactions.generateTransactionId`,
   - calls `addTransaction`,
   - submits transaction through service,
   - sets `CONFIRMING`,
   - waits for confirmation via protected/private `service['waitForTransaction']`,
   - sets `SUCCESS` or `ERROR`,
   - shows toast,
   - performs post-success refresh/sync.
6. `useSpread` already uses `useBlockchainTransaction`, but the current shared hook only has a coarse lifecycle: `PENDING → SUCCESS/ERROR`. It does not expose an intermediate “hash received / confirming” stage to executors.

Reusable code:

- `useBlockchainTransaction` already centralizes:
  - `isExecuting`,
  - status/error/hash state,
  - transaction ID generation,
  - stale transaction guard through `currentTxIdRef`,
  - transaction store integration,
  - success/error callbacks.
- `useSpread` is a useful reference for executor shape, but its current `onPending` also calls `addTransaction` while passing `addTransaction` to the hook, which risks duplicated store writes for the same ID.

Blocking issues:

- Existing duplicated hooks require a `CONFIRMING` status between submission and receipt.
- `useSearing.searConcords` returns `Promise<SearingTransactionResult>`, while current `useBlockchainTransaction.execute` returns `Promise<void>`.
- Approval transactions and domain transactions have different returned public booleans (`isApproving`, `isStaking`, `isBurning`, etc.) that must be preserved.

Hard constraints:

- Public hook return shapes used by UI and Storybook mocks should remain unchanged:
  - `.storybook/mocks/hooks/useStaking.ts`
  - `.storybook/mocks/hooks/useSearing.ts`
  - `.storybook/mocks/hooks/useCorpseBurning.ts`
  - `.storybook/mocks/hooks/useCure.ts`
  - `.storybook/mocks/hooks/useSpread.ts`
- `TransactionRecord` persisted under `wagdie-transactions` must remain schema-compatible.

---

### Map staking UI flow

Relevant files:

- `app/map/page.tsx`
- `components/map/MapStakingSidebar.tsx`
- `hooks/useOwnedCharacters.ts`
- `hooks/useStakingStatuses.ts`
- `hooks/useStaking.ts`
- `hooks/map/useMapData.ts`
- `game/EventBus.ts`

Current data/control flow:

1. `app/map/page.tsx` loads `locations` and `stakedCharacters` via `useMapData`.
2. It emits map payloads to Phaser through `EventBus`:
   - `UPDATE_LOCATIONS`
   - `UPDATE_CHARACTERS`
   - `UPDATE_EVENTS`
3. When a marker is clicked, `handleMarkerClick` stores:
   - `selectedMarker`,
   - sidebar open state,
   - `selectedStakingLocation` for location markers,
   - `selectedStakingError` for invalid chain location IDs.
4. `MapStakingSidebar` receives selected marker/location plus callbacks and owns:
   - sidebar animation state,
   - active tab,
   - approval state,
   - active token row,
   - pagination,
   - owned character fetching,
   - staking status fetching,
   - approval checks,
   - stake/unstake transaction calls,
   - rendering for marker details, location tabs, wallet gate, approval banners, lists, pagination, footer hints.
5. Successful stake/unstake calls:
   - refetch statuses,
   - refetch owned characters,
   - call `onStakingChanged`,
   - which calls `useMapData.refetch`,
   - which refreshes staked character map data.

Reusable code:

- `useOwnedCharacters` already has abort-safe wallet-scoped fetching.
- `useStakingStatuses` already has abort-safe batch fetching.
- `MapStakingSidebar` contains local pure helpers that can be moved without behavior changes:
  - `isNonEmptyString`
  - `truncateAddress`
  - `getMarkerTitle`
  - `getCharacterName`
  - `getCharacterImage`
  - `uniqueNumberList`
  - `NonLocationMarkerDetails`

Blocking issues:

- `MapStakingSidebar.tsx` is a large mixed-responsibility component, making staking UI changes risky.
- UI rendering and side-effect orchestration are interleaved.
- `app/map/page.tsx` should not need to change if the sidebar public props are preserved.

Hard constraints:

- Preserve `MapStakingSidebarProps`.
- Preserve right-sidebar behavior, mobile scrim, `Escape` close, location tab behavior, pagination behavior, and `onStakingChanged` semantics.

---

### Phaser map runtime

Relevant files:

- `game/scenes/MapScene.ts`
- `game/config/markerConfig.ts`
- `game/scenes/map/coords.ts`
- `game/scenes/map/event-bindings.ts`
- `game/EventBus.ts`
- `game/PhaserGame.tsx`
- `game/main.ts`

Current responsibilities in `MapScene`:

- Phaser asset preload.
- Map image creation.
- Camera bounds/zoom setup.
- Tooltip creation/update.
- Input handling:
  - wheel zoom,
  - pointer pan,
  - marker drag,
  - pinch zoom.
- EventBus binding through `bindMapSceneEvents`.
- Marker reconciliation for:
  - locations,
  - characters,
  - burns/deaths/fights.
- Layer visibility.
- Editor-mode marker draggability.
- Phaser-to-React event emission for marker/camera interactions.
- Cleanup on scene shutdown/destroy.

Reusable seams:

- `game/config/markerConfig.ts` already centralizes marker icon/scale/depth/visibility mapping.
- `game/scenes/map/event-bindings.ts` already owns EventBus registration cleanup.
- `game/scenes/map/coords.ts` centralizes coordinate scaling.
- `getStackOffset` is currently a pure function in `MapScene` and is safe to extract.

Blocking issues:

- `MapScene` still owns too many independent responsibilities.
- Marker reconciliation and tooltip/input logic can be extracted with minimal API changes.

Hard constraints:

- Do not change `MapEvents` names or payload shapes.
- Do not change `PhaserGame` callback props.
- Preserve marker IDs:
  - `location-${location.id}`
  - `character-${tokenId}`
  - event IDs such as `burn-${rawId}`, `death-${rawId}`, `fight-${rawId}`.

---

### API route standardization

Relevant files:

- Helpers:
  - `lib/api/responses.ts`
  - `lib/api/auth.ts`
  - `lib/api/params.ts`
  - `lib/api/errors.ts`
- Reference routes:
  - `app/api/locations/route.ts`
  - `app/api/locations/[id]/route.ts`
- Manual routes:
  - `app/api/characters/route.ts`
  - `app/api/characters/staking-status/route.ts`
  - `app/api/sync/staking/route.ts`
  - selected but not provided in contents:
    - `app/api/characters/[tokenId]/events/route.ts`
    - `app/api/characters/[tokenId]/staking/route.ts`
    - `app/api/characters/[tokenId]/searing/route.ts`

Current patterns:

- Location routes use `jsonOk`, `jsonCreated`, `jsonBadRequest`, `requireAdmin`, `handleServiceError`.
- Character and sync routes manually parse params and return raw `NextResponse.json`.
- Response contracts differ:
  - `/api/characters` returns `CharactersResponse` directly.
  - `/api/characters/staking-status` returns `{ statuses, error? }`.
  - `/api/sync/staking` returns `{ results, error? }`.
  - `jsonOk` wraps as `{ success: true, data }`, which cannot be applied blindly without breaking clients.

Reusable code:

- `parseCsvNumberList` already exists.
- `jsonServerError`, `jsonBadRequest` are useful for wrapped endpoints, but raw response endpoints need either a raw helper or local response preservation.

Blocking issues:

- Standardization must not break existing clients expecting unwrapped bodies.
- Selected nested character route contents are unknown and need a discovery checkpoint before edits.

Hard constraints:

- Preserve response body shapes and status codes for selected routes unless tests prove no consumers rely on them.
- Preserve `Cache-Control: no-store` headers for staking status and sync endpoints.

---

### Character repository layer

Relevant files:

- `lib/repositories/character-repository.ts`
- `lib/repositories/activity-repository.ts`
- `lib/repositories/index.ts`
- `lib/services/character-service.ts`
- `types/character.ts`
- `hooks/map/useMapData.ts`

Current responsibilities in `CharacterRepository`:

- General character listing/filtering/pagination.
- Single-character fetch.
- Character updates through admin client.
- Concord lookup.
- Origin/alignment/trait aggregation.
- Staked-character location join.
- Ownership reads and bulk updates.
- Burned-owner normalization.

Data/control flow:

- API routes call `getCharacters`, `getCharacter`, `updateCharacter` through `CharacterService`.
- `CharacterService` uses `characterRepository`.
- `useMapData` dynamically imports `getStakedCharacters` directly from `character-repository`.
- Sync/indexer paths likely use ownership helpers directly or through repository exports.

Reusable code:

- Current `CharacterRepository` can become a facade to preserve imports while delegating to concern-specific repositories.
- Types `JoinedLocation` and `CharacterWithLocation` should remain exported from the same facade path for compatibility.

Blocking issues:

- The class is doing too much, but call sites are spread across app/services/hooks.
- A direct split with renamed imports would create unnecessary churn in a dirty worktree.

Hard constraints:

- Preserve these exports from `lib/repositories/character-repository.ts`:
  - `CharacterRepository`
  - `ICharacterRepository`
  - `characterRepository`
  - `getStakedCharacters`
  - `JoinedLocation`
  - `CharacterWithLocation`

---

### Asset loading stack

Relevant files:

- `hooks/useAssetLoading.ts`
- `lib/services/asset-loading-service.ts`
- `lib/services/asset-cache.ts`
- `lib/services/asset-error-handler.ts`
- `lib/services/assets/asset-policy.ts`
- `lib/services/assets/asset-errors.ts`
- `lib/services/assets/asset-ids.ts`
- `types/assets.ts`

Current responsibilities:

- `useAssetLoading` is the React facade around singleton services.
- `AssetLoadingService` owns:
  - loading states,
  - retry timers,
  - cache usage,
  - image loading with timeout,
  - fallback handling,
  - performance metrics,
  - critical asset preload.
- `AssetCache` owns in-memory/persistent cache and cleanup timers.
- `AssetErrorHandler` owns error logs and fallback lookup.
- Policy/id/error modules are already partially extracted.

Blocking issues:

- This stack is already more modular than the high-ROI candidates.
- Changes here have less immediate ROI and can introduce lifecycle/timer bugs if done too early.
- `useAssetLoading` has dependency risks because `loadAssets` depends on `assets`, and initialization effect depends on `loadAssets`.

Hard constraints:

- Preserve `types/assets.ts` interfaces.
- Preserve singleton accessors:
  - `getAssetLoadingService`
  - `getAssetCache`
  - `getAssetErrorHandler`

---

### AI/Eliza editor and adapter

Relevant files:

- `components/characters/ai-editor/AIPersonaTab.tsx`
- `hooks/useAIPersonaEditor.ts`
- `hooks/useAICharacter.ts`
- `hooks/useKnowledgeUpload.ts`
- `lib/eliza/sdkAdapter.ts`
- `lib/eliza/migration.ts`
- `types/eliza.ts`
- `app/api/eliza/characters/[tokenId]/route.ts`
- `app/api/eliza/characters/[tokenId]/export/route.ts`
- `app/api/eliza/characters/[tokenId]/import/route.ts`

Current state:

- `useAIPersonaEditor` already implements the reducer pattern from `specs/019-code-complexity-refactor/contracts/aiPersonaReducer.ts`.
- `AIPersonaTab` still mixes:
  - data loading,
  - editor state,
  - knowledge state,
  - import/export file handling,
  - tab navigation,
  - warnings/errors,
  - save/discard actions,
  - tab rendering.
- `sdkAdapter.ts` is large and mixes:
  - local SDK type definitions,
  - message example conversion,
  - character mapping,
  - update merging,
  - export/import mapping helpers.

Reusable code:

- `sdkAdapter.ts` can be split behind a facade without changing imports.
- `AIPersonaTab` can be split into smaller presentational components later, but the reducer work already captured much of the ROI.

Blocking issues:

- Eliza mapping is integration-sensitive and touches API behavior.
- Because current editor reducer is already implemented, this is lower ROI than transaction/map/API work.

Hard constraints:

- Preserve DTO contracts in `types/eliza.ts`.
- Preserve API route response shapes and import/export JSON format.
- Preserve public exported names from `lib/eliza/sdkAdapter.ts`.

---

## 3. Design

### 3.1 Overall execution strategy

Use **targeted staged extraction with compatibility facades**.

Rationale:

- Broad rewrites are unsafe with a dirty worktree.
- The codebase already has contracts and partial refactors.
- Most consumers can be protected by preserving public hook/component/repository/adapter exports.

Global rules for every subagent:

1. **Path allowlist only.** Do not edit files outside the assigned packet.
2. **No unrelated formatting.** Do not run formatters over entire files unless that file is in scope and formatting is restricted to touched regions.
3. **Dirty-file checkpoint before editing.**
   - Inspect status and diff for allowlisted files.
   - Record whether each file already has user changes.
   - If a file has unexpected concurrent edits, stop and report.
4. **No deletes/resets.**
   - Do not run `git checkout --`, `git reset`, or remove untracked files.
5. **Public contracts preserved by default.**
   - API response shapes, hook return types, component props, EventBus payloads, and repository exports remain stable unless a packet explicitly defines an additive internal change.
6. **Atomic compile gates.**
   - Each packet must leave the repository compiling for its touched area before the next dependent packet starts.

---

### 3.2 Ranked work packets and subagent delegation

#### Packet A — Blockchain transaction lifecycle consolidation

**ROI rank:** 1  
**Primary subagent:** `tx-hooks-refactor`  
**Can run in parallel?** Not with Packet B, because `MapStakingSidebar` consumes `useStaking`. Can run in parallel with API work if no shared files are touched.  
**Scope type:** Targeted refactor with additive internal hook API.

##### File ownership allowlist

Primary:

- `hooks/useBlockchainTransaction.ts`
- `hooks/useSpread.ts`
- `hooks/useStaking.ts`
- `hooks/useSearing.ts`
- `hooks/useCorpseBurning.ts`
- `hooks/useCure.ts`

Validation/test files, if present or created:

- `tests/hooks/useBlockchainTransaction.test.ts`
- `tests/hooks/useSpread.test.ts`
- `tests/hooks/useStaking.test.ts`
- `tests/hooks/useSearing.test.ts`
- `tests/hooks/useCorpseBurning.test.ts`
- `tests/hooks/useCure.test.ts`

Read-only references:

- `types/blockchain.ts`
- `types/contracts.ts`
- `lib/store/transactions.ts`
- `lib/services/blockchain/*.ts`
- `.storybook/mocks/hooks/*.ts`

Do not edit:

- `components/map/MapStakingSidebar.tsx`
- blockchain service files unless a compile error proves a type-only adjustment is required.

##### Design decision

Extend `useBlockchainTransaction` just enough to support the lifecycle needed by existing duplicated hooks:

- `PENDING` when operation starts.
- `CONFIRMING` when a transaction hash is submitted.
- `SUCCESS` after receipt succeeds.
- `ERROR` after service or receipt error.
- Return an execution outcome so hooks such as `useSearing.searConcords` can preserve their result contract.

This is better than adding another transaction abstraction because the app already has `useBlockchainTransaction` and `useSpread` as a target pattern.

##### Modified internal interfaces

Before:

```ts
execute: <TParams>(
  params: TParams,
  executor: (params: TParams) => Promise<ExecutorResult<TResult>>
) => Promise<void>
```

After, additive behavior:

```ts
type TransactionExecutionOutcome<TResult> = {
  success: boolean
  txId: string
  hash?: TransactionHash
  error?: ContractError
  result?: TResult
  superseded?: boolean
}

type TransactionExecutionContext<TResult> = {
  txId: string
  isCurrent: () => boolean
  markSubmitted: (
    hash: TransactionHash,
    update?: { metadata?: Record<string, unknown> }
  ) => void
}

execute: <TParams>(
  params: TParams,
  executor: (
    params: TParams,
    context: TransactionExecutionContext<TResult>
  ) => Promise<ExecutorResult<TResult>>
) => Promise<TransactionExecutionOutcome<TResult>>
```

Key contract details:

- Existing one-argument executors remain valid because the second argument is optional from the executor’s perspective.
- Existing callers that ignore the returned value remain valid.
- `markSubmitted`:
  - no-ops if transaction is stale,
  - sets hook `txHash`,
  - sets hook `status` to `TransactionStatus.CONFIRMING`,
  - calls `updateTransaction(txId, { hash, status: CONFIRMING, ...metadata })`,
  - calls `onSubmitted(hash)` exactly once per transaction.
- Final successful `ExecutorResult`:
  - sets `status` to `SUCCESS`,
  - keeps `txHash`,
  - calls `onSuccess(hash, result)`.
- Final `ExecutorResult.error`:
  - sets `status` to `ERROR`,
  - keeps prior `txHash` if `markSubmitted` already ran,
  - calls `onError(error)`.
- Superseded transactions:
  - must not update React state,
  - return `{ success: false, txId, superseded: true }`.

##### Hook migration rules

For each migrated hook:

- Preserve the public return interface exactly.
- Preserve toast wording unless the packet explicitly notes a required change.
- Preserve validation and precheck ordering.
- Preserve post-success side effects:
  - `useStaking`: `syncStakingStateToDb`.
  - `useCorpseBurning`: `fetchBalances`.
  - `useCure`: `fetchCureStatus`.
  - `useSearing`: return `SearingTransactionResult`.
- Use separate transaction hook instances where the UI exposes separate busy flags:
  - `useStaking`: approval, stake, unstake.
  - `useSearing`: approval, sear.
  - `useCorpseBurning`: approval, burn.
  - `useCure`: cure only.
- `isApproving`, `isStaking`, `isUnstaking`, `isBurning`, `isCuring`, `isSearing` are derived from the relevant transaction hook’s `isExecuting`.

##### State/data flow after refactor

Example: `useStaking.stakeWagdie`

1. Caller invokes `stakeWagdie(wagdieId, locationId)`.
2. Hook performs wallet/client validation.
3. Hook calls `stakeTx.execute({ wagdieId, locationId }, executor)`.
4. Shared hook:
   - generates `txId`,
   - sets `PENDING`,
   - adds store row.
5. Executor:
   - creates `StakingService`,
   - validates `locationId`,
   - checks `isStakingEnabled`,
   - checks approval,
   - calls `service.stakeWagdies`.
6. If hash returned:
   - executor calls `context.markSubmitted(hash, { metadata })`,
   - toast shows pending,
   - executor waits for receipt.
7. Receipt success:
   - executor returns `{ hash }`.
8. Shared hook:
   - sets `SUCCESS`,
   - updates store,
   - calls success callback.
9. Hook-specific success callback or post-execute code:
   - calls `syncStakingStateToDb({ tokenId: wagdieId, action: 'stake' })`.
10. UI observes:
   - returned hook state changes,
   - transaction store changes,
   - toasts.

Out-of-order behavior:

- If a user starts another transaction before the previous one resolves, only the latest transaction can mutate local hook state.
- Store rows for older tx IDs remain as created/updated up to the point they were superseded; do not delete them.

##### Error handling

- Wallet not connected:
  - preserve current behavior of setting hook error or showing toast depending on hook.
- Precheck failure:
  - return an `ExecutorResult.error` from executor where possible so shared hook owns status/store/error.
- Receipt failure:
  - executor returns `{ hash, error: receipt.error }`.
- Missing hash:
  - for hooks that currently treat missing hash as error (`useSearing`), keep that behavior.
  - for hooks that currently silently complete with no hash, preserve existing behavior unless tests indicate it is erroneous.

##### Validation checkpoints

Minimum:

- Typecheck/lint for touched hooks.
- Hook tests for:
  - pending → confirming → success,
  - pending → error before hash,
  - confirming → error after receipt failure,
  - superseded stale transaction does not overwrite state,
  - `useSearing.searConcords` still returns `{ success, hash?, error? }`.

Manual smoke:

- Stake flow in map sidebar still shows approval/stake states.
- Searing flow still returns result to caller.
- Corpse burn refreshes balances after success.
- Cure refreshes cure status after success.
- Spread still works and now shows confirming if executor calls `markSubmitted`.

---

#### Packet B — Map staking sidebar split

**ROI rank:** 2  
**Primary subagent:** `map-staking-sidebar-split`  
**Dependency:** Start after Packet A is merged/validated, because it consumes `useStaking`.  
**Scope type:** Component/hook extraction with unchanged public props.

##### File ownership allowlist

Primary:

- `components/map/MapStakingSidebar.tsx`
- `components/map/staking-sidebar/*` new files
- `hooks/map/useMapStakingPanel.ts` new file

Tests:

- `tests/components/map/MapStakingSidebar.test.tsx`
- `tests/components/map/staking-sidebar/*.test.tsx`
- `tests/hooks/map/useMapStakingPanel.test.ts`

Read-only references:

- `app/map/page.tsx`
- `hooks/useOwnedCharacters.ts`
- `hooks/useStakingStatuses.ts`
- `hooks/useStaking.ts`
- `game/EventBus.ts`
- `lib/repositories/character-repository.ts`
- `types/character.ts`

Do not edit:

- `app/map/page.tsx` unless a compile-only import type issue is discovered.
- `hooks/useStaking.ts` in this packet.

##### Design decision

Keep `MapStakingSidebar` as the public container and move mixed responsibilities into:

1. A state/action hook:
   - `hooks/map/useMapStakingPanel.ts`
2. Presentational components:
   - `components/map/staking-sidebar/*`

This avoids forcing `app/map/page.tsx` to change and isolates UI rendering from staking side effects.

##### New hook

Name: `useMapStakingPanel`  
Kind: React hook  
Location: `hooks/map/useMapStakingPanel.ts`

Inputs:

```ts
type UseMapStakingPanelInput = {
  isOpen: boolean
  selectedLocation: SelectedStakingLocation | null
  selectedMarker: MarkerPayload | null
  stakedHere: CharacterWithLocation[]
  walletAddress?: string
  onStakingChanged?: () => void
}
```

Output shape:

```ts
type UseMapStakingPanelResult = {
  effectiveWallet?: string
  isConnected: boolean
  isCorrectChain: boolean
  chainError: string | null

  activeTab: string
  setActiveTab: (tab: string) => void

  approvalState: ApprovalState
  approvalError: string | null
  handleApprove: () => Promise<void>

  characters: Character[]
  pagedCharacters: Character[]
  allCharacters: Array<Character & {
    isStaked: boolean
    locationId?: bigint
  }>
  totalCharacters: number
  totalPages: number
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  startIndex: number
  endIndex: number

  isLoadingCharacters: boolean
  isLoadingStatuses: boolean
  dataLoadingError: string | null
  transactionError: string | null

  activeTokenId: number | null
  handleStake: (tokenId: number) => Promise<void>
  handleUnstake: (tokenId: number) => Promise<void>

  canStakeNow: boolean
  showApprovalBanner: boolean
}
```

Ownership/lifecycle:

- Owns all current data hooks:
  - `useAccount`
  - `useChainId`
  - `useOwnedCharacters`
  - `useStakingStatuses`
  - `useStaking`
- Owns approval-check refs and nonce logic.
- Owns pagination state.
- Owns active row state.
- Resets page when wallet changes.
- Must preserve the existing 10-second approval check timeout.

Out-of-order behavior:

- Approval checks continue using `approvalCheckNonceRef`.
- If sidebar closes before approval check resolves, do not update visible approval state.
- Stake/unstake active token resets in `finally`.

##### New presentational components

Recommended components:

1. `SidebarShell.tsx`
   - Owns panel layout, scrim, transform classes.
   - Props: `isOpen`, `visible`, `onClose`, `children`, `footer?`.

2. `SidebarHeader.tsx`
   - Renders title, badge, location description, close button.
   - Inputs: `selectedMarker`, `headerTitle`, `isLocationMarker`, `locationData`, `onClose`.

3. `MarkerDetailsCard.tsx`
   - Replaces `NonLocationMarkerDetails`.
   - Inputs: `marker`.

4. `LocationTabs.tsx`
   - Inputs: `activeTab`, `setActiveTab`, `stakedCount`, `totalCharacters`, `isConnected`.

5. `ApprovalBanner.tsx`
   - Inputs: `approvalState`, `approvalError`, `isApproving`, `handleApprove`.

6. `WalletGate.tsx`
   - Renders wallet-not-connected state.

7. `CharacterStakeList.tsx`
   - Renders “Your Characters” rows.
   - Inputs: `allCharacters`, `activeTokenId`, `isStaking`, `isUnstaking`, `isLoadingStatuses`, `canStakeNow`, `handleStake`, `handleUnstake`.

8. `StakedHereList.tsx`
   - Renders location occupants.
   - Inputs: `stakedHere`, `effectiveWallet`, `activeTokenId`, `isUnstaking`, `isLoadingStatuses`, `handleUnstake`.

9. `PaginationControls.tsx`
   - Inputs: `page`, `totalPages`, `startIndex`, `endIndex`, `totalCharacters`, `isLoadingStatuses`, `setPage`.

10. `utils.ts`
   - Pure helpers currently embedded in `MapStakingSidebar`:
     - `isNonEmptyString`
     - `truncateAddress`
     - `getMarkerTitle`
     - `getCharacterName`
     - `getCharacterImage`
     - `uniqueNumberList`

##### Component data flow after split

- `MapStakingSidebar`:
  - computes marker-derived values,
  - calls `useMapStakingPanel`,
  - passes state/actions to presentational components.
- Presentational components:
  - do not call `wagmi`,
  - do not call data hooks,
  - do not mutate transaction state,
  - only call callbacks passed via props.

##### Validation checkpoints

- Existing map page compiles without changes.
- Sidebar:
  - opens/closes with animation,
  - closes with Escape,
  - shows non-location marker details,
  - shows location tabs,
  - preserves wallet gate,
  - preserves approval banner states,
  - preserves pagination,
  - stake/unstake still triggers `onStakingChanged`.
- Add focused component tests around:
  - location vs non-location rendering,
  - owned/staked row button selection,
  - pagination disabled states,
  - approval banner states.

---

#### Packet C — Focused API route standardization

**ROI rank:** 3  
**Primary subagent:** `api-standardization`  
**Can run in parallel?** Yes with Packet A if no shared files are touched, but avoid touching `character-service` or repositories.  
**Scope type:** Boilerplate reduction with response compatibility.

##### File ownership allowlist

Primary:

- `lib/api/responses.ts`
- `lib/api/params.ts`
- `app/api/characters/route.ts`
- `app/api/characters/staking-status/route.ts`
- `app/api/sync/staking/route.ts`

Conditional after discovery:

- `app/api/characters/[tokenId]/events/route.ts`
- `app/api/characters/[tokenId]/staking/route.ts`
- `app/api/characters/[tokenId]/searing/route.ts`

Tests:

- `tests/api/characters-route.test.ts`
- `tests/api/characters-staking-status-route.test.ts`
- `tests/api/sync-staking-route.test.ts`

Read-only references:

- `app/api/locations/route.ts`
- `app/api/locations/[id]/route.ts`
- `lib/api/auth.ts`
- `lib/api/errors.ts`
- `lib/services/sync/staking-state-sync`
- `lib/repositories/activity-repository.ts`

##### Design decision

Standardize parsing and response utilities **without wrapping existing raw response bodies**.

Reason: `jsonOk` changes body shape to `{ success, data }`, but selected clients currently expect bodies like `{ characters }`, `{ statuses }`, or `{ results }`.

##### Helper additions

In `lib/api/responses.ts`, add raw response helpers:

```ts
type JsonInit = {
  status?: number
  headers?: HeadersInit
}

function jsonRaw<T>(body: T, init?: JsonInit): NextResponse<T>

function jsonNoStore<T>(
  body: T,
  init?: Omit<JsonInit, 'headers'> & { headers?: HeadersInit }
): NextResponse<T>
```

Contract:

- `jsonRaw` does not wrap body.
- `jsonNoStore` merges `Cache-Control: no-store` with provided headers.
- Existing `jsonOk`, `jsonBadRequest`, etc. remain unchanged.

In `lib/api/params.ts`, add narrowly useful parsers:

```ts
function parsePositiveIntParam(
  value: string | null,
  options: { defaultValue?: number; min?: number; max?: number } = {}
): number | null

function parseEnumParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  defaultValue: T
): T | null

function parseCsvPositiveIntList(
  value: string | null,
  options: { maxItems?: number } = {}
): { values: number[]; error?: string }
```

Contract:

- Parsers do not throw.
- Route handlers decide status code and error body.
- Existing parsers remain unchanged for compatibility.

##### Route behavior preservation

`app/api/characters/route.ts`:

- Preserve current success body:
  - `CharactersResponse`
- Preserve current validation errors:
  - `{ error: 'Invalid pagination parameters' }`
  - `{ error: 'Invalid tab parameter' }`
  - `{ error: 'Invalid sort parameter' }`
- Use enum/constants for allowed tabs and sorts.
- Keep `owned` without wallet returning empty response.

`app/api/characters/staking-status/route.ts`:

- Preserve success/error body:
  - `{ statuses, error? }`
- Preserve `Cache-Control: no-store`.
- Preserve `source=db|chain`.
- Use CSV parser helper.
- Keep 500-token limit.

`app/api/sync/staking/route.ts`:

- Preserve success/error body:
  - `{ results, error? }`
- Preserve `Cache-Control: no-store`.
- Preserve 50-token limit.
- Use shared positive integer list validation for request body if helper supports unknown arrays; otherwise keep local `parseTokenIds` and only use `jsonNoStore`.

Conditional nested routes:

- First inspect contents.
- Only refactor if they have obvious manual parsing/response duplication.
- Preserve route-specific response contracts.

##### Validation checkpoints

- Unit tests assert exact JSON shapes and status codes for:
  - invalid pagination,
  - invalid tab,
  - owned tab without wallet,
  - staking-status missing token IDs,
  - staking-status invalid source,
  - staking-status too many token IDs,
  - sync invalid JSON,
  - sync empty token IDs,
  - sync too many token IDs.
- No client code changes required.

---

#### Packet D — Phaser `MapScene` decomposition

**ROI rank:** 4  
**Primary subagent:** `phaser-map-scene-split`  
**Can run in parallel?** Yes after Packet A starts, but avoid `app/map/page.tsx` and `MapStakingSidebar`.  
**Scope type:** Runtime class extraction with unchanged EventBus/API behavior.

##### File ownership allowlist

Primary:

- `game/scenes/MapScene.ts`
- `game/scenes/map/stack-layout.ts` new
- `game/scenes/map/tooltip-controller.ts` new
- `game/scenes/map/marker-manager.ts` new
- `game/scenes/map/event-marker-utils.ts` new, optional

Tests:

- `tests/map/stack-layout.test.ts`
- `tests/map/event-marker-utils.test.ts`

Read-only references:

- `game/EventBus.ts`
- `game/PhaserGame.tsx`
- `game/main.ts`
- `game/config/markerConfig.ts`
- `game/scenes/map/coords.ts`
- `game/scenes/map/event-bindings.ts`

##### Design decision

Split marker and tooltip logic first; leave input/camera handling in `MapScene` unless the first split validates cleanly. Marker reconciliation is the largest isolated responsibility and already depends on `markerConfig`.

##### New pure helper

File: `game/scenes/map/stack-layout.ts`

Exports:

```ts
function getStackOffset(index: number): { dx: number; dy: number }
```

Contract:

- Same deterministic output as current `MapScene.getStackOffset`.
- `index === 0` returns `{ dx: 0, dy: 0 }`.
- Stable layout by token sort order.

##### New tooltip controller

File: `game/scenes/map/tooltip-controller.ts`

Kind: class

Responsibilities:

- Create tooltip container/text/background.
- `show(text: string, screenX: number, screenY: number): void`
- `hide(): void`
- `updatePosition(screenX: number, screenY: number): void`
- `destroy?(): void` only if needed by Phaser lifecycle.

Ownership:

- Created by `MapScene.create()`.
- Owned by `MapScene`.
- Uses Phaser scene object only; emits no EventBus events.

##### New marker manager

File: `game/scenes/map/marker-manager.ts`

Kind: class

Responsibilities:

- Own `markers: Map<string, Phaser.GameObjects.Sprite>`.
- Own `markerData: Map<string, MarkerData>`.
- Own layer visibility application.
- Reconcile:
  - locations,
  - characters,
  - events.
- Update marker draggability when editor mode changes.
- Remove location marker on delete.
- Expose `getMarkerData(id)` for drag cancel restore.

Constructor dependencies:

```ts
type MapMarkerManagerOptions = {
  scene: Phaser.Scene
  getEditorMode: () => EditorMode
  getLayerVisibility: () => LayerVisibility
  onMarkerHover: (data: MarkerData) => void
  onMarkerOut: (data: MarkerData) => void
  onMarkerClick: (data: MarkerData) => void
  onBeginLocationDrag: (
    marker: Phaser.GameObjects.Sprite,
    markerId: string
  ) => void
}
```

Contract:

- Emits no EventBus events directly; `MapScene` remains the EventBus emission owner for interactions.
- Uses existing `getMarkerIcon`, `getMarkerScale`, `getMarkerDepth`, `isMarkerVisible`.
- Preserves marker IDs and event ID generation.

##### `MapScene` after split

`MapScene` keeps:

- Phaser lifecycle methods.
- Asset preload.
- Camera/input handling.
- EventBus handlers.
- Interaction state.
- Event emissions.
- Delegates marker updates to `markerManager`.
- Delegates tooltip rendering to `tooltipController`.

##### Validation checkpoints

- Map loads.
- Locations render.
- Wallet-specific character pins render and clear on disconnect.
- Fallen warrior death markers render and reconcile.
- Layer toggles affect all marker types.
- Editor mode drag still emits `MARKER_DRAGGED`.
- Tooltip appears/disappears and follows pointer.
- EventBus listeners still clean up on scene shutdown/destroy.

---

#### Packet E — Character repository split behind facade

**ROI rank:** 5  
**Primary subagent:** `character-repository-split`  
**Can run in parallel?** Yes if API packet does not touch repository files.  
**Scope type:** Internal decomposition with facade preservation.

##### File ownership allowlist

Primary:

- `lib/repositories/character-repository.ts`
- `lib/repositories/character/*` new files
- `lib/repositories/index.ts`

Tests:

- `tests/services/character-service.test.ts`
- `tests/repositories/character-repository.test.ts`
- `tests/repositories/character-staking-repository.test.ts`
- `tests/repositories/character-traits-repository.test.ts`

Read-only references:

- `lib/services/character-service.ts`
- `hooks/map/useMapData.ts`
- `types/character.ts`
- `lib/domain/location/metadata.ts`
- `lib/domain/location/metadata-types.ts`

##### Design decision

Preserve `character-repository.ts` as a facade that composes specialized repositories. This avoids mass import changes in a dirty worktree.

##### New modules

Recommended structure:

```text
lib/repositories/character/
  character-types.ts
  character-query-repository.ts
  character-traits-repository.ts
  character-staking-repository.ts
  character-ownership-repository.ts
```

Responsibilities:

1. `character-types.ts`
   - Move/export `JoinedLocation`.
   - Move/export `CharacterWithLocation`.
   - Shared internal row types if needed.

2. `character-query-repository.ts`
   - `findMany`
   - `findById`
   - `update`
   - `findConcords`
   - Preserve burned normalization.

3. `character-traits-repository.ts`
   - `getOrigins`
   - `getAlignments`
   - `getTraitCounts`
   - Extract shared metadata trait-count algorithm.

4. `character-staking-repository.ts`
   - `getStakedCharacters`
   - Own location join and metadata normalization.

5. `character-ownership-repository.ts`
   - `getAllTokenIds`
   - `getCurrentOwnership`
   - `bulkUpdateOwnership`
   - `updateOwnership`

Facade:

- `CharacterRepository` composes instances and delegates methods.
- `ICharacterRepository` remains focused on service-used methods.
- Extra methods remain available on `CharacterRepository` for existing direct consumers.

##### Validation checkpoints

- No import path changes required outside repository module.
- `CharacterService` tests still pass.
- `useMapData` dynamic import of `getStakedCharacters` still works.
- Character listing filters behave unchanged.
- Trait count ordering unchanged.
- Staked character location join unchanged.

---

#### Packet F — AI/Eliza adapter decomposition

**ROI rank:** 6  
**Primary subagent:** `eliza-adapter-split`  
**Can run in parallel?** Yes if no API agent touches Eliza files.  
**Scope type:** Adapter split behind stable facade.

##### File ownership allowlist

Primary:

- `lib/eliza/sdkAdapter.ts`
- `lib/eliza/sdk-types.ts` new
- `lib/eliza/message-examples.ts` new
- `lib/eliza/agent-character-mapper.ts` new
- `lib/eliza/eliza-export-mapper.ts` new

Optional UI split after adapter validation:

- `components/characters/ai-editor/AIPersonaTab.tsx`
- `components/characters/ai-editor/shared/PersonaImportExportToolbar.tsx` new
- `components/characters/ai-editor/shared/PersonaWarnings.tsx` new

Tests:

- `tests/api/eliza/sdkAdapter.test.ts`
- `tests/api/eliza/message-examples.test.ts`
- `tests/components/ai-editor/AIPersonaTab.test.tsx`

Read-only references:

- `types/eliza.ts`
- `lib/eliza/migration.ts`
- `app/api/eliza/characters/[tokenId]/route.ts`
- `app/api/eliza/characters/[tokenId]/export/route.ts`
- `app/api/eliza/characters/[tokenId]/import/route.ts`
- `hooks/useAIPersonaEditor.ts`
- `hooks/useAICharacter.ts`

##### Design decision

Split `sdkAdapter.ts` behind a facade so all current imports remain valid. This lowers integration risk.

##### New module ownership

1. `sdk-types.ts`
   - Move local SDK-compatible type aliases:
     - `AgentMessage`
     - `AgentMessageExample`
     - `AgentCharacter`
     - `CharacterRecord`
     - `AuthTokens`
     - chat/stream types.

2. `message-examples.ts`
   - Move:
     - `toAgentMessageExamples`
     - `fromAgentMessageExamples`
     - `roleContentPairsToAgentMessageExamples`
     - `agentMessageExamplesToRoleContentPairs`

3. `agent-character-mapper.ts`
   - Move:
     - `toAgentCharacterFromAICharacter`
     - `toAgentCharacterPatchFromUpdate`
     - `mergeAgentCharacter`
     - `applyWagdieUpdateToAgentCharacter`
     - `extractBackstory`
     - `toAICharacterFromRecord`

4. `eliza-export-mapper.ts`
   - Move:
     - `toElizaExportMessageExamples`
     - `fromElizaExportMessageExamples`

5. `sdkAdapter.ts`
   - Re-export all previous public names.
   - Keep `ElizaError` export.

##### Validation checkpoints

- API routes compile without import changes.
- Existing adapter tests pass or are added for:
  - example conversion round trip,
  - update patch preserves undefined values,
  - style/settings shallow merge,
  - backstory/lore extraction,
  - export message examples conversion.
- No API response shape changes.

---

#### Packet G — Asset loading stack cleanup

**ROI rank:** 7  
**Primary subagent:** `asset-loading-cleanup`  
**Can run in parallel?** Yes, but only after high-ROI packets are stable due lower priority.  
**Scope type:** Small lifecycle and helper extraction only; defer if discovery shows active dirty changes.

##### File ownership allowlist

Primary:

- `hooks/useAssetLoading.ts`
- `lib/services/asset-loading-service.ts`
- `lib/services/assets/image-loader.ts` new, optional
- `lib/services/assets/asset-loading-metrics.ts` new, optional

Read-only:

- `lib/services/asset-cache.ts`
- `lib/services/asset-error-handler.ts`
- `lib/services/assets/asset-policy.ts`
- `lib/services/assets/asset-errors.ts`
- `lib/services/assets/asset-ids.ts`
- `types/assets.ts`

Tests:

- `tests/services/asset-loading-service.test.ts`
- `tests/hooks/useAssetLoading.test.ts`

##### Design decision

Do not rewrite the asset stack. It is already partially modular. Limit this packet to:

- extracting image-load-with-timeout into a small helper, if useful;
- fixing hook dependency churn if tests expose it;
- preserving singleton/service contracts.

##### Validation checkpoints

- Critical assets preload still marks `completedCritical`.
- Failed asset uses fallback.
- Retry timer is cleared on retry.
- `useAssetLoading` does not enter repeated initialization loops when `assetIds` array identity changes but content is stable.

---

## 4. File-by-file impact

### Packet A — Blockchain transaction hooks

| File | Change | Why | Ordering |
|---|---|---|---|
| `hooks/useBlockchainTransaction.ts` | Add confirming-stage context, execution outcome return, stale-safe `markSubmitted`; preserve existing options | Enables duplicated hooks to share lifecycle without losing `CONFIRMING` or return results | First in Packet A |
| `hooks/useSpread.ts` | Adapt executor to call `context.markSubmitted`; remove duplicate pending store write if present | Keeps reference adopter aligned with enhanced hook | After shared hook change |
| `hooks/useStaking.ts` | Replace manual approval/stake/unstake lifecycle with shared transaction hook instances; preserve public return type and sync behavior | Highest duplication ROI | After shared hook change |
| `hooks/useSearing.ts` | Replace manual approval/sear lifecycle with shared hook; map execution outcome to `SearingTransactionResult` | Reduces duplicated status/store/toast code while preserving return contract | After shared hook change |
| `hooks/useCorpseBurning.ts` | Replace manual approval/burn lifecycle with shared hook; keep balance refresh | Reduces duplication | After shared hook change |
| `hooks/useCure.ts` | Replace cure transaction lifecycle with shared hook; keep status refresh effect | Reduces duplication | After shared hook change |
| `tests/hooks/useBlockchainTransaction.test.ts` | Add lifecycle and stale transaction tests | Verifies new internal hook contract | Same packet |
| Domain hook tests | Add/update focused tests for return shapes and success/error behavior | Prevent public API regressions | Same packet |

---

### Packet B — Map staking sidebar split

| File | Change | Why | Ordering |
|---|---|---|---|
| `hooks/map/useMapStakingPanel.ts` | New hook owning sidebar data/action state | Separates side effects from rendering | First in Packet B |
| `components/map/staking-sidebar/utils.ts` | Move pure helpers from sidebar | Reuse and test helpers | Before components |
| `components/map/staking-sidebar/SidebarShell.tsx` | New layout shell | Isolates animation/scrim/panel layout | After hook |
| `components/map/staking-sidebar/SidebarHeader.tsx` | New header component | Reduces main component size | After utils |
| `components/map/staking-sidebar/MarkerDetailsCard.tsx` | New non-location marker details component | Extracts embedded function component | After utils |
| `components/map/staking-sidebar/LocationTabs.tsx` | New tab control | Isolates tab UI | After hook |
| `components/map/staking-sidebar/ApprovalBanner.tsx` | New approval state UI | Isolates approval rendering | After hook |
| `components/map/staking-sidebar/WalletGate.tsx` | New wallet gate UI | Isolates disconnected state | After hook |
| `components/map/staking-sidebar/CharacterStakeList.tsx` | New “Your Characters” list | Isolates list row rendering/actions | After hook |
| `components/map/staking-sidebar/StakedHereList.tsx` | New occupants list | Isolates location staked list | After hook |
| `components/map/staking-sidebar/PaginationControls.tsx` | New pagination component | Isolates pagination UI | After hook |
| `components/map/MapStakingSidebar.tsx` | Reduce to orchestration/composition; preserve props/default export | Keeps `app/map/page.tsx` stable | Last in Packet B |
| Tests under `tests/components/map` and `tests/hooks/map` | Add targeted tests | Validate split behavior | Same packet |

---

### Packet C — API standardization

| File | Change | Why | Ordering |
|---|---|---|---|
| `lib/api/responses.ts` | Add raw/no-store JSON helpers without changing existing wrapped helpers | Allows standardization without response-shape breakage | First |
| `lib/api/params.ts` | Add positive-int, enum, CSV positive-int parser helpers | Reduces duplicated route parsing | First |
| `app/api/characters/route.ts` | Use shared parsers/constants; preserve raw response body | Boilerplate reduction | After helpers |
| `app/api/characters/staking-status/route.ts` | Use shared parsers and `jsonNoStore`; preserve body/header behavior | Boilerplate reduction and consistency | After helpers |
| `app/api/sync/staking/route.ts` | Use `jsonNoStore` and reusable validation where possible | Boilerplate reduction | After helpers |
| `app/api/characters/[tokenId]/events/route.ts` | Conditional refactor after discovery | Selected route family; contents unknown | After main three routes |
| `app/api/characters/[tokenId]/staking/route.ts` | Conditional refactor after discovery | Selected route family; contents unknown | After main three routes |
| `app/api/characters/[tokenId]/searing/route.ts` | Conditional refactor after discovery | Selected route family; contents unknown | After main three routes |
| API tests | Add exact response contract tests | Prevent unintentional body wrapping | Same packet |

---

### Packet D — Phaser scene split

| File | Change | Why | Ordering |
|---|---|---|---|
| `game/scenes/map/stack-layout.ts` | New pure helper for stacked character offsets | Safe pure extraction | First |
| `game/scenes/map/tooltip-controller.ts` | New tooltip controller class | Removes tooltip lifecycle from scene | Second |
| `game/scenes/map/event-marker-utils.ts` | Optional pure event ID helper | Makes event reconciliation testable | Before marker manager if used |
| `game/scenes/map/marker-manager.ts` | New marker reconciliation manager | Largest isolated scene responsibility | Third |
| `game/scenes/MapScene.ts` | Delegate marker/tooltip work; keep lifecycle/input/EventBus ownership | Reduce complexity while preserving behavior | Last |
| Map tests | Add tests for pure helpers | Validate deterministic IDs/offsets | Same packet |

---

### Packet E — Character repository split

| File | Change | Why | Ordering |
|---|---|---|---|
| `lib/repositories/character/character-types.ts` | Move `JoinedLocation`/`CharacterWithLocation` types | Shared concern-specific types | First |
| `lib/repositories/character/character-query-repository.ts` | Move listing/fetch/update/concord methods | Isolate CRUD/query concern | Second |
| `lib/repositories/character/character-traits-repository.ts` | Move origin/alignment/trait counts and shared trait extraction | Isolate aggregation concern | Second |
| `lib/repositories/character/character-staking-repository.ts` | Move staked-character location join | Isolate map/staking concern | Second |
| `lib/repositories/character/character-ownership-repository.ts` | Move ownership sync helpers | Isolate sync/indexer concern | Second |
| `lib/repositories/character-repository.ts` | Become facade composing specialized repositories; preserve exports | Avoid call-site churn | Last |
| `lib/repositories/index.ts` | Export new modules if needed; preserve existing wildcard behavior | Makes new repos available | Last |
| Repository tests | Add/adjust tests | Verify facade parity | Same packet |

---

### Packet F — AI/Eliza adapter split

| File | Change | Why | Ordering |
|---|---|---|---|
| `lib/eliza/sdk-types.ts` | Move local SDK type aliases | Separate types from behavior | First |
| `lib/eliza/message-examples.ts` | Move message example conversions | Isolate conversion logic | Second |
| `lib/eliza/agent-character-mapper.ts` | Move AI/Agent mapping and merge helpers | Isolate mapping logic | Third |
| `lib/eliza/eliza-export-mapper.ts` | Move export/import message conversion helpers | Isolate export mapping | Third |
| `lib/eliza/sdkAdapter.ts` | Re-export all existing public names | Preserve imports | Last |
| Adapter tests | Add/adjust tests | Ensure behavior parity | Same packet |
| Optional `AIPersonaTab` component split files | Extract toolbar/warnings only if adapter split is stable and dirty diff is manageable | Lower-risk UI size reduction | Separate sub-step |

---

### Packet G — Asset stack cleanup

| File | Change | Why | Ordering |
|---|---|---|---|
| `lib/services/assets/image-loader.ts` | Optional helper for image load with timeout | Extract repeated async/load concerns from service | First if implemented |
| `lib/services/assets/asset-loading-metrics.ts` | Optional helper for metric update/report logic | Reduce service size | After image helper |
| `lib/services/asset-loading-service.ts` | Delegate image loading/metrics; preserve public methods | Reduce complexity without contract change | After helpers |
| `hooks/useAssetLoading.ts` | Stabilize initialization dependencies if tests expose churn | Prevent repeated load loops | After service tests |
| Asset tests | Add service/hook tests | Validate fallback/retry/preload behavior | Same packet |

---

## 5. Risks and migration

### Dirty worktree risk

Risk: subagents can overwrite or reformat unrelated dirty changes.

Mitigation:

- Each packet has a strict path allowlist.
- Each subagent must inspect and summarize preexisting diffs for allowlisted files before editing.
- If an allowlisted file has surprising or conflicting edits, the subagent stops and reports.
- No broad code formatting or cleanup.

### Transaction lifecycle risk

Risk: changing `useBlockchainTransaction.execute` can alter timing/status behavior in hooks.

Mitigation:

- Make the return value additive.
- Preserve existing hook public returns.
- Add explicit tests for `PENDING → CONFIRMING → SUCCESS/ERROR`.
- Keep transaction store schema unchanged.

Migration:

- No persisted schema migration.
- Existing `wagdie-transactions` records remain valid because fields are unchanged.
- New records may use `confirming` more consistently; old readers already know `TransactionStatus.CONFIRMING`.

### API compatibility risk

Risk: using `jsonOk` broadly would break clients expecting raw response bodies.

Mitigation:

- Introduce raw helpers.
- Preserve exact response body shapes.
- Add exact JSON-shape route tests.

Migration:

- No API versioning required because responses remain compatible.

### Phaser runtime behavior risk

Risk: extracting marker/input code can subtly break marker click/drag/tooltip behavior.

Mitigation:

- First extract pure helpers and marker/tooltip managers only.
- Preserve EventBus payloads and marker IDs.
- Keep input/camera in `MapScene` for the first pass unless follow-up validation is strong.

### Repository split risk

Risk: import churn or behavior drift in complex Supabase queries.

Mitigation:

- Keep `character-repository.ts` facade exports.
- Move code with minimal logic changes.
- Add parity tests for query filters and `getStakedCharacters`.

### AI/Eliza and asset lower-priority risk

Risk: these areas are integration-heavy and already partially refactored.

Mitigation:

- Defer until high-ROI packets complete.
- Use facade-preserving decomposition only.
- Do not change API DTOs or singleton service contracts.

---

## 6. Implementation order

1. **Stage 0 — Worktree and delegation setup**
   - Assign subagents and path allowlists.
   - Each subagent records preexisting diffs for its allowlisted files.
   - No code edits until the packet owner confirms no conflicting dirty changes.
   - Create a simple packet checklist in the task tracker or PR description:
     - files touched,
     - tests run,
     - behavior verified,
     - unresolved risks.

2. **Stage 1 — Packet A shared transaction hook extension**
   - Modify `hooks/useBlockchainTransaction.ts` only.
   - Validate with focused hook tests.
   - Ensure `useSpread.ts` still compiles before migrating other hooks.

3. **Stage 2 — Packet A consumer migration**
   - Update `useSpread.ts` to the enhanced context pattern.
   - Update `useCure.ts`.
   - Update `useCorpseBurning.ts`.
   - Update `useSearing.ts`.
   - Update `useStaking.ts` last because it is consumed by map sidebar and has staking sync side effects.
   - Run:
     - hook tests,
     - TypeScript compile,
     - lint on touched files.

4. **Stage 3 — Packet B map staking sidebar split**
   - Create `useMapStakingPanel`.
   - Extract pure utilities.
   - Extract presentational components.
   - Reduce `MapStakingSidebar.tsx` to composition.
   - Validate map sidebar behavior manually and with component tests.
   - Confirm `app/map/page.tsx` is unchanged unless a compile-only type adjustment was required.

5. **Stage 4 — Packet C API standardization**
   - Add raw/no-store response helpers and param helpers.
   - Refactor the three known route files:
     - `app/api/characters/route.ts`
     - `app/api/characters/staking-status/route.ts`
     - `app/api/sync/staking/route.ts`
   - Run exact JSON-shape tests.
   - Discovery-check selected nested route files; refactor only if safe and response contracts are clear.

6. **Stage 5 — Packet D Phaser scene decomposition**
   - Extract `stack-layout`.
   - Extract tooltip controller.
   - Extract marker manager.
   - Update `MapScene.ts`.
   - Run map helper tests.
   - Manual smoke:
     - map render,
     - markers,
     - layers,
     - tooltip,
     - drag,
     - cleanup on navigation.

7. **Stage 6 — Packet E character repository split**
   - Add concern-specific repository modules.
   - Convert `character-repository.ts` to facade.
   - Preserve all exports and direct helper functions.
   - Run repository/service tests and any API tests relying on character data.

8. **Stage 7 — Packet F AI/Eliza adapter split**
   - Split adapter modules behind `sdkAdapter.ts` facade.
   - Do not change API route imports initially.
   - Run adapter/API tests.
   - Only then consider small `AIPersonaTab` UI extraction if the file has no conflicting dirty edits.

9. **Stage 8 — Packet G asset loading cleanup**
   - Run discovery first; skip if files are heavily dirty or recent changes are unclear.
   - Extract only small helpers with tests.
   - Preserve singleton contracts and asset type interfaces.
   - Validate fallback/retry/preload behavior.

10. **Final integration checkpoint**
    - Run full available validation:
      - `bun run lint`
      - `bun run test`
      - `bun run build`
    - Manual smoke checklist:
      - map loads,
      - sidebar stake/unstake works,
      - transaction toasts/statuses progress correctly,
      - character APIs return same shapes,
      - Eliza persona load/save/import/export still works if Packet F landed,
      - no unexpected files changed outside packet allowlists.


---

## Orchestrator progress log

- 2026-04-14 — Packet A complete: blockchain transaction lifecycle consolidation implemented by subagent `0D359C63-45ED-4EBC-9662-F73394E9B993`. Changed only `hooks/useBlockchainTransaction.ts`, `hooks/useSpread.ts`, `hooks/useStaking.ts`, `hooks/useSearing.ts`, `hooks/useCorpseBurning.ts`, and `hooks/useCure.ts`. Reported validation: eslint on touched hooks passed, `git diff --check` on touched hooks passed, `bun run test -- tests/hooks --runInBand` passed. Full `tsc --noEmit` still blocked by unrelated preexisting errors outside Packet A.
- 2026-04-14 — Packet B complete: `MapStakingSidebar` split implemented by subagent `9B3F2B62-22AD-40D1-A010-1DDD761DD5F2`. Added `hooks/map/useMapStakingPanel.ts`, `components/map/staking-sidebar/*`, and focused tests in `tests/components/map/staking-sidebar/*`. `app/map/page.tsx` was not edited. Reported validation: Packet B lint passed, `git diff --check` passed, targeted sidebar tests passed (2 suites, 10 tests). Full typecheck remains blocked by unrelated existing errors outside Packet B.
- 2026-04-14 — Packet C complete: focused API standardization implemented by subagent `167258CC-0889-4737-AF5B-15DE35819A21`. Added raw/no-store response helpers and param parsers, refactored selected character/sync routes while preserving raw response shapes, and added targeted API tests. Reported validation: targeted API tests passed (4 suites, 24 tests), `git diff --check` passed. Full typecheck remains blocked by unrelated existing errors; dirty untracked searing sync route was intentionally deferred.
- 2026-04-14 — Packet D complete: Phaser `MapScene` decomposition implemented by subagent `3FE4990D-5A8F-4618-B590-F5488BA6867D`. Added stack layout, event marker utils, tooltip controller, marker manager, and focused map tests while preserving EventBus/marker contracts. Reported validation: `bun run test -- tests/map --runInBand` passed, scoped TS check for Packet D files passed, scoped ESLint passed, `git diff --check` passed. Full typecheck remains blocked by unrelated existing errors outside Packet D.
- 2026-04-14 — Packet E complete: `character-repository.ts` facade split implemented by subagent `B7EABB12-92B3-4464-93F9-C0190D6186ED`. Added concern-specific repositories under `lib/repositories/character/` and preserved required exports from the facade. Reported validation: targeted repository tests passed (1 suite, 3 tests), `git diff --check` passed. Full typecheck remains blocked by unrelated existing errors outside Packet E; preexisting dirty `lib/repositories/index.ts` was intentionally left untouched.
- 2026-04-14 — Packet F complete: Eliza `sdkAdapter.ts` facade split implemented by subagent `02CBE3C6-0E97-48AA-8435-6F3E510E0F67`. Added `sdk-types`, message example, agent character mapper, and export mapper modules plus focused adapter tests. `AIPersonaTab` UI extraction was intentionally deferred. Reported validation: targeted adapter tests passed, full `tests/api/eliza` passed (5 suites, 42 tests), scoped ESLint passed, `git diff --check` passed. Full typecheck remains blocked by unrelated existing errors.
- 2026-04-14 — Packet G complete: limited asset-loading cleanup implemented by subagent `F3593437-D4FA-4A22-A38D-2FDA229A2960`. Added `lib/services/assets/image-loader.ts`, stabilized `useAssetLoading` initialization, and added focused hook/service tests. Reported validation: scoped hook tests passed, targeted service retry test passed, `git diff --check` passed. Full asset-loading-service suite remains noisy/preexisting in jsdom/timer areas; full typecheck remains blocked by unrelated existing errors.

> 💡 Continue this plan conversation with ask_oracle(chat_id: "refactor-execution-plan-43F836", new_chat: false)