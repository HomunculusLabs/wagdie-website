# Location API Contracts

**Feature**: Interactive Map Integration
**Date**: 2025-11-03

## REST API Endpoints

### GET /api/locations

Get list of all available locations in the WAGDIE world.

**Request**:
```http
GET /api/locations
Accept: application/json
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "id": "concord_searing",
      "name": "Concord Searing",
      "description": "A place of power where...",
      "metadata": {
        "coordinates": { "x": 100, "y": 200 },
        "rarity": "rare",
        "special_properties": ["healing", "protection"]
      },
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "error": null,
  "count": 1
}
```

**Response** (500 Internal Server Error):
```json
{
  "data": null,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch locations"
  }
}
```

---

### GET /api/character-locations

Get character locations for authenticated wallet.

**Request**:
```http
GET /api/character-locations
Authorization: Bearer <wallet_signature>
Accept: application/json
```

**Response** (200 OK):
```json
{
  "data": [
    {
      "character_id": "1234",
      "location_id": "concord_searing",
      "wallet_address": "0xabc...123",
      "transaction_hash": "0x456...789",
      "block_number": 18500000,
      "status": "staked",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "location": {
        "id": "concord_searing",
        "name": "Concord Searing",
        "description": "A place of power where..."
      }
    }
  ],
  "error": null
}
```

**Response** (401 Unauthorized):
```json
{
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication"
  }
}
```

---

### POST /api/character-locations/stake

Stake characters to a location (blockchain transaction).

**Request**:
```http
POST /api/character-locations/stake
Authorization: Bearer <wallet_signature>
Content-Type: application/json

{
  "character_ids": ["1234", "5678"],
  "location_id": "forsaken_lands"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "transaction_hash": "0xabc...def",
    "status": "pending",
    "estimated_gas": 150000,
    "characters_staked": 2,
    "location": "forsaken_lands"
  },
  "error": null
}
```

**Response** (400 Bad Request):
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid location_id or character_ids"
  }
}
```

---

### POST /api/character-locations/unstake

Unstake characters from their current location.

**Request**:
```http
POST /api/character-locations/unstake
Authorization: Bearer <wallet_signature>
Content-Type: application/json

{
  "character_ids": ["1234"]
}
```

**Response** (200 OK):
```json
{
  "data": {
    "transaction_hash": "0xabc...def",
    "status": "pending",
    "estimated_gas": 80000,
    "characters_unstaked": 1
  },
  "error": null
}
```

---

### POST /api/character-locations/move

Move characters from one location to another.

**Request**:
```http
POST /api/character-locations/move
Authorization: Bearer <wallet_signature>
Content-Type: application/json

{
  "character_ids": ["1234"],
  "from_location_id": "concord_searing",
  "to_location_id": "forsaken_lands"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "transaction_hash": "0xabc...def",
    "status": "pending",
    "estimated_gas": 100000,
    "characters_moved": 1,
    "from": "concord_searing",
    "to": "forsaken_lands"
  },
  "error": null
}
```

---

### GET /api/character-locations/sync/:characterId

Sync character location with blockchain (manual refresh).

**Request**:
```http
GET /api/character-locations/sync/1234
Authorization: Bearer <wallet_signature>
```

**Response** (200 OK):
```json
{
  "data": {
    "character_id": "1234",
    "location_id": "concord_searing",
    "wallet_address": "0xabc...123",
    "transaction_hash": "0x456...789",
    "block_number": 18500000,
    "status": "staked",
    "synced_at": "2025-01-01T00:00:00Z"
  },
  "error": null
}
```

---

## WebSocket API (Optional Real-Time)

### ws://api.example.com/locations/stream

Real-time updates for character location changes.

**Authentication**:
```http
Authorization: Bearer <wallet_signature>
```

**Message Types**:

#### Subscribe to character updates
```json
{
  "type": "subscribe",
  "character_ids": ["1234", "5678"]
}
```

#### Location update event
```json
{
  "type": "location_update",
  "data": {
    "character_id": "1234",
    "location_id": "forsaken_lands",
    "transaction_hash": "0xabc...def",
    "status": "confirmed",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Character already staked or location occupied |
| `BLOCKCHAIN_ERROR` | 422 | Blockchain transaction failed |
| `RATE_LIMITED` | 429 | Too many requests |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `CONTRACT_ERROR` | 500 | Smart contract interaction failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limits

- **GET /api/locations**: 100 requests/minute
- **GET /api/character-locations**: 60 requests/minute
- **POST /api/character-locations/***: 10 requests/minute
- **GET /api/character-locations/sync**: 30 requests/minute

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Authentication

All POST/PUT/DELETE endpoints require SIWE (Sign-In with Ethereum) authentication.

**Header**: `Authorization: Bearer <signature>`

**Signature Flow**:
1. Client requests nonce from `/api/auth/nonce`
2. User signs nonce with wallet
3. Client sends signature to `/api/auth/verify`
4. Server returns JWT token
5. Client uses JWT for subsequent requests

---

## Pagination

List endpoints support pagination:

**Request**:
```http
GET /api/locations?page=1&limit=20&sort=name&order=asc
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## Caching

### Cache Headers

**GET /api/locations**:
```
Cache-Control: public, max-age=300
ETag: "abc123"
```

**GET /api/character-locations**:
```
Cache-Control: private, max-age=30
ETag: "def456"
```

### Cache Invalidation

- Location data: Manual invalidation only (admin only)
- Character locations: Auto-invalidate on transaction confirmation
- Use `If-None-Match` header for conditional requests

---

## Webhook Integration (Optional)

Subscribe to location change webhooks:

**Endpoint**: `POST /api/webhooks/location-changes`

**Payload**:
```json
{
  "event": "character.location_changed",
  "data": {
    "character_id": "1234",
    "from_location": "concord_searing",
    "to_location": "forsaken_lands",
    "wallet_address": "0xabc...123",
    "transaction_hash": "0x456...789",
    "timestamp": "2025-01-01T00:00:00Z"
  }
}
```

---

**Status**: ✅ API Contracts Defined
**Next Step**: Implement API routes in Next.js
