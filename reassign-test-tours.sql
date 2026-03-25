-- Reassign test tours to guides you have passwords for

-- Clear existing check-ins first
DELETE FROM guide_checkins WHERE tour_id IN (
    SELECT id FROM tours WHERE tour_date = '2026-03-25' AND name IN ('Tulum Mayan Ruins', 'Coba Adventure')
);

-- Update Tour 1: Tulum -> assign to gude@lifeoperations.com (Guide One)
UPDATE tours 
SET guide_id = '0da9c371-5fe9-4e10-8122-1e3ee1836764',
    status = 'in_progress'
WHERE name = 'Tulum Mayan Ruins';

-- Update pickup_stop for Tour 1
UPDATE pickup_stops 
SET tour_id = (SELECT id FROM tours WHERE name = 'Tulum Mayan Ruins')
WHERE location_name = 'Hotel Zone Pickup';

-- Update Tour 2: Coba -> assign to guide2@lifeoperations.com (Guide Two)
UPDATE tours 
SET guide_id = 'efb510fa-ff1e-4a77-8737-a6395e4000c5',
    status = 'in_progress'
WHERE name = 'Coba Adventure';

-- Update pickup_stop for Tour 2  
UPDATE pickup_stops 
SET tour_id = (SELECT id FROM tours WHERE name = 'Coba Adventure')
WHERE location_name = 'Downtown Pickup';

-- Get pickup_stop IDs
DO $$
DECLARE
    v_tour2_id uuid;
    v_stop2_id uuid;
BEGIN
    -- Get Tour 2 ID
    SELECT id INTO v_tour2_id FROM tours WHERE name = 'Coba Adventure';
    
    -- Get first pickup stop for Tour 2
    SELECT id INTO v_stop2_id 
    FROM pickup_stops 
    WHERE tour_id = v_tour2_id 
    LIMIT 1;
    
    -- Add check-in for Tour 2 (already checked in, 25 min early)
    INSERT INTO guide_checkins (
        tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, 
        checked_in_at, latitude, longitude, selfie_url, 
        scheduled_time, minutes_early_or_late, notes
    )
    SELECT 
        v_tour2_id,
        brand_id,
        'efb510fa-ff1e-4a77-8737-a6395e4000c5', -- guide2
        v_stop2_id,
        'pre_pickup',
        NOW() - INTERVAL '2 hours',
        21.165,
        -86.825,
        'https://res.cloudinary.com/demo/sample.jpg',
        '08:30:00',
        25,
        'Guide arrived early'
    FROM tours 
    WHERE id = v_tour2_id;
END $$;

-- Verify
SELECT t.name, t.status, p.email, p.full_name, 
       EXISTS(SELECT 1 FROM guide_checkins c WHERE c.tour_id = t.id) as has_checkin
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.tour_date = '2026-03-25';
