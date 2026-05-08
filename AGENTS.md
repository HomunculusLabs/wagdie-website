# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js application for the WAGDIE project with Phaser game integration.

- `app/`: Next.js app router pages and layouts
- `components/`: React components
- `lib/`: Utility functions and shared logic
- `specs/`: Ralph v2 spec files (one topic per concern)
- `.storybook/`: Storybook configuration

## Build, Test, and Development Commands

> **Before you start:** read the Quick Start in `SETUP.md`. **Use Node 20** — Node 22+ breaks SSR (built-in `localStorage` global). For UI-only work, set `WAGDIE_API_BASE_URL=https://fateofwagdie.com` in `.env.local` and skip Supabase entirely; `middleware.ts` proxies `/api/*` to the deployed instance.

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run tests
bun run test              # All tests
bun run test:watch        # Watch mode

# Lint
bun run lint

# Storybook
bun run storybook         # Dev server on port 6006
bun run build-storybook   # Build static storybook

# Database
bun run seed              # Full database seed
bun run seed:quick        # Quick seed
```

## Coding Style & Naming Conventions

- Language: TypeScript, React 18, Next.js 15
- 2-space indentation, semicolons, single quotes
- `PascalCase` for components/types, `camelCase` for functions/variables
- `kebab-case` for filenames

## Testing Guidelines

- Framework: Jest
- Test files: `*.test.ts` or `*.test.tsx`
- Run all tests before committing

## Commit & Pull Request Guidelines

- Commits: imperative mood, conventional commits (`feat:`, `fix:`, `chore:`)
- PRs: clear description, screenshots for UI changes
