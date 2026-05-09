# Community Lore Media Submissions: Plan

## Goal

Build a community lore submission workflow where wallet-authenticated token owners can submit lore entries for tokens they own, using browser-authored Markdown plus external source/media URLs. Admins review and promote selected community lore to canon from the admin panel.

First version constraints:

- No binary uploads.
- Markdown is authored in the browser, not uploaded as files.
- Twitter/X posts, YouTube videos, and other references are submitted as URLs.
- A valid token-owner submission is community lore by default; admin canonization is the path that promotes selected community lore into canon.
- Source links, archive links, submitter attribution, and admin audit history must be preserved.

## Background

- Lore already has structured event, source, media, and canon types. `LoreEvent` carries title, summary, body, locations, characters, canon status, source ids, and media ids (`lib/lore/types.ts:144`). `SourceRecord` models URL, archive URL, author/platform, attribution, preservation notes, and attached media (`lib/lore/types.ts:129`). `LoreMedia` models media kind, URL/archive URL, alt text, and attribution (`lib/lore/types.ts:119`).
- Public lore reads now flow through `lib/lore/effective-query.ts`. `getAllEffectiveLoreEvents()` applies published canonization overrides and is consumed by archive, character, location, and detail lookups (`lib/lore/effective-query.ts:66`). New DB-backed community records should extend this seam, not introduce a third query layer.
- Static source/media resolution currently uses Maps in `lib/lore/query.ts`; `getSourcesForEvent()` reads `event.sourceIds` from static `loreSources` (`lib/lore/query.ts:135`). Published submission sources/media need an effective resolver too, otherwise DB-backed events will render without their submitted URLs.
- `LoreEventDetail` currently renders body text by splitting on newlines (`components/lore/LoreEventDetail.tsx:154`). Community-authored bodies need sanitized Markdown rendering, with no raw HTML execution.
- Admin canonization already has draft/publish semantics. The service keeps draft and published snapshots (`lib/services/lore-canonization-service.ts:43`), and the migration stores `publication_status`, published snapshots, and admin wallet audit fields (`supabase/migrations/20260509000000_create_lore_canonization_overrides.sql:20`).
- Wallet auth and admin auth already exist. `requireAuth()` gates signed-in wallets (`lib/api/auth.ts:21`), while `requireAdmin()` verifies the admin allowlist for review and canonization routes (`lib/api/auth.ts:35`). Community submission routes must require wallet auth and verify the connected wallet owns the character/token being submitted against.
- Existing validation patterns are useful, but this workflow should use a browser editor rather than file upload (`app/api/eliza/characters/[tokenId]/knowledge/route.ts:22`).
- The app already embeds YouTube via `youtube-nocookie.com` iframes (`app/videos/page.tsx:154`) and has tweet/media metadata shapes (`types/tweet.ts:6`).

## Approach

Add a DB-backed community lore subsystem keyed to owned character/token ids, and merge admin-canonized submissions into the existing lore effective-query path.

The workflow has one core rule: a wallet may submit community lore only for a token it owns; admin promotion turns selected community lore into canon. Admins may also hide, reject, or request edits before/after public community visibility depending on moderation policy.

Do not create a separate public lore composition service. Extend `lib/lore/effective-query.ts` so archive pages, detail pages, character links, location links, and related-event lookups all see the same effective canon/event set. Community lore can be listed separately until canonized if product wants a moderation buffer.

Use one submission service for v1. Split public/admin services later only if the module becomes hard to maintain.

## Data Model

Add `supabase/migrations/<timestamp>_create_lore_submissions.sql` using the same service-role-only/RLS style as the canonization override migration.

### `lore_submissions`

Stores original content, curated admin fields, publication state, and canon state.

Key fields:

- `id uuid primary key default gen_random_uuid()`
- `submitter_address text not null`
- `token_id text not null`
- `title text not null`
- `summary text not null`
- `body_markdown text not null`
- `tags text[] not null default '{}'`
- nullable curated overrides: `curated_title`, `curated_summary`, `curated_body_markdown`, `curated_tags`
- graph links: `season_id text null`, `character_ids text[] default '{}'`, `location_ids text[] default '{}'`
- `status text not null default 'submitted'`
- `review_note text null`
- `status_reason text null`
- `last_admin_address text null`
- `published_slug text unique null`
- `visibility text not null default 'pending'` (`pending | public | hidden`)
- `published_kind text null` (`community | official`)
- `canon_status text not null default 'community'`
- `canon_stage_id text not null default 'community_recorded'`
- `canon_note text null`
- `canon_path jsonb not null default '[]'`
- `publication_snapshot jsonb null`
- timestamps for created, updated, submitted, reviewed, published, canonized, closed

