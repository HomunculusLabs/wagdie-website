# Testing and Verification

Use this guide to choose the right verification path for development work. The exact command inventory lives in `package.json` `scripts`; examples here are intentionally minimal and Bun-first.

## Source of truth

- Test runner config: `jest.config.js`
- Test environment setup and global mocks: `jest.setup.js`
- Test files: `tests/`
- Storybook config: `.storybook/main.ts` and `.storybook/preview.tsx`
- Package scripts: `package.json`

## Runtime and runner

Use Node `23.3.0` and Bun package scripts:

```bash
nvm use
bun install
```

## Jest

Run Jest when TypeScript behavior, hooks, routes, services, repositories, or component interactions change:

```bash
bun run test
bun run test:watch
```

`jest.config.js` uses `next/jest`, `jest-environment-jsdom`, `jest.setup.js`, and the `@/` module alias. It matches tests under `tests/**/*.{test,spec}.{ts,tsx}` and ignores `.next/`, `node_modules/`, and `tests/TODO-*`.

`jest.setup.js` installs `@testing-library/jest-dom` and provides global mocks for Next navigation, wagmi, and legacy map libraries when those modules are present.

## Narrow test selection

For fast iteration, run the package script with Jest arguments instead of adding new scripts:

```bash
bun run test -- tests/api/eliza/chat.test.ts
bun run test -- tests/components/characters/CoreStatsEditor.test.tsx
bun run test -- --runInBand tests/services/searing-materialization-service.test.ts
```

Use narrow tests while developing, then run the broader relevant suite before handing off meaningful changes.

## Storybook verification

Run Storybook for visual and interactive component checks:

```bash
bun run storybook
bun run build-storybook
```

Use Storybook when changes primarily affect:

- component styling;
- responsive layout;
- loading/empty/error states;
- wallet-connected and disconnected presentations;
- dialog, form, or accessibility behavior.

The Storybook build is a useful static verification step when adding stories or changing Storybook mocks/config.

## Build verification

Run the Next build when a change affects app routing, server/client boundaries, API route imports, configuration, or deployment-sensitive code:

```bash
bun run build
```

Note: `next.config.js` currently ignores TypeScript and ESLint build errors. Do not treat that as permission to skip narrow tests or type-aware review for touched code.

## Linting

Use the package script when linting is relevant to the touched area:

```bash
bun run lint
```

The command is defined in `package.json`; update docs only after checking that source.

## Operational validation scripts

Some subsystems have package scripts for repeatable validation. Keep exact names in `package.json` and run the narrow one that matches the change:

- Data and assets: seed, image import/localization/metadata comparison, asset collection, searing materialization, and lore seed/parity scripts.
- ElizaOS: smoke, post-restart smoke, database migration validation, and WAGDIE route parity validation.
- Sync route behavior: API route tests under `tests/api/` and service tests under `tests/services/`.

See `docs/operations/data-sync-and-assets.md` and `docs/operations/elizaos-validation.md` for runbook context.

## What to run by change type

| Change type | Suggested verification |
| --- | --- |
| Pure docs | Link/path review; no code test required unless commands or config claims changed. |
| UI component styling | Storybook dev check; narrow component tests if behavior changed; Storybook build for story/config changes. |
| Component behavior | Narrow Jest tests for the component/hook plus Storybook for visual states. |
| API route or service | Narrow API/service Jest tests; build if imports or route boundaries changed. |
| Supabase schema/data access | Migration review against `supabase/migrations/`; relevant repository/service tests; avoid hardcoded schema claims in docs. |
| Blockchain transaction flow | Hook/component tests for state transitions; manual wallet/devnet check when needed. |
| Map/Phaser bridge | Relevant map tests and manual `/map` check; build for dynamic import/client boundary changes. |
| Eliza integration | Relevant `tests/api/eliza/*` tests; use the ElizaOS runbook for live validation. |
| Deployment/config | Build, env review against `.env.example`, and deployment doc review. |

## Writing tests

- Put tests under `tests/` in the domain folder that matches the source under test.
- Prefer behavior-focused assertions over snapshots for business logic.
- Mock external services at the boundary; do not require production credentials for ordinary Jest runs.
- Use realistic WAGDIE-shaped data where it helps prevent regressions.
- Keep mutation and live-service validation in explicit runbooks, not default test runs.
