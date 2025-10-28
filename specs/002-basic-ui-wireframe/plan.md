# Implementation Plan: Basic UI Wireframe and Components

**Branch**: `002-basic-ui-wireframe` | **Date**: 2025-10-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-basic-ui-wireframe/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements the foundational UI components and wireframe for the WAGDIE simplified platform, including wallet connection with multi-provider support, responsive navigation with header and footer, and a gothic dark theme. The implementation will use RainbowKit for wallet integration, Next.js App Router for routing and layouts, and Tailwind CSS with custom theming for the dark fantasy aesthetic. This provides the essential user interface foundation required for all subsequent features.

## Technical Context

**Language/Version**: TypeScript 5+, React 18+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), RainbowKit, wagmi v2, viem v2, Tailwind CSS
**Storage**: Browser localStorage/sessionStorage for wallet connection persistence, Supabase PostgreSQL for user sessions (existing)
**Testing**: NEEDS CLARIFICATION - Jest with React Testing Library for component tests, Playwright for E2E tests
**Target Platform**: Modern web browsers (Chrome 90+, Safari 14+, Firefox 88+, Edge 90+), mobile web browsers (iOS Safari, Chrome Mobile)
**Project Type**: Web application (Next.js frontend with API routes)
**Performance Goals**: <100ms UI response time for interactions, <3s initial page load, <1s navigation between pages, wallet connection in <10s
**Constraints**: Must work on devices 320px-2560px width, touch targets minimum 44x44px, must support Ethereum Mainnet only, read-only mode without wallet required
**Scale/Scope**: 1,000 concurrent users, ~10-15 React components for this feature, 4 main navigation sections, support 4 wallet providers (MetaMask, WalletConnect, Rainbow, Coinbase Wallet)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Simplicity First ✅ PASS
- **Uses managed services**: RainbowKit abstracts wallet complexity, Tailwind for styling (no custom CSS build)
- **No Docker/containers**: Pure Next.js deployment to Vercel
- **Direct patterns**: React hooks and components, no complex state management libraries
- **Assessment**: Aligns with simplicity principle - RainbowKit is specifically chosen to avoid custom wallet integration complexity

### II. Community Accessibility ✅ PASS
- **Standard patterns**: React components with TypeScript, standard Next.js App Router conventions
- **Clear structure**: UI components separated from business logic
- **Documentation plan**: Component docs, theme guide, wallet integration guide required in success criteria
- **Assessment**: Target components are straightforward React - accessible to developers with moderate React/TypeScript skills

### III. Clean Architecture ✅ PASS
- **UI Layer**: Components in `components/` (Header, Footer, WalletButton, etc.)
- **Service Layer**: Wallet connection logic abstracted through wagmi hooks
- **Auth Layer**: Integration with existing SIWE endpoints (`/api/auth/*`)
- **No violations**: UI components will call hooks, hooks call services, no direct database access from UI
- **Assessment**: Architecture plan maintains clean separation - components are presentational, wallet logic in hooks/services

### IV. Type Safety & Contract Clarity ✅ PASS
- **TypeScript 5+**: All components will have explicit prop interfaces
- **Wagmi/Viem**: Fully typed Web3 libraries
- **No `any` types**: RainbowKit and wagmi provide complete type definitions
- **Assessment**: Modern Web3 stack is fully typed - no type safety concerns

### V. Test-Driven for Critical Paths ⚠️ NEEDS CLARIFICATION
- **Critical path identified**: Wallet connection flow is authentication-critical
- **Testing approach**: Marked as NEEDS CLARIFICATION in Technical Context
- **Required**: Integration tests for wallet connection, session persistence
- **Assessment**: CLARIFICATION NEEDED - confirm Jest + React Testing Library + Playwright approach

### VI. Documentation as Code ✅ PASS
- **Success criteria includes**: Component documentation, theme guide, wallet integration guide, responsive design guidelines
- **Inline comments**: Required for Web3 interactions (constitution VII)
- **Assessment**: Documentation deliverables explicitly defined in spec

### VII. Web3 Pragmatism ✅ PASS
- **Smooth wallet connection**: RainbowKit provides polished UX with clear error messages
- **Major wallet support**: MetaMask, WalletConnect, Rainbow, Coinbase Wallet
- **Error handling**: FR-012 requires graceful error handling with user-friendly messages
- **Loading states**: FR-011 requires loading states during connection
- **Read-only mode**: Constraint explicitly requires browsing without wallet connection
- **Assessment**: Design prioritizes UX - RainbowKit chosen specifically for superior wallet connection experience

### Summary
**Status**: ✅ CONDITIONALLY PASS - 6/7 checks pass, 1 needs clarification (Testing approach)
**Violations**: None
**Clarifications needed**: Testing framework confirmation (low risk - standard choices listed)
**Action**: Proceed to Phase 0 research to resolve testing clarification

---

## Constitution Check - POST DESIGN RE-EVALUATION

*Re-evaluated after Phase 1 design artifacts completed (research, data-model, contracts, quickstart)*

### I. Simplicity First ✅ PASS (Confirmed)
- **Design validates**: RainbowKit significantly reduces code complexity vs custom wallet integration
- **No new infrastructure**: Pure client-side state, leverages existing SIWE backend
- **Standard patterns**: React hooks, component composition, no custom abstractions
- **Assessment**: Design maintains simplicity - ~10-15 components with clear responsibilities

