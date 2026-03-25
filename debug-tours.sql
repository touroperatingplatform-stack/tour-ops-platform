-- Check tours
SELECT id, name, tour_date, guide_id, status 
FROM tours 
WHERE name IN ('Tulum Mayan Ruins', 'Coba Adventure');

-- Check gude's tours
SELECT t.id, t.name, t.tour_date, t.status
FROM tours t
WHERE t.guide_id = '0da9c371-5fe9-4e10-8122-1e3ee1836764';

-- Check what today's date is
SELECT CURRENT_DATE as today;

-- Update tours to today if needed
-- UPDATE tours SET tour_date = CURRENT_DATE WHERE name IN ('Tulum Mayan Ruins', 'Coba Adventure');
