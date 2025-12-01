# Data Model: Security Hardening

**Feature**: 013-security-hardening
**Date**: 2025-11-29
**Status**: Complete

## Overview

This feature primarily modifies existing data structures and introduces in-memory runtime entities. No database schema changes are required.

---

## Entities

### 1. Nonce (Modified)

**Location**: Cookie storage (`siwe-nonce`)
**Lifecycle**: Created on `/api/auth/nonce` → Validated on `/api/auth/verify` → Deleted after use

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| value | string | 32 chars, hex | Cryptographically random value |
| createdAt | implicit | Cookie maxAge | 5-minute TTL via cookie expiration |

**State Transitions**:
```
[Generated] → [Stored in Cookie] → [Validated] → [Deleted]
                                 ↘ [Expired after 5 min]
```

**Validation Rules**:
- Must be exactly 32 hexadecimal characters
- Must match nonce field in SIWE message
- Single-use: deleted immediately after successful verification
- Expires after 5 minutes if unused

---

### 2. Rate Limit Entry (New - In-Memory)

**Location**: In-memory Map (`rateLimitMap`)
**Lifecycle**: Created on first request from IP → Updated on subsequent requests → Evicted after window expires

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| key | string | IP address | Client IP identifier |
| count | number | 0-10 | Request count in current window |
| windowStart | number | Unix timestamp ms | Start of current sliding window |

**State Transitions**:
```
[First Request] → [Entry Created, count=1]
                        ↓
[Subsequent Request] → [count++] → [count >= 10?] → [RATE LIMITED]
                        ↓                               ↓
              [Window expired?] → [Reset count=1] ← [Wait for reset]
                        ↓
              [Cleanup job] → [Entry Deleted]
```

**Validation Rules**:
- Maximum 10 requests per 60-second sliding window
- Window resets when (now - windowStart) > 60000ms
- Entries cleaned up every 5 minutes if window expired

**Memory Constraints**:
- Estimated max entries: ~10,000 (10KB overhead)
- Cleanup prevents unbounded growth

---

### 3. CSRF Token (New - Cookie/Header)

**Location**: Cookie (`csrf-token`) + Request Header (`X-CSRF-Token`)
**Lifecycle**: Created on first page load → Validated on state-changing requests → Renewed on session refresh

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| value | string | UUID v4 format | Cryptographically random token |
| cookieValue | string | Same as value | Stored in non-httpOnly cookie |
| headerValue | string | Same as value | Sent in X-CSRF-Token header |

**State Transitions**:
```
[Page Load] → [Token Generated] → [Set in Cookie]
                                        ↓
[State-Changing Request] → [Header matches Cookie?] → [Proceed]
                                        ↓
                               [Mismatch/Missing] → [403 Rejected]

[Authorization Header Present] → [CSRF Check Bypassed] → [Proceed]
```

**Validation Rules**:
- Cookie must be present and non-empty
- Header must exactly match cookie value
- Bypass validation if `Authorization: Bearer ...` header present
- Not required for GET, HEAD, OPTIONS requests
- Not required for `/api/auth/nonce` and `/api/auth/verify`

---

### 4. Session (Modified)

**Location**: Encrypted cookie (`wagdie_session` via iron-session)
**Existing fields preserved, validation added**

| Attribute | Type | Constraints | Description |
|-----------|------|-------------|-------------|
| address | string | Ethereum address | User's wallet address |
| siwe | object | SIWE data | Message, signature, nonce |
| expires | number | Unix timestamp ms | Session expiration |

**New Validation (Startup)**:
```typescript
// Required environment validation
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error('Invalid SESSION_SECRET configuration')
}
```

---

### 5. Audit Log Entry (New - Console/Server Logs)

**Location**: Server-side logging (console/Vercel logs)
**Lifecycle**: Created on security events → Persisted in log aggregation

| Attribute | Type | Description |
|-----------|------|-------------|
| timestamp | ISO string | When event occurred |
| event | string | Event type identifier |
| ip | string | Client IP address |
| path | string | Request path |
| result | string | success/failure/blocked |
| details | object | Event-specific data |

**Event Types**:
- `auth.nonce.generated` - Nonce created
- `auth.verify.success` - Successful authentication
- `auth.verify.failed` - Failed authentication (nonce mismatch, signature invalid)
- `auth.ratelimit.exceeded` - Rate limit triggered
- `csrf.validation.failed` - CSRF token mismatch
- `sync.operation.completed` - Sync endpoint called

---

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Client IP] ──────┐                                        │
│                    ↓                                        │
│            ┌──────────────┐                                 │
│            │ Rate Limit   │ ← checks → [Rate Limit Entry]   │
│            │ Middleware   │                                 │
│            └──────┬───────┘                                 │
│                   ↓                                         │
│            ┌──────────────┐                                 │
│            │ CSRF         │ ← validates → [CSRF Token]      │
│            │ Middleware   │              (cookie + header)  │
│            └──────┬───────┘                                 │
│                   ↓                                         │
│            ┌──────────────┐                                 │
│            │ Auth Route   │ ← verifies → [Nonce]            │
│            │ /verify      │              (cookie)           │
│            └──────┬───────┘                                 │
│                   ↓                                         │
│            ┌──────────────┐                                 │
│            │ Session      │ ← stores → [Session Data]       │
│            │ (iron-session│            (encrypted cookie)   │
│            └──────────────┘                                 │
│                                                             │
│  All events → [Audit Log Entry] → Server Logs              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Volume Estimates

| Entity | Expected Volume | Storage | Cleanup Strategy |
|--------|-----------------|---------|------------------|
| Nonce | ~100/hour | Cookie (client) | 5-min TTL, auto-expires |
| Rate Limit Entry | ~1,000 active | In-memory (~10KB) | 5-min cleanup job |
| CSRF Token | 1 per session | Cookie (client) | Session lifetime |
| Session | ~500 concurrent | Cookie (client) | 7-day expiration |
| Audit Log | ~10,000/day | Log aggregation | External retention policy |

---

## Migration Notes

### No Database Migration Required

All new entities are:
- In-memory (rate limit entries)
- Cookie-based (nonce, CSRF token)
- Log-based (audit entries)

### Session Compatibility

Existing sessions remain valid. Changes are:
1. Session secret validation at startup (breaks startup, not sessions)
2. Nonce verification added (new nonces only)

### Breaking Changes

None for end users. Operators must:
1. Ensure `SESSION_SECRET` environment variable is set (32+ chars)
2. Update any sync jobs using query parameter secrets to use Authorization header
