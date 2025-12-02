# wagdie-simplified Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-05

## Active Technologies
- TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), RainbowKit, wagmi v2, viem v2, Tailwind CSS (002-basic-ui-wireframe)
- Browser localStorage/sessionStorage for wallet connection persistence, Supabase PostgreSQL for user sessions (existing) (002-basic-ui-wireframe)
- TypeScript 5+, Node.js 18+ + Next.js 15 (App Router), React 18, RainbowKit 2.2+, wagmi 2.0, viem 2.0, Tailwind CSS 3.4 (003-page-wireframes)
- Supabase PostgreSQL (characters, chat, tweets), Firebase Realtime Database (chat real-time sync), Browser localStorage (wallet persistence) (003-page-wireframes)
- TypeScript 5+, Node.js 18+ + Supabase JS Client, @supabase/supabase-js v2 (005-mock-data-integration)
- Supabase PostgreSQL (existing migrations applied) (005-mock-data-integration)
- TypeScript 5+, Node.js 18+ + Next.js 15 (App Router), React 18, wagmi v2, viem v2, Tailwind CSS 3.4, Supabase PostgreSQL, RainbowKit 2.2+ (006-map-integration)
- Supabase PostgreSQL (characters, locations data), Browser localStorage (wallet persistence) (006-map-integration)
- TypeScript 5+ + React 18, React-Leaflet 7+, Leaflet 1.9+, Next.js 15 (App Router), Tailwind CSS 3.4 (008-map-refactor)
- N/A (refactoring existing code, no database changes) (008-map-refactor)
- TypeScript 5+, React 18+, Node.js 18+ + @storybook/react@8.x, @storybook/react-vite, @storybook/nextjs, storybook CLI (009-storybook)
- N/A (development tool, no persistent storage) (009-storybook)
- TypeScript 5.0+ (Constitution Requirement) + Next.js 15+, React 18+, Leaflet 1.9+, React-Leaflet 7+ (from existing map refactor) (001-map-assets-import)
- Static files in public/images/ (flat structure), browser localStorage for asset caching (001-map-assets-import)
- TypeScript 5.0+ (Constitution Requirement) + Node.js 18+ + @supabase/supabase-js v2 (existing), Commander.js for CLI, Jest for testing (009-database-restore)
- TypeScript 5+, Node.js 18+ + Next.js 15, React 18, Phaser 3.90, wagmi 2.0, viem 2.0, RainbowKit 2.2 (011-phaser-contract-integration)
- Supabase PostgreSQL (existing), Ethereum mainnet (blockchain state) (011-phaser-contract-integration)
- TypeScript 5+, React 18, Node.js 18+ + Next.js 15 (App Router), wagmi v2, viem v2, Tailwind CSS 3.4, @tanstack/react-query (012-character-editor)
- Supabase PostgreSQL (`characters` table with dedicated stat columns) (012-character-editor)
- TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), React Query (@tanstack/react-query), Tailwind CSS 3.4, Supabase JS (012-character-filter)
- Supabase PostgreSQL (existing `characters` table with `metadata` JSONB) (012-character-filter)
- TypeScript 5+, Node.js 18+ + Next.js 15 (App Router), React 18, Tailwind CSS 3.4, @supabase/supabase-js v2 (015-character-stats-equipment)
- Supabase PostgreSQL (characters table with dedicated stat columns + metadata JSONB) (015-character-stats-equipment)
- TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), @eliza/sdk, wagmi v2, viem v2, RainbowKit 2.2+, Tailwind CSS 3.4, @tanstack/react-query (016-character-editor-chat)
- Supabase PostgreSQL (existing characters table), Eliza API backend (AI characters, conversations) (016-character-editor-chat)

- TypeScript 5+ (Node.js 18+ for migration scripts) + Firebase Admin SDK, Supabase JS client, ethers.js (for address normalization) (001-migration-plan)

## Project Structure

```text
src/
tests/
```

## Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- IconFactory.test.ts

# Run performance tests
npm test -- performance-tests.test.tsx

# Build project
npm run build

# Run linting
npm run lint
```

## Code Style

TypeScript 5+ (Node.js 18+ for migration scripts): Follow standard conventions

## Recent Changes
- 016-character-editor-chat: Added TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), @eliza/sdk, wagmi v2, viem v2, RainbowKit 2.2+, Tailwind CSS 3.4, @tanstack/react-query
- 015-character-stats-equipment: Added TypeScript 5+, Node.js 18+ + Next.js 15 (App Router), React 18, Tailwind CSS 3.4, @supabase/supabase-js v2
- 012-character-filter: Added TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), React Query (@tanstack/react-query), Tailwind CSS 3.4, Supabase JS

  - ✅ Modular architecture with separation of concerns
  - ✅ SimpleMap reduced from 735 to 150 lines (80% reduction)
  - ✅ React.memo, useCallback, useMemo optimization
  - ✅ IconFactory with caching (100 items, FIFO)
  - ✅ Performance monitoring utility
  - ✅ 100+ passing tests with 87.62% coverage
  - ✅ 60fps rendering with 60+ markers
  - ✅ 5.42 kB bundle size (outstanding!)
  - ✅ Component architecture documented


<!-- MANUAL ADDITIONS START -->

## Map Refactoring Architecture (v2.0.0)

The map components have been completely refactored for maintainability and performance.

### Component Structure
```
components/map/
├── SimpleMap.tsx              (150 lines, was 735 - 80% reduction)
├── MarkerComponent.tsx        (Generic marker renderer with memoization)
├── IconFactory.ts             (190 lines, caching with size management)
├── PopupRenderer.tsx          (180 lines, WAGDIE theming)
├── TooltipRenderer.tsx        (120 lines, WAGDIE theming)
├── LayerController.tsx        (140 lines, context with useCallback)
├── LayerControls.tsx          (220 lines, UI controls)
└── markers/
    ├── LocationMarker.tsx     (29 lines)
    ├── CharacterMarker.tsx    (29 lines)
    ├── BurnMarker.tsx         (29 lines)
    ├── DeathMarker.tsx        (29 lines)
    └── FightMarker.tsx        (29 lines)
```

### Performance Metrics
- **Bundle Size**: 5.42 kB (map route)
- **Test Coverage**: 87.62%
- **Markers at 60fps**: 60+ markers (exceeds 50 marker requirement)
- **Re-render Time**: < 10ms for 50 markers
- **Icon Cache**: 100% coverage on IconFactory

### Key Optimizations
1. React.memo on all major components with custom comparison
2. useCallback for all event handlers
3. useMemo for all expensive computations
4. Icon cache with FIFO eviction
5. Performance monitoring utility

### Testing
- 100+ passing tests
- Performance benchmarks for 60fps target
- Comprehensive mock utilities
- Unit tests for all components

### Documentation
- `components/map/README.md` - Full architecture documentation
- `tests/README.md` - Testing guide
- Component contracts in `specs/008-map-refactor/contracts/`

<!-- MANUAL ADDITIONS END -->

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
