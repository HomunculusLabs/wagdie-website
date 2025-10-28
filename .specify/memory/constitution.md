<!--
Sync Impact Report:
Version Change: N/A (Initial version) → 1.0.0
Modified Principles: N/A (new constitution)
Added Sections: All core principles (7), Architecture Standards, Development Workflow, Governance
Removed Sections: N/A (new constitution)
Templates Status:
  ✅ plan-template.md - Reviewed, "Constitution Check" section aligns with principles
  ✅ spec-template.md - Reviewed, user story and requirements structure supports accessibility principle
  ✅ tasks-template.md - Reviewed, task organization supports clean architecture and testing principles
  ✅ Slash commands in .claude/commands/ - Reviewed, no agent-specific references found
Follow-up TODOs: None - all placeholders filled
-->

# WAGDIE Simplified Web3 Platform Constitution

## Core Principles

### I. Simplicity First

The project exists to make WAGDIE accessible to the community by removing unnecessary complexity. Every technical decision MUST be evaluated against this principle:

- NO Docker containers, NO complex infrastructure, NO GraphQL code generation
- Direct database queries over abstraction layers (unless abstraction provides clear community value)
- Managed services (Supabase, Vercel) over self-hosted infrastructure
- If a feature requires extensive documentation to understand, it violates this principle

**Rationale**: The original WAGDIE platform became unmaintainable because technical complexity created a barrier to community contribution. Simplicity is not negotiable—it is the project's primary success criterion.

### II. Community Accessibility

All code, architecture, and tooling MUST be approachable for developers with moderate technical skills:

- Clear, commented code with explanatory README files at every level
- Standard patterns over clever abstractions
- Prefer explicit over implicit (clear data flow, no magic)
- Architecture decisions MUST be documented with "why" not just "what"
- Feature additions require a "community maintainability review" before merging

**Rationale**: This is a community-managed project. If only senior engineers can modify core systems, we have failed. Target audience: developers with React/TypeScript knowledge but not necessarily deep full-stack or web3 expertise.

### III. Clean Architecture (Mandatory)

Code MUST be organized in clear, logical layers with unidirectional dependencies:

- **UI Layer** (`components/`, `app/pages/`): Presentation only, no business logic
- **Service Layer** (`lib/services/`): Business logic, orchestration, reusable operations
- **Data Layer** (`lib/supabase.ts`, `lib/database.types.ts`): Database access, type definitions
- **Auth Layer** (`lib/auth/`): Authentication, session management, wallet integration

**Rules**:
- UI components MUST NOT directly access database or authentication
- Services MUST be pure functions or classes with clear inputs/outputs
- Data access MUST go through typed interfaces (Supabase client or defined APIs)
- Cross-layer imports only go downward (UI → Services → Data, never reverse)

**Rationale**: Clean architecture enables contributors to understand where code belongs, prevents tangled dependencies, and makes testing/modification safer.

### IV. Type Safety & Contract Clarity

TypeScript MUST be used strictly; all public interfaces MUST have explicit types:

- NO `any` types except in documented edge cases with justification comments
- Database schemas generate TypeScript types (via Supabase type generation)
- API boundaries (frontend ↔ backend) require explicit type contracts
- Component props MUST have TypeScript interfaces
- Shared types live in `/types` or service-specific type files

**Rationale**: Type safety catches errors before runtime, serves as living documentation, and makes refactoring safer for community contributors.

### V. Test-Driven for Critical Paths (Pragmatic)

Tests are REQUIRED for:
- Authentication flows (wallet connection, session management, logout)
- NFT data fetching and state management
- Database schema migrations
- API endpoints with business logic

Tests are OPTIONAL (but encouraged) for:
- UI components with simple prop rendering
- Utility functions with trivial logic
- Styling and layout code

**Testing approach**:
- Integration tests preferred over unit tests (test real flows, not mocks)
- Use Supabase local dev environment for database tests
- Playwright or Cypress for critical user flows
- Tests MUST pass before PR approval

**Rationale**: Full TDD creates friction in a volunteer project, but critical paths (auth, data integrity) MUST be protected to prevent community members from breaking core functionality.

### VI. Documentation as Code

Every feature MUST include:
- README in the relevant directory explaining purpose and usage
- Inline comments for non-obvious logic (especially web3 interactions)
- Database schema documentation (inline comments in migration files)
- Architecture Decision Records (ADRs) for significant technical choices

**Documentation standards**:
- Start each function/component file with a comment explaining its purpose
- Complex algorithms or web3 interactions require step-by-step comments
- README files MUST have "Getting Started" and "How it Works" sections
- ADRs follow format: Context, Decision, Consequences

**Rationale**: Code without context is a black box. Documentation lowers the bar for community contributions and prevents knowledge silos.

### VII. Web3 Pragmatism

