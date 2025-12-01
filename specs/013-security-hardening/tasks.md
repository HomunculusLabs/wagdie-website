# Tasks: Security Hardening

**Input**: Design documents from `/specs/013-security-hardening/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are included based on the security-critical nature of this feature (TDD approach for crypto and auth).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md structure (Next.js App Router):
- **lib/**: Shared utilities and middleware
- **app/api/**: API routes
- **components/**: React components
- **tests/**: Test files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new directories and utility files needed across all user stories

- [x] T001 Create lib/middleware/ directory for security middleware
- [x] T002 [P] Create lib/utils/crypto.ts with generateSecureNonce() and generateSecureToken() functions
- [x] T003 [P] Create lib/utils/audit-logger.ts with security event logging functions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core security infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create tests/unit/crypto.test.ts for secure random generation (verify randomness, format, length)
- [x] T005 Implement generateSecureNonce() in lib/utils/crypto.ts using crypto.randomBytes(16).toString('hex')
- [x] T006 Implement generateSecureToken() in lib/utils/crypto.ts for CSRF tokens using crypto.randomUUID()
- [x] T007 [P] Create tests/unit/audit-logger.test.ts for logging functions
- [x] T008 Implement audit logging functions in lib/utils/audit-logger.ts (logSecurityEvent, logAuthEvent, logRateLimitEvent)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Secure Authentication Flow (Priority: P1) 🎯 MVP

**Goal**: Replace weak nonce generation with cryptographically secure random values and verify nonce in SIWE message matches stored nonce

**Independent Test**: Authenticate with wallet and verify session tokens cannot be predicted or replayed

### Tests for User Story 1

- [x] T009 [P] [US1] Create tests/integration/auth-nonce.test.ts testing nonce generation and expiration
- [x] T010 [P] [US1] Create tests/integration/auth-verify.test.ts testing nonce verification and replay prevention

### Implementation for User Story 1

- [x] T011 [US1] Update lib/auth/siwe.ts - replace Math.random() nonce with generateSecureNonce() from lib/utils/crypto.ts
- [x] T012 [US1] Update lib/auth/siwe.ts - add verifyNonceMatch(messageNonce, storedNonce) function
- [x] T013 [US1] Update app/api/auth/nonce/route.ts - use secure nonce generator with 5-minute cookie TTL (Max-Age=300)
- [x] T014 [US1] Update app/api/auth/verify/route.ts - parse SIWE message and verify nonce matches cookie before signature verification
- [x] T015 [US1] Update app/api/auth/verify/route.ts - delete nonce cookie immediately after successful verification (single-use)
- [x] T016 [US1] Add audit logging for nonce generation and verification events in auth routes

**Checkpoint**: Authentication flow now uses cryptographically secure nonces with proper verification

---

## Phase 4: User Story 2 - Application Startup Security (Priority: P1)

**Goal**: Application fails safely if SESSION_SECRET is missing or insufficient

**Independent Test**: Start application without SESSION_SECRET and verify it fails with clear error message

### Tests for User Story 2

- [x] T017 [P] [US2] Create tests/unit/session-validation.test.ts testing startup validation for SESSION_SECRET

### Implementation for User Story 2

- [x] T018 [US2] Update lib/auth/session.ts - remove hardcoded fallback password
- [x] T019 [US2] Update lib/auth/session.ts - add validateSessionSecret() function that throws if not set or < 32 chars
- [x] T020 [US2] Update lib/auth/session.ts - call validateSessionSecret() at module load time (fail-fast)
- [x] T021 [US2] Update .env.example with SESSION_SECRET placeholder and generation instructions

**Checkpoint**: Application refuses to start with invalid security configuration

---

## Phase 5: User Story 3 - Protection Against Abuse (Priority: P2)

**Goal**: Rate limit authentication endpoints to 10 requests per minute per IP

**Independent Test**: Send 11+ rapid requests to /api/auth/nonce and verify rate limit response (429)

### Tests for User Story 3

- [x] T022 [P] [US3] Create tests/unit/rate-limit.test.ts testing sliding window counter, reset, and fail-open behavior
- [x] T023 [P] [US3] Create tests/integration/rate-limit-auth.test.ts testing rate limiting on auth endpoints

### Implementation for User Story 3

- [x] T024 [US3] Create lib/middleware/rate-limit.ts with RateLimiter class using in-memory Map
- [x] T025 [US3] Implement sliding window algorithm in rate-limit.ts (10 requests per 60 seconds per IP)
- [x] T026 [US3] Add getRateLimitHeaders() function returning X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- [x] T027 [US3] Add cleanup mechanism for expired entries (every 5 minutes)
- [x] T028 [US3] Implement fail-open behavior in rate-limit.ts (allow requests if storage unavailable)
- [x] T029 [US3] Create withRateLimit() wrapper function for route handlers
- [x] T030 [US3] Apply rate limiting to app/api/auth/nonce/route.ts
- [x] T031 [US3] Apply rate limiting to app/api/auth/verify/route.ts
- [x] T032 [US3] Add audit logging for rate limit exceeded events

**Checkpoint**: Authentication endpoints protected against brute force attacks

---

## Phase 6: User Story 4 - Cross-Site Request Forgery Protection (Priority: P2)

**Goal**: Protect state-changing requests with double-submit cookie CSRF tokens

**Independent Test**: Submit PATCH request without CSRF token and verify 403 rejection

### Tests for User Story 4

- [x] T033 [P] [US4] Create tests/unit/csrf.test.ts testing token generation, validation, and bypass logic
- [x] T034 [P] [US4] Create tests/integration/csrf-protection.test.ts testing CSRF on character update endpoint

### Implementation for User Story 4

- [x] T035 [US4] Create lib/middleware/csrf.ts with generateCsrfToken() function
- [x] T036 [US4] Implement validateCsrfToken(request) function checking cookie vs X-CSRF-Token header
- [x] T037 [US4] Implement shouldBypassCsrf(request) function checking for Authorization header
- [x] T038 [US4] Create withCsrfProtection() middleware wrapper for route handlers
- [x] T039 [US4] Create or update app/middleware.ts to set CSRF token cookie on page loads
- [x] T040 [US4] Configure middleware matcher to exclude /api/auth/nonce and /api/auth/verify from CSRF
- [x] T041 [US4] Apply CSRF protection to app/api/characters/[tokenId]/route.ts PATCH handler
- [x] T042 [US4] Add audit logging for CSRF validation failures

**Checkpoint**: State-changing endpoints protected against CSRF attacks

---

## Phase 7: User Story 5 - Secure Error Handling (Priority: P3)

**Goal**: No stack traces or internal paths exposed in production error responses

**Independent Test**: Trigger error in production mode and verify no sensitive details exposed

### Tests for User Story 5

- [x] T043 [P] [US5] Create tests/unit/error-handling.test.ts testing production vs development error display

### Implementation for User Story 5

- [x] T044 [US5] Update components/ErrorBoundary.tsx - add isProduction check that also verifies hostname
- [x] T045 [US5] Update components/ErrorBoundary.tsx - ensure stack traces only shown when !isProduction
- [x] T046 [US5] Add console.error logging for production errors (server-side only)
- [x] T047 [US5] Update API error responses in auth routes to use generic messages in production

**Checkpoint**: Error information safely handled without information disclosure

---

## Phase 8: User Story 6 - Security Headers (Priority: P3)

**Goal**: All responses include CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy headers

**Independent Test**: Inspect HTTP response headers and verify all security headers present

### Tests for User Story 6

- [x] T048 [P] [US6] Create tests/e2e/security-headers.test.ts verifying headers on page responses

### Implementation for User Story 6

- [x] T049 [US6] Update next.config.js - add headers() function with security headers configuration
- [x] T050 [US6] Configure Content-Security-Policy allowing 'self', ipfs sources, supabase, alchemy
- [x] T051 [US6] Add X-Frame-Options: DENY header
- [x] T052 [US6] Add X-Content-Type-Options: nosniff header
- [x] T053 [US6] Add Referrer-Policy: strict-origin-when-cross-origin header

**Checkpoint**: All security headers present on every response

---

## Phase 9: Sync Endpoint Security (Cross-Cutting)

**Goal**: Remove query parameter secret support, require Authorization header only

- [x] T054 [P] Update app/api/sync/ownership/route.ts - remove querySecret check
- [x] T055 Update app/api/sync/ownership/route.ts - only accept Authorization: Bearer header
- [x] T056 Add audit logging for sync operations in app/api/sync/ownership/route.ts

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T057 [P] Update .env.example with all new environment variables documented
- [x] T058 [P] Run all unit tests and verify passing
- [x] T059 Run all integration tests and verify passing
- [ ] T060 Manual testing: Full authentication flow with new security measures
- [ ] T061 Manual testing: Rate limiting behavior with rapid requests
- [ ] T062 Manual testing: CSRF protection on character updates
- [ ] T063 Manual testing: Security headers in browser DevTools
- [ ] T064 Run quickstart.md validation checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational completion
  - US1 (Phase 3) and US2 (Phase 4) are P1 priority - do first
  - US3 (Phase 5) and US4 (Phase 6) are P2 priority - do second
  - US5 (Phase 7) and US6 (Phase 8) are P3 priority - do third
- **Sync Security (Phase 9)**: Can be done in parallel with P3 stories
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Run In Parallel With |
|-------|------------|--------------------------|
| US1 (Secure Auth) | Foundational | US2 |
| US2 (Startup Security) | Foundational | US1 |
| US3 (Rate Limiting) | Foundational | US4 |
| US4 (CSRF) | Foundational | US3 |
| US5 (Error Handling) | Foundational | US6 |
| US6 (Security Headers) | Foundational | US5 |

### Parallel Opportunities

Within each user story phase:
- Tests (T0XX [P] [USX]) can run in parallel before implementation
- Tasks marked [P] can run in parallel within their phase

Across phases after Foundational:
- US1 and US2 (both P1) can run in parallel
- US3 and US4 (both P2) can run in parallel after P1 complete
- US5 and US6 (both P3) can run in parallel after P2 complete

---

## Parallel Example: User Story 3 (Rate Limiting)

```bash
# Launch tests in parallel:
Task: "tests/unit/rate-limit.test.ts"
Task: "tests/integration/rate-limit-auth.test.ts"

# Then sequential implementation:
Task: "Create lib/middleware/rate-limit.ts"
Task: "Implement sliding window algorithm"
Task: "Add rate limit headers function"
# etc.
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (Secure Auth)
4. Complete Phase 4: US2 (Startup Security)
5. **STOP and VALIDATE**: Core authentication hardened
6. Deploy if ready - critical security fixes in place

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 + US2 → **MVP: Core auth security hardened**
3. US3 + US4 → **+Rate limiting +CSRF protection**
4. US5 + US6 → **+Error handling +Security headers**
5. Phase 9 + 10 → **Complete feature**

---

## Notes

- All security tasks should have corresponding tests
- Test for failure cases explicitly (invalid nonce, rate exceeded, missing CSRF)
- Verify fail-open behavior for rate limiting doesn't create security holes
- Test with and without Authorization header for CSRF bypass
- Commit after each phase completion
- Validate security headers in actual browser, not just tests
