-- Clear all test tours and related data
DELETE FROM guide_checkins WHERE tour_id IN (SELECT id FROM tours WHERE name LIKE '%Test%' OR name LIKE '%Tulum%' OR name LIKE '%Coba%');
DELETE FROM pickup_stops WHERE tour_id IN (SELECT id FROM tours WHERE name LIKE '%Test%' OR name LIKE '%Tulum%' OR name LIKE '%Coba%');
DELETE FROM tours WHERE name LIKE '%Test%' OR name LIKE '%Tulum%' OR name LIKE '%Coba%';

-- Verify cleared
SELECT 'Tours remaining' as check, COUNT(*) as count FROM tours WHERE tour_date = CURRENT_DATE;
