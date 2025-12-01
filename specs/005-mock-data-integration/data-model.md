# Data Model: Mock Data Integration

**Feature**: 005-mock-data-integration
**Date**: 2025-10-29

## Overview

This document defines the complete structure of sample data for testing and demonstration. All data structures match existing database schema from migrations.

## Sample Data Summary

| Entity | Count | Status | Notes |
|--------|-------|--------|-------|
| Characters | 50 | ✅ To Create | Token IDs 1-50 |
| Tweets | 60 | ✅ To Create | Spread over 30 days |
| Character Concords | 10 | ✅ To Create | Links to Concord #15 |
| Locations | 4 | ✅ Already Seeded | From migration |
| Concords | 1 | ✅ Already Seeded | Concord #15 from migration |
| Users | 3 | ✅ To Create | Test wallet addresses |

## Entity Definitions

### 1. Characters (50 records)

**Table**: `characters`

**Schema**:
```typescript
interface Character {
  id: UUID;                    // Auto-generated
  token_id: number;            // 1-50
  contract_address: string;    // WAGDIE contract address
  owner_address: string | null; // Test wallet or null
  name: string | null;         // Dark fantasy name
  class: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric';
  level: number;               // 1-5
  experience: number;          // Based on level

  // D&D Stats (1-20)
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;

  // Combat Stats
  hp: number;                  // Current HP (≤ max_hp)
  max_hp: number;              // Maximum HP
  ac: number;                  // Armor Class (10-25)
  speed: number;               // Movement speed (30)

  // Equipment (JSONB)
  equipment: {
    armor?: string;
    back?: string;
    mask?: string;
  };

  // Story
  background_story: string | null;

  // Game State
  infection_status: 'healthy' | 'infected' | 'cured';
  staking_status: 'unstaked' | 'staked';
  location_id: string | null;  // References locations table

  // Blockchain
  burned: boolean;             // Always false for sample data
  image_url: string;           // Path to existing image asset
  metadata: JSONB | null;      // Optional

  created_at: timestamp;
  updated_at: timestamp;
}
```

**Distribution**:
- **Infection**: 17 healthy, 17 infected, 16 cured
- **Staking**: 25 unstaked, 25 staked (distributed across 4 locations)
- **Ownership**: 20 owned by wallet1, 20 by wallet2, 10 unowned
- **Equipment**: 20 full sets, 15 partial, 15 none
- **Classes**: 12-13 per class (Warrior/Mage/Rogue/Cleric)
- **Levels**: Random 1-5 with normal distribution

