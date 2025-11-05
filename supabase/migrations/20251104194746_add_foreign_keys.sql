-- Add foreign key constraint between character_locations and locations
-- This migration establishes the relationship needed for the map to display character data

ALTER TABLE character_locations
ADD CONSTRAINT fk_character_locations_location_id
FOREIGN KEY (location_id)
REFERENCES locations(id)
ON DELETE CASCADE;

-- Add index for better performance on joins
CREATE INDEX IF NOT EXISTS idx_character_locations_location_id
ON character_locations(location_id);

-- Add index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_character_locations_status
ON character_locations(status);
