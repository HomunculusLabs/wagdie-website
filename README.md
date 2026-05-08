# WAGDIE Simplified

Community-maintainable WAGDIE web app built with Next.js. The app brings the WAGDIE collection, lore, map, staking/searing flows, wallet auth, and AI persona tools into one modern TypeScript codebase.

## Current Capabilities

- **Character browser and details** — searchable/filterable WAGDIE character pages with traits, ownership, equipment, stats, story editing, animated view, and blockchain action modals.
- **Wallet authentication** — Sign-In with Ethereum (SIWE), iron-session cookies, owner/admin-gated editing, and wallet-aware UI.
- **World map and staking** — Phaser-backed map experience, staking sidebar, location metadata, staking/move/unstake transaction flows, and sync endpoints.
- **Searing and infection flows** — concord ownership, searing previews/sync, infection/cure/sear modals, and searing map editor support.
- **Eliza AI integration** — character export/import, persona editing, knowledge documents, conversations, chat dock, and server-side Eliza auth/token handling.
- **Lore/spread/videos pages** — project lore, spread tooling, and low-poly video gallery.
- **Asset tooling** — local character images, metadata import/compare scripts, GCS image import, searing event materialization, and map asset optimization.
- **Storybook and tests** — component stories plus Jest coverage for hooks, API behavior, map/editor flows, services, repositories, and utilities.

## Tech Stack

- **Runtime**: Node `23.3.0` (pinned in `.nvmrc` and `package.json`)
- **Package manager**: Bun preferred; npm works for most commands
- **Framework**: Next.js 15 App Router, React 18, TypeScript
- **Styling**: Tailwind CSS and shared UI primitives
- **Data**: Supabase/Postgres plus local repository/service layers
- **Blockchain**: wagmi, viem, ethers, RainbowKit
- **Auth**: SIWE + iron-session cookies
- **Game/map**: Phaser
- **AI**: bundled local `@eliza/sdk` package
- **Testing/docs**: Jest, Storybook, specs, Supabase migrations

## Quick Start: UI Work Without Local Supabase

Use this path for styling, component work, layout changes, and most frontend debugging. Local `/api/*` requests are proxied to the deployed app.

```bash
nvm use                 # uses .nvmrc -> Node 23.3.0
bun install
cp .env.example .env.local
```

