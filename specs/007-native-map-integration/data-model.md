# Data Model: Native Map Integration

**Phase**: 1 - Design & Contracts
**Date**: 2025-11-03
**Feature**: 007-native-map-integration

## Entity Relationships

### Core Entities

```
┌─────────────┐
│  Location   │◄─────┐
└─────────────┘      │
     ▲               │
     │               │
     │               │
     │          ┌─────────────────────────┐
     │          │  CharacterLocation      │
     │          └─────────────────────────┘
     │                   │
     └───────────────────┘
          (links to)
```

### Detailed Relationships

#### Location → CharacterLocation (1-to-Many)
- One location can have many characters staked
- Location defines the geographic area on the map
- CharacterLocation references Location by `location_id`

#### CharacterLocation → Character (via token_id)
- Each CharacterLocation represents one character's position
- Not a formal database relationship (different schemas)
- Connected via `character_token_id` field

## Entity Definitions

### Location Entity

**Source**: Supabase `locations` table

```typescript
interface Location {
  id: string;                    // UUID (primary key)
  name: string;                  // Location name
  description?: string;          // Optional description
  metadata: LocationMetadata;    // JSONB with map positioning
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

interface LocationMetadata {
  bounds: [
    [number, number],            // Southwest corner [x, y]
    [number, number]             // Northeast corner [x, y]
  ];
  center?: [number, number];     // Optional center point
  area?: number;                 // Optional area size
  properties?: {
    terrain?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    special?: boolean;
  };
}
```

**Database Schema**:
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### CharacterLocation Entity

**Source**: Supabase `character_locations` table

```typescript
interface CharacterLocation {
  id: string;                    // UUID (primary key)
  character_token_id: number;    // WAGDIE token ID
  location_id: string;           // Foreign key to Location
  wallet_address: string;        // Owner wallet address
  transaction_hash: string;      // Blockchain transaction
  status: CharacterLocationStatus;
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp

  // Relations (eager loaded)
  location?: Location;           // Resolved Location
}

type CharacterLocationStatus =
  | 'pending'                    // Transaction in progress
  | 'confirmed'                  // Successfully staked
  | 'failed';                    // Transaction failed
```

**Database Schema**:
```sql
CREATE TABLE character_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_token_id INTEGER NOT NULL,
  location_id UUID REFERENCES locations(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_character_locations_token_id ON character_locations(character_token_id);
CREATE INDEX idx_character_locations_wallet ON character_locations(wallet_address);
CREATE INDEX idx_character_locations_status ON character_locations(status);
```

## Supporting Types

### Map Marker Types

```typescript
type MarkerType = 'location' | 'character' | 'burn' | 'death' | 'fight';

interface MapMarker {
  id: string;
  type: MarkerType;
  position: [number, number];    // [x, y] coordinates
  data: Location | CharacterLocation | Event;
}
```

### Layer Visibility

```typescript
interface LayerVisibility {
  locations: boolean;            // Show location markers
  characters: boolean;           // Show character markers
  burns: boolean;                // Show burn events
  deaths: boolean;               // Show death events
  fights: boolean;               // Show battle events
}
```

### Map Bounds

```typescript
interface MapBounds {
  southwest: [number, number];   // [x, y]
  northeast: [number, number];   // [x, y]
}

interface Viewport {
  bounds: MapBounds;
  zoom: number;
}
```

### Marker Popup Content

```typescript
interface PopupContent {
  title: string;
  description?: string;
  details?: {
    label: string;
    value: string | number;
  }[];
  actions?: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  }[];
}
```

## Repository Interfaces

### Location Repository

```typescript
interface LocationRepository {
  // Read operations
  getAll(): Promise<Location[]>;
  getById(id: string): Promise<Location | null>;
  getWithCharacters(id: string): Promise<Location | null>;

  // Write operations
  create(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location>;
  update(id: string, updates: Partial<Location>): Promise<Location>;
  delete(id: string): Promise<void>;
}
```

### Character Location Repository

```typescript
interface CharacterLocationRepository {
  // Read operations
  getAll(): Promise<CharacterLocation[]>;
  getByTokenId(tokenId: number): Promise<CharacterLocation | null>;
  getByWalletAddress(address: string): Promise<CharacterLocation[]>;
  getByLocationId(locationId: string): Promise<CharacterLocation[]>;
  getConfirmed(): Promise<CharacterLocation[]>;

  // Write operations
  create(
    location: Omit<CharacterLocation, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CharacterLocation>;
  update(id: string, updates: Partial<CharacterLocation>): Promise<CharacterLocation>;
  delete(id: string): Promise<void>;
}
```

## Service Interfaces

### Location Service

```typescript
interface LocationService {
  // Business logic
  getAvailableLocations(): Promise<Location[]>;
  getLocationWithOccupancy(id: string): Promise<LocationOccupancy | null>;
  validateLocationBounds(id: string, point: [number, number]): Promise<boolean>;
}

interface LocationOccupancy {
  location: Location;
  characterCount: number;
  characters: {
    tokenId: number;
    walletAddress: string;
  }[];
}
```

### Character Location Service

```typescript
interface CharacterLocationService {
  // Business logic
  getCharacterLocation(tokenId: number): Promise<CharacterLocation | null>;
  getWalletCharacters(address: string): Promise<CharacterLocation[]>;
  getAllCharacterPositions(): Promise<MapMarker[]>;
  getPositionsByLayer(layer: MarkerType): Promise<MapMarker[]>;
}
```

