# WAGDIE Simplified

Community-maintainable WAGDIE web app built with Next.js. The app brings the WAGDIE collection, lore, map, staking/searing flows, wallet auth, and AI persona tools into one TypeScript codebase.

## Fastest Start

Use this path for UI work, component changes, layout debugging, and other frontend tasks that do not require local database writes.

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

Then start the app:

```bash
bun run dev
```

Open http://localhost:3000. With `WAGDIE_API_BASE_URL` set, `middleware.ts` proxies local `/api/*` requests to the deployed app so most frontend work does not need local Supabase, RPC keys, or migrations.

See [`docs/onboarding/quickstart.md`](docs/onboarding/quickstart.md) for details and when to use full local setup instead.

## What This App Includes

- Character browsing, details, traits, ownership, equipment, story editing, and animated views.
- SIWE wallet authentication with owner/admin-gated UI.
- Phaser-backed world map, staking, location metadata, and transaction flows.
- Searing, infection, cure, concord, and related map/editor flows.
- Eliza AI persona, chat, import/export, conversations, and knowledge tooling.
- Lore, spread, video, asset import/sync, Storybook, and Jest coverage.

## Runtime and Command Policy

- Use Node `23.3.0`; it is pinned in `.nvmrc` and `package.json`.
- Prefer Bun commands (`bun install`, `bun run ...`).
- Keep command examples minimal here; `package.json` is the source of truth for the full script inventory.

Common commands:

```bash
bun run dev
bun run test
bun run build
bun run storybook
```

## Documentation Map

`docs/` is the canonical home for durable documentation.

- [`docs/README.md`](docs/README.md) — documentation index, lifecycle policy, and source-of-truth rules.
- [`docs/onboarding/quickstart.md`](docs/onboarding/quickstart.md) — fastest UI-only setup using the deployed API proxy.
- [`docs/onboarding/local-development.md`](docs/onboarding/local-development.md) — full local setup for API writes, migrations, seeds, and sync jobs.
- [`docs/onboarding/environment.md`](docs/onboarding/environment.md) — environment variable families by workflow.
- [`docs/onboarding/troubleshooting.md`](docs/onboarding/troubleshooting.md) — common setup/runtime failures.
Other architecture, development, operations, and reference docs remain under their area owners as they are rewritten.

Compatibility pointers remain at old top-level entry points such as [`SETUP.md`](SETUP.md), `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and `STORYBOOK-QUICKSTART.md` as those areas are rewritten.

## Contributing

- Run `nvm use` before installing or running scripts.
- Prefer Bun unless a package script intentionally invokes another tool.
- Keep TypeScript, React, and docs changes close to the existing style: 2-space indentation, semicolons, single quotes, PascalCase components/types, camelCase functions/variables, and kebab-case filenames.
- Add or update focused tests/stories for meaningful behavior changes.
- Use conventional commits (`feat:`, `fix:`, `chore:`).
