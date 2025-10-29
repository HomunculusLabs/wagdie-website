# wagdie-simplified Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-28

## Active Technologies
- TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), RainbowKit, wagmi v2, viem v2, Tailwind CSS (002-basic-ui-wireframe)
- Browser localStorage/sessionStorage for wallet connection persistence, Supabase PostgreSQL for user sessions (existing) (002-basic-ui-wireframe)
- TypeScript 5+, Node.js 18+ + Next.js 15 (App Router), React 18, RainbowKit 2.2+, wagmi 2.0, viem 2.0, Tailwind CSS 3.4 (003-page-wireframes)
- Supabase PostgreSQL (characters, chat, tweets), Firebase Realtime Database (chat real-time sync), Browser localStorage (wallet persistence) (003-page-wireframes)

- TypeScript 5+ (Node.js 18+ for migration scripts) + Firebase Admin SDK, Supabase JS client, ethers.js (for address normalization) (001-migration-plan)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5+ (Node.js 18+ for migration scripts): Follow standard conventions

## Recent Changes
- 003-page-wireframes: **COMPLETED 2025-10-28** - Full UI wireframe implementation with 6 major pages (Home, Characters Browse/Detail, Lore, Spread), navigation system, authentication (SIWE), and blockchain integration placeholders. Chat feature intentionally skipped to avoid Firebase dependency. See IMPLEMENTATION_NOTES.md for details.
- 002-basic-ui-wireframe: Added TypeScript 5+, React 18+, Node.js 18+ + Next.js 15 (App Router), RainbowKit, wagmi v2, viem v2, Tailwind CSS
- 001-migration-plan: Added TypeScript 5+ (Node.js 18+ for migration scripts) + Firebase Admin SDK, Supabase JS client, ethers.js (for address normalization)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
