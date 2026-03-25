-- Fix incidents table - add guide_id column if missing

-- First check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'incidents';

-- Add guide_id if missing
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES profiles(id);

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'guide_id';
