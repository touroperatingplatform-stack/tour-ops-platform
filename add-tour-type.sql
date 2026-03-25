-- Add tour_type column for private vs shared tours
-- Default: 'private' (no impact on existing/testing)

ALTER TABLE tours ADD COLUMN IF NOT EXISTS tour_type text DEFAULT 'private';

-- Optional: Add constraint for valid values
-- ALTER TABLE tours ADD CONSTRAINT chk_tour_type 
-- CHECK (tour_type IN ('private', 'shared'));

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'tour_type';

-- All existing tours are private
SELECT tour_type, COUNT(*) FROM tours GROUP BY tour_type;
