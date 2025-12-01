# Quickstart: Character Editor

**Feature**: 012-character-editor
**Date**: 2025-11-29

## Overview

This feature enables character owners to edit their character's name and stats through the existing character detail page.

## Prerequisites

- Node.js 18+
- Running Supabase database (local or cloud)
- Wallet with owned characters for testing

## Quick Setup

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start development server
npm run dev

# 3. Navigate to a character you own
# http://localhost:3000/characters/[YOUR_TOKEN_ID]
```

## Key Files

### Backend (API + Data Layer)

| File | Purpose |
|------|---------|
| `app/api/characters/[tokenId]/route.ts` | PATCH endpoint for character updates |
| `lib/services/character-service.ts` | Business logic for character operations |
| `lib/repositories/character-repository.ts` | Database operations |
| `lib/utils/stat-validation.ts` | Validation utilities (NEW) |

### Frontend (UI Components)

| File | Purpose |
|------|---------|
| `app/characters/[tokenId]/page.tsx` | Character detail page with edit mode |
| `components/characters/StatEditor.tsx` | Stat input component (NEW) |
| `components/characters/NameEditor.tsx` | Name input component (NEW) |

### Types

| File | Purpose |
|------|---------|
| `types/character.ts` | Character type with EditableCharacterFields |

## API Usage

### Update Character Stats

```bash
# Update core stats
curl -X PATCH http://localhost:3000/api/characters/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{
    "str": 16,
    "dex": 14,
    "con": 15,
    "int": 10,
    "wis": 12,
    "cha": 8
  }'
```

### Update Character Name

```bash
curl -X PATCH http://localhost:3000/api/characters/123 \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION" \
  -d '{
    "name": "Grimholt the Unburnt"
  }'
```

## Validation Rules

| Field | Range | Notes |
|-------|-------|-------|
| name | 0-100 chars | Empty string clears name |
| str, dex, con, int, wis, cha | 1-30 | Core stats |
| hp | 0-999 | Current hit points |
| max_hp | 1-999 | Maximum hit points |
| ac | 0-30 | Armor class |
| speed | 0-120 | Movement in feet |
| level | 1-20 | Character level |
| experience | 0-999999 | XP points |

## Testing

```bash
# Run all tests
npm test

# Run character editor tests only
npm test -- --testPathPattern="stat|character"

# Run with coverage
npm test -- --coverage
```

## User Flow

1. Connect wallet (RainbowKit)
2. Navigate to `/characters/[tokenId]` for an owned character
3. Click "Edit" button
4. Modify name and/or stats
5. Click "Save" to persist changes
6. See success toast notification

## Troubleshooting

### "You do not own this character" error
- Verify wallet is connected
- Check that your wallet address matches character's `owner_address`
- Run ownership sync if blockchain state is stale

### Validation errors
- Ensure values are within valid ranges
- Name must be 100 characters or less
- Stats must be integers, not decimals

### Changes not persisting
- Check browser console for API errors
- Verify Supabase connection is active
- Check network tab for failed requests
