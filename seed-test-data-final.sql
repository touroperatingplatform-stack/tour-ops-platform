-- Test data using gen_random_uuid() instead of manual UUIDs
-- Run each block separately

-- First, get IDs we'll reference
DO $$
DECLARE
    v_company_id uuid := '6e046c69-93e2-48c9-a861-46c91fd2ae3b';
    v_brand_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    v_guide1_id uuid := '34ef0245-f2be-4c3d-a870-d5d081296046';
    v_guide2_id uuid := 'd68d3488-1a30-4970-8aff-90e62e605c57';
    v_admin_id uuid := '7b0d216f-7a23-44ea-b075-cb919b5424c1';
    v_tour1_id uuid;
    v_tour2_id uuid;
    v_stop1_id uuid;
    v_stop2_id uuid;
BEGIN
    -- Create Tour 1 (Tulum)
    INSERT INTO tours (company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
    VALUES (v_company_id, 'Tulum Mayan Ruins Express', 'Visit the ancient Mayan city of Tulum', '2026-03-25', '09:00', 300, 12, 'Hotel Zone Lobby', 'Hotel Zone Lobby', v_guide1_id, v_brand_id, 85.00, 'in_progress', 8, v_admin_id, NOW())
    RETURNING id INTO v_tour1_id;

    -- Create pickup stops for Tour 1
    INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
    VALUES (v_tour1_id, v_brand_id, 1, 'Hotel Zone - Zone 1', 'Kukulkan Blvd, Hotel Zone', 21.1350, -86.7460, '09:00:00', 4)
    RETURNING id INTO v_stop1_id;

    INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
    VALUES (v_tour1_id, v_brand_id, 2, 'Hotel Zone - Zone 2', 'Kukulkan Blvd South', 21.1200, -86.7550, '09:30:00', 4);

    -- Create Tour 2 (Coba) - already checked in
    INSERT INTO tours (company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
    VALUES (v_company_id, 'Coba and Cenote Adventure', 'Explore Coba ruins and cenote', '2026-03-25', '08:30', 480, 10, 'Downtown Cancun', 'Downtown Cancun', v_guide2_id, v_brand_id, 120.00, 'in_progress', 6, v_admin_id, NOW())
    RETURNING id INTO v_tour2_id;

    INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
    VALUES (v_tour2_id, v_brand_id, 1, 'Downtown - ADO Station', 'Av. Uxmal 60, Downtown', 21.1650, -86.8250, '08:30:00', 6)
    RETURNING id INTO v_stop2_id;

    -- Add check-in for Tour 2 (25 min early)
    INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, selfie_url, scheduled_time, minutes_early_or_late, notes)
    VALUES (v_tour2_id, v_brand_id, v_guide2_id, v_stop2_id, 'pre_pickup', NOW() - INTERVAL '2 hours', 21.1650, -86.8250, 5.0, 'https://res.cloudinary.com/demo/sample.jpg', '08:30:00', 25, 'Guide arrived early');

END $$;

-- Verify
SELECT 'Tours created today' as description, COUNT(*) as count FROM tours WHERE tour_date = '2026-03-25';
