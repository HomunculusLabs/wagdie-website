# Concord Searing Integration Plan

Goal: integrate the legacy `web` concord searing system into `wagdie-simplified` without replacing the target app’s event-driven architecture.

Source legacy areas:
- `web/pages/api/characters/sear/[tokenId].ts`
- `web/src/features/characters/api/{concord-searing-query,sear-wagdie,sync-seared}.ts`
- `web/src/features/characters/components/{SearDialog,ConcordBadge}.tsx`
- `web/src/features/characters/components/staking/DialogCharacterSearingApproval.tsx`
- `web/src/features/characters/lib/{concord-searing-map,character-utils,token-image-src}.ts`
- `web/src/typechain-types/SearWagdie.ts`
- `web/public/images/concords/*`, `web/public/images/searing_loading_*.gif`

Target areas:
- `wagdie-simplified/app/api/characters/[tokenId]/{concords,searing}`
- `wagdie-simplified/app/api/concords/[tokenId]/transfers`
- `wagdie-simplified/components/modals/SearingModal.tsx`
- `wagdie-simplified/hooks/useSearing.ts`
- `wagdie-simplified/lib/services/blockchain/searing.ts`
- `wagdie-simplified/lib/contracts/abis/{searing,concord,wagdie}.ts`
- `wagdie-simplified/lib/repositories/{activity-repository,character-repository}.ts`
- `wagdie-simplified/scripts/indexer/{searing-event-handler,searing-indexer,concord-transfer-handler}.ts`
- `wagdie-simplified/supabase/migrations/*searing_events.sql`, `*concord_transfers.sql`

Key architecture decision:
- Keep target transaction + event indexer path as source of chain truth.
- Add legacy behavior as idempotent materialization and UX layers: searing map, owned-concord selection, dual approval handling, seared artwork composition/upload, metadata/read-model updates, and sync/backfill routes.
- Do not make browser callback the only source of truth; sync should verify/decode tx events or use indexed `searing_events`.

Work items:

## Item 1 — Data/API foundation — DONE
Goal: add the data contracts for searing maps and materialization state.
Status note: Completed by agent `E3FFD4C0-15B5-4683-BFF9-454C91F7501A`. Added migration, searing-map domain/repository/service/API, importer, and `concord_transfers.batch_index` schema hardening. Verified with focused lint/importer checks; not applied against a live Supabase DB.
Done when:
- A migration adds `concord_searing_maps` and materialization columns on `searing_events`.
- The existing `concord_transfers` schema mismatch is fixed with `batch_index` and matching unique constraint.
- Domain/repository/service/API support exists for `GET /api/concords/searing-map`.
- An import script exists to load legacy searing-map JSON into Supabase.
Key files/modules:
- `supabase/migrations/`
- `lib/domain/searing/*` or equivalent
- `lib/repositories/*`
- `lib/services/*searing-map*` or equivalent
- `app/api/concords/searing-map/route.ts`
- `scripts/import-concord-searing-map.ts`
Dependencies: none.
Size: large.

## Item 2 — Blockchain approval/write flow — DONE
Goal: align target blockchain write/approval behavior with legacy searing contract behavior.
Status note: Completed by agent `BF38C441-1D73-4757-B5BC-138BB0E3D32D`. ABI/service/hook flow now aligns with legacy tokenId boundary, dual approval status/sequential approval, arbitrary Concord balances, and `useSearing().searConcords` returns a tx result/hash. Verified with focused eslint/scoped checks; no real-chain execution.
Done when:
- `lib/contracts/abis/searing.ts` is checked against `web/src/typechain-types/SearWagdie.ts`; domain `concordId` is converted to ABI `tokenId` at the service boundary if needed.
- `SearingService` supports WAGDIE + Concord approval status and sequential approval, while preserving existing hook compatibility where possible.
- `SearingService` can fetch arbitrary Concord ERC1155 balances for searable concord IDs.
- `hooks/useSearing.ts`, Storybook mocks, and existing call sites compile with the updated return shape.
Key files/modules:
- `lib/contracts/abis/searing.ts`
- `lib/services/blockchain/searing.ts`
- `hooks/useSearing.ts`
- `.storybook/mocks/hooks/useSearing.ts`
- `components/modals/SearingModal.stories.tsx`
Dependencies: none, but coordinate with Item 4.
Size: large.