**Sample Character** (Token #1):
```typescript
{
  token_id: 1,
  contract_address: '0x659A4BdcA...',  // WAGDIE contract
  owner_address: '0x1111111111111111111111111111111111111111',
  name: 'Grim Theron the Cursed',
  class: 'Warrior',
  level: 3,
  experience: 900,
  str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10,
  hp: 42, max_hp: 42,
  ac: 16, speed: 30,
  equipment: {
    armor: 'Darksteel Plate',
    back: 'Tattered Cloak',
    mask: 'Skull Visage'
  },
  background_story: 'Once a noble knight, now cursed to wander the wastes...',
  infection_status: 'infected',
  staking_status: 'staked',
  location_id: 'the-ruins',
  burned: false,
  image_url: '/images/interactive-1.png'
}
```

**Character Names** (50 total):
1. Grim Theron the Cursed
2. Elara Nightshade
3. Kael the Forsaken
4. Morgath Shadowbane
5. Lyra of the Wastes
6. Vex the Wanderer
7. Rook Ashborne
8. Selene Darkwater
9. Thane Ironheart
10. Ash of the Void
11. Corvus Blackthorn
12. Mira the Lost
13. Draven Grimshaw
14. Nyx Shadowmere
15. Orin the Fallen
16. Zara Nightwhisper
17. Rune the Forgotten
18. Sable Darkwind
19. Torn of the Depths
20. Vesper Moonbane
_(Continue to 50 with similar naming pattern)_

**Image Rotation** (6 images cycle):
```typescript
const images = [
  '/images/interactive-1.png',
  '/images/interactive-2.png',
  '/images/interactive-3.png',
  '/images/story-1.png',
  '/images/story-2.png',
  '/images/story-3.png'
];
// Character tokenId % images.length
```

---

### 2. Tweets (60 records)

**Table**: `tweets`

**Schema**:
```typescript
interface Tweet {
  tweet_id: string;            // UUID
  text: string;                // Tweet content
  author_username: string;     // '@WAGDIE_ETH'
  media_type: 'none' | 'image' | 'video';
  media_url: string | null;    // Image URL if media_type = 'image'
  video_url: string | null;    // Video URL if media_type = 'video'
  engagement_count: JSONB | null;
  is_reply: boolean;           // Always false
  is_retweet: boolean;         // Always false
  created_at: timestamp;       // Spread over past 30 days
  fetched_at: timestamp;
}
```

**Distribution**:
- **Media Types**: 30 text-only (50%), 18 with images (30%), 12 with videos (20%)
- **Timeline**: Evenly spread over past 30 days (2 tweets per day)
- **Author**: All from '@WAGDIE_ETH'

**Sample Tweets**:

**Text-Only**:
```typescript
{
  tweet_id: 'uuid-1',
  text: 'The darkness spreads across the realm. Who will stand against it?',
  author_username: '@WAGDIE_ETH',
  media_type: 'none',
  media_url: null,
  video_url: null,
  is_reply: false,
  is_retweet: false,
  created_at: '2025-10-29T12:00:00Z'
}
```

**With Image**:
```typescript
{
  tweet_id: 'uuid-2',
  text: 'New character reveal: Grim Theron emerges from the ruins...',
  author_username: '@WAGDIE_ETH',
  media_type: 'image',
  media_url: '/images/interactive-1.png',
  video_url: null,
  is_reply: false,
  is_retweet: false,
  created_at: '2025-10-28T12:00:00Z'
}
```

**With Video**:
```typescript
{
  tweet_id: 'uuid-3',
  text: 'Watch the infection spread in real-time...',
  author_username: '@WAGDIE_ETH',
  media_type: 'video',
  media_url: null,
  video_url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
  is_reply: false,
  is_retweet: false,
  created_at: '2025-10-27T12:00:00Z'
}
```

**Tweet Content Themes**:
- Lore announcements ("The ancient ones awaken...")
- Character reveals ("Meet the warriors of...")
- Game mechanics ("Staking is now live at...")
- Community engagement ("Share your character stories...")
- Event announcements ("The Concord ritual begins...")

---

### 3. Character Concords (10 records)

**Table**: `character_concords`

**Schema**:
```typescript
interface CharacterConcord {
  id: UUID;                    // Auto-generated
  token_id: number;            // References characters
  concord_id: number;          // Always 15 (Strange Mushroom)
  quantity: number;            // 1-3
  is_seared: boolean;          // false (not yet seared)
  seared_at: timestamp | null; // null
  created_at: timestamp;
}
```

**Distribution**:
- 10 random characters (token IDs 5, 12, 18, 23, 31, 37, 42, 45, 48, 50)
- Concord #15 (Strange Mushroom) - already seeded in migration
- Quantity varies: 6 have qty=1, 3 have qty=2, 1 has qty=3

**Sample Record**:
```typescript
{
  token_id: 5,
  concord_id: 15,
  quantity: 1,
  is_seared: false,
  seared_at: null
}
```

---

### 4. Users (3 records)

**Table**: `users`

**Schema**:
```typescript
interface User {
  id: UUID;                    // Auto-generated
  eth_address: string;         // UNIQUE
  created_at: timestamp;
  last_login_at: timestamp;
  login_count: number;
}
```

**Test Wallets**:
```typescript
const testWallets = [
  '0x1111111111111111111111111111111111111111', // Owns characters 1-20
  '0x2222222222222222222222222222222222222222', // Owns characters 21-40
  '0x3333333333333333333333333333333333333333'  // Unused (for future tests)
];
```

**Sample Record**:
```typescript
{
  eth_address: '0x1111111111111111111111111111111111111111',
  created_at: '2025-10-01T00:00:00Z',
  last_login_at: '2025-10-29T00:00:00Z',
  login_count: 5
}
```

---

### 5. Locations (4 records) - Already Seeded

**Table**: `locations`

**Schema**:
```typescript
interface Location {
  id: string;                  // PRIMARY KEY
  name: string;
  description: string;
  is_active: boolean;
  created_at: timestamp;
}
```

**Existing Locations** (from migration):
1. `the-ruins` - "The Ruins" - Ancient crumbling structures
2. `crossroads` - "Crossroads" - Meeting point for travelers
3. `dark-forest` - "Dark Forest" - Dense woodland danger
4. `haven` - "Haven" - Safe refuge from darkness

**Character Distribution** (for staked characters):
- The Ruins: 7 characters
- Crossroads: 6 characters
- Dark Forest: 6 characters
- Haven: 6 characters
- Total staked: 25 characters

---

### 6. Concords (1 record) - Already Seeded

**Table**: `concords`

**Schema**:
```typescript
interface Concord {
  concord_id: number;          // PRIMARY KEY
  name: string;
  description: string;
  image_url: string;
  is_consumable: boolean;
  effect_type: 'stat_boost' | 'ability' | 'passive';
  created_at: timestamp;
}
```

**Existing Concord** (from migration):
```typescript
{
  concord_id: 15,
  name: 'Strange Mushroom',
  description: 'A mysterious mushroom obtained from burning corpses. Can be used to spread infections or target specific pilgrims.',
  image_url: '/images/concords/strange-mushroom.png',
  is_consumable: true,
  effect_type: 'ability'
}
```

---

## Data Relationships

```
characters
├── → locations (via location_id)
├── → users (via owner_address = eth_address)
└── ← character_concords (via token_id)
    └── → concords (via concord_id)

tweets
└── (standalone, no relationships)

users
└── ← characters (via eth_address = owner_address)
```

---

## Data Validation Rules

### Characters
- `token_id`: 1-50, UNIQUE with contract_address
- `str, dex, con, int, wis, cha`: 1-20
- `level`: 1-5
- `hp`: > 0, ≤ max_hp
- `max_hp`: > 0
- `ac`: 10-25
- `speed`: 10-50 (default 30)
- `infection_status`: 'healthy' | 'infected' | 'cured'
- `staking_status`: 'unstaked' | 'staked'
- `class`: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric'
- `equipment`: Valid JSONB object or null
- `location_id`: Must reference existing location if not null
- `image_url`: Must reference existing file in public/images/

### Tweets
- `tweet_id`: UNIQUE (UUID)
- `text`: NOT NULL
- `author_username`: NOT NULL
- `media_type`: 'none' | 'image' | 'video'
- `created_at`: NOT NULL

### Character Concords
- `token_id`: Must reference existing character
- `concord_id`: Must reference existing concord (15)
- `quantity`: ≥ 1
- UNIQUE(token_id, concord_id)

---

## Implementation Notes

1. **Idempotency**: Use `ON CONFLICT (token_id, contract_address) DO NOTHING` for characters
2. **Order of Insertion**: Users → Characters → Character Concords → Tweets
3. **Referential Integrity**: Verify locations and concords exist before inserting dependent records
4. **Error Handling**: Continue on error, log failed records, display summary
5. **Performance**: Batch inserts where possible (insert 50 characters in one call)

---

## Next Steps

1. Implement seed script using this data model
2. Verify all constraints are satisfied
3. Test idempotency by running script twice
4. Verify UI pages load correctly with sample data