### II. Community Accessibility ✅ PASS (Confirmed)
- **Documentation delivered**: Quickstart guide provides step-by-step implementation with code examples
- **Type contracts defined**: `contracts/component-interfaces.ts` provides clear API definitions
- **Standard React patterns**: Hooks + components pattern is widely understood
- **Assessment**: Mid-level React developers can implement this feature following quickstart

### III. Clean Architecture ✅ PASS (Confirmed)
- **Layers defined in data-model.md**:
  - UI: `components/layout/*`, `components/wallet/*`
  - Service: `hooks/useWalletAuth.ts`, wagmi hooks
  - Data: Existing SIWE API routes, wagmi/localStorage
- **No violations**: Components are presentational, hooks manage business logic, no direct DB access
- **Assessment**: Design adheres to clean architecture - proper separation maintained

### IV. Type Safety & Contract Clarity ✅ PASS (Confirmed)
- **Complete type definitions**: 30+ interfaces in `component-interfaces.ts`
- **No any types**: All contracts use explicit types with template literals for addresses
- **Validation rules**: Address regex, chain ID validation documented in data-model.md
- **Assessment**: TypeScript contracts are comprehensive and strict

### V. Test-Driven for Critical Paths ✅ PASS (Resolved)
- **Testing approach confirmed in research.md**:
  - Jest + React Testing Library for component tests
  - Playwright for E2E wallet connection flows
- **Critical paths identified**:
  - Wallet connection + SIWE flow (E2E test required)
  - Session persistence across refresh (integration test)
  - Component rendering with mocked wallet state (unit tests)
- **Assessment**: Testing strategy aligns with constitution - critical paths covered, E2E for wallet flow

### VI. Documentation as Code ✅ PASS (Confirmed)
- **Deliverables complete**:
  - `quickstart.md`: Developer onboarding with step-by-step guide
  - `contracts/README.md`: API contract documentation
  - `research.md`: Technology decisions and rationale
  - `data-model.md`: State structure and validation rules
- **Assessment**: Comprehensive documentation exceeds requirements

### VII. Web3 Pragmatism ✅ PASS (Confirmed)
- **UX prioritized**: RainbowKit provides polished wallet modal, error messages, loading states
- **Error handling**: 8+ error scenarios documented with user-friendly messages in data-model.md
- **Read-only mode**: Design explicitly supports browsing without wallet (constraint in spec)
- **Network validation**: Chain ID validation with switch prompts for wrong network
- **Assessment**: Design prioritizes practical UX over ideological purity

### Final Assessment
**Status**: ✅ FULL PASS - All 7 constitution principles satisfied
**Violations**: None
**Clarifications**: All resolved (testing framework confirmed in research.md)
**Complexity justifications**: None needed - design aligns with all principles
**Ready for implementation**: Yes - proceed to Phase 2 (/speckit.tasks)

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
wagdie-simplified/
├── app/                          # Next.js 15 App Router
│   ├── layout.tsx               # Root layout (UPDATE: add wallet providers, theme)
│   ├── page.tsx                 # Homepage (existing)
│   ├── characters/              # Character routes (future)
│   ├── lore/                    # Lore routes (future)
│   └── gather/                  # Gather/chat routes (future)
│
├── components/                   # React components (NEW)
│   ├── layout/                  # Layout components
│   │   ├── Header.tsx          # Navigation header with wallet button
│   │   ├── Footer.tsx          # Footer with external links
│   │   └── Navigation.tsx      # Main navigation links component
│   ├── wallet/                  # Wallet-related components
│   │   ├── WalletButton.tsx    # Connect wallet button (wraps RainbowKit)
│   │   └── UserDropdown.tsx    # Profile dropdown when connected
│   └── ui/                      # Reusable UI primitives (future)
│
├── lib/                         # Core business logic and utilities
│   ├── auth/                    # Authentication (existing SIWE)
│   ├── services/                # Business logic services (future)
│   ├── supabase.ts             # Database client (existing)
│   ├── database.types.ts       # Generated DB types (existing)
│   └── wagmi.ts                # wagmi/RainbowKit configuration (NEW)
│
├── hooks/                       # Custom React hooks (NEW)
│   └── useWalletAuth.ts        # Hook for wallet + SIWE integration
│
├── types/                       # Shared TypeScript types
│   └── wallet.ts               # Wallet-related types (NEW)
│
├── styles/                      # Global styles
│   └── globals.css             # Tailwind imports + custom theme (UPDATE)
│
├── public/                      # Static assets
│   └── fonts/                  # Gothic/fantasy fonts (NEW)
│
└── __tests__/                   # Tests (NEW for this feature)
    ├── components/              # Component tests
    │   ├── Header.test.tsx
    │   └── WalletButton.test.tsx
    └── e2e/                     # End-to-end tests
        └── wallet-connection.spec.ts
```

**Structure Decision**: Next.js App Router monorepo structure with clean layer separation. This feature adds:
- **UI Layer**: `components/layout/*` and `components/wallet/*` for presentational components
- **Configuration Layer**: `lib/wagmi.ts` for RainbowKit/wagmi setup
- **Integration Layer**: `hooks/useWalletAuth.ts` to bridge wagmi (wallet) with SIWE (backend auth)
- **Root Layout**: `app/layout.tsx` updated to wrap app with wallet providers and theme
- **Styling**: `styles/globals.css` extended with gothic dark theme colors

No backend changes required - leverages existing SIWE API routes (`/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`).

## Complexity Tracking

No violations - this section is not applicable. Constitution Check shows 6/7 passes with only 1 minor clarification needed (testing framework confirmation).
