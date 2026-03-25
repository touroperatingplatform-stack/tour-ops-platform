-- Add missing columns for tour completion
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS report_weather text,
ADD COLUMN IF NOT EXISTS report_guest_satisfaction text,
ADD COLUMN IF NOT EXISTS report_incident text,
ADD COLUMN IF NOT EXISTS report_guest_count integer,
ADD COLUMN IF NOT EXISTS report_highlights text,
ADD COLUMN IF NOT EXISTS report_issues text,
ADD COLUMN IF NOT EXISTS report_photos text[];

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours' 
ORDER BY ordinal_position;
