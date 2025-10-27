-- WAGDIE Simplified Database Schema
-- Migration: Initial schema setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (replaces logins collection)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eth_address TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW(),
  login_count INTEGER DEFAULT 1
);

-- Create index on eth_address for fast lookups
CREATE INDEX idx_users_eth_address ON users(eth_address);

-- Characters table (replaces tokens/character_sheets collections)
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id INTEGER NOT NULL,
  contract_address TEXT NOT NULL,
  owner_address TEXT,
  metadata JSONB,
  burned BOOLEAN DEFAULT FALSE,
  infected BOOLEAN DEFAULT FALSE,
  location_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_characters_token_id ON characters(token_id);
CREATE INDEX idx_characters_owner ON characters(owner_address);
CREATE INDEX idx_characters_burned ON characters(burned);
CREATE INDEX idx_characters_infected ON characters(infected);
CREATE INDEX idx_characters_location ON characters(location_id);

-- Tweets table (simplified social content)
CREATE TABLE tweets (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL,
  stored_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tweet queries
CREATE INDEX idx_tweets_author ON tweets(author_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);

-- Locations table (for staking/game mechanics)
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for characters
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables (authenticated users can read)
CREATE POLICY "Allow public read access on users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on characters"
  ON characters FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on tweets"
  ON tweets FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on locations"
  ON locations FOR SELECT
  USING (true);

-- Users can update their own login info
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (eth_address = current_setting('request.jwt.claims', true)::json->>'eth_address');

-- Insert policy for new users (anyone can create a user record during SIWE auth)
CREATE POLICY "Allow insert for new users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user login information and wallet addresses';
COMMENT ON TABLE characters IS 'WAGDIE NFT characters with metadata and game state';
COMMENT ON TABLE tweets IS 'Social media content related to WAGDIE';
COMMENT ON TABLE locations IS 'Game locations for character staking/positioning';