Required SQL checks:

- `status in ('submitted', 'changes_requested', 'public', 'canonized', 'closed')`
- `visibility in ('pending', 'public', 'hidden')`
- `published_kind is null or published_kind in ('community', 'official')`
- `canon_status` and `canon_stage_id` match the existing lore canon enums
- `published_slug is not null` when `status in ('public', 'canonized')`

Indexes:

- `(submitter_address, created_at desc)`
- `(token_id, created_at desc)`
- `(status, submitted_at desc)`
- partial unique index on `published_slug where published_slug is not null`

### `lore_submission_links`

Stores source/media URLs attached to a submission.

Key fields:

- `submission_id uuid references lore_submissions(id) on delete cascade`
- `role text not null default 'source_media'` (`source | media | source_media`)
- `link_type text not null` (`twitter | youtube | generic`)
- `original_url text not null`
- `normalized_url text not null`
- `display_title text null`
- `platform text null`
- `author text null`
- `published_at timestamptz null`
- `archived_url text null`
- `attribution text null`
- `preservation_note text null`
- `metadata jsonb not null default '{}'`
- `sort_order integer not null default 0`

Required SQL checks:

- `role in ('source', 'media', 'source_media')`
- `link_type in ('twitter', 'youtube', 'generic')`
- unique `(submission_id, normalized_url)`

### `lore_submission_reviews`

Append-only moderation audit log.

Key fields:

- `submission_id uuid references lore_submissions(id) on delete cascade`
- `actor_address text not null`
- `action text not null`
- `from_status text null`
- `to_status text not null`
- `note text null`
- `created_at timestamptz not null default now()`

## Workflow

Use a compact status set:

```ts
type LoreSubmissionStatus =
  | 'submitted'
  | 'changes_requested'
  | 'public'
  | 'canonized'
  | 'closed';
```

There is no required server-side draft state in v1. Drafting can happen client-side before the wallet-authenticated POST. The POST must verify the session wallet owns `token_id` at submission time.

Allowed transitions:

| From | To | Actor | Rule |
| --- | --- | --- | --- |
| `submitted` | `public` | admin or auto-policy | Makes valid token-owner entry visible as community lore. |
| `submitted` | `changes_requested` | admin | Requires note and submitter contact/identity if follow-up is possible. |
| `submitted` | `closed` | admin | Spam/rejected; requires reason. |
| `changes_requested` | `submitted` | community submitter/admin | Revised content is resubmitted. |
| `public` | `canonized` | admin | Promotes community lore to canon. |
| `public` | `closed` | admin | Hide/unpublish community lore; preserves audit history. |
| `canonized` | `public` | admin | Decanonize back to community lore. |

Invalid transitions return `409 Conflict`.

Slug ownership:

- Slugs are minted by the system when community lore becomes publicly visible from the curated or submitted title.
- Slug validation checks both DB-published submissions and static lore event slugs before commit.
- Static lore wins collisions. DB slugs receive a deterministic suffix from the submission id.
- Canonization keeps the same slug. `/lore/community/[slug]` redirects to `/lore/events/[slug]` after canonization.

## Validation and Markdown Rendering

Add `lib/lore/submissions/validation.ts` using Zod.

Rules:

- title: 3–120 characters
- summary: 20–500 characters
- Markdown body: 1–50,000 characters
- tags: max 10, each max 32 characters
- links: submitted entries require 1–10 links
- URLs: `http`/`https`, max 2048 characters, normalized and deduplicated

URL handling:

- Twitter/X: accept `twitter.com`, `mobile.twitter.com`, and `x.com` status URLs; map to `SourceRecord.kind = 'tweet'`.
- YouTube: accept `youtube.com/watch?v=`, `youtu.be/{id}`, `/shorts/{id}`, and `/embed/{id}`; derive `youtube-nocookie.com/embed/{id}` and map to video source/media records.
- Generic: store as website/source link unless admin marks it media-only.

Markdown rendering decision for v1:

