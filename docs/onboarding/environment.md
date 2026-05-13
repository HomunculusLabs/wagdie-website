# Environment Variables

Use `.env.example` as the maintained template and `.env.local` for untracked local values. This page groups the important variable families by workflow; it does not replace `.env.example`.

## UI-Only Proxy Workflow

Use these values with [`quickstart.md`](quickstart.md):

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
WAGDIE_API_BASE_URL=https://fateofwagdie.com
SESSION_SECRET=local_dev_session_secret_at_least_32_characters_long_xxxxx
NEXT_PUBLIC_CHAIN_ID=1
```

`WAGDIE_API_BASE_URL` makes local `/api/*` calls use the deployed app. Remove it when you need local API routes.

## App and Session

- `NEXT_PUBLIC_APP_URL` — base URL used for local metadata, links, and auth flows.
- `SESSION_SECRET` — iron-session password; use a long local value and a real secret in shared environments.
- `NODE_ENV` — usually supplied by the runtime; keep local development as `development`.

## Supabase

Browser/public values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server/script values:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_KEY` — optional legacy name for scripts that still read it.

Schema truth lives in `supabase/migrations/`. Do not use old table-count checklists to decide whether the database is current.

## Blockchain and Contracts

Common RPC values:

- `NEXT_PUBLIC_ALCHEMY_API_KEY`
- `NEXT_PUBLIC_ALCHEMY_RPC_URL`
- `NEXT_PUBLIC_MAINNET_RPC_URL`
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`
- `MAINNET_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`

Optional contract overrides follow the pattern in `.env.example`, with `NEXT_PUBLIC_*` names for client-safe values and server-only names for private/server workflows.

## Sync Jobs

- `SYNC_SECRET_KEY` — shared secret for protected sync endpoints/jobs.
- RPC and Supabase server values are usually also required for sync work.

Use the operations docs for detailed sync runbooks once they are rewritten; use `package.json` for exact script names.

## Eliza and AI

Legacy/custom gateway values:

- `ELIZA_API_URL`
- `NEXT_PUBLIC_ELIZA_API_URL`
- `ELIZA_API_KEY`
- `ELIZA_LLM_BASE_URL`
- `ELIZA_LLM_API_KEY`
- `ELIZA_LLM_MODEL`

Official ElizaOS migration/control values:

- `ELIZA_INTEGRATION_MODE`
- `ELIZAOS_BASE_URL`
- `ELIZAOS_API_KEY`
- `ELIZAOS_HEALTH_PATH`

Service-side ElizaOS secrets such as provider keys and server auth tokens should stay server-only and must not use `NEXT_PUBLIC_*` names.

## External Links and Feature Flags

Common public values include:

- `NEXT_PUBLIC_DISCORD_URL`
- `NEXT_PUBLIC_OPENSEA_URL`
- `NEXT_PUBLIC_TWITTER_URL`
- `NEXT_PUBLIC_SHOW_LORE_NAV`

## Deployment and Shared Environments

Shared environments need the same families as full local development, adjusted for the target environment:

- app/session values;
- Supabase values;
- RPC/contract values;
- Eliza values when AI routes are enabled;
- sync secrets for protected jobs;
- public external links and feature flags.

Never commit real secrets. Keep `.env.local` local and use the deployment platform's secret store for preview/production.
