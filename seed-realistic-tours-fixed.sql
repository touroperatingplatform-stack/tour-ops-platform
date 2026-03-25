-- Create realistic tours for TODAY
-- Current time: ~1:00 PM

DO $$
DECLARE
  v_brand_id uuid;
  v_stop_id uuid;
  v_tour_id uuid;
BEGIN
  SELECT id INTO v_brand_id FROM brands LIMIT 1;

  -- ========================================
  -- TOUR 1: Afternoon Tulum (2:30 PM pickup)
  -- Guide: gude@lifeoperations.com
  -- Status: scheduled (not started)
  -- ========================================
  INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by)
  VALUES ('6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Ruins and Beach', CURRENT_DATE, '14:30', 360, 12, 'Hotel Zone Lobby', 'Hotel Zone Lobby', '0da9c371-5fe9-4e10-8122-1e3ee1836764', v_brand_id, 95.00, 'scheduled', 10, '7b0d216f-7a23-44ea-b075-cb919b5424c1')
  RETURNING id INTO v_tour_id;

  -- Pickup stop for Tour 1
  INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, scheduled_time, guest_count)
  VALUES (gen_random_uuid(), v_tour_id, v_brand_id, 1, 'Hotel Zone North', 'Kukulkan Blvd', '14:30:00', 10)
  RETURNING id INTO v_stop_id;

  -- ========================================
  -- TOUR 2: Morning Coba (8:00 AM) - COMPLETED
  -- Guide: guide2@lifeoperations.com
  -- Status: completed (already done)
  -- ========================================
  INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, completed_at, report_weather, report_guest_satisfaction, report_guest_count, report_highlights)
  VALUES ('6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba Cenote Adventure', CURRENT_DATE, '08:00', 480, 10, 'Downtown Cancun', 'Downtown Cancun', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_brand_id, 120.00, 'completed', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW() - INTERVAL '2 hours', 'sunny', 'excellent', 8, 'Guests loved the pyramid!')
  RETURNING id INTO v_tour_id;

  -- Pickup stop for Tour 2
  INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, scheduled_time, guest_count)
  VALUES (gen_random_uuid(), v_tour_id, v_brand_id, 1, 'Downtown ADO Station', '08:00:00', 8)
  RETURNING id INTO v_stop_id;

  -- Check-in for completed tour
  INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, selfie_url, scheduled_time, minutes_early_or_late)
  VALUES (v_tour_id, v_brand_id, 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_stop_id, 'pre_pickup', NOW() - INTERVAL '6 hours', 21.165, -86.825, 'https://res.cloudinary.com/demo/sample.jpg', '08:00:00', 15);

END $$;

-- Verify
SELECT t.name, t.start_time, t.status, p.email as guide
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.tour_date = CURRENT_DATE
ORDER BY t.start_time;
