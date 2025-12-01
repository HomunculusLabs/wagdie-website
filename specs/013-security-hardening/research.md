# Research: Security Hardening

**Feature**: 013-security-hardening
**Date**: 2025-11-29
**Status**: Complete

## Research Summary

All technical decisions have been resolved. This document captures the rationale for each security implementation choice.

---

## 1. Cryptographic Nonce Generation

### Decision
Use Node.js `crypto.randomBytes()` for nonce generation.

### Rationale
- Built into Node.js runtime (no external dependency)
- Cryptographically secure pseudo-random number generator (CSPRNG)
- Uses operating system's entropy source
- Standard practice for security-sensitive applications
- Compatible with both Node.js and Edge runtime

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| `Math.random()` | Not cryptographically secure; predictable with enough samples |
| `uuid` package | Adds dependency; UUIDs are for uniqueness, not unpredictability |
| Web Crypto API only | Less portable; crypto.randomBytes works in more environments |

### Implementation Pattern
```typescript
import { randomBytes } from 'crypto'
export function generateSecureNonce(): string {
  return randomBytes(16).toString('hex') // 32 character hex string
}
```

---

## 2. Session Secret Validation

### Decision
Validate SESSION_SECRET at module load time; throw error if missing or insufficient.

### Rationale
- Fail-fast prevents running with insecure configuration
- 32 character minimum matches iron-session requirements
- Error message guides operators to fix configuration
- Module-level validation catches issues before any request

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Runtime validation per-request | Too late; session already compromised if fallback used |
| Warning instead of error | Silent failures are security anti-pattern |
| Environment-specific bypass | Creates production risk if misconfigured |

### Implementation Pattern
```typescript
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be set and at least 32 characters')
}
```

---

## 3. SIWE Nonce Verification

### Decision
Parse SIWE message and compare nonce field against cookie-stored nonce before signature verification.

### Rationale
- SIWE library's SiweMessage class provides nonce extraction
- Comparing before signature verification prevents unnecessary crypto operations on invalid requests
- Matches SIWE specification (EIP-4361) requirements
- Cookie nonce is deleted immediately after verification (single-use)

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Trust signature verification alone | Doesn't prevent replay with different nonces |
| Session-stored nonce | Cookies are simpler; session might not exist yet |
| Nonce in database | Over-engineered for single-use 5-minute values |

### Implementation Pattern
```typescript
const siweMessage = new SiweMessage(message)
if (siweMessage.nonce !== storedNonce) {
  return { success: false, error: 'Nonce mismatch' }
}
// Then verify signature
```

---

## 4. Rate Limiting Strategy

### Decision
In-memory sliding window rate limiting using Map with IP-based keys.

### Rationale
- No external dependencies (Redis, database)
- Sliding window provides smoother limiting than fixed windows
- Map is efficient for moderate traffic (~1000 users)
- Automatic cleanup via TTL-based eviction
- Fail-open design maintains availability if issues occur

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Redis/Upstash | Adds external dependency; overkill for current scale |
| Token bucket | More complex; sliding window sufficient for auth endpoints |
| Fixed window | Allows burst at window boundaries |
| Database storage | Too slow for per-request rate checking |

### Implementation Pattern
```typescript
interface RateLimitEntry {
  count: number
  windowStart: number
}
const rateLimitMap = new Map<string, RateLimitEntry>()

// Sliding window: 10 requests per 60 seconds
const LIMIT = 10
const WINDOW_MS = 60_000
```

### Scaling Considerations
- Current in-memory approach works for single-instance deployment
- For multi-instance: upgrade to Upstash Redis (documented in quickstart.md)
- Memory cleanup runs every 5 minutes to prevent unbounded growth

---

## 5. CSRF Protection Pattern

### Decision
Double-submit cookie pattern with Authorization header bypass for API clients.

