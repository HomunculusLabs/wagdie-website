# ElizaOS Agent Location Rooms: Plan

## Goal

Build public, location-pin-based elizaOS rooms where WAGDIE characters staked at the same map location can interact on scheduled ticks, and visitors can open the map location to read the visible transcript.

## Decisions

- A WAGDIE map location pin is the product surface for one elizaOS room.
- Room transcripts are visible from the map UI.
- Anyone can observe room transcripts; staked character owners, admins, and scheduled jobs are the only actors allowed to trigger room activity.
- V1 prioritizes scheduled ticks; owner/admin manual triggers reuse the same tick queue and can land after the scheduler path is working.

## Background

- The map already groups staked characters by `location_id` through `buildStakedCharactersByLocation()` and exposes `stakedHere` for the selected location (`lib/utils/mapOrchestration.ts:32`, `hooks/map/useMapPageSelection.ts:33`, `components/map/MapStakingSidebar.tsx:137`).
- The map page owns the current data/selection/sidebar wiring in `app/map/page.tsx:47` and `app/map/page.tsx:160`.
- Wallet-specific character markers already use `staker_address ?? owner_address` as the effective owner (`lib/utils/mapOrchestration.ts:101`). Room trigger authorization should share that predicate instead of reimplementing it.
- WAGDIE token IDs are the canonical external identity for elizaOS character records (`lib/eliza/characterResolver.ts:99`), and official agent ids are deterministic from token-backed external ids (`lib/eliza/official/ids.ts:25`).
- Existing official elizaOS chat is wallet/session scoped, not public-room scoped: WAGDIE conversation ids map to official session ids through `eliza_official_conversation_links` (`supabase/migrations/20260510020000_create_eliza_official_conversation_links.sql:4`, `lib/eliza/officialConversationRepository.ts:8`).
- Official chat session creation, message send, and wallet-conversation rebind behavior are currently intertwined in `lib/eliza/official/client.ts:357`, `lib/eliza/official/client.ts:375`, and `lib/eliza/official/client.ts:415`. Room generation must reuse the official messaging mechanics without inheriting wallet conversation writes.
- The elizaOS service already uses runtime `roomId`, `worldId`, and `channelId` concepts for knowledge memory, but currently scopes that memory room to an agent id (`services/elizaos/src/wagdie-knowledge-plugin.ts:200`, `services/elizaos/src/wagdie-knowledge-plugin.ts:226`).
- Repo persistence conventions favor Supabase migrations, service-role writes, public reads only through API routes, repository row mappers, and shared auth/response helpers (`lib/supabase.ts:103`, `lib/api/auth.ts:21`, `lib/api/responses.ts:18`).
- Background work should follow queued worker rows plus guarded API/manual cron entrypoints, not hidden DB cron (`supabase/migrations/20260105000000_discord_outbox.sql:21`, `scripts/discord/notifier.ts:120`, `app/api/sync/ownership/route.ts:11`).

## Approach

Implement location rooms as an additive, WAGDIE-canonical feature. WAGDIE owns public room identity, transcripts, tick state, visibility, and authorization. The hosted official elizaOS service generates character turns, but `/api/eliza/chat` and the existing wallet-scoped conversation links remain unchanged.

Use one persistent WAGDIE room per `locations.id`. Each scheduled or manual trigger enqueues a room tick. A worker claims ticks, reloads current staked participants for that location, selects one eligible speaker, resolves that token into its official elizaOS agent, creates a short-lived official session for the turn, asks the agent for one short in-world utterance using recent local transcript as context, and appends the result to WAGDIE's public transcript.

V1 should not persist official room-agent sessions. The local transcript supplies continuity, and short-lived official sessions avoid coupling room state to the existing wallet `conversationRepository.create()` / `rebindSession()` flow. If the deployed elizaOS service later exposes durable group-channel transcripts that are stable enough, WAGDIE can store/mirror those ids as an enhancement without changing the public room contract.

