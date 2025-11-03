-- Create tables for Interactive Map Integration feature
-- Created: 2025-11-03
-- Feature: 006-map-integration

-- Locations table: Catalog of available locations for character staking
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CharacterLocation table: Tracks which location a character is currently staked to
CREATE TABLE IF NOT EXISTS character_locations (
  character_id TEXT NOT NULL,
  location_id TEXT NOT NULL REFERENCES locations(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER,
  status TEXT NOT NULL CHECK (status IN ('staked', 'unstaked', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (character_id)
);

-- LocationTransaction table: Audit log of all location changes
CREATE TABLE IF NOT EXISTS location_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id TEXT NOT NULL,
  from_location_id TEXT REFERENCES locations(id),
  to_location_id TEXT NOT NULL REFERENCES locations(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('stake', 'move', 'unstake')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used INTEGER,
  block_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_character_locations_wallet ON character_locations(wallet_address);
CREATE INDEX IF NOT EXISTS idx_character_locations_location ON character_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_character_locations_status ON character_locations(status);
CREATE INDEX IF NOT EXISTS idx_location_transactions_character ON location_transactions(character_id);
CREATE INDEX IF NOT EXISTS idx_location_transactions_hash ON location_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_location_transactions_created ON location_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_transactions_status ON location_transactions(status);

-- Row Level Security (RLS)
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_transactions ENABLE ROW LEVEL SECURITY;

-- Policies for public read access (everyone can read location data)
CREATE POLICY "Locations are publicly readable" ON locations
  FOR SELECT USING (true);

CREATE POLICY "Character locations publicly readable" ON character_locations
  FOR SELECT USING (true);

CREATE POLICY "Transactions publicly readable" ON location_transactions
  FOR SELECT USING (true);

-- Policies for authenticated writes (service role only)
CREATE POLICY "Service role can manage locations" ON locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage character locations" ON character_locations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage transactions" ON location_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Insert initial location data
-- Note: Additional locations will be added via governance or sync with blockchain
INSERT INTO locations (id, name, description) VALUES
  ('concord_searing', 'Concord Searing', 'A place of power where the ancient energies converge. Characters staked here gain enhanced abilities and protection from the digital realm.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO locations (id, name, description) VALUES
  ('forsaken_lands', 'Forsaken Lands', 'The starting grounds for all WAGDIE characters. A place of beginning where newcomers gather before embarking on their journey.')
ON CONFLICT (id) DO NOTHING;

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_character_locations_updated_at ON character_locations;
CREATE TRIGGER update_character_locations_updated_at
  BEFORE UPDATE ON character_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE locations IS 'Available locations in the WAGDIE world where characters can be staked';
COMMENT ON TABLE character_locations IS 'Current location of each character (denormalized for performance)';
COMMENT ON TABLE location_transactions IS 'Complete audit trail of all character movements between locations';

COMMENT ON COLUMN locations.metadata IS 'Optional JSON metadata with coordinates, rarity, special properties';
COMMENT ON COLUMN character_locations.status IS 'staked: character at location, unstaked: character not staked, pending: transaction in progress';
COMMENT ON COLUMN location_transactions.action IS 'Initial stake, move between locations, or unstake action';
COMMENT ON COLUMN location_transactions.status IS 'Transaction status: pending, confirmed on-chain, or failed';
