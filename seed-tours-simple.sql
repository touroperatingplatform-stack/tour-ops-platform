-- Clear and recreate tours
DELETE FROM guide_checkins WHERE tour_id IN (SELECT id FROM tours WHERE tour_date = CURRENT_DATE);
DELETE FROM pickup_stops WHERE tour_id IN (SELECT id FROM tours WHERE tour_date = CURRENT_DATE);
DELETE FROM tours WHERE tour_date = CURRENT_DATE;

-- Get brand ID
DO $$
DECLARE
  v_brand_id uuid;
BEGIN
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  
  -- Tour 1: gude's tour
  INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
  VALUES ('6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Test Tour', CURRENT_DATE, '09:00', 300, 12, 'Hotel Zone', 'Hotel Zone', '0da9c371-5fe9-4e10-8122-1e3ee1836764', v_brand_id, 85.00, 'in_progress', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW());
  
  -- Tour 2: guide2's tour
  INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at)
  VALUES ('6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba Test Tour', CURRENT_DATE, '08:30', 480, 10, 'Downtown', 'Downtown', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_brand_id, 120.00, 'in_progress', 6, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW());
END $$;

-- Add pickup stops
DO $$
DECLARE
  v_brand_id uuid;
  v_tour1_id uuid;
  v_tour2_id uuid;
  v_stop1_id uuid;
  v_stop2_id uuid;
BEGIN
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  SELECT id INTO v_tour1_id FROM tours WHERE name = 'Tulum Test Tour';
  SELECT id INTO v_tour2_id FROM tours WHERE name = 'Coba Test Tour';
  
  INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, scheduled_time, guest_count)
  VALUES (v_tour1_id, v_brand_id, 1, 'Hotel Zone Pickup', 'Kukulkan Blvd', '09:00:00', 8)
  RETURNING id INTO v_stop1_id;
  
  INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, scheduled_time, guest_count)
  VALUES (v_tour2_id, v_brand_id, 1, 'Downtown Pickup', 'Av. Uxmal', '08:30:00', 6)
  RETURNING id INTO v_stop2_id;
  
  -- Add checkin for tour 2
  INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, selfie_url, scheduled_time, minutes_early_or_late)
  VALUES (v_tour2_id, v_brand_id, 'efb510fa-ff1e-4a77-8737-a6395e4000c5', v_stop2_id, 'pre_pickup', NOW() - INTERVAL '2 hours', 21.165, -86.825, 'https://res.cloudinary.com/demo/sample.jpg', '08:30:00', 25);
END $$;

-- Verify
SELECT t.name, p.email FROM tours t JOIN profiles p ON t.guide_id = p.id WHERE t.tour_date = CURRENT_DATE;