## Data Flow

### 1. Map Initialization Flow

```
User visits /map
    ↓
NativeMap component mounts
    ↓
Load map bounds from wagdiemap.png
    ↓
Fetch locations from Supabase
    ↓
Fetch character_locations from Supabase
    ↓
Render markers based on active layers
    ↓
Display interactive map
```

### 2. Character Location Update Flow

```
User stakes character to location
    ↓
Blockchain transaction initiated
    ↓
Transaction confirmed
    ↓
Webhook/cron updates Supabase character_locations
    ↓
React Query cache invalidated
    ↓
Map re-renders with new position
    ↓
User sees updated marker
```

### 3. Layer Toggle Flow

```
User clicks layer toggle
    ↓
LayerVisibility state updated
    ↓
Conditional rendering checks active layers
    ↓
Markers for hidden layers unmounted
    ↓
Markers for visible layers mounted
    ↓
Map performance optimized
```

## Database Queries

### Common Queries

#### Get All Locations with Character Count

```sql
SELECT
  l.id,
  l.name,
  l.metadata,
  COUNT(cl.id) as character_count
FROM locations l
LEFT JOIN character_locations cl ON l.id = cl.location_id
WHERE cl.status = 'confirmed' OR cl.status IS NULL
GROUP BY l.id, l.name, l.metadata
ORDER BY l.name;
```

#### Get Character's Current Location

```sql
SELECT
  cl.*,
  l.name as location_name,
  l.metadata as location_metadata
FROM character_locations cl
JOIN locations l ON cl.location_id = l.id
WHERE cl.character_token_id = $1
  AND cl.status = 'confirmed'
ORDER BY cl.updated_at DESC
LIMIT 1;
```

#### Get Wallet's Characters with Locations

```sql
SELECT
  cl.*,
  l.name as location_name,
  l.metadata as location_metadata
FROM character_locations cl
JOIN locations l ON cl.location_id = l.id
WHERE cl.wallet_address = $1
  AND cl.status = 'confirmed'
ORDER BY cl.updated_at DESC;
```

#### Get All Confirmed Character Positions for Map

```sql
SELECT
  cl.character_token_id,
  cl.wallet_address,
  l.metadata->'center' as position,
  l.metadata->'bounds' as bounds,
  l.name as location_name
FROM character_locations cl
JOIN locations l ON cl.location_id = l.id
WHERE cl.status = 'confirmed'
ORDER BY cl.updated_at DESC;
```

## Migration Scripts

### Initial Location Data

```sql
-- Insert sample locations (adjust metadata as needed)
INSERT INTO locations (name, description, metadata) VALUES
('The Cathedral', 'A grand cathedral of the WAGDIE', '{
  "bounds": [[0, 0], [100, 100]],
  "center": [50, 50],
  "area": 10000,
  "properties": {
    "terrain": "urban",
    "difficulty": "medium",
    "special": true
  }
}'),
('The Outskirts', 'Wasteland beyond the city', '{
  "bounds": [[100, 0], [200, 100]],
  "center": [150, 50],
  "area": 10000,
  "properties": {
    "terrain": "wasteland",
    "difficulty": "easy",
    "special": false
  }
}');
```

## Indexes & Performance

### Recommended Indexes

```sql
-- locations table
CREATE INDEX idx_locations_name ON locations(name);

-- character_locations table
CREATE INDEX idx_character_locations_token_id ON character_locations(character_token_id);
CREATE INDEX idx_character_locations_wallet ON character_locations(wallet_address);
CREATE INDEX idx_character_locations_status ON character_locations(status);
CREATE INDEX idx_character_locations_location ON character_locations(location_id);

-- Composite indexes for common queries
CREATE INDEX idx_character_locations_wallet_status ON character_locations(wallet_address, status);
CREATE INDEX idx_character_locations_location_status ON character_locations(location_id, status);
```

### Query Performance Considerations

1. **Character count per location**: Use COUNT with JOIN (efficient with indexes)
2. **Wallet character fetch**: Filter by wallet_address + status (composite index)
3. **Map marker positions**: Only fetch confirmed status (partial index recommended)

```sql
-- Partial index for confirmed statuses only
CREATE INDEX idx_character_locations_confirmed ON character_locations(wallet_address, location_id)
WHERE status = 'confirmed';
```

## Data Integrity

### Constraints

```sql
-- Ensure character_token_id is positive
ALTER TABLE character_locations
ADD CONSTRAINT chk_character_token_id_positive
CHECK (character_token_id > 0);

-- Ensure location_id references existing location
ALTER TABLE character_locations
ADD CONSTRAINT fk_character_locations_location
FOREIGN KEY (location_id) REFERENCES locations(id);

-- Ensure metadata has required fields
ALTER TABLE locations
ADD CONSTRAINT chk_location_metadata_bounds
CHECK (
  metadata ? 'bounds' AND
  jsonb_typeof(metadata->'bounds') = 'array' AND
  jsonb_array_length(metadata->'bounds') = 2
);
```

### Validation Rules

1. **Location bounds must be valid**: southwest < northeast
2. **Character can only have one confirmed location at a time**
3. **Location metadata must include bounds**

## Next Steps

✅ Entity relationships documented
✅ TypeScript interfaces defined
✅ Repository interfaces specified
✅ Database queries planned
✅ Migration scripts prepared

**Proceed to**: Implementation phase with tasks.md generation
