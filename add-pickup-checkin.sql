-- Add pickup check-in columns to tours table
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS pickup_checked_in_at timestamp NULL,
ADD COLUMN IF NOT EXISTS pickup_checkin_photo_url text NULL,
ADD COLUMN IF NOT EXISTS pickup_checkin_lat float NULL,
ADD COLUMN IF NOT EXISTS pickup_checkin_lng float NULL,
ADD COLUMN IF NOT EXISTS pickup_checkin_status text NULL; -- 'early', 'ontime', 'late'

-- Verify columns added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tours' 
ORDER BY ordinal_position;
