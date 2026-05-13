# Troubleshooting

Common setup and runtime fixes for onboarding. If a command name has drifted, check `package.json`; it is the source of truth for scripts.

## Wrong Node Version

The project is pinned to Node `23.3.0` in `.nvmrc` and `package.json`.

```bash
nvm install 23.3.0
nvm use
node -v   # should print v23.3.0
```

Use the pinned runtime before reinstalling dependencies or debugging SSR/runtime behavior.

## Dependencies Behave Strangely

Prefer Bun and reinstall after confirming Node:

```bash
nvm use
bun install
```

If you previously installed with a different runtime or package manager, remove generated dependency artifacts only if you understand the local impact, then reinstall with Bun.

## Local API Calls Hit the Wrong Place

Check `WAGDIE_API_BASE_URL`:

- Set it to `https://fateofwagdie.com` for UI-only work that should proxy `/api/*` to the deployed app.
- Remove it when testing local API route code, database writes, migrations, seeds, or sync jobs.

Restart `bun run dev` after changing `.env.local`.

## Proxy Responses Look Like Garbled JSON

The local proxy in `middleware.ts` forces upstream `Accept-Encoding: identity` and strips response compression headers before returning proxied `/api/*` responses.

If you see errors like `Unexpected token` with compressed-looking characters, verify:

1. you restarted the dev server after env changes;
2. the request is actually going through the current `middleware.ts`;
3. no local changes reintroduced `Content-Encoding` or stale `Content-Length` headers on proxied responses.

## Missing Supabase Environment Variables

For UI-only proxy work, you should not need Supabase values locally. Make sure `WAGDIE_API_BASE_URL` is set.

For local API/database work, populate the Supabase public and server values from `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Database Shape Looks Wrong

`supabase/migrations/` is the schema source of truth. Apply migrations in filename order with your Supabase workflow and verify against the current migration files.

Do not use old setup docs that expect a fixed number of tables; that checklist is obsolete.

## API Requests Fail Locally

Check the workflow first:

1. If using the proxy, confirm `WAGDIE_API_BASE_URL` is set and the deployed app is reachable.
2. If using local APIs, confirm Supabase env values are present and the target database has current migrations.
3. Check terminal logs from `bun run dev` and browser network responses.
4. For protected writes or sync endpoints, confirm required server secrets such as `SESSION_SECRET`, `SYNC_SECRET_KEY`, RPC values, and Supabase service-role values.

## SIWE or Wallet Auth Fails

Verify:

- `NEXT_PUBLIC_APP_URL` matches the local origin, usually `http://localhost:3000`.
- `SESSION_SECRET` is set and at least 32 characters.
- The browser wallet is connected to the expected chain from `NEXT_PUBLIC_CHAIN_ID`.
- The API workflow is intentional: proxied deployed API for UI-only work, local API for auth route changes.

## Blockchain Data or Transactions Fail

For read/sync workflows, check RPC values:

```env
NEXT_PUBLIC_MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
NEXT_PUBLIC_CHAIN_ID=1
```

Contract override variables are optional; use the names documented in `.env.example` when you need them.

## Build Fails

Start with the standard local checks:

```bash
nvm use
bun install
bun run build
```

Then inspect the first build error. Common causes are missing env values for server code, browser-only code crossing into SSR, or dependencies installed under the wrong Node version.

## Still Blocked

Use the focused docs for the workflow you are on:

- [`quickstart.md`](quickstart.md) — UI-only deployed API proxy.
- [`local-development.md`](local-development.md) — local APIs, database, migrations, and seeds.
- [`environment.md`](environment.md) — env var families.
