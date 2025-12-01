# API Contracts: Security Hardening

**Feature**: 013-security-hardening
**Date**: 2025-11-29
**Version**: 1.0

## Overview

This document defines the API contracts for security-related endpoints. All endpoints follow REST conventions and return JSON responses.

---

## Authentication Endpoints

### GET/POST /api/auth/nonce

Generate a cryptographically secure nonce for SIWE authentication.

**Request**:
```http
GET /api/auth/nonce
# or
POST /api/auth/nonce
```

**Response** (200 OK):
```json
{
  "nonce": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
}
```

**Response Headers**:
```http
Set-Cookie: siwe-nonce=a1b2c3d4...; HttpOnly; Secure; SameSite=Lax; Max-Age=300; Path=/
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 429 | Rate limited | `{"error": "Too many requests"}` |
| 500 | Generation failed | `{"error": "Failed to generate nonce"}` |

**Rate Limiting**: 10 requests per minute per IP

---

### POST /api/auth/verify

Verify SIWE signature and create session.

**Request**:
```http
POST /api/auth/verify
Content-Type: application/json
Cookie: siwe-nonce=<stored-nonce>

{
  "message": "<SIWE message string>",
  "signature": "0x..."
}
```

**Validation**:
1. Nonce in message must match cookie nonce
2. Signature must be valid for message
3. Message must not be expired

**Response** (200 OK):
```json
{
  "success": true,
  "address": "0x1234...abcd",
  "user": {
    "eth_address": "0x1234...abcd"
  }
}
```

**Response Headers**:
```http
Set-Cookie: wagdie_session=<encrypted>; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
Set-Cookie: siwe-session=0x1234...abcd; HttpOnly; Secure; SameSite=Lax; Max-Age=604800; Path=/
Set-Cookie: siwe-nonce=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Missing message/signature | `{"error": "Missing message or signature"}` |
| 400 | No nonce cookie | `{"error": "No nonce found. Please request a new one."}` |
| 400 | Nonce mismatch | `{"error": "Invalid nonce. Please request a new one."}` |
| 401 | Invalid signature | `{"error": "Verification failed"}` |
| 429 | Rate limited | `{"error": "Too many requests"}` |
| 500 | Server error | `{"error": "Verification failed"}` |

**Rate Limiting**: 10 requests per minute per IP

---

### GET /api/auth/me

Get current authenticated user.

**Request**:
```http
GET /api/auth/me
Cookie: wagdie_session=<encrypted>
```

**Response** (200 OK):
```json
{
  "address": "0x1234...abcd",
  "expires": 1735689600000,
  "selectedCharacter": null
}
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Not authenticated | `{"error": "Not authenticated"}` |
| 401 | Session expired | `{"error": "Not authenticated"}` |
| 500 | Server error | `{"error": "Failed to fetch user session"}` |

---

### POST /api/auth/logout

End current session.

**Request**:
```http
POST /api/auth/logout
Cookie: wagdie_session=<encrypted>
```

**Response** (200 OK):
```json
{
  "success": true
}
```

**Response Headers**:
```http
Set-Cookie: wagdie_session=; Max-Age=0; Path=/
Set-Cookie: siwe-session=; Max-Age=0; Path=/
Set-Cookie: siwe-nonce=; Max-Age=0; Path=/
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 500 | Server error | `{"error": "Logout failed"}` |

---

## Protected Endpoints (CSRF Required)

All state-changing endpoints require CSRF token validation.

### Common CSRF Headers

**Request**:
```http
POST /api/<endpoint>
Cookie: csrf-token=<token>
X-CSRF-Token: <same-token>
Content-Type: application/json
```

**CSRF Bypass** (API clients):
```http
POST /api/<endpoint>
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Error Response** (403 Forbidden):
```json
{
  "error": "Invalid CSRF token"
}
```

### PATCH /api/characters/[tokenId]

Update character data (requires ownership + CSRF).

**Request**:
```http
PATCH /api/characters/123
Cookie: wagdie_session=<encrypted>; csrf-token=<token>
X-CSRF-Token: <same-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "str": 15
}
```

**Validation**:
1. User must be authenticated
2. User must own the character
3. CSRF token must be valid (unless Authorization header present)
4. Fields must pass validation rules

**Response** (200 OK):
```json
{
  "token_id": 123,
  "name": "Updated Name",
  "str": 15,
  ...
}
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid token ID | `{"error": "Invalid token ID"}` |
| 400 | Validation failed | `{"error": "Validation failed", "details": [...]}` |
| 401 | Not authenticated | `{"error": "Not authenticated"}` |
| 403 | CSRF invalid | `{"error": "Invalid CSRF token"}` |
| 403 | Not owner | `{"error": "You do not own this character"}` |
| 404 | Character not found | `{"error": "Character not found"}` |
| 500 | Server error | `{"error": "Failed to update character"}` |

---

## Sync Endpoint

### GET/POST /api/sync/ownership

Sync NFT ownership from blockchain (protected endpoint).

**Request**:
```http
GET /api/sync/ownership
Authorization: Bearer <sync-secret-key>
```

**Note**: Query parameter `?secret=<key>` is no longer supported.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Ownership sync completed successfully",
  "stats": {
    "tokensProcessed": 6666,
    "tokensUpdated": 42,
    "duration": "12500ms"
  },
  "timestamp": "2025-11-29T12:00:00.000Z"
}
```

**Error Responses**:

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing/invalid auth | `{"error": "Unauthorized"}` |
| 500 | Sync failed | `{"error": "Sync failed", "message": "..."}` |

---

## Rate Limiting Headers

All rate-limited responses include these headers:

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 5
X-RateLimit-Reset: 1735689600
```

| Header | Description |
|--------|-------------|
| X-RateLimit-Limit | Maximum requests per window |
| X-RateLimit-Remaining | Requests remaining in window |
| X-RateLimit-Reset | Unix timestamp when window resets |

---

## Security Headers

All responses include these security headers:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://ipfs.io https://gateway.pinata.cloud https://cloudflare-ipfs.com; connect-src 'self' https://*.supabase.co https://*.alchemy.com wss://*.alchemy.com; frame-ancestors 'none'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "Human-readable error message",
  "details": ["Optional array of validation errors"]
}
```

**Production Mode**: Error messages are generic. No stack traces, file paths, or internal details are exposed.

**Development Mode**: Additional debugging information may be included in logs (not in response body).
