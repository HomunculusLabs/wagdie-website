-- Page Wireframes Feature: Database Schema Updates
-- Migration: Add concords, character enhancements, and seed data
-- Date: 2025-10-28

-- ============================================================================
-- CONCORDS TABLE
-- ============================================================================

-- Create concords table (special items/powers)
CREATE TABLE IF NOT EXISTS concords (
  concord_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_consumable BOOLEAN DEFAULT TRUE,
  effect_type TEXT NOT NULL CHECK (effect_type IN ('stat_boost', 'ability', 'passive')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE concords IS 'Special items/powers that can be owned by characters';

-- ============================================================================
-- CHARACTER_CONCORDS JOIN TABLE
-- ============================================================================

-- Create character_concords join table
CREATE TABLE IF NOT EXISTS character_concords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  concord_id INTEGER NOT NULL REFERENCES concords(concord_id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  is_seared BOOLEAN DEFAULT FALSE,
  seared_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token_id, concord_id)
);

COMMENT ON TABLE character_concords IS 'Links characters to their owned concords';

-- Index for fast character concords lookup
CREATE INDEX idx_character_concords_token_id ON character_concords(token_id);

-- ============================================================================
-- CHARACTERS TABLE UPDATES
-- ============================================================================

-- Add new columns to characters table (if they don't exist)
DO $$
BEGIN
  -- Character identity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'name') THEN
    ALTER TABLE characters ADD COLUMN name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'class') THEN
    ALTER TABLE characters ADD COLUMN class TEXT CHECK (class IN ('Warrior', 'Mage', 'Rogue', 'Cleric'));
  END IF;

  -- Level and experience
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'level') THEN
    ALTER TABLE characters ADD COLUMN level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'experience') THEN
    ALTER TABLE characters ADD COLUMN experience INTEGER DEFAULT 0 CHECK (experience >= 0);
  END IF;

  -- Attributes (D&D style)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'str') THEN
    ALTER TABLE characters ADD COLUMN str INTEGER DEFAULT 10 CHECK (str BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'dex') THEN
    ALTER TABLE characters ADD COLUMN dex INTEGER DEFAULT 10 CHECK (dex BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'con') THEN
    ALTER TABLE characters ADD COLUMN con INTEGER DEFAULT 10 CHECK (con BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'int') THEN
    ALTER TABLE characters ADD COLUMN int INTEGER DEFAULT 10 CHECK (int BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'wis') THEN
    ALTER TABLE characters ADD COLUMN wis INTEGER DEFAULT 10 CHECK (wis BETWEEN 1 AND 20);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'cha') THEN
    ALTER TABLE characters ADD COLUMN cha INTEGER DEFAULT 10 CHECK (cha BETWEEN 1 AND 20);
  END IF;

  -- Combat stats
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'hp') THEN
    ALTER TABLE characters ADD COLUMN hp INTEGER DEFAULT 10 CHECK (hp > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'max_hp') THEN
    ALTER TABLE characters ADD COLUMN max_hp INTEGER DEFAULT 10 CHECK (max_hp > 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'ac') THEN
    ALTER TABLE characters ADD COLUMN ac INTEGER DEFAULT 10 CHECK (ac BETWEEN 10 AND 25);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'speed') THEN
    ALTER TABLE characters ADD COLUMN speed INTEGER DEFAULT 30 CHECK (speed BETWEEN 10 AND 50);
  END IF;

  -- Story and equipment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'background_story') THEN
    ALTER TABLE characters ADD COLUMN background_story TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'equipment') THEN
    ALTER TABLE characters ADD COLUMN equipment JSONB;
  END IF;

  -- Game states (replace boolean infected with infection_status enum)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'infection_status') THEN
    ALTER TABLE characters ADD COLUMN infection_status TEXT DEFAULT 'healthy' CHECK (infection_status IN ('healthy', 'infected', 'cured'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'staking_status') THEN
    ALTER TABLE characters ADD COLUMN staking_status TEXT DEFAULT 'unstaked' CHECK (staking_status IN ('unstaked', 'staked'));
  END IF;

  -- Visual
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'characters' AND column_name = 'image_url') THEN
    ALTER TABLE characters ADD COLUMN image_url TEXT;
  END IF;
