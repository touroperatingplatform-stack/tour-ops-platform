-- Check if the columns the page queries exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND column_name IN ('id', 'name', 'start_time', 'status', 'pickup_location', 'guide_id', 'equipment_photo_url', 'van_photo_url');

-- Check if equipment_photo_url and van_photo_url exist
SELECT column_name FROM information_schema.columns WHERE table_name = 'tours' AND column_name LIKE '%photo%';
