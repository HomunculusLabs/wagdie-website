# Components Directory Notes

This directory contains React components for the WAGDIE application.

For current component ownership, naming, story, and testing guidance, use [`docs/development/components.md`](../docs/development/components.md).

## Local notes

- Keep reusable primitives in `components/ui/` and app-specific reusable pieces in `components/shared/`.
- Keep route-level pages, layouts, and route boundaries in `app/` rather than this directory.
- Feature-owned components should stay near their feature folder, such as `characters/`, `map/`, `lore/`, `searing/`, `spread/`, `wallet/`, or `admin/`.
- Co-locate Storybook stories with components when a component has meaningful visual states.
- Prefer existing shared primitives before adding a new generic component.

## Adjacent references

- Storybook guidance: [`docs/development/storybook.md`](../docs/development/storybook.md)
- Design-system guidance: [`docs/development/design-system.md`](../docs/development/design-system.md)
- Testing guidance: [`docs/development/testing.md`](../docs/development/testing.md)