END $$;

-- Add constraint to ensure hp <= max_hp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'characters_hp_check'
  ) THEN
    ALTER TABLE characters ADD CONSTRAINT characters_hp_check CHECK (hp <= max_hp);
  END IF;
END $$;

-- ============================================================================
-- LOCATIONS TABLE UPDATES
-- ============================================================================

-- Add is_active column to locations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'is_active') THEN
    ALTER TABLE locations ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'locations' AND column_name = 'created_at') THEN
    ALTER TABLE locations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- TWEETS TABLE UPDATES
-- ============================================================================

-- Rename and update tweets table columns for better alignment with requirements
DO $$
BEGIN
  -- Rename id to tweet_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'tweet_id') THEN
    ALTER TABLE tweets RENAME COLUMN id TO tweet_id;
  END IF;

  -- Rename content to text
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'content')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'text') THEN
    ALTER TABLE tweets RENAME COLUMN content TO text;
  END IF;

  -- Rename author_id to author_username
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'author_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'author_username') THEN
    ALTER TABLE tweets RENAME COLUMN author_id TO author_username;
  END IF;

  -- Add media_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'media_type') THEN
    ALTER TABLE tweets ADD COLUMN media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video'));
  END IF;

  -- Add media_url (single) and video_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'media_url') THEN
    ALTER TABLE tweets ADD COLUMN media_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'video_url') THEN
    ALTER TABLE tweets ADD COLUMN video_url TEXT;
  END IF;

  -- Add engagement_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'engagement_count') THEN
    ALTER TABLE tweets ADD COLUMN engagement_count JSONB;
  END IF;

  -- Add is_reply and is_retweet
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'is_reply') THEN
    ALTER TABLE tweets ADD COLUMN is_reply BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'is_retweet') THEN
    ALTER TABLE tweets ADD COLUMN is_retweet BOOLEAN DEFAULT FALSE;
  END IF;

  -- Rename stored_at to fetched_at
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'stored_at')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tweets' AND column_name = 'fetched_at') THEN
    ALTER TABLE tweets RENAME COLUMN stored_at TO fetched_at;
  END IF;
END $$;

-- Add index for media_type filtering
CREATE INDEX IF NOT EXISTS idx_tweets_media_type ON tweets(media_type);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional indexes on characters table
CREATE INDEX IF NOT EXISTS idx_characters_infection_status ON characters(infection_status);
CREATE INDEX IF NOT EXISTS idx_characters_staking_status ON characters(staking_status);
CREATE INDEX IF NOT EXISTS idx_characters_location_id ON characters(location_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE concords ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_concords ENABLE ROW LEVEL SECURITY;

-- Public read access for concords
CREATE POLICY "Allow public read access on concords"
  ON concords FOR SELECT
  USING (true);

-- Public read access for character_concords
CREATE POLICY "Allow public read access on character_concords"
  ON character_concords FOR SELECT
  USING (true);

-- ============================================================================
-- SEED DATA: LOCATIONS
-- ============================================================================

INSERT INTO locations (id, name, description, is_active) VALUES
  ('the-ruins', 'The Ruins', 'Ancient crumbling structures where shadows gather', TRUE),
  ('crossroads', 'Crossroads', 'A meeting point for travelers and traders', TRUE),
  ('dark-forest', 'Dark Forest', 'Dense woodland where danger lurks', TRUE),
  ('haven', 'Haven', 'A safe refuge from the spreading darkness', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- SEED DATA: CONCORDS
-- ============================================================================

-- Insert Concord #15 (Strange Mushroom)
INSERT INTO concords (concord_id, name, description, image_url, is_consumable, effect_type) VALUES
  (15, 'Strange Mushroom', 'A mysterious mushroom obtained from burning corpses. Can be used to spread infections or target specific pilgrims.', '/images/concords/strange-mushroom.png', TRUE, 'ability')
ON CONFLICT (concord_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  is_consumable = EXCLUDED.is_consumable,
  effect_type = EXCLUDED.effect_type;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON MIGRATION IS 'Page Wireframes Feature: Added concords, enhanced characters table with D&D stats, updated tweets structure, seeded locations and concord #15';
