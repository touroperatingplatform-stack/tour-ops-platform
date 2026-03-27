-- Verify all guide checkins and their locations for the map
-- Run this to see what pins should appear

SELECT 
  p.first_name || ' ' || p.last_name as guide_name,
  t.name as tour_name,
  c.latitude,
  c.longitude,
  c.checked_in_at,
  c.notes
FROM guide_checkins c
JOIN tours t ON c.tour_id = t.id
JOIN profiles p ON c.guide_id = p.id
WHERE t.status = 'in_progress' 
  AND t.tour_date = CURRENT_DATE
  AND t.name LIKE '[TEST]%'
ORDER BY c.latitude DESC;

-- Also check lat/lng ranges to ensure they fit the map bounds
SELECT 
  MIN(c.latitude) as min_lat,
  MAX(c.latitude) as max_lat,
  MIN(c.longitude) as min_lng,
  MAX(c.longitude) as max_lng
FROM guide_checkins c
JOIN tours t ON c.tour_id = t.id
WHERE t.status = 'in_progress' 
  AND t.tour_date = CURRENT_DATE
  AND t.name LIKE '[TEST]%';