-- Run this in Supabase SQL Editor to see ACTUAL table columns
-- Copy the output and share it

-- Vehicles table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

-- Incidents table columns  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'incidents' 
ORDER BY ordinal_position;

-- Guest_feedback table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'guest_feedback' 
ORDER BY ordinal_position;

-- Tours table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' 
ORDER BY ordinal_position;
