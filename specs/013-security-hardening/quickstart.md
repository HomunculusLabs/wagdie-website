# Quickstart: Security Hardening

**Feature**: 013-security-hardening
**Date**: 2025-11-29

## Prerequisites

Before implementing this feature:

1. **Environment Variables** - Ensure these are configured:
   ```bash
   # Required (32+ characters, generate with: openssl rand -hex 32)
   SESSION_SECRET=your-secure-session-secret-at-least-32-characters

   # Existing (should already be set)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SYNC_SECRET_KEY=...
   ```

2. **Development Environment**:
   ```bash
   node --version  # >= 18.0.0
   npm --version   # >= 9.0.0
   ```

3. **Existing Codebase**:
   - `lib/auth/session.ts` - iron-session configuration
   - `lib/auth/siwe.ts` - SIWE authentication
   - `app/api/auth/*` - Authentication routes
   - `next.config.js` - Next.js configuration

---

## Implementation Order

Follow this sequence to minimize breaking changes:

### Phase 1: Foundation (No Breaking Changes)

1. **Create crypto utilities** (`lib/utils/crypto.ts`)
   - Secure nonce generation
   - Token generation functions
   - Unit tests

2. **Update session validation** (`lib/auth/session.ts`)
   - Add startup validation for SESSION_SECRET
   - Keep fallback temporarily for testing
   - Remove fallback only after validation confirmed

### Phase 2: Authentication Hardening

3. **Update nonce generation** (`lib/auth/siwe.ts`)
   - Replace Math.random() with crypto.randomBytes()
   - Update function signature if needed

4. **Add nonce verification** (`app/api/auth/verify/route.ts`)
   - Parse SIWE message before signature verification
   - Compare nonce fields
   - Add error responses for mismatch

5. **Update nonce route** (`app/api/auth/nonce/route.ts`)
   - Use new secure nonce function

### Phase 3: Rate Limiting

6. **Create rate limiter** (`lib/middleware/rate-limit.ts`)
   - Sliding window implementation
   - In-memory Map storage
   - Fail-open behavior

7. **Apply to auth routes**
   - Wrap `/api/auth/nonce` and `/api/auth/verify`
   - Add rate limit headers

### Phase 4: CSRF Protection

8. **Create CSRF middleware** (`lib/middleware/csrf.ts`)
   - Double-submit cookie validation
   - Authorization header bypass
   - Token generation

9. **Create/update middleware.ts**
   - Apply CSRF to state-changing routes
   - Exclude auth endpoints

### Phase 5: Security Headers & Error Handling

10. **Update next.config.js**
    - Add security headers configuration
    - CSP policy with required sources

11. **Update ErrorBoundary** (`components/ErrorBoundary.tsx`)
    - Add explicit production check
    - Remove stack trace display in prod

### Phase 6: Sync Endpoint

12. **Update sync route** (`app/api/sync/ownership/route.ts`)
    - Remove query parameter secret support
    - Add audit logging
    - Update error responses

---

## Key Files to Modify

| File | Changes |
|------|---------|
| `lib/utils/crypto.ts` | **NEW** - Secure random utilities |
| `lib/middleware/rate-limit.ts` | **NEW** - Rate limiting |
| `lib/middleware/csrf.ts` | **NEW** - CSRF protection |
| `lib/auth/session.ts` | Remove fallback, add validation |
| `lib/auth/siwe.ts` | Use crypto.randomBytes() |
| `app/api/auth/nonce/route.ts` | Use secure nonce |
| `app/api/auth/verify/route.ts` | Add nonce verification |
| `app/api/sync/ownership/route.ts` | Remove query param secret |
| `app/middleware.ts` | Add CSRF, rate limiting |
| `next.config.js` | Add security headers |
| `components/ErrorBoundary.tsx` | Production-safe errors |

---

## Testing Checklist

### Unit Tests

- [ ] `crypto.ts` - Nonce format, randomness
- [ ] `rate-limit.ts` - Counter logic, window reset, cleanup
- [ ] `csrf.ts` - Token generation, validation logic

### Integration Tests

- [ ] Full auth flow with new nonce verification
- [ ] Rate limiting across multiple requests
- [ ] CSRF validation with/without tokens
- [ ] CSRF bypass with Authorization header

### Manual Tests

- [ ] Application starts with valid SESSION_SECRET
- [ ] Application fails with missing/short SESSION_SECRET
- [ ] Security headers present in browser DevTools
- [ ] Error pages don't show stack traces in production

---

## Rollback Plan

If issues occur after deployment:

1. **Rate limiting issues**: Set `RATE_LIMIT_ENABLED=false` env var (add feature flag)
2. **CSRF issues**: Set `CSRF_ENABLED=false` env var (add feature flag)
3. **Session issues**: Redeploy previous version (no migration needed)

---

## Scaling Considerations

Current implementation uses in-memory rate limiting. For multi-instance deployments:

1. **Add Upstash Redis**:
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

2. **Configure environment**:
   ```bash
   UPSTASH_REDIS_REST_URL=...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

3. **Update rate-limit.ts** to use Upstash client

---

## Common Issues

### "SESSION_SECRET must be set"

Generate a secure secret:
```bash
openssl rand -hex 32
```

Add to `.env.local`:
```
SESSION_SECRET=<generated-value>
```

### "Invalid nonce" errors

- User took too long to sign (>5 min)
- Multiple tabs generated different nonces
- Solution: Request new nonce and retry

### Rate limit affecting all users

If rate limit storage fails:
- Verify fail-open behavior is working
- Check for memory issues (Map size)
- Consider upgrading to Redis

### CSRF blocking API clients

Ensure API clients:
1. Include `Authorization: Bearer <token>` header, OR
2. Include both `csrf-token` cookie and `X-CSRF-Token` header

---

## Verification Commands

```bash
# Run tests
npm test -- --testPathPattern="security|auth|csrf|rate-limit"

# Check security headers (after deployment)
curl -I https://your-domain.com | grep -E "Content-Security|X-Frame|X-Content"

# Test rate limiting
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/auth/nonce; done

# Verify SESSION_SECRET validation (should fail)
SESSION_SECRET="" npm run dev
```
