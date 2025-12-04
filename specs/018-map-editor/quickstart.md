# Quickstart: Map Location Pin Editor

**Feature**: 018-map-editor
**Date**: 2025-12-03

## Prerequisites

1. Node.js 18+ installed
2. Project dependencies installed (`npm install`)
3. Supabase database running with existing `locations` table
4. Environment variables configured (`.env.local`)

## Development Setup

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Connect Admin Wallet

Navigate to `http://localhost:3000/map-editor` and connect your wallet using RainbowKit.

**Admin Wallet** (for testing): `0x5a7F5938deA6238137043415e28efd99A6532dD3`

If using a different wallet, add it to `lib/auth/admin.ts`:

```typescript
export const ADMIN_WALLETS = [
  '0x5a7F5938deA6238137043415e28efd99A6532dD3',
  '0xYourWalletAddress', // Add your wallet
] as const
```

## Key Files

| File | Purpose |
|------|---------|
| `app/map-editor/page.tsx` | Editor page entry point |
| `app/api/locations/route.ts` | GET all, POST new |
| `app/api/locations/[id]/route.ts` | GET/PATCH/DELETE single |
| `components/map-editor/MapEditorContainer.tsx` | Main editor UI |
| `hooks/map/useMapEditor.ts` | Editor state management |
| `lib/services/location-service.ts` | Business logic |
| `lib/utils/slug.ts` | ID generation |

## Testing

### Run All Tests

```bash
npm test
```

### Run Map Editor Tests Only

```bash
npm test -- --testPathPattern="map-editor"
```

### Manual Testing Checklist

1. **Access Control**
   - [ ] Non-admin wallet sees "Access Denied"
   - [ ] Admin wallet sees editor controls

2. **Create Location**
   - [ ] Click "Add Location" mode
   - [ ] Click on map to place pin
   - [ ] Fill in name, optional description
   - [ ] Click Save
   - [ ] Verify pin appears on map

3. **Edit Location**
   - [ ] Click existing pin
   - [ ] Modify name or description
   - [ ] Click Save
   - [ ] Verify changes persist

4. **Delete Location**
   - [ ] Click existing pin
   - [ ] Click Delete
   - [ ] Confirm in modal
   - [ ] Verify pin removed

5. **Reposition Location**
   - [ ] Drag existing pin to new position
   - [ ] Verify coordinates saved

## API Examples

### Create Location

```bash
curl -X POST http://localhost:3000/api/locations \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Dragon'\''s Lair",
    "description": "A fearsome cavern",
    "coordinates": { "x": 450, "y": 320 }
  }'
```

### Update Location

```bash
curl -X PATCH http://localhost:3000/api/locations/dragons_lair \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "description": "Updated description"
  }'
```

### Delete Location

```bash
curl -X DELETE http://localhost:3000/api/locations/dragons_lair \
  -H "Cookie: your-session-cookie"
```

## Troubleshooting

### "Not authenticated" Error

- Ensure you're signed in via wallet connect
- Check that session cookie is present
- Verify SIWE authentication is working

### "Not an admin" Error

- Check your wallet address in browser console
- Verify it's in `ADMIN_WALLETS` array (case-insensitive)

### Map Not Loading

- Check browser console for Phaser errors
- Verify `/public/images/wagdiemap.png` exists
- Check Supabase connection in network tab

### Locations Not Saving

- Check API response in network tab
- Verify Supabase service role key is set
- Check RLS policies allow service role writes

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Map Editor Page                       │
│  ┌─────────────┐  ┌─────────────────────────────────┐  │
│  │ AdminGate   │  │     MapEditorContainer          │  │
│  │             │  │  ┌───────────┐ ┌─────────────┐  │  │
│  │ ┌─────────┐ │  │  │EditorCtrl │ │LocationForm │  │  │
│  │ │ Check   │ │  │  └───────────┘ └─────────────┘  │  │
│  │ │ isAdmin │ │  │  ┌───────────────────────────┐  │  │
│  │ └─────────┘ │  │  │      Phaser Canvas        │  │  │
│  └─────────────┘  │  │   (existing map game)     │  │  │
│                   │  └───────────────────────────┘  │  │
│                   └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ /api/locations  │  │ /api/locations/[id]         │  │
│  │ GET, POST       │  │ GET, PATCH, DELETE          │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Service Layer                            │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │LocationService  │  │ LocationRepository          │  │
│  │ (business logic)│  │ (Supabase CRUD)            │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                 Supabase PostgreSQL                      │
│  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   locations     │  │ character_locations         │  │
│  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Next Steps

After implementation, run `/speckit.tasks` to generate the task breakdown for development.
