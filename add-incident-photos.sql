-- Add photo_urls column to incidents table
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT NULL;

-- Verify column added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incidents' 
ORDER BY ordinal_position;
