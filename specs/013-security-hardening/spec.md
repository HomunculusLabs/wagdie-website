# Feature Specification: Security Hardening

**Feature Branch**: `013-security-hardening`
**Created**: 2025-11-29
**Status**: Draft
**Input**: User description: "Implement security hardening fixes for authentication vulnerabilities including cryptographic nonce generation, session secret validation, SIWE nonce verification, rate limiting, and CSRF protection"

## Clarifications

### Session 2025-11-29

- Q: When rate limit storage is unavailable, what should the system do? → A: Fail-open - allow all requests when storage unavailable (availability priority)
- Q: How should CSRF protection handle programmatic API clients vs browser requests? → A: Exclude API clients using Authorization header (Bearer token/API key present = skip CSRF)

## Overview

This feature addresses critical security vulnerabilities identified in the security vulnerability analysis. The focus is on hardening the authentication system, protecting against abuse, and implementing defense-in-depth measures. These changes are essential for protecting user accounts and maintaining the integrity of the WAGDIE platform.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Secure Authentication Flow (Priority: P1)

As a user connecting my wallet, I want the authentication process to use cryptographically secure random values so that my session cannot be hijacked or replayed by attackers.

**Why this priority**: Authentication security is foundational. If authentication can be bypassed or sessions hijacked, all other security measures become irrelevant. This directly protects user funds and character ownership.

**Independent Test**: Can be fully tested by attempting to authenticate with a wallet and verifying that session tokens cannot be predicted or replayed, delivering secure user sessions.

**Acceptance Scenarios**:

1. **Given** a user initiates wallet connection, **When** the system generates a nonce, **Then** the nonce uses cryptographically secure random generation
2. **Given** a user has a valid nonce, **When** they sign and submit the SIWE message, **Then** the system verifies the nonce in the message matches the stored nonce
3. **Given** a user has already used a nonce, **When** they attempt to reuse it, **Then** the system rejects the authentication attempt
4. **Given** a nonce was generated, **When** more than 5 minutes have passed, **Then** the nonce expires and cannot be used

---

### User Story 2 - Application Startup Security (Priority: P1)

As a platform operator, I want the application to fail safely if critical security configuration is missing so that the system never runs with insecure defaults.

**Why this priority**: A misconfigured production deployment with hardcoded secrets could result in complete authentication bypass. This must be caught at startup, not at runtime.

**Independent Test**: Can be fully tested by starting the application without required environment variables and verifying it fails with a clear error message.

**Acceptance Scenarios**:

1. **Given** the application starts, **When** SESSION_SECRET is not set, **Then** the application fails to start with a clear error message
2. **Given** the application starts, **When** SESSION_SECRET is less than 32 characters, **Then** the application fails to start with a validation error
3. **Given** all required security configuration is present, **When** the application starts, **Then** authentication functions correctly

---

### User Story 3 - Protection Against Abuse (Priority: P2)

As a platform operator, I want authentication endpoints protected against brute force and denial of service attacks so that legitimate users can always access the platform.

**Why this priority**: Rate limiting prevents resource exhaustion and protects against credential stuffing. While important, users can still authenticate without rate limiting in place.

**Independent Test**: Can be fully tested by sending many rapid requests to authentication endpoints and verifying that excessive requests are rejected with appropriate rate limit responses.

**Acceptance Scenarios**:

1. **Given** a client makes authentication requests, **When** they exceed 10 requests per minute, **Then** subsequent requests receive a rate limit error
2. **Given** a client is rate limited, **When** the rate limit window expires, **Then** they can make requests again
3. **Given** a client is rate limited, **When** they receive the error response, **Then** the response includes rate limit headers indicating limit, remaining, and reset time

---

### User Story 4 - Cross-Site Request Forgery Protection (Priority: P2)

As a user with an authenticated session, I want protection against malicious websites that could perform actions on my behalf so that my characters and data remain under my control.

**Why this priority**: CSRF protection prevents attackers from tricking users into making unintended state changes. This is important for protecting character modifications but less critical than core authentication.

**Independent Test**: Can be fully tested by attempting to submit state-changing requests without valid CSRF tokens and verifying they are rejected.

**Acceptance Scenarios**:

1. **Given** a user loads any page, **When** the page renders, **Then** a unique CSRF token is set in cookies
2. **Given** a user submits a state-changing request, **When** the request lacks a valid CSRF token header, **Then** the request is rejected with an error
3. **Given** a user submits a state-changing request, **When** the CSRF token header matches the cookie value, **Then** the request proceeds normally

---

### User Story 5 - Secure Error Handling (Priority: P3)

As a platform operator, I want error information to be handled safely so that attackers cannot use error messages to gather information about the system.

**Why this priority**: Information disclosure is a lower-severity issue that supports other attacks rather than enabling direct exploitation.

**Independent Test**: Can be fully tested by triggering various errors in production mode and verifying that sensitive details are not exposed to users.

**Acceptance Scenarios**:

1. **Given** the application runs in production mode, **When** an error occurs, **Then** users see a friendly error message without stack traces or internal paths
2. **Given** the application runs in production mode, **When** an error occurs, **Then** detailed error information is logged server-side for debugging
3. **Given** the application runs in development mode, **When** an error occurs, **Then** developers can see detailed error information for debugging

---

### User Story 6 - Security Headers (Priority: P3)

As a user browsing the platform, I want the application to implement security headers so that my browser can help protect against common web attacks.

**Why this priority**: Security headers provide defense-in-depth but the application already uses safe patterns (no dangerouslySetInnerHTML). These are best practices that reduce attack surface.

