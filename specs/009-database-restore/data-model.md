# Data Model: Database Restoration Migration

**Date**: 2025-11-19
**Source**: wagdie.json analysis
**Target**: Supabase PostgreSQL schema

## Entity Analysis

### 1. Character Sheets (31 records)

**JSON Structure**:
```typescript
interface CharacterSheet {
  id: string; // "dev:character_sheets/1124"
  hit_points: number;
  experience_points: number;
  tokenIdInt: number;
  level: number;
  origin: string;
  name: string;
  equipment: {
    armor: string;
    back: string;
    mask: string;
  };
  attributes: {
    dexterity: number;
    constitution: number;
    strength: number;
    charisma: number;
    wisdom: number;
    intelligence: number;
  };
  location: string;
  background_story?: string; // Optional field
}
```

**Target Schema**:
```sql
CREATE TABLE character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  level INTEGER DEFAULT 1,
  origin VARCHAR(255),
  location VARCHAR(255) DEFAULT 'Unknown',
  hit_points INTEGER NOT NULL,
  experience_points INTEGER DEFAULT 0,
  equipment JSONB NOT NULL,
  attributes JSONB NOT NULL,
  background_story TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_character_sheets_token_id ON character_sheets(token_id);
CREATE INDEX idx_character_sheets_name ON character_sheets(name);
```

### 2. Login Records (26 records)

**JSON Structure**:
```typescript
interface LoginRecord {
  id: string; // "dev:logins/[identifier]"
  // Fields to be analyzed from actual JSON structure
}
```

**Target Schema**:
```sql
CREATE TABLE login_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(255) UNIQUE NOT NULL, -- Ethereum wallet address
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_records_address ON login_records(user_address);
```

### 3. Metadata (6666 records)

**JSON Structure**:
```typescript
interface Metadata {
  id: string; // "dev:metadata/[identifier]"
  // Large dataset requiring analysis for specific fields
  // Likely includes NFT metadata, properties, traits
}
```

**Target Schema**:
```sql
CREATE TABLE metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255),
  description TEXT,
  image_url TEXT,
  attributes JSONB, -- NFT attributes/traits
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metadata_token_id ON metadata(token_id);
CREATE INDEX idx_metadata_name ON metadata(name);
```

### 4. Tokens (6693 records)

**JSON Structure**:
```typescript
interface Token {
  id: string; // "dev:tokens/[identifier]"
  // Blockchain token data
  // Links to character_sheets and metadata
}
```

**Target Schema**:
```sql
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  owner_address VARCHAR(255), -- Current owner wallet address
  character_sheet_id UUID REFERENCES character_sheets(id),
  metadata_id UUID REFERENCES metadata(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tokens_token_id ON tokens(token_id);
CREATE INDEX idx_tokens_owner ON tokens(owner_address);
CREATE INDEX idx_tokens_character_sheet ON tokens(character_sheet_id);
CREATE INDEX idx_tokens_metadata ON tokens(metadata_id);
```

### 5. Tweets (1124 records)

**JSON Structure**:
```typescript
interface Tweet {
  id: string; // "dev:tweets/[identifier]"
  content: string;
  author_id: string; // References tweet_authors
  created_at: string;
  // Additional social media metadata
}
```

**Target Schema**:
```sql
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tweet_author_id UUID REFERENCES tweet_authors(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tweets_author ON tweets(tweet_author_id);
CREATE INDEX idx_tweets_created ON tweets(created_at);
```

### 6. Tweet Authors (1 record)

**JSON Structure**:
```typescript
interface TweetAuthor {
  id: string; // "dev:tweet_authors/[identifier]"
  username: string;
  display_name: string;
  profile_image?: string;
}
```

**Target Schema**:
```sql
CREATE TABLE tweet_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tweet_authors_username ON tweet_authors(username);
```

## Migration Data Flow

### Primary Key Strategy
- **JSON IDs**: Parse numeric identifier from paths (e.g., "dev:character_sheets/1124" → 1124)
- **Database IDs**: Generate UUID primary keys for better distributed system compatibility
- **Foreign Keys**: Maintain relationships using generated UUIDs

### Data Validation Rules

```typescript
interface ValidationRule {
  entity: string;
  field: string;
  type: 'required' | 'format' | 'range' | 'unique';
  validator: (value: any) => boolean;
  errorMessage: string;
}

const validationRules: ValidationRule[] = [
  // Character Sheets
  {
    entity: 'character_sheets',
    field: 'token_id',
    type: 'required',
    validator: (value) => typeof value === 'number' && value > 0,
    errorMessage: 'Token ID must be a positive number'
  },
  {
    entity: 'character_sheets',
    field: 'name',
    type: 'required',
    validator: (value) => typeof value === 'string' && value.length > 0,
    errorMessage: 'Character name is required'
  },
  // Tokens
  {
    entity: 'tokens',
    field: 'token_id',
    type: 'unique',
    validator: (value) => typeof value === 'number' && value > 0,
    errorMessage: 'Token ID must be unique positive number'
  }
];
```