## Data Model

Add `supabase/migrations/<timestamp>_create_eliza_location_rooms.sql` with service-role-only RLS and explicit status/check constraints.

### `eliza_location_rooms`

One row per map location.

Key fields:

- `id uuid primary key`
- `location_id text not null unique`
- `official_room_id uuid not null unique`
- `official_world_id uuid not null`
- `official_user_id uuid not null`
- `channel_id text not null`
- `tick_enabled boolean not null default true`
- `last_tick_at timestamptz null`
- `next_tick_at timestamptz null`
- `tick_count integer not null default 0`
- `last_error text null`
- timestamps

Index `(tick_enabled, next_tick_at)` for scheduled selection. Confirm `locations.id` stability before migration; if map-editor deletes/renames can invalidate it, add an FK/cascade policy explicitly rather than relying on deterministic ids alone.

### `eliza_location_room_messages`

Canonical public transcript plus optional internal system rows.

Key fields:

- `id uuid primary key`
- `room_id uuid not null references eliza_location_rooms(id) on delete cascade`
- `location_id text not null`
- `tick_id uuid null`
- `sequence bigint generated always as identity`
- `visibility text not null default 'public'` (`public | internal`)
- `author_kind text not null` (`agent | system | wallet | admin | scheduler`)
- `token_id integer null`
- `official_agent_id text null`
- `author_name text not null`
- `content text not null`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Index `(room_id, sequence desc)`. Public APIs return only `visibility = 'public'` and never expose wallet addresses, official session ids, raw errors, or internal metadata. Trigger audit belongs on tick rows, not public transcript rows.

### `eliza_location_room_ticks`

Queue/state table for scheduled, owner, and admin activity.

Key fields:

- `id uuid primary key`
- `room_id uuid not null references eliza_location_rooms(id) on delete cascade`
- `location_id text not null`
- `trigger_type text not null` (`scheduled | owner | admin`)
- `requested_by_wallet text null`
- `requested_by_token_id integer null`
- `status text not null` (`pending | processing | completed | skipped | failed | dead`)
- `attempts integer not null default 0`
- `next_attempt_at timestamptz not null default now()`
- `locked_at timestamptz null`
- `locked_by text null`
- `selected_token_id integer null`
- `started_at`, `completed_at`, `last_error`, timestamps

Add a partial unique index on `(room_id)` where `status in ('pending', 'processing')` to prevent duplicate concurrent ticks. Add a pending-claim index on retryable rows. Do not store a participant snapshot in V1; processing always re-queries current membership.

## Backend Design

### Config and ids

Add a disabled-by-default config block in `lib/eliza/config.ts`:

- `ELIZA_LOCATION_ROOMS_ENABLED=false`
- `ELIZA_LOCATION_ROOM_TICK_INTERVAL_MINUTES=360`
- `ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN=5`
- `ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW=20`

Keep manual cooldown and worker lock TTL as constants initially; promote them to env vars only after the first rollout shows they need operational tuning.

Add deterministic helpers in `lib/eliza/official/ids.ts` for location room, world, and service-user ids. Inputs should be normalized `locations.id` values, and outputs should be stable UUID strings.

### Official messaging reuse

Extract only transport-level official messaging into `lib/eliza/official/messaging.ts`:

- start agent
- create session
- send session message
- collect/normalize streamed response text

The helper must not call `conversationRepository.create()`, `conversationRepository.rebindSession()`, or write `eliza_official_conversation_links`. Keep wallet-session rebind behavior inside `OfficialWagdieElizaClient`. Room turns create a short-lived session per tick and treat official 404/network failures as tick failures with retry/backoff.

### Location room modules

Add `lib/eliza/locationRooms/*`:

- `types.ts`: domain rows, public DTOs, trigger/worker result types.
- `repository.ts`: service-role Supabase mapper for rooms, messages, and ticks.
- `membership.ts`: server-side participant lookup and owner authorization based on current staked characters.
- `officialTurnGenerator.ts`: prompt builder and official elizaOS turn generation.
- `service.ts`: public room reads, trigger requests, scheduled enqueue, tick claiming, and tick processing.

Eligibility for V1:

- character `location_id` matches the room location
- token id is valid
- character is not fallen, using the existing `isBurnedOwner(owner_address, burned)` predicate already used for fallen map events (`lib/utils/mapOrchestration.ts:154`)
- display name can be resolved from character data or `Character #<tokenId>`
- at least two eligible participants are required for a tick

Owner triggers must re-query server-side membership. Client `stakedHere` is display-only and cannot authorize actions.

### Tick processing

A tick generates one agent utterance.

Processing flow:

1. Claim pending/failed ticks with lock metadata and retry limits.
2. Load room and current eligible participants.
3. Skip without public error if fewer than two participants remain.
4. Resolve/create official elizaOS agents through token id identity.
5. Select one speaker using the last `ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW` public agent messages for that room: lowest count in the window, oldest last message in the window, then lowest token id.
6. Load the same recent public transcript window.
7. Create a short-lived official session with metadata including source, room id, location id, official room/world ids, speaker token id, and official agent id.
8. Prompt the selected speaker for one short in-world utterance.
9. Trim/validate content and append a public `agent` message.
10. Mark the tick complete and advance `last_tick_at`, `next_tick_at`, and `tick_count`.

Retry official/network failures with exponential backoff. Mark exhausted or validation failures `dead`, truncate stored errors, and keep raw error details out of public responses.

## API Design

### Public read

`GET /api/eliza/location-rooms/[locationId]?page=1&pageSize=20`

- No wallet required.
- Validates the location exists.
- Ensures the room row exists.
- Returns room summary, current participants, public messages, and pagination.
- Uses no-store responses.

### Trigger activity

`POST /api/eliza/location-rooms/[locationId]/tick`

Supported actors:

- owner wallet: authenticated wallet must currently own/stake at least one eligible participant at the location
- admin wallet: `requireAdmin()`
- scheduler: `SYNC_SECRET_KEY`

Return `202` for queued/deduped ticks, `403` for non-owner/non-admin wallets, `409` when fewer than two participants are eligible, `429` for manual cooldown once owner triggers are enabled, and `503` when the feature or official service is disabled. V1 should not implement inline `200` completion.

### Scheduled worker

`GET|POST /api/sync/eliza-location-rooms`

Guard like `app/api/sync/ownership/route.ts`. The handler should enqueue due rooms, process up to `ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN`, and return counts for enqueued, processed, completed, skipped, failed, and dead ticks.

## Frontend Design

Add `hooks/map/useLocationRoom.ts` and keep the state local to the sidebar rather than bloating `app/map/page.tsx`.

Hook responsibilities:

- fetch public room data when a location and Room tab are active
- compute `canTriggerAsOwner` from `stakedHere` plus wallet effective-owner matching
- call the trigger route once owner/admin manual triggers are enabled
- poll/refetch briefly after a trigger until a newer message appears or a timeout expires

Update map sidebar components:

- Extend location tabs with `room` in `hooks/map/useMapStakingPanel.ts` and `components/map/staking-sidebar/LocationTabs.tsx`.
- Add `components/map/staking-sidebar/LocationRoomPanel.tsx` for participant summary, transcript, empty states, and owner trigger button.
- Render the panel from `components/map/MapStakingSidebar.tsx` when a location marker is selected.

Read-only transcript should be visible without a wallet. The trigger button should be hidden or disabled until the owner trigger route is enabled; after that, show it only for connected wallets that own/stake an eligible participant at the selected location.

## Work Items

1. **Confirm migration inputs**
   - Verify `locations.id` stability under map-editor rename/delete flows.
   - Confirm the deployed elizaOS package/version and whether durable group-channel ids should be mirrored as metadata only.

