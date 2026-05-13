# Design System

This page is the durable design-system guide for WAGDIE Simplified. The current source files are `tailwind.config.ts`, `app/globals.css`, and the shared UI components under `components/ui/`.

## Source of truth

- Theme tokens: `tailwind.config.ts`
- Global font faces, base styles, scrollbars, and legacy utility classes: `app/globals.css`
- Reusable primitives: `components/ui/`
- Component guidance: `docs/development/components.md`
- Storybook behavior: `docs/development/storybook.md`

If this page conflicts with a component or config file, update the doc after checking the source.

## Visual language

The app uses a dark gothic fantasy theme with sharp edges, muted surfaces, Fraktur display type, and restrained accent glows.

Prefer existing Tailwind tokens over new one-off colors. Add new tokens to `tailwind.config.ts` only when they are reusable across more than one component or feature.

## Typography

The repo defines two custom fonts in `app/globals.css` and exposes them through Tailwind in `tailwind.config.ts`:

| Tailwind class | Font | Intended use |
| --- | --- | --- |
| `font-display` / `font-wagdie` | Wagdie Fraktur | Page titles, section headings, modal headings, prominent labels |
| `font-eskapade` | Eskapade Fraktur | Body copy, labels, form fields, buttons, captions, UI text |
| `font-serif` | Georgia fallback stack | Long fallback text where a system serif is preferable |

The base `body` applies `font-eskapade`, so UI copy inherits the body font unless a component overrides it.

### Type scale

Use the semantic sizes from `tailwind.config.ts` when a component is part of the app UI:

- `text-h1`, `text-h2`, `text-h3`, `text-h4` for headings.
- `text-body`, `text-body-sm`, `text-caption`, and `text-tiny` for UI copy.
- Standard aliases such as `text-sm`, `text-base`, `text-lg`, and `text-2xl` remain available, but semantic sizes make intent clearer.

Global helper classes in `app/globals.css` are available for common cases: `.heading-1` through `.heading-4`, `.body-text`, `.body-text-sm`, `.form-label`, `.caption-text`, and `.form-input`.

## Color tokens

Custom colors live in `tailwind.config.ts`.

### Core surfaces and text

- `abyss`: deepest page background.
- `shadow`: dark section background.
- `midnight` / `midnight-light`: component surfaces, hover states, and borders.
- `bone`: primary light text.
- `ash`: secondary text.
- `mist`: tertiary or disabled text.
- `dark`: quiet/muted text.

### Accents

- `blood`: danger and destructive accents.
- `ember`: active or hover danger accent.
- `gold`: important highlights.
- `poison`: success states.
- `arcane`: informational/link accent.
- `soul.accent`, `soul.800`, `soul.900`, `soul.950`, `soul.blood`: the preferred token family for newer gothic UI primitives.

Use transparent overlays such as `white/5`, `white/10`, or token opacity modifiers for glass effects instead of creating new static colors.

## Layout and spacing

- Use Tailwind utilities and the default spacing scale for layout.
- Build mobile-first: start with the narrow layout, then add `sm:`, `md:`, `lg:`, and `xl:` variants.
- Keep mobile touch targets at least 44px square for primary interactions. The shared `Button` icon size uses `h-11 w-11` for this reason.
- Prefer semantic HTML (`button`, `nav`, `main`, `section`, `form`, `label`) over clickable `div`s.

## Shared primitives

Use `components/ui/` before introducing a new generic primitive. Current examples include:

- `Button`: `variant` values are `primary`, `secondary`, and `danger`; `size` values are `md`, `sm`, and `icon`; `isLoading` disables the button and exposes `aria-busy`.
- `Modal`: handles dialog semantics, focus trapping, Escape close, backdrop close, body scroll lock, and focus restoration.
- `Spinner`: exposes `role="status"`, `aria-label="Loading"`, and `size` values `sm`, `md`, and `lg`.
- `Typography`, `Card`, `Alert`, `Badge`, `Tabs`, `Pagination`, and related primitives cover many common app patterns.

Do not copy old global `.btn-primary` / `.btn-secondary` styles into new components. `app/globals.css` marks them as legacy; use `Button` instead.

## Interaction and state conventions

- Loading actions should use component props such as `Button`'s `isLoading` or `Spinner` for standalone loading states.
- Transaction flows should centralize state in the existing transaction hooks/components for the touched feature instead of local ad-hoc booleans.
- Form errors should be visible near the field and, when dynamic, announced via accessible text or ARIA live regions where appropriate.
- Destructive actions should use `danger` styling and clear confirmation copy.

## Accessibility baseline

All interactive UI should include:

- Keyboard access and visible focus states.
- `aria-label` or visible text for icon-only controls.
- Proper `disabled` attributes for unavailable actions.
- Labels for form controls.
- Dialogs built with the shared `Modal` or equivalent `role="dialog"`, `aria-modal`, focus management, and Escape handling.

Storybook includes the a11y addon; use the Accessibility panel during component review.

## Adding or changing design tokens

1. Check whether an existing Tailwind token or UI primitive already covers the need.
2. If a reusable token is needed, add it to `tailwind.config.ts`.
3. If global CSS is needed, keep it small and document why it cannot be a component utility.
4. Add or update component stories when a visual state is meaningful to reviewers.
5. Run the narrow verification for the touched area; see `docs/development/testing.md`.