## Item 3 — Materialization and sync — DONE
Goal: port the legacy off-chain side effects into a server-side, idempotent materialization path.
Status note: Completed by agent `B3B1C81A-98CD-4264-9ADE-9358FB90D070`. Added searing layer resolver/test, materialization repositories/services, per-token and protected bulk sync routes, backfill script, sharp/GCS deps, and image precedence/read-model plumbing. Focused resolver tests pass; DB-backed materialization awaits applying the Item 1 migration, and real GCS/RPC remain unverified locally.
Done when:
- Server-only layer-resolution and image-composition logic ports legacy `getLayersForCharacter` / searing-map behavior into target modules.
- A materialization service composes/uploads seared artwork, updates character metadata/image fields, upserts `character_concords`, and marks `searing_events` materialization status.
- `POST /api/characters/[tokenId]/searing/sync` and protected `POST /api/sync/searing` exist and validate/verify tx or indexed event data.
- A backfill/retry script exists for pending/failed searing events.
- Image precedence preserves infected-over-seared behavior.
Key files/modules:
- `lib/domain/searing/*`
- `lib/services/searing-materialization-service.ts`
- `app/api/characters/[tokenId]/searing/sync/route.ts`
- `app/api/sync/searing/route.ts`
- `scripts/materialize-searing-events.ts`
- `types/character.ts`
- `lib/utils/image.ts`
- `app/characters/[tokenId]/page.tsx`
Dependencies: Item 1.
Size: large.

## Item 4 — UI integration and verification — DONE
Goal: replace the manual concord ID searing UI with legacy-style owned-concord selection, approval panel, preview, and post-tx sync.
Status note: Completed by agent `A28BA6D0-0C36-43E8-ABCA-924766B6DA28`. Added owned Concord hook, selection grid, preview, approval/status panels, post-tx sync call, character refetch wiring, Storybook mocks/stories, and focused hook/grid tests. Follow-up review fixes addressed sync chainId/auth concerns, event decoder tokenId normalization, infected image precedence, and searing ABI write-arg TypeScript errors. Focused searing TS grep now returns no errors; repo-wide lint/tsc still fail on existing unrelated baseline issues.
Done when:
- `SearingModal` uses owned searable concord data rather than manual Concord ID input.
- New UI components exist for concord grid, searing preview, and approval panel where useful.
- `useSearingConcords` or equivalent fetches map data, ERC1155 balances, and filters blocked/unowned Concords.
- After tx success, the modal calls the sync route and refetches character state; materialization failure is shown as off-chain pending/failure, not tx failure.
- Storybook stories cover default, no concords, needs approval, selected preview, success, and materialization-failed states.
- Focused tests cover layer resolver, service parameter conversion/approval, API validation, and key UI/hook behavior as practical.
Key files/modules:
- `components/modals/SearingModal.tsx`
- `components/characters/searing/*`
- `hooks/useSearingConcords.ts`
- `components/characters/detail/{CharacterActions,CharacterModals}.tsx`
- `app/characters/[tokenId]/page.tsx`
- `.storybook/mocks/*`
- `components/modals/SearingModal.stories.tsx`
- relevant tests under `tests/`
Dependencies: Items 1 and 2; Item 3 for final sync behavior.
Size: large.

Verification guidance:
- Run targeted tests as work lands, then `bun run lint` and `bun run test` if feasible.
- For build-sensitive changes, run `bun run build` before final handoff if time allows.
- If GCS/sharp credentials or real chain access are unavailable locally, mock those boundaries and clearly report what remains unverified.