### Referential Integrity Constraints

1. **Tokens → Character Sheets**: Optional relationship (not all tokens have characters)
2. **Tokens → Metadata**: Required relationship (all tokens should have metadata)
3. **Tweets → Tweet Authors**: Required relationship (all tweets must have authors)
4. **Login Records**: No foreign key dependencies

### Migration Order Dependencies

1. **Phase 1**: Independent entities (no dependencies)
   - tweet_authors (1 record)
   - login_records (26 records)
   - metadata (6666 records)

2. **Phase 2**: Dependent entities
   - character_sheets (31 records)
   - tokens (6693 records) - depends on character_sheets and metadata

3. **Phase 3**: Final dependent entity
   - tweets (1124 records) - depends on tweet_authors

## Batch Processing Strategy

### Batch Size Optimization
```typescript
const batchConfig = {
  small_entities: { batchSize: 1000, parallelBatches: 1 },  // < 100 records
  medium_entities: { batchSize: 500, parallelBatches: 2 },   // 100-1000 records
  large_entities: { batchSize: 100, parallelBatches: 4 },    // 1000+ records
  very_large_entities: { batchSize: 50, parallelBatches: 8 } // 5000+ records
};
```

### Checkpoint Strategy
- **Frequency**: Every 1000 records or every 30 seconds
- **Persistence**: Store in migration_checkpoints table
- **Resume Capability**: Continue from last successful batch
- **Rollback**: Complete transaction rollback on critical failures

## TypeScript Type Definitions

```typescript
// Migration framework types
export interface MigrationEntity {
  name: string;
  jsonPath: string;
  tableName: string;
  batchSize: number;
  dependencies: string[];
  transformFunction: (data: any) => any;
  validationRules: ValidationRule[];
}

export interface MigrationCheckpoint {
  id: string;
  entity_name: string;
  last_processed_index: number;
  total_records: number;
  batch_id: string;
  created_at: Date;
}

export interface MigrationResult {
  entity_name: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  success_rate: number;
  duration_ms: number;
  error_details: ValidationError[];
}

// Entity-specific types
export interface CharacterSheetRecord {
  tokenId: number;
  name: string;
  level: number;
  origin: string;
  location: string;
  hitPoints: number;
  experiencePoints: number;
  equipment: Equipment;
  attributes: Attributes;
  backgroundStory?: string;
}

export interface Equipment {
  armor: string;
  back: string;
  mask: string;
}

export interface Attributes {
  dexterity: number;
  constitution: number;
  strength: number;
  charisma: number;
  wisdom: number;
  intelligence: number;
}
```

## Data Transformation Functions

```typescript
export class DataTransformer {
  static transformCharacterSheet(jsonData: any): CharacterSheetRecord {
    const idParts = jsonData.id.split('/');
    const tokenId = parseInt(idParts[idParts.length - 1]);

    return {
      tokenId: jsonData.tokenIdInt || tokenId,
      name: jsonData.name,
      level: jsonData.level || 1,
      origin: jsonData.origin || 'Unknown',
      location: jsonData.location || 'Unknown',
      hitPoints: jsonData.hit_points || 0,
      experiencePoints: jsonData.experience_points || 0,
      equipment: jsonData.equipment || { armor: 'None', back: 'None', mask: 'None' },
      attributes: jsonData.attributes || {
        dexterity: 0, constitution: 0, strength: 0,
        charisma: 0, wisdom: 0, intelligence: 0
      },
      backgroundStory: jsonData.background_story
    };
  }

  static extractTokenId(jsonId: string): number {
    const parts = jsonId.split('/');
    return parseInt(parts[parts.length - 1]);
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateEthereumAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  }
}
```

## Performance Considerations

### Index Strategy
- **Primary Keys**: UUID with default indexing
- **Foreign Keys**: Explicit indexes for join performance
- **Search Fields**: Username, token_id, character names
- **Time Fields**: created_at for time-based queries

### Query Optimization
- **Batch Inserts**: Use Supabase batch insert API
- **Transaction Management**: Group related operations in transactions
- **Connection Pooling**: Leverage Supabase connection pooling
- **Memory Management**: Process data in chunks to avoid memory overflow

### Monitoring Metrics
- **Throughput**: Records per second by entity type
- **Error Rate**: Failed records vs total processed
- **Memory Usage**: Peak memory consumption during migration
- **Database Load**: Query execution times and connection usage