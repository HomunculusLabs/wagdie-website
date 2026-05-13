# Local Development

Use full local development when the deployed API proxy is not enough: API route changes, database writes, migrations, seeds, sync jobs, server-side Eliza work, or anything that must run against local/dev infrastructure.

For UI-only work, prefer the faster [`quickstart.md`](quickstart.md) path.

## Prerequisites

- Node `23.3.0` selected with `nvm use`.
- Bun installed.
- Supabase project or local Supabase stack for database-backed work.
- RPC provider credentials when testing blockchain reads or sync jobs.
- Browser wallet for SIWE and ownership-gated UI.

## Install

```bash
nvm use
bun install
cp .env.example .env.local
```

Keep using Bun for project scripts unless a package script intentionally invokes another tool internally.

## Configure `.env.local`

Start from `.env.example`, then fill only the families required by your workflow. See [`environment.md`](environment.md) for a fuller map.

Minimum local app/session values:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=local_dev_session_secret_at_least_32_characters_long_xxxxx
NEXT_PUBLIC_CHAIN_ID=1
```

For local API/database work, add Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

For blockchain reads and sync jobs, add RPC values such as:

```env
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
```

Do not set `WAGDIE_API_BASE_URL` when you want to exercise local API routes; that variable intentionally proxies `/api/*` to a deployed app.

## Supabase Schema

`supabase/migrations/` is the schema source of truth. Apply the migrations in filename order using your chosen Supabase workflow, such as the Supabase CLI or dashboard SQL editor.

Do not verify setup with a hardcoded table-count checklist. The schema changes over time; verify against the current migrations and the behavior you are testing.

## Seed or Import Data

Use seed/import scripts only when your task needs local data. Common entry points include:

```bash
bun run seed:quick
bun run seed
```

Additional data, asset, lore, searing, and Eliza validation scripts live in `package.json`; use that file as the exact command inventory.

## Run Locally

```bash
bun run dev
```

Open http://localhost:3000.

## Validate Changes

Choose checks based on the touched area:

```bash
bun run test
bun run build
```

For visual component work, use Storybook:

```bash
bun run storybook
```

For data/schema/sync changes, run the specific scripts or tests for the subsystem you touched, using `package.json` for exact names.

## Related Docs

- [`environment.md`](environment.md) — env var families by workflow.
- [`troubleshooting.md`](troubleshooting.md) — common setup/runtime failures.
- `supabase/migrations/` — database schema source of truth.
- `package.json` — script source of truth.
