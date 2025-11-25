-- Database Restoration Migration Schema
-- Created: 2025-11-19
-- Feature: 009-database-restore
-- Purpose: Schema for importing wagdie.json data into Supabase

-- Character Sheets table: RPG character data with attributes and equipment
CREATE TABLE IF NOT EXISTS character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  level INTEGER DEFAULT 1,
  origin VARCHAR(255),
  location VARCHAR(255) DEFAULT 'Unknown',
  hit_points INTEGER NOT NULL DEFAULT 0,
  experience_points INTEGER DEFAULT 0,
  equipment JSONB NOT NULL DEFAULT '{}',
  attributes JSONB NOT NULL DEFAULT '{}',
  background_story TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login Records table: User wallet login tracking
CREATE TABLE IF NOT EXISTS login_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address VARCHAR(255) UNIQUE NOT NULL,
  last_login TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metadata table: NFT metadata with traits and attributes
CREATE TABLE IF NOT EXISTS metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  name VARCHAR(255),
  description TEXT,
  image_url TEXT,
  attributes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tokens table: NFT token ownership and relationships
CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER UNIQUE NOT NULL,
  owner_address VARCHAR(255),
  character_sheet_id UUID REFERENCES character_sheets(id),
  metadata_id UUID REFERENCES metadata(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tweet Authors table: Twitter/X author information
CREATE TABLE IF NOT EXISTS tweet_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tweets table: Twitter/X post content
CREATE TABLE IF NOT EXISTS tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  tweet_author_id UUID NOT NULL REFERENCES tweet_authors(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration Checkpoints table: Track migration progress and resumability
CREATE TABLE IF NOT EXISTS migration_checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_id VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  last_processed_index INTEGER NOT NULL DEFAULT 0,
  total_records INTEGER NOT NULL DEFAULT 0,
  batch_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_sheets_token_id ON character_sheets(token_id);
CREATE INDEX IF NOT EXISTS idx_character_sheets_name ON character_sheets(name);
CREATE INDEX IF NOT EXISTS idx_login_records_address ON login_records(user_address);
CREATE INDEX IF NOT EXISTS idx_metadata_token_id ON metadata(token_id);
CREATE INDEX IF NOT EXISTS idx_metadata_name ON metadata(name);
CREATE INDEX IF NOT EXISTS idx_tokens_token_id ON tokens(token_id);
CREATE INDEX IF NOT EXISTS idx_tokens_owner ON tokens(owner_address);
CREATE INDEX IF NOT EXISTS idx_tokens_character_sheet ON tokens(character_sheet_id);
CREATE INDEX IF NOT EXISTS idx_tokens_metadata ON tokens(metadata_id);
CREATE INDEX IF NOT EXISTS idx_tweets_author ON tweets(tweet_author_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created ON tweets(created_at);
CREATE INDEX IF NOT EXISTS idx_tweet_authors_username ON tweet_authors(username);
CREATE INDEX IF NOT EXISTS idx_migration_checkpoints_migration ON migration_checkpoints(migration_id);
CREATE INDEX IF NOT EXISTS idx_migration_checkpoints_entity ON migration_checkpoints(entity_name);

-- Row Level Security (RLS)
ALTER TABLE character_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_checkpoints ENABLE ROW LEVEL SECURITY;

-- Public read policies for game data
CREATE POLICY "Character sheets are publicly readable" ON character_sheets
  FOR SELECT USING (true);

CREATE POLICY "Login records are publicly readable" ON login_records
  FOR SELECT USING (true);

CREATE POLICY "Metadata is publicly readable" ON metadata
  FOR SELECT USING (true);

CREATE POLICY "Tokens are publicly readable" ON tokens
  FOR SELECT USING (true);

CREATE POLICY "Tweets are publicly readable" ON tweets
  FOR SELECT USING (true);

CREATE POLICY "Tweet authors are publicly readable" ON tweet_authors
  FOR SELECT USING (true);

-- Service role policies for migration management
CREATE POLICY "Service role can manage all data" ON character_sheets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data" ON login_records
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data" ON metadata
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data" ON tokens
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data" ON tweets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all data" ON tweet_authors
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage migration checkpoints" ON migration_checkpoints
  FOR ALL USING (auth.role() = 'service_role');

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_character_sheets_updated_at ON character_sheets;
CREATE TRIGGER update_character_sheets_updated_at
  BEFORE UPDATE ON character_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_login_records_updated_at ON login_records;
CREATE TRIGGER update_login_records_updated_at
  BEFORE UPDATE ON login_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_metadata_updated_at ON metadata;
CREATE TRIGGER update_metadata_updated_at
  BEFORE UPDATE ON metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tokens_updated_at ON tokens;
CREATE TRIGGER update_tokens_updated_at
  BEFORE UPDATE ON tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tweets_updated_at ON tweets;
CREATE TRIGGER update_tweets_updated_at
  BEFORE UPDATE ON tweets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tweet_authors_updated_at ON tweet_authors;
CREATE TRIGGER update_tweet_authors_updated_at
  BEFORE UPDATE ON tweet_authors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE character_sheets IS 'RPG character data with stats, equipment, and progression';
COMMENT ON TABLE login_records IS 'User wallet login tracking and statistics';
COMMENT ON TABLE metadata IS 'NFT metadata including traits and image URLs';
COMMENT ON TABLE tokens IS 'NFT token ownership and relationships to characters/metadata';
COMMENT ON TABLE tweets IS 'Twitter/X post content and engagement data';
COMMENT ON TABLE tweet_authors IS 'Twitter/X account information and profiles';
COMMENT ON TABLE migration_checkpoints IS 'Migration progress tracking for resumable operations';

COMMENT ON COLUMN character_sheets.equipment IS 'JSON object with armor, back, mask items';
COMMENT ON COLUMN character_sheets.attributes IS 'JSON object with character stats (STR, DEX, CON, etc)';
COMMENT ON COLUMN metadata.attributes IS 'JSON object with NFT traits and properties';
COMMENT ON COLUMN migration_checkpoints.status IS 'Migration status: in_progress, completed, or failed';