Set the minimum local values in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WAGDIE_API_BASE_URL=https://fateofwagdie.com
SESSION_SECRET=local_dev_session_secret_at_least_32_characters_long_xxxxx
NEXT_PUBLIC_CHAIN_ID=1
```

Start the app:

```bash
bun run dev
```

Open http://localhost:3000.

### Why the proxy exists

`middleware.ts` can forward `/api/*` to `WAGDIE_API_BASE_URL`, which lets local frontend work use production-like data without provisioning Supabase, RPC keys, or migrations. The proxy normalizes upstream compression headers and preserves auth cookies for SIWE flows.

## Full Local Setup

Use full local setup when you need to test API writes, database migrations, sync jobs, seed scripts, or local-only data.

1. Install and select Node:
   ```bash
   nvm install 23.3.0
   nvm use
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy env defaults:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in relevant values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - RPC values such as `NEXT_PUBLIC_MAINNET_RPC_URL` / `MAINNET_RPC_URL`
   - optional contract address overrides
   - optional Eliza values: `ELIZA_API_URL`, `ELIZA_API_KEY`
5. Run migrations/seeds as needed. See `supabase/migrations/`, `scripts/`, and `SETUP.md` for detailed setup notes.
6. Start the app:
   ```bash
   bun run dev
   ```

## Common Commands

```bash
# Development
bun run dev
bun run build
bun run start

# Quality
bun run lint
bun run test
bun run test:watch

# Storybook
bun run storybook
bun run build-storybook

# Data/assets
bun run seed
bun run seed:quick
bun run import:gcs
bun run images:localize
bun run images:extract-metadata
bun run images:compare-metadata
bun run assets:collect
bun run searing:materialize
```

## App Routes

- `/` — landing page
- `/characters` — character browser
- `/characters/[tokenId]` — character details, editor, wallet, equipment, AI persona, and blockchain actions
- `/characters/[tokenId]/animated` — animated character view
- `/map` — world map and staking experience
- `/map-editor` — location/map editing tools
- `/searing` — searing/concord flows
- `/searing-map-editor` — concord-to-searing map tooling
- `/spread` — spread tooling
- `/lore` — lore content
- `/videos` — low-poly video gallery

## API Areas

- `app/api/auth/*` — SIWE nonce/verify/logout/me
- `app/api/characters/*` and `app/api/character/*` — character browse/detail/edit data
- `app/api/concords/*` — concord ownership, transfers, searing map data
- `app/api/locations/*` — location read/update APIs
- `app/api/sync/*` — ownership, staking, and searing sync jobs
- `app/api/eliza/*` — Eliza auth, chat, conversations, character import/export, knowledge documents
- `app/api/tweets` — tweet data

## Project Structure

```text
app/                         Next.js App Router pages and API routes
components/                  React components and Storybook stories
contexts/                    React context providers
data/                        Local/imported metadata and image data
docs/                        Architecture notes, investigations, reports
game/                        Phaser game bootstrap and scenes
hooks/                       React hooks for app, map, wallet, AI, data fetching
lib/                         API handlers, auth, contracts, domain logic, db, repos, services, utils
public/                      Static assets, images, fonts, metadata, videos
scripts/                     Import, migration, sync, wiki, and asset scripts
specs/                       Ralph/specify feature specs and contracts
supabase/migrations/         Database migrations
tests/                       Jest tests by domain/feature
types/                       Shared TypeScript types
eliza-sdk-master/            Local Eliza SDK package used by the app
```

## Architecture Notes

- **Client/server boundary**: Browser-only APIs should be guarded with `typeof window` or `window.*` access. Node `23.3.0` is the supported runtime; SSR sanitizes server-side Web Storage globals so browser-oriented libraries do not mistake Node for the browser.
- **API route reuse**: Many route handlers delegate into `lib/api/handlers`, repositories, and services instead of embedding business logic in route files.
- **Data access**: Supabase and Postgres access live behind repository/service layers where practical.
- **Transactions**: Blockchain transaction state is tracked client-side and reconciled with sync endpoints after confirmation.
- **Assets**: Character and map assets are progressively loaded with fallbacks and local image tooling.

## Testing and Verification

Before merging meaningful code changes, run the narrow tests for the touched area and, when practical:

```bash
bun run test
bun run build
```

For UI-only changes, Storybook is often the fastest visual check:

```bash
bun run storybook
```

## Deployment

The app is built for Vercel. Production/preview environments need the same env families as local full setup:

- app/session values (`NEXT_PUBLIC_APP_URL`, `SESSION_SECRET`)
- Supabase values
- RPC/contract values
- Eliza values when using AI routes
- sync secrets for protected sync jobs

## More Documentation

- `SETUP.md` — detailed setup, troubleshooting, Vercel, roadmap notes
- `ARCHITECTURE.md` — architecture overview
- `DESIGN_SYSTEM.md` — visual/system conventions
- `DOCKER-SUPABASE.md` — local Supabase/Docker notes
- `DOCKER-WIKI.md` — local Wiki.js stack
- `docs/` — audits, reports, investigations, and implementation notes
- `specs/` — feature specs/contracts

## Contributing

- Use Node `23.3.0` via `nvm use`.
- Prefer Bun commands unless a script explicitly uses npm/npx.
- Keep TypeScript strictness and existing style conventions: 2-space indentation, semicolons, single quotes, PascalCase components/types, camelCase functions/variables, kebab-case filenames.
- Add or update tests/stories for meaningful behavior changes.
- Use conventional commits (`feat:`, `fix:`, `chore:`).

## License

This project is for the WAGDIE community. See repository/license guidance before reuse or redistribution.