- Add `react-markdown`, `remark-gfm`, and `rehype-sanitize`.
- Disable raw HTML.
- Use one shared component/config for submitter preview, admin preview, and public community/canonized submission bodies.
- Leave static lore bodies on the existing paragraph renderer unless explicitly converted later. This avoids regressions across current official lore pages.

Do not fetch Twitter/X or YouTube metadata in v1. Store pasted URLs and manually entered attribution/archive fields. Metadata unfurling can be planned later as a background job with SSRF protection.

## API Surface

### Community routes

- `POST /api/lore/submissions` — `requireAuth()`, verifies connected wallet owns `token_id`, validates input, and creates a `submitted` community lore entry.
- `GET /api/lore/submissions` — `requireAuth()`, lists current wallet’s submissions.
- `GET /api/lore/submissions/[submissionId]` — submitter wallet or admin can view.
- `PATCH /api/lore/submissions/[submissionId]` — submitter wallet can revise `changes_requested` entries if they still own the token.

Community submission is not anonymous. Add rate limiting and server-side moderation controls, but ownership verification is the primary gate.

### Admin routes

- `GET /api/admin/lore/submissions` — queue filters: status, submitter, query, page, perPage.
- `GET /api/admin/lore/submissions/[submissionId]` — full submission, links, curation fields, review log.
- `PATCH /api/admin/lore/submissions/[submissionId]` — save curation metadata and graph links.
- `POST /api/admin/lore/submissions/[submissionId]/review` — request changes, approve, or close/reject.
- `POST /api/admin/lore/submissions/[submissionId]/publish` — make submitted entry visible as community lore, if not auto-public.
- `POST /api/admin/lore/submissions/[submissionId]/canonize` — promote public community lore to canon.
- `POST /api/admin/lore/submissions/[submissionId]/decanonize` — demote canonized lore back to community lore.
- `POST /api/admin/lore/submissions/[submissionId]/unpublish` — hide public community lore.

All mutating admin routes call `requireAdmin()`. Community submission routes call `requireAuth()`, verify token ownership, validate input, apply abuse controls, write review-log entries, and use standard API response helpers.

## Services and Effective Lore Integration

Add:

- `types/lore-submission.ts` — workflow, link, review, and DTO types.
- `lib/lore/submissions/validation.ts` — Zod schemas and URL normalization.
- `lib/repositories/lore-submission-repository.ts` — persistence, public/admin queries, conditional status updates, review logs.
- `lib/services/lore-submission-service.ts` — public submission and admin workflow operations.
- `lib/lore/submissions/adapter.ts` — map published/canonized rows into `LoreEvent`, `SourceRecord`, and `LoreMedia`.

Extend existing lore seams:

- `lib/lore/effective-query.ts`
  - load published/canonized submission rows;
  - append adapted submission events inside `getAllEffectiveLoreEvents()`;
  - keep canonization override application for static events;
  - ensure character/location/event archive queries see DB-backed entries.
- `lib/lore/query.ts` or a new effective resolver module
  - add effective source/media resolution for DB-backed event source/media ids;
  - avoid relying only on static `loreSources` / `loreMedia` Maps for published submissions.

Publication mapping:

- `public` → `LoreEvent.kind = 'community'`, public route `/lore/community/[slug]`, canon status `community` or `canonizing`.
- `canonized` → `LoreEvent.kind = 'official'`, public route `/lore/events/[slug]`, canon status `canon`, stage `canonized`.
- community route redirects to the official route once canonized.

Canonization storage:

- `lore_submissions` owns canon state for DB-backed community submissions.
- `lore_canonization_overrides` remains for static lore events only.
- The adapter exposes canonized submissions as effective `LoreEvent`s so public components do not need to know which backing store produced the event.

## UI Work

### Community UI

Add:

- `app/lore/submit/page.tsx`
- `app/lore/submissions/page.tsx`
- `app/lore/submissions/[submissionId]/page.tsx`
- `components/lore/submissions/LoreSubmissionForm.tsx`
- `components/lore/submissions/MarkdownEditor.tsx`
- `components/lore/submissions/MarkdownPreview.tsx`
- `components/lore/submissions/SourceUrlListEditor.tsx`
- `components/lore/submissions/SubmissionStatusBadge.tsx`
- `components/lore/submissions/UserSubmissionsList.tsx`

Behavior:

- users must connect/sign in with a wallet before submitting;
- the form requires selecting or entering a token they own;
- submit and revision actions re-check ownership server-side;
- preview uses the shared sanitized Markdown component.

### Admin UI

Add:

