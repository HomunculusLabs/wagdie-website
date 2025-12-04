# API Contract: Locations API

**Feature**: 018-map-editor
**Date**: 2025-12-03
**Base Path**: `/api/locations`

---

## Authentication

All write operations (POST, PATCH, DELETE) require:
1. Valid session (authenticated wallet)
2. Admin wallet verification via `isAdmin(session.address)`

Read operations (GET) are public.

---

## Endpoints

### GET /api/locations

Fetch all locations.

**Request**: No body or query parameters required.

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "dragons_lair",
      "name": "Dragon's Lair",
      "description": "A fearsome cavern of fire and gold",
      "metadata": {
        "coordinates": { "x": 450, "y": 320 },
        "rarity": "legendary"
      },
      "created_at": "2025-12-03T10:00:00Z",
      "updated_at": "2025-12-03T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- 500 Internal Server Error: Database connection failed

---

### POST /api/locations

Create a new location (Admin only).

**Request Headers**:
- Cookie: Session cookie (from wallet auth)

**Request Body**:
```json
{
  "name": "Dragon's Lair",
  "description": "A fearsome cavern of fire and gold",
  "coordinates": { "x": 450, "y": 320 }
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | ✅ | 1-200 chars, non-empty |
| description | string | ❌ | Max 2000 chars |
| coordinates | object | ✅ | { x: number, y: number } |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "dragons_lair",
    "name": "Dragon's Lair",
    "description": "A fearsome cavern of fire and gold",
    "metadata": {
      "coordinates": { "x": 450, "y": 320 }
    },
    "created_at": "2025-12-03T10:00:00Z",
    "updated_at": "2025-12-03T10:00:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation failed (name empty, coordinates missing)
- 401 Unauthorized: No session
- 403 Forbidden: Not an admin wallet
- 409 Conflict: Location with generated slug already exists
- 500 Internal Server Error: Database error

---

### GET /api/locations/[id]

Fetch a single location by ID.

**Path Parameters**:
- `id`: Location slug (e.g., `dragons_lair`)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "dragons_lair",
    "name": "Dragon's Lair",
    "description": "A fearsome cavern of fire and gold",
    "metadata": {
      "coordinates": { "x": 450, "y": 320 }
    },
    "created_at": "2025-12-03T10:00:00Z",
    "updated_at": "2025-12-03T10:00:00Z"
  }
}
```

**Error Responses**:
- 404 Not Found: Location does not exist
- 500 Internal Server Error: Database error

---

### PATCH /api/locations/[id]

Update a location (Admin only).

**Path Parameters**:
- `id`: Location slug (e.g., `dragons_lair`)

**Request Headers**:
- Cookie: Session cookie (from wallet auth)

**Request Body** (all fields optional):
```json
{
  "name": "Dragon's New Lair",
  "description": "Updated description",
  "coordinates": { "x": 500, "y": 350 }
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| name | string | ❌ | 1-200 chars if provided |
| description | string | ❌ | Max 2000 chars |
| coordinates | object | ❌ | { x: number, y: number } |

**Note**: Updating `name` does NOT change the `id` (slug). The ID is immutable after creation.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "dragons_lair",
    "name": "Dragon's New Lair",
    "description": "Updated description",
    "metadata": {
      "coordinates": { "x": 500, "y": 350 }
    },
    "created_at": "2025-12-03T10:00:00Z",
    "updated_at": "2025-12-03T11:00:00Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Validation failed
- 401 Unauthorized: No session
- 403 Forbidden: Not an admin wallet
- 404 Not Found: Location does not exist
- 500 Internal Server Error: Database error

---

### DELETE /api/locations/[id]

Delete a location (Admin only).

**Path Parameters**:
- `id`: Location slug (e.g., `dragons_lair`)

**Request Headers**:
- Cookie: Session cookie (from wallet auth)

**Pre-conditions**:
- No characters may be staked at this location

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Location deleted successfully"
}
```

**Error Responses**:
- 401 Unauthorized: No session
- 403 Forbidden: Not an admin wallet
- 404 Not Found: Location does not exist
- 409 Conflict: Characters are staked at this location
- 500 Internal Server Error: Database error

**409 Conflict Response Body**:
```json
{
  "success": false,
  "error": "Cannot delete location: 3 characters are staked here"
}
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "details": ["Optional array of specific validation errors"]
}
```

---

## Logging Requirements

All mutation operations (POST, PATCH, DELETE) must log:
- Timestamp
- Admin wallet address
- Operation type
- Location ID
- Success/failure status

Example log format:
```
[2025-12-03T10:00:00Z] [LOCATION] admin=0x5a7F...2dD3 action=create id=dragons_lair status=success
```
