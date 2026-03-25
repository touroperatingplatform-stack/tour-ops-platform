-- Create realistic test tours for TODAY with current time context
-- Current time: ~1:00 PM, so we'll create tours around this time

DO $$
DECLARE
  v_brand_id uuid;
  v_company_id uuid := '6e046c69-93e2-48c9-a861-46c91fd2ae3b';
  v_guide1_id uuid := '0da9c371-5fe9-4e10-8122-1e3ee1836764'; -- gude
  v_guide2_id uuid := 'efb510fa-ff1e-4a77-8737-a6395e4000c5'; -- guide2
  v_admin_id uuid := '7b0d216f-7a23-44ea-b075-cb919b5424c1';
  v_tour1_id uuid;
  v_tour2_id uuid;
  v_stop1_id uuid;
  v_stop2_id uuid;
BEGIN
  -- Get brand
  SELECT id INTO v_brand_id FROM brands LIMIT 1;

  -- ========================================
  -- TOUR 1: Afternoon Tulum (2:30 PM pickup)
  -- Guide: gude@lifeoperations.com
  -- Status: scheduled (not started yet)
  -- Expected: Guide should see "Start Tour" button
  -- ========================================
  INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
  VALUES (gen_random_uuid(), v_company_id, 'Tulum Ruins & Beach', 'Explore the ancient Mayan ruins of Tulum and relax at the beach. Includes guided tour and free time.', CURRENT_DATE, '14:30', 360, 12, 'Hotel Zone - Lobby', 'Hotel Zone - Lobby', v_guide1_id, v_brand_id, 95.00, 'scheduled', 10, v_admin_id, NOW())
  RETURNING id INTO v_tour1_id;

  -- Pickup stops for Tour 1
  INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes)
  VALUES (gen_random_uuid(), v_tour1_id, v_brand_id, 1, 'Hotel Zone North', 'Kukulkan Blvd Km 12, Hotel Zone', 21.1450, -86.7460, '14:30:00', 6, 'Beachfront hotels')
  RETURNING id INTO v_stop1_id;

  INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes)
  VALUES (gen_random_uuid(), v_tour1_id, v_brand_id, 2, 'Hotel Zone South', 'Kukulkan Blvd Km 18, Hotel Zone', 21.1200, -86.7550, '15:00:00', 4, 'South end hotels');

  -- ========================================
  -- TOUR 2: Coba Morning (already completed)
  -- Guide: guide2@lifeoperations.com  
  -- Status: completed (for reference/testing history)
  -- This shows what a completed tour looks like
  -- ========================================
  INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at, completed_at, report_weather, report_guest_satisfaction, report_guest_count, report_highlights)
  VALUES (gen_random_uuid(), v_company_id, 'Coba Cenote Adventure', 'Visit Coba ruins, climb the pyramid, swim in cenote. Lunch included.', CURRENT_DATE, '08:00', 480, 10, 'Downtown Cancun', 'Downtown Cancun', v_guide2_id, v_brand_id, 120.00, 'completed', 8, v_admin_id, NOW(), NOW() - INTERVAL '2 hours', 'sunny', 'excellent', 8, 'Guests loved climbing the pyramid! Cenote was beautiful. Great group energy.', v_tour2_id);

  -- Add pickup stop for completed tour
  INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count)
  VALUES (gen_random_uuid(), v_tour2_id, v_brand_id, 1, 'Downtown ADO Station', 'Av. Uxmal 60, Downtown', 21.1650, -86.8250, '08:00:00', 8)
  RETURNING id INTO v_stop2_id;

  -- Add check-in for completed tour (was 15 min early)
  INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, selfie_url, scheduled_time, minutes_early_or_late, notes)
  VALUES (v_tour2_id, v_brand_id, v_guide2_id, v_stop2_id, 'pre_pickup', NOW() - INTERVAL '6 hours', 21.1650, -86.8250, 'https://res.cloudinary.com/demo/sample.jpg', '08:00:00', 15, 'Guide arrived early, vehicle ready');

END $$;

-- Verify tours created
SELECT 
  t.name, 
  t.start_time, 
  t.status, 
  p.email as guide,
  EXISTS(SELECT 1 FROM guide_checkins c WHERE c.tour_id = t.id) as has_checkin
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.tour_date = CURRENT_DATE
ORDER BY t.start_time;