### Rationale
- Stateless: no server-side token storage needed
- Compatible with Next.js middleware
- Authorization header bypass enables programmatic API access
- Industry-standard pattern (OWASP recommended)

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Synchronizer token | Requires server-side state; complex with stateless sessions |
| SameSite=Strict only | Too restrictive; breaks legitimate cross-origin flows |
| Origin header check | Not sufficient alone; can be spoofed in some scenarios |

### Implementation Pattern
```typescript
// Set token in cookie (non-httpOnly so JS can read)
// Validate X-CSRF-Token header matches cookie value
// Skip if Authorization header present (API client)
```

---

## 6. Security Headers Configuration

### Decision
Configure security headers in Next.js config with appropriate CSP for the application.

### Rationale
- next.config.js headers apply to all routes automatically
- CSP must allow Supabase, Alchemy, IPFS image sources
- X-Frame-Options: DENY prevents clickjacking
- Referrer-Policy limits information leakage

### CSP Policy Decisions

| Directive | Value | Reason |
|-----------|-------|--------|
| default-src | 'self' | Restrict to same origin by default |
| script-src | 'self' 'unsafe-eval' 'unsafe-inline' | Next.js requires these for hydration |
| style-src | 'self' 'unsafe-inline' | Tailwind and dynamic styles |
| img-src | 'self' data: https://ipfs.io https://gateway.pinata.cloud https://cloudflare-ipfs.com | NFT images from IPFS |
| connect-src | 'self' https://*.supabase.co https://*.alchemy.com wss://*.alchemy.com | API and RPC connections |
| frame-ancestors | 'none' | Prevent embedding in frames |

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|------------------|
| Helmet.js | Adds dependency; Next.js native headers sufficient |
| Strict CSP (no unsafe-inline) | Breaks Next.js; requires nonce injection complexity |
| Report-only mode | Initial deployment should enforce, not just report |

---

## 7. Error Handling in Production

### Decision
Environment-based conditional rendering with explicit production check.

### Rationale
- `process.env.NODE_ENV === 'production'` is standard Next.js pattern
- Additional hostname check prevents accidental exposure
- Server-side logging preserves debugging capability
- User-facing messages are generic and safe

### Implementation Pattern
```typescript
const isProduction = process.env.NODE_ENV === 'production'
const showDetails = !isProduction &&
  typeof window !== 'undefined' &&
  window.location.hostname === 'localhost'
```

---

## 8. Sync Endpoint Security

### Decision
Remove query parameter secret support; require Authorization header only.

### Rationale
- Secrets in URLs are logged in access logs, history, referrers
- Authorization header is the standard for API authentication
- Vercel cron can use Authorization header
- Simplifies code and reduces attack surface

### Migration Note
If existing cron jobs use query parameter, update Vercel cron configuration to use header.

---

## Dependencies Summary

| Dependency | Version | Purpose | New/Existing |
|------------|---------|---------|--------------|
| crypto (Node.js) | built-in | Secure random generation | Existing |
| siwe | existing | SIWE message parsing | Existing |
| iron-session | existing | Session management | Existing |
| next | 15.x | Middleware, headers | Existing |

**No new external dependencies required.**

---

## Testing Strategy

| Component | Test Type | Approach |
|-----------|-----------|----------|
| Nonce generation | Unit | Verify randomness, length, format |
| Session validation | Unit | Test missing/short secret errors |
| Nonce verification | Integration | Full auth flow with valid/invalid nonces |
| Rate limiting | Unit + Integration | Counter logic, sliding window, fail-open |
| CSRF | Integration | Cookie/header matching, bypass logic |
| Security headers | E2E | Response header inspection |

---

## Open Questions Resolved

All NEEDS CLARIFICATION items from technical context have been resolved:

1. ✅ Cryptographic library: Node.js built-in crypto
2. ✅ Rate limit storage: In-memory Map
3. ✅ CSRF pattern: Double-submit cookie
4. ✅ CSP configuration: Documented above
5. ✅ Error handling: Environment-based conditional
