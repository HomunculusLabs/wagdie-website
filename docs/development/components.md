# Components

This page describes how React components are organized, named, documented, and verified. `components/README.md` remains as adjacent notes for the component directory and points back here.

## Source of truth

- Component implementation: `components/`
- App pages and route composition: `app/`
- Shared UI primitives: `components/ui/`
- Storybook config: `.storybook/main.ts` and `.storybook/preview.tsx`
- Tests: `tests/` and `jest.config.js`

## Directory ownership

Use the folder that matches the component's owner and reuse scope:

- `components/ui/`: generic primitives that are safe to reuse across features.
- `components/shared/`: app-specific reusable pieces that are not low-level primitives.
- `components/layout/`: site shell and navigation UI.
- `components/characters/`, `components/lore/`, `components/map/`, `components/spread/`, `components/searing/`, `components/wallet/`, `components/admin/`, and similar folders: feature-owned components.
- `components/*/detail`, `components/*/editor`, and nested folders: subfeature boundaries when a feature folder grows.
- `app/`: route-level pages, layouts, loading/error boundaries, and server/client composition.

When a feature component becomes broadly reusable, move it toward `components/shared/` or `components/ui/` rather than importing across unrelated feature folders.

## Naming and exports

Follow the repository conventions from `AGENTS.md`:

- `PascalCase` for component and type names.
- `camelCase` for functions, variables, and hooks.
- `kebab-case` for filenames is preferred by policy, but many existing component files are `PascalCase.tsx`; match the local folder convention when touching existing code.
- Prefer named exports for reusable components.
- Keep props interfaces explicit and close to the component when they are not shared elsewhere.
- Shared types belong in `types/` or a feature-local `types.ts` when multiple files in the same feature use them.

Example shape:

```tsx
interface CharacterBadgeProps {
  tokenId: number;
  label: string;
  onSelect?: (tokenId: number) => void;
}

export function CharacterBadge({ tokenId, label, onSelect }: CharacterBadgeProps) {
  return (
    <button type="button" onClick={() => onSelect?.(tokenId)}>
      {label}
    </button>
  );
}
```

## Data flow expectations

- Page routes in `app/` compose data loading, route params, and feature containers.
- Client components should receive typed props or call hooks that encapsulate API/client state.
- Backend data access should stay in API routes, repositories, and services under `lib/`, not in presentational components.
- Wallet and blockchain interactions should use existing hooks/components for the touched domain instead of duplicating transaction state.
- Components that depend on browser-only APIs should be client components and should guard direct `window`/DOM access when needed.

## Styling expectations

- Use Tailwind classes and design tokens from `tailwind.config.ts`.
- Prefer shared primitives from `components/ui/` for buttons, modals, loading, alerts, layout, and form controls.
- Use `font-display` for headings and `font-eskapade` for UI/body text.
- Keep responsive behavior mobile-first.
- Avoid inline styles unless the value is genuinely dynamic or required by a third-party integration.

See `docs/development/design-system.md` for token and primitive details.

## Stories

Add or update stories for reusable UI and meaningful feature states:

- Story files are discovered under `components/**/*.stories.@(js|jsx|ts|tsx)` and `src/**/*.stories.@(js|jsx|ts|tsx)` per `.storybook/main.ts`.
- Co-locate stories with the component unless a feature has an established local pattern.
- Use realistic WAGDIE-shaped mock data.
- Include important states such as default, loading, empty, error, disabled, connected/disconnected wallet, and permission-gated variants.
- Use `tags: ['autodocs']` when a component should publish generated docs.
- Use Storybook parameters or `hookMocks` for state that should not hit live APIs.

See `docs/development/storybook.md` for provider and mock details.

## Tests

Add or update Jest tests when behavior changes, especially for:

- form validation;
- permissions and owner/admin gating;
- API-backed state transitions;
- wallet/transaction state;
- map or searing logic;
- accessibility-sensitive interactions such as dialogs, keyboard navigation, and focus management.

Test files live under `tests/` and are matched by `jest.config.js` as `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` under that directory.

See `docs/development/testing.md` for command guidance.

## Component review checklist

Before opening a PR for component work:

- [ ] The component lives in the correct owner folder.
- [ ] Props are typed and named for the domain.
- [ ] The component reuses `components/ui/` or `components/shared/` where practical.
- [ ] Loading, empty, error, and disabled states are intentional.
- [ ] Keyboard and screen-reader behavior is covered for interactive UI.
- [ ] Storybook stories cover important visual states when useful.
- [ ] Narrow tests or visual checks have been run for the touched area.
