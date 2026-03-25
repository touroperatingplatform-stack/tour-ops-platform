-- Check ALL tours
SELECT COUNT(*) as total_tours FROM tours;

-- Check if tours with those names exist
SELECT name, tour_date FROM tours WHERE name LIKE '%Tulum%' OR name LIKE '%Coba%';

-- If not, recreate them
INSERT INTO tours (id, company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) 
VALUES 
('11111111-1111-1111-1111-111111111111', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Mayan Ruins', CURRENT_DATE, '09:00', 300, 12, 'Hotel Zone', 'Hotel Zone', '0da9c371-5fe9-4e10-8122-1e3ee1836764', (SELECT id FROM brands LIMIT 1), 85.00, 'in_progress', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET guide_id = EXCLUDED.guide_id, tour_date = EXCLUDED.tour_date;

-- Verify
SELECT t.name, p.email 
FROM tours t 
JOIN profiles p ON t.guide_id = p.id 
WHERE t.tour_date = CURRENT_DATE;
