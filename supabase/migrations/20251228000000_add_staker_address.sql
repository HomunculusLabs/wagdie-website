-- Add staker_address column to track original staker when NFT is staked
-- The owner_address changes to the staking contract when staked,
-- but the contract remembers who staked it in WagdieInfo.owner

-- Add staker_address column
ALTER TABLE wagdie_characters
ADD COLUMN IF NOT EXISTS staker_address TEXT;

-- Create index for efficient lookups by staker
CREATE INDEX IF NOT EXISTS idx_wagdie_characters_staker ON wagdie_characters(staker_address);

-- Grant permissions
GRANT SELECT, UPDATE ON wagdie_characters TO authenticated;
GRANT SELECT, UPDATE ON wagdie_characters TO anon;
