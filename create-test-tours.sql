-- Create fresh test tours
-- Get brand ID first
DO $$
DECLARE
    v_brand_id uuid;
BEGIN
    SELECT id INTO v_brand_id FROM brands LIMIT 1;
    
    -- Create Tour 1: Tulum for gude
    INSERT INTO tours (id, company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
    VALUES ('11111111-1111-1111-1111-111111111111', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Mayan Ruins', CURRENT_DATE, '09:00', 300, 12, 'Hotel Zone', 'Hotel Zone', '0da9c371-5fe9-4e10-8122-1e3ee1836764', v_brand_id, 85.00, 'in_progress', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
    ON CONFLICT (id) DO UPDATE SET guide_id = '0da9c371-5fe9-4e10-8122-1e3ee1836764', tour_date = CURRENT_DATE;

    -- Create Tour 2: Coba for guide2 (already checked in)
    INSERT INTO tours (id, company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
    VALUES ('22222222-2222-2222-2222-222222222222', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba Adventure', CURRENT_DATE, '08:30', 480, 10, 'Downtown', 'Downtown', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_brand_id, 120.00, 'in_progress', 6, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
    ON CONFLICT (id) DO UPDATE SET guide_id = 'efb510fa-ff1e-4a77-8737-a6395e4000c5', tour_date = CURRENT_DATE;
END $$;

-- Create pickup stops
DO $$
DECLARE
    v_tour1_id uuid := '11111111-1111-1111-1111-111111111111';
    v_tour2_id uuid := '22222222-2222-2222-2222-222222222222';
    v_brand_id uuid;
    v_stop1_id uuid;
    v_stop2_id uuid;
BEGIN
    SELECT id INTO v_brand_id FROM brands LIMIT 1;
    
    -- Stops for Tour 1
    INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
    VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', v_tour1_id, v_brand_id, 1, 'Hotel Zone Pickup', 'Kukulkan Blvd', 21.135, -86.746, '09:00:00', 8)
    RETURNING id INTO v_stop1_id;
    
    -- Stops for Tour 2
    INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
    VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', v_tour2_id, v_brand_id, 1, 'Downtown Pickup', 'Av. Uxmal', 21.165, -86.825, '08:30:00', 6)
    RETURNING id INTO v_stop2_id;
    
    -- Add check-in for Tour 2 (guide2 already checked in)
    DELETE FROM guide_checkins WHERE tour_id = v_tour2_id;
    INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, selfie_url, scheduled_time, minutes_early_or_late)
    VALUES (v_tour2_id, v_brand_id, 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_stop2_id, 'pre_pickup', NOW() - INTERVAL '2 hours', 21.165, -86.825, 'https://res.cloudinary.com/demo/sample.jpg', '08:30:00', 25);
END $$;

-- Verify
SELECT t.name, p.email, p.full_name,
       EXISTS(SELECT 1 FROM guide_checkins c WHERE c.tour_id = t.id) as has_checkin
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.tour_date = CURRENT_DATE;
