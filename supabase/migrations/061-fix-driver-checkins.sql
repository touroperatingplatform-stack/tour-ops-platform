-- Migration 061: Add brand_id to driver_checkins
-- Created: 2026-04-24

-- Step 1: Add brand_id column
ALTER TABLE driver_checkins 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_driver_checkins_brand ON driver_checkins(brand_id);

-- Step 3: Update existing records with brand_id from tours
UPDATE driver_checkins dc
SET brand_id = t.brand_id
FROM tours t
WHERE dc.tour_id = t.id
AND dc.brand_id IS NULL;

-- Step 4: Make brand_id NOT NULL
ALTER TABLE driver_checkins 
ALTER COLUMN brand_id SET NOT NULL;

-- Step 5: Update RLS policies to include brand_id check
-- Drop and recreate SELECT policy for drivers
DROP POLICY IF EXISTS "Drivers can view own check-ins" ON driver_checkins;
CREATE POLICY "Drivers can view own check-ins"
  ON driver_checkins FOR SELECT
  USING (
    driver_id = auth.uid()
    AND brand_id = (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- Drop and recreate INSERT policy for drivers
DROP POLICY IF EXISTS "Drivers can create check-ins" ON driver_checkins;
CREATE POLICY "Drivers can create check-ins"
  ON driver_checkins FOR INSERT
  WITH CHECK (
    driver_id = auth.uid()
    AND brand_id = (SELECT brand_id FROM profiles WHERE id = auth.uid())
  );

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'driver_checkins'
AND column_name = 'brand_id';
