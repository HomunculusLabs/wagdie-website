# Implementation Plan: Security Hardening

**Branch**: `013-security-hardening` | **Date**: 2025-11-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-security-hardening/spec.md`

## Summary

Implement security hardening fixes addressing critical authentication vulnerabilities identified in the security analysis. Primary requirements include:
- Replace weak `Math.random()` nonce generation with cryptographically secure alternatives
- Remove hardcoded session secret fallback and enforce environment configuration
- Add proper SIWE nonce verification against signed messages
- Implement rate limiting on authentication endpoints (10 req/min per IP)
- Add CSRF protection with double-submit cookie pattern
- Configure security headers (CSP, X-Frame-Options, etc.)

Technical approach: Modify existing authentication infrastructure in `lib/auth/` using Node.js crypto module, implement rate limiting via in-memory sliding window, add Next.js middleware for CSRF and security headers.

## Technical Context

**Language/Version**: TypeScript 5+, Node.js 18+
**Primary Dependencies**: Next.js 15 (App Router), iron-session, siwe, wagmi v2, viem v2
**Storage**: Supabase PostgreSQL (existing), In-memory for rate limiting
**Testing**: Jest, React Testing Library
**Target Platform**: Vercel Edge/Node.js runtime, Modern browsers
**Project Type**: Web application (Next.js monolith)
**Performance Goals**: Rate limit check <10ms, CSRF validation <5ms, Auth flow <500ms total
**Constraints**: No external dependencies for rate limiting (in-memory acceptable), maintain existing session cookie compatibility
**Scale/Scope**: ~1000 daily users, 6666 NFT characters, moderate traffic

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Constitution file contains template placeholders. Applying general best practices:

| Principle | Status | Notes |
|-----------|--------|-------|
| Library-First | N/A | Security modules are infrastructure, not standalone libraries |
| Test-First | WILL COMPLY | Unit tests for crypto functions, integration tests for auth flow |
| Simplicity | COMPLIANT | Using built-in crypto, in-memory rate limiting, standard patterns |
| Observability | WILL COMPLY | Logging for rate limit events, auth failures, sync operations |

**Gate Status**: PASS - No blocking violations

## Project Structure

### Documentation (this feature)

```text
specs/013-security-hardening/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── security-api.md  # Security endpoint contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
lib/
├── auth/
│   ├── session.ts       # MODIFY: Remove fallback, add validation
│   └── siwe.ts          # MODIFY: Secure nonce, nonce verification
├── middleware/
│   ├── rate-limit.ts    # NEW: Rate limiting implementation
│   └── csrf.ts          # NEW: CSRF protection
└── utils/
    └── crypto.ts        # NEW: Secure random utilities

app/
├── api/
│   └── auth/
│       ├── nonce/route.ts   # MODIFY: Use secure nonce
│       └── verify/route.ts  # MODIFY: Verify nonce match
└── middleware.ts            # MODIFY: Add security headers, CSRF

components/
└── ErrorBoundary.tsx        # MODIFY: Production-safe error display

next.config.js               # MODIFY: Add security headers
```

**Structure Decision**: Extending existing Next.js App Router structure. New security middleware in `lib/middleware/`, crypto utilities in `lib/utils/`. No new directories at root level.

## Complexity Tracking

No constitutional violations requiring justification. All implementations use standard patterns:
- Built-in Node.js crypto (no external library)
- In-memory Map for rate limiting (no Redis dependency)
- Next.js middleware for request interception (framework pattern)
- Double-submit cookie for CSRF (industry standard)