- `app/admin/lore/submissions/page.tsx`
- `app/admin/lore/submissions/[submissionId]/page.tsx`
- `components/admin/lore-submissions/LoreSubmissionsAdminQueue.tsx`
- `components/admin/lore-submissions/LoreSubmissionReviewPanel.tsx`
- `components/admin/lore-submissions/LoreSubmissionCurationForm.tsx`
- `components/admin/lore-submissions/LoreSubmissionPublishControls.tsx`
- `components/admin/lore-submissions/LoreSubmissionReviewLog.tsx`

Use the existing admin gate pattern with lore-specific copy. The detail page should show original content, sanitized preview, source/media cards, curated title/summary/body/tags, character/location/season fields, canonization fields, review log, and action controls.

## Work Items

1. **Migration and types**
   - Add submission/link/review tables with RLS, service-role policies, closed-set checks, indexes, and audit timestamps.
   - Add `types/lore-submission.ts`.
   - Done when migrations apply cleanly and TypeScript reflects the status/link/review model.

2. **Validation, Markdown, and URL normalization**
   - Add Markdown renderer/sanitizer dependency and shared preview component.
   - Add Zod schemas and Twitter/X, YouTube, generic URL normalization helpers.
   - Done when unsafe Markdown is sanitized, valid URLs normalize, invalid URLs fail with field errors, and YouTube embed URLs are deterministic.

3. **Repository, service, and status transitions**
   - Add repository and one workflow service covering token-owner submission and admin operations.
   - Enforce wallet auth plus token ownership at community API boundaries, admin authorization at admin API boundaries, and conditional transitions in service methods.
   - Done when token ownership mismatch, invalid transitions, static slug collisions, duplicate submissions, abuse-control failures, and concurrent stale updates fail predictably.

4. **API routes**
   - Add community submission routes and admin review/publish/canonize/unpublish routes.
   - Done when community submission routes use `requireAuth()`, token ownership verification, validation/abuse controls; admin routes use `requireAdmin()`; and all routes use standard response helpers plus review-log writes.

5. **Community submission UI**
   - Add submitter pages and components.
   - Done when a connected wallet can author, preview, link sources, and submit community lore only for a token it owns; revisions re-check ownership.

6. **Admin review UI**
   - Add admin queue and detail pages inside the admin panel.
   - Done when an admin can curate metadata, request changes, close/reject, publish community lore, canonize, decanonize, and hide/unpublish from one place.

7. **Effective lore integration**
   - Extend `effective-query.ts` and source/media resolution to include DB-backed published/canonized submissions.
   - Done when published submissions appear in archive/community detail/character/location lookups, canonized submissions appear in official routes, and source/media cards render from DB-backed records.

8. **Tests and smoke flow**
   - Add unit tests for validators, status transitions, slug collision handling, adapter mapping, and source/media resolution.
   - Add API tests for wallet auth, token ownership verification, submission validation, abuse controls, admin-only actions, and 400/403/404/409 errors.
   - Smoke test: connect wallet → submit lore for owned token → reject submission for unowned token → admin publish/community view → canonize → official view/redirect → decanonize/hide. Also test changes-requested revision with ownership re-check.

## Open Questions

- Should metadata enrichment for Twitter/X and YouTube be added later via API fetch/background job? Current plan deliberately defers it.
- Should generic website links support rich previews in v1? Current plan displays them as source cards only.

## References

- `lib/lore/types.ts`
- `lib/lore/effective-query.ts`
- `lib/lore/query.ts`
- `components/lore/LoreEventDetail.tsx`
- `components/lore/MediaGallery.tsx`
- `components/lore/SourceList.tsx`
- `lib/services/lore-canonization-service.ts`
- `supabase/migrations/20260509000000_create_lore_canonization_overrides.sql`
- `lib/api/auth.ts`
- `lib/auth/session.ts`
- `app/videos/page.tsx`
- `types/tweet.ts`

## Implementation Progress

- [x] Work items 1–2 foundation: migration, shared types, validation/URL normalization, sanitized Markdown preview, token-ownership helper, and focused unit tests.
- [x] Work items 3–4 backend workflow: repository/service layer and community/admin API routes.
- [x] Work items 5–6 UI: community submission UI and admin review UI.
- [x] Work item 7 effective lore integration.
- [~] Work item 8 verification: targeted tests pass; full lint/typecheck still blocked by pre-existing unrelated errors.
