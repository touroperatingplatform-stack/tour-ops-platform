-- Add stage column to checklists table
-- Run this BEFORE categorizing existing data

-- Add column with default
ALTER TABLE checklists 
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'pre_departure';

-- Update existing system presets based on their names/content
UPDATE checklists 
SET stage = 'activity' 
WHERE company_id IS NULL 
AND (
  name LIKE '%Equipment' 
  OR name LIKE '%Cenote%'
  OR name LIKE '%Ruins%'
  OR name LIKE '%Snorkel%'
  OR name LIKE '%ATV%'
  OR name LIKE '%Beach%'
  OR name LIKE '%Zip%'
  OR name LIKE '%Horse%'
  OR name LIKE '%Catamaran%'
  OR name LIKE '%Bike%'
  OR name LIKE '%Fishing%'
);

UPDATE checklists 
SET stage = 'pre_departure' 
WHERE company_id IS NULL 
AND name LIKE '%Pre-Departure%';

UPDATE checklists 
SET stage = 'pre_pickup' 
WHERE company_id IS NULL 
AND name LIKE '%Pre-Pickup%';

UPDATE checklists 
SET stage = 'dropoff' 
WHERE company_id IS NULL 
AND name LIKE '%Dropoff%';

UPDATE checklists 
SET stage = 'finish' 
WHERE company_id IS NULL 
AND name LIKE '%Completion%';

-- Van equipment is pre_departure
UPDATE checklists 
SET stage = 'pre_departure' 
WHERE company_id IS NULL 
AND name LIKE '%Van%';

-- Verify
SELECT name, stage, jsonb_array_length(items) as items
FROM checklists 
WHERE company_id IS NULL
ORDER BY stage, name;