**Independent Test**: Can be fully tested by inspecting HTTP response headers and verifying security headers are present and correctly configured.

**Acceptance Scenarios**:

1. **Given** any page is requested, **When** the response is sent, **Then** Content-Security-Policy header is present and correctly configured
2. **Given** any page is requested, **When** the response is sent, **Then** X-Frame-Options header prevents clickjacking
3. **Given** any page is requested, **When** the response is sent, **Then** X-Content-Type-Options prevents MIME sniffing

---

### Edge Cases

- What happens when a user has multiple browser tabs and nonces conflict?
- How does the system handle clock skew affecting nonce expiration?
- **Rate limit storage unavailable**: System fails open - all requests are allowed to maintain availability; alert is triggered for operators
- **API clients vs browser CSRF**: Requests with valid Authorization header (Bearer token/API key) bypass CSRF validation; browser requests without Authorization header require CSRF token
- What happens when a user's session expires during an active editing session?

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication Security

- **FR-001**: System MUST generate nonces using cryptographically secure random number generation
- **FR-002**: System MUST verify that the nonce in the SIWE message matches the stored nonce before validating the signature
- **FR-003**: System MUST expire unused nonces after 5 minutes
- **FR-004**: System MUST invalidate nonces immediately after successful use (single-use)
- **FR-005**: System MUST refuse to start if SESSION_SECRET environment variable is not set
- **FR-006**: System MUST refuse to start if SESSION_SECRET is shorter than 32 characters

#### Rate Limiting

- **FR-007**: System MUST limit authentication endpoint requests to 10 per minute per IP address
- **FR-008**: System MUST return HTTP 429 status with rate limit headers when limits are exceeded
- **FR-009**: System MUST include X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers in rate-limited responses
- **FR-010**: System MUST gracefully degrade if rate limit storage is temporarily unavailable (allow requests rather than block all)

#### CSRF Protection

- **FR-011**: System MUST set a unique CSRF token cookie for each user session
- **FR-012**: System MUST validate CSRF token header against cookie value for all state-changing requests (POST, PATCH, DELETE) from browser clients
- **FR-013**: System MUST reject state-changing requests that lack valid CSRF tokens with HTTP 403 status
- **FR-014**: CSRF protection MUST NOT apply to authentication endpoints (nonce, verify) as they have their own protections
- **FR-014a**: System MUST bypass CSRF validation for requests containing a valid Authorization header (Bearer token/API key), enabling programmatic API access

#### Error Handling

- **FR-015**: System MUST NOT expose stack traces, file paths, or internal error details to users in production
- **FR-016**: System MUST log detailed error information server-side for debugging
- **FR-017**: System MUST display user-friendly error messages that do not reveal implementation details

#### Security Headers

- **FR-018**: System MUST send Content-Security-Policy header on all responses
- **FR-019**: System MUST send X-Frame-Options: DENY header to prevent clickjacking
- **FR-020**: System MUST send X-Content-Type-Options: nosniff header
- **FR-021**: System MUST send Referrer-Policy: strict-origin-when-cross-origin header

#### Sync Endpoint Security

- **FR-022**: System MUST only accept sync authorization via Authorization header, not query parameters
- **FR-023**: System MUST log all sync operations for audit purposes

### Key Entities

- **Nonce**: Cryptographically random single-use value for authentication; associated with session, has expiration timestamp
- **Rate Limit Record**: Tracks request count per IP address within time window; has counter, window start time, IP address
- **CSRF Token**: Cryptographically random value tied to user session; stored in cookie, validated against request header
- **Audit Log Entry**: Record of security-relevant operations; includes timestamp, operation type, actor, result

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authentication nonces cannot be predicted - passes randomness test suite with >99% confidence
- **SC-002**: Application fails to start within 5 seconds if security configuration is invalid, with clear error message
- **SC-003**: Rate-limited users receive 429 response within 100ms with correct headers
- **SC-004**: 100% of state-changing requests without valid CSRF tokens are rejected
- **SC-005**: Zero stack traces or internal paths visible in production error responses
- **SC-006**: All security headers present on 100% of HTTP responses
- **SC-007**: Nonce replay attacks are blocked with 100% effectiveness
- **SC-008**: System remains available to legitimate users when rate limiting abusive clients

## Assumptions

1. The application uses iron-session for session management (existing implementation)
2. SIWE (Sign-In with Ethereum) library is already integrated (existing implementation)
3. Rate limiting can use in-memory storage for initial implementation (external rate limit storage optional enhancement)
4. The application runs on a runtime with access to cryptographic random generation
5. Existing cookie security settings (httpOnly, sameSite, secure) will be preserved
6. API clients making requests will be updated to include CSRF tokens where required

## Out of Scope

- Implementation of multi-factor authentication
- IP-based blocking or allowlisting
- Advanced threat detection (anomaly detection, behavioral analysis)
- Security monitoring dashboards
- Penetration testing (separate activity)
- Database-level security enhancements (RLS policies)
- Smart contract security audits

## Dependencies

- Cryptographic random generation capability
- Environment variable configuration in deployment pipeline
- Existing authentication flow (SIWE) must remain functional
- Rate limit storage solution (memory or external)

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rate limiting blocks legitimate users | High | Start with generous limits, monitor before tightening |
| CSRF protection breaks API integrations | Medium | Exclude documented API endpoints, provide migration guide |
| Security changes break existing sessions | Medium | Deploy during low-traffic period, communicate to users |
| Rate limit storage failure | Low | Fail-open design with alerting |