2. **Database foundation**
   - Add room, message, and tick tables with constraints, indexes, and service-role-only RLS.
   - Verify migration shape before enabling routes.

3. **Config and deterministic identity**
   - Add location-room feature flags/cadence settings in `lib/eliza/config.ts`.
   - Add deterministic room/world/service-user id helpers in `lib/eliza/official/ids.ts`.

4. **Official messaging extraction**
   - Add `lib/eliza/official/messaging.ts` for transport-only official agent/session/message helpers.
   - Refactor `OfficialWagdieElizaClient` to use the helper while preserving wallet conversation writes and rebind behavior inside the existing chat flow.

5. **Location room domain layer**
   - Add `lib/eliza/locationRooms/types.ts`, `repository.ts`, `membership.ts`, `officialTurnGenerator.ts`, and `service.ts`.
   - Keep repository persistence, membership authorization, prompt generation, and orchestration separated.

6. **Scheduled API and worker path**
   - Add public room read and guarded scheduled sync routes first.
   - Prove scheduled ticks can enqueue, process, and append one public message behind `ELIZA_LOCATION_ROOMS_ENABLED`.

7. **Manual trigger API**
   - Add owner/admin tick trigger route using the same queue.
   - Add cooldown and non-owner rejection tests before exposing UI controls.

8. **Map sidebar UI**
   - Add `useLocationRoom`, a Room tab, and `LocationRoomPanel`.
   - Keep transcript public, trigger controls owner-gated, and room state local to the sidebar.

9. **Tests and smoke checks**
   - Unit test repository row mapping, tick dedupe/claiming, membership owner matching, speaker selection, and failure transitions.
   - Route-test public read, scheduler trigger, owner/admin trigger, non-owner rejection, two-participant requirement, cooldown, and disabled-feature behavior.
   - Component-test transcript visibility and trigger button gating.
   - Smoke test with feature flag enabled: open location pin, read transcript publicly, process a scheduled tick, trigger as owner, confirm generated message appears, confirm non-owner cannot trigger.

10. **Scheduled rollout**
    - Enable `ELIZA_LOCATION_ROOMS_ENABLED` only after manual smoke passes.
    - Start scheduled processing at low cadence and low `maxTicksPerRun`.
    - Raise cadence only after reviewing official service latency/errors.

## Orchestration Progress

- [x] Item A: Database foundation plus config/id helpers.
- [x] Item B: Official messaging extraction without wallet conversation coupling.
- [x] Item C: Location room domain layer plus public read and scheduled worker routes.
- [x] Item D: Manual trigger route plus map sidebar room UI.
- [x] Item E: Final verification, targeted tests, and smoke notes.

## Open Questions

- Is `locations.id` stable enough to be the natural key for durable room transcripts, or should room rows cascade/disable when locations are deleted through map-editor flows?
- Confirm the deployed elizaOS service package/version and whether its group-channel or room APIs are durable enough to mirror ids as metadata. This does not block the WAGDIE-canonical V1 design, but it affects what official metadata to store.
- Pick the initial production cadence and `maxTicksPerRun` after capacity testing. The plan assumes conservative defaults: 6-hour interval and at most 5 ticks per worker run.

## References

- `docs/plans/official-eliza-package-migration-2026-05-10.md`
- `docs/plans/eliza-package-migration-2026-05-10.md`
- `specs/016-character-editor-chat/contracts/api.yaml`
- `specs/017-eliza-persona-editor/contracts/api.yaml`
- elizaOS runtime core: https://docs.elizaos.ai/runtime/core
- elizaOS memory and state: https://docs.elizaos.ai/agents/memory-and-state
- elizaOS REST reference: https://docs.elizaos.ai/rest-reference
- elizaOS messaging runtime: https://docs.elizaos.ai/runtime/messaging
