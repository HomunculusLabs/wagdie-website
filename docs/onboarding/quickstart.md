# Quickstart

Use this path for UI work, component changes, layout debugging, and most frontend tasks. It runs the local Next.js app while proxying `/api/*` to the deployed WAGDIE app, so you do not need local Supabase, RPC keys, or migrations.

## Prerequisites

- Node `23.3.0` via `.nvmrc`.
- Bun for install and scripts.
- A browser wallet if you need to exercise SIWE or owner-gated UI.

## Start the App

```bash
nvm use                 # uses .nvmrc -> Node 23.3.0
bun install
cp .env.example .env.local
```

Set the minimum values in `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WAGDIE_API_BASE_URL=https://fateofwagdie.com
SESSION_SECRET=local_dev_session_secret_at_least_32_characters_long_xxxxx
NEXT_PUBLIC_CHAIN_ID=1
```

Run the development server:

```bash
bun run dev
```

Open http://localhost:3000.

## What the Proxy Does

When `WAGDIE_API_BASE_URL` is set, `middleware.ts` forwards local `/api/*` requests to the deployed app. This lets local frontend pages load production-like character, map, searing, lore, and Eliza data without provisioning local database infrastructure.

The proxy also normalizes upstream compression headers and preserves auth cookies for SIWE flows.

## When to Use Full Local Setup

Use [`local-development.md`](local-development.md) instead when you need to:

- test local API route behavior instead of the deployed API;
- test database writes, migrations, seeds, or sync jobs;
- work on Supabase repository/service code;
- use local-only data fixtures;
- validate server-only Eliza, RPC, or sync secrets.

## Common Checks

```bash
bun run test
bun run build
bun run storybook
```

Run the narrowest useful check for your change. `package.json` is the source of truth for the complete script inventory.

## More Onboarding Docs

- [`local-development.md`](local-development.md) — full local setup.
- [`environment.md`](environment.md) — environment variable families and workflows.
- [`troubleshooting.md`](troubleshooting.md) — setup and runtime failure fixes.
