# Storybook

Storybook is the preferred isolated UI workbench for reusable components and feature states. This guide is grounded in `.storybook/main.ts` and `.storybook/preview.tsx`.

## Source of truth

- Storybook framework, story globs, addons, aliases, and Vite overrides: `.storybook/main.ts`
- Global decorators, providers, MSW, backgrounds, and toolbar globals: `.storybook/preview.tsx`
- Mocks: `.storybook/mocks/` and `.storybook/mock-providers.tsx`
- Commands: `package.json` `scripts`

Do not hardcode story counts in docs. Story counts change as files are added or removed.

## Commands

Use Bun to run package scripts:

```bash
bun run storybook
bun run build-storybook
```

`bun run storybook` starts Storybook on port 6006 because `package.json` maps it to `storybook dev -p 6006`. If you need another port, pass Storybook arguments through the package script:

```bash
bun run storybook -- --port 6008
```

## Framework and addons

`.storybook/main.ts` configures Storybook with:

- `@storybook/react-vite` as the framework.
- `@storybook/addon-essentials` for controls, actions, docs helpers, and common panels.
- `@storybook/addon-docs` for docs pages.
- `@storybook/addon-interactions` for interaction tooling.
- `@storybook/addon-a11y` for accessibility checks.
- `docs.autodocs = 'tag'`, so generated docs are opt-in via `tags: ['autodocs']` on story metadata.

## Story discovery

Stories are discovered from these globs in `.storybook/main.ts`:

```text
../components/**/*.stories.@(js|jsx|ts|tsx)
../src/**/*.stories.@(js|jsx|ts|tsx)
```

The repo primarily colocates stories beside components under `components/`.

## Aliases and mocks

Storybook's Vite config provides the app `@` alias and replaces browser/Next/blockchain-sensitive imports with local mocks where needed.

Current aliases include:

- `@` → repository root.
- `next/link`, `next/image`, `next/navigation`, and `next/dynamic` → `.storybook/mocks/next/*`.
- selected feature hooks such as `useSearing`, `useSpread`, `useCure`, `useCorpseBurning`, `useTokenBalances`, `useStaking`, and `useAICharacter` → `.storybook/mocks/hooks/*`.
- `eventemitter3` → `.storybook/mocks/eventemitter3` for wagmi-related ESM/CJS compatibility.

The config also defines `process.env` as an empty object, includes selected dependencies in Vite optimization, targets `es2020`, and forces `eventemitter3` to be bundled for SSR compatibility.

## Global providers

`.storybook/preview.tsx` wraps every story in the `withProviders` decorator:

1. `HookMocksProvider` for per-story hook overrides via `parameters.hookMocks`.
2. `WagmiProvider` with a Storybook-only config for mainnet and sepolia.
3. `QueryClientProvider` with retries disabled and `gcTime: 0` for cleaner isolated stories.
4. Mock auth, token-balance, staking-status, and character-ownership providers.
5. A padded wrapper around the story.

The preview imports `app/globals.css`, so stories should render with the same global fonts and Tailwind layers as the app.

## MSW

`.storybook/preview.tsx` starts an MSW browser worker with handlers from `.storybook/mocks/handlers`. Unhandled requests are bypassed.

Use MSW handlers for network-shaped component states. Do not point stories at production services unless a story is explicitly designed for manual integration debugging and clearly documented as such.

## Toolbar globals and backgrounds

The preview defines a `mockState` toolbar with these values:

- `connected` (default)
- `disconnected`
- `error`
- `loading`

Use `context.globals.mockState` or story parameters to make wallet/auth-sensitive stories react to this toolbar state.

The default background is `dark` (`#1a1a1a`), with a `light` (`#ffffff`) option.

## Writing a story

Use Component Story Format with typed metadata:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ExamplePanel } from './ExamplePanel';

const meta: Meta<typeof ExamplePanel> = {
  title: 'Components/Example/ExamplePanel',
  component: ExamplePanel,
  tags: ['autodocs'],
  args: {
    title: 'The Ashen Gate',
  },
};

export default meta;
type Story = StoryObj<typeof ExamplePanel>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    items: [],
  },
};
```

For stateful hooks, prefer `parameters.hookMocks` or an existing mock provider over bespoke global state.

## What to cover

For reusable and review-critical components, include stories for:

- default rendering;
- loading, empty, and error states;
- disabled or permission-gated states;
- wallet connected/disconnected states when relevant;
- long labels, missing images, or other WAGDIE-specific edge cases;
- destructive or confirmation flows.

Keep stories focused. A story should demonstrate one meaningful state or variation.

## Accessibility checks

The a11y addon is installed. For component changes that affect interaction, inspect the Accessibility panel and keyboard behavior in Storybook. Pay particular attention to dialogs, focus traps, form labels, icon-only buttons, color contrast, and disabled states.

## Troubleshooting

- If imports fail, check `.storybook/main.ts` aliases first.
- If a component tries to call a live browser or Next API, add or extend a Storybook mock rather than adding production-only guards to the component.
- If hooks need alternate return values, use `HookMocksProvider` and story `parameters.hookMocks`.
- If wallet or query state behaves unexpectedly, remember every story is already wrapped in Wagmi and React Query providers from `.storybook/preview.tsx`.
- If a story renders with unexpected spacing, the global decorator adds a `1rem` padded wrapper.