Web3 integrations MUST balance decentralization ideals with practical user experience:

- Wallet connection MUST be smooth (clear error messages, support major wallets)
- Gas-free operations where possible (use Supabase for non-critical state)
- Blockchain calls MUST have loading states and error handling
- Store metadata on-chain, application state off-chain (Supabase)
- Support read-only mode (users can browse without connecting wallet)

**Rationale**: Crypto UX is already challenging. We must not compound it with poor implementation. Every web3 interaction should feel necessary, not like unnecessary friction.

## Architecture Standards

### Monorepo Structure

This project uses a monorepo with clear separation:

```
wagdie-simplified/
├── app/                 # Next.js App Router (UI + API routes)
├── components/          # React components (organized by feature)
├── lib/                # Core business logic and utilities
│   ├── auth/           # Authentication (SIWE)
│   ├── services/       # Business logic services
│   ├── supabase.ts     # Database client
│   └── database.types.ts # Generated DB types
├── hooks/              # Custom React hooks
├── types/              # Shared TypeScript types
├── supabase/           # Database migrations
└── public/             # Static assets
```

### Technology Constraints

**Required Stack** (deviations require constitution amendment):
- **Frontend**: Next.js 15+ (App Router), React 18+, TypeScript 5+
- **Styling**: Tailwind CSS (utility-first, easy for contributors)
- **Database**: Supabase (PostgreSQL with auto-generated REST API)
- **Auth**: SIWE (Sign-In with Ethereum) via wagmi/viem
- **Deployment**: Vercel (zero-config, preview deployments per PR)

**Forbidden Dependencies**:
- NO Docker or containerization (goes against Simplicity First)
- NO GraphQL (added complexity without clear community value)
- NO ORMs beyond Supabase client (direct SQL preferred for transparency)
- NO state management libraries unless justified (React state + hooks sufficient for most cases)

### Performance & Scale Expectations

- **Target**: 1,000 concurrent users without degradation
- **Page Load**: <3s initial load, <1s subsequent navigation
- **Database**: Optimize queries with indexes; EXPLAIN ANALYZE required for complex queries
- **Caching**: Use Next.js caching, Supabase caching, but keep invalidation simple

## Development Workflow

### Contribution Process

1. **Discuss**: Open GitHub issue or discussion for non-trivial changes
2. **Branch**: Feature branches named `feature/###-description` or `fix/###-description`
3. **Develop**: Follow Clean Architecture, write tests for critical paths
4. **Document**: Update relevant README files, add inline comments
5. **PR**: Submit with description explaining "why" not just "what"
6. **Review**: At least one maintainer approval required; focus on community maintainability
7. **Merge**: Squash-merge to main, deploy via Vercel

### PR Review Checklist

Reviewers MUST verify:
- [ ] Follows Clean Architecture (correct layer, proper dependencies)
- [ ] TypeScript types are explicit (no `any` without justification)
- [ ] Critical paths have tests (auth, data, NFT operations)
- [ ] Documentation updated (README, inline comments, ADR if needed)
- [ ] Simplicity maintained (no unnecessary abstractions)
- [ ] Community maintainable (would a mid-level dev understand this?)

### Constitution Compliance

All PRs MUST pass the "Constitution Check":
- Does this increase or decrease complexity?
- Can a community member with moderate skills maintain this?
- Are layers properly separated (UI/Service/Data)?
- Are types explicit and safe?
- Do critical paths have test coverage?

If a PR violates principles, it MUST either be refactored or justify the violation in the PR description with an architecture decision rationale.

## Governance

### Amendment Procedure

This constitution can be amended via:
1. **Proposal**: GitHub issue tagged `constitution-amendment`
2. **Discussion**: Minimum 7-day comment period
3. **Approval**: Maintainer consensus (all active maintainers must approve)
4. **Migration Plan**: If amendment affects existing code, include refactoring plan
5. **Version Bump**: Follow semantic versioning (MAJOR for breaking changes, MINOR for additions, PATCH for clarifications)

### Versioning Policy

- **MAJOR** (X.0.0): Principle removal, redefinition, or backward-incompatible governance change
- **MINOR** (x.Y.0): New principle added, section expanded, new mandatory standards
- **PATCH** (x.y.Z): Clarifications, wording improvements, typo fixes

### Conflict Resolution

When code practices conflict with constitution:
1. Constitution takes precedence over legacy code
2. Refactor legacy code to align, or document exception with expiration date
3. Exceptions MUST include plan to resolve (e.g., "refactor by Q2 2026")

### Enforcement

- Maintainers review PRs for constitution compliance
- Quarterly architecture reviews to identify drift
- Community can flag violations via GitHub issues
- Repeated violations by contributors result in increased review scrutiny

**Version**: 1.0.0 | **Ratified**: 2025-10-27 | **Last Amended**: 2025-10-27
