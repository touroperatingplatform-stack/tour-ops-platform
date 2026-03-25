-- Create test tours using gen_random_uuid
-- Run this simple version:

-- Tour 1: Tulum for gude
INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
SELECT 
    '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
    'Tulum Mayan Ruins Test',
    CURRENT_DATE,
    '09:00',
    300,
    12,
    'Hotel Zone',
    'Hotel Zone',
    '0da9c371-5fe9-4e10-8122-1e3ee1836764',
    (SELECT id FROM brands LIMIT 1),
    85.00,
    'in_progress',
    8,
    '7b0d216f-7a23-44ea-b075-cb919b5424c1',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Tulum Mayan Ruins Test' AND tour_date = CURRENT_DATE);

-- Tour 2: Coba for guide2
INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
SELECT 
    '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
    'Coba Adventure Test',
    CURRENT_DATE,
    '08:30',
    480,
    10,
    'Downtown',
    'Downtown',
    'efb510fa-ff1e-4a77-8737-a6395e4000c5',
    (SELECT id FROM brands LIMIT 1),
    120.00,
    'in_progress',
    6,
    '7b0d216f-7a23-44ea-b075-cb919b5424c1',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM tours WHERE name = 'Coba Adventure Test' AND tour_date = CURRENT_DATE);

-- Verify
SELECT t.name, t.guide_id, p.email, p.full_name
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.tour_date = CURRENT_DATE
ORDER BY t.start_time;
