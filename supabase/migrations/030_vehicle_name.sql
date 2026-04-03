-- Add name column to vehicles for friendly van names
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS name TEXT;

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_vehicles_name ON vehicles(name);
