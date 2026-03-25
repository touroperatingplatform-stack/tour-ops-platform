-- Create a new ACTIVE test tour for right now
-- Current time: ~3:22 PM, create tour for 4:00 PM

DO $$
DECLARE
  v_brand_id uuid;
  v_tour_id uuid;
  v_guide_id uuid := '0da9c371-5fe9-4e10-8122-1e3ee1836764'; -- gude
BEGIN
  SELECT id INTO v_brand_id FROM brands LIMIT 1;

  -- Create active tour for 4:00 PM (in 30+ min)
  INSERT INTO tours (
    company_id, name, description, tour_date, start_time, 
    duration_minutes, capacity, pickup_location, dropoff_location,
    guide_id, brand_id, price, status, guest_count, created_by
  ) VALUES (
    '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
    'Coba Cenote Maya',
    'Explore Coba ruins, climb the pyramid, swim in cenote',
    CURRENT_DATE,
    '16:00', -- 4:00 PM
    420,
    12,
    'Hotel Zone - Main Lobby',
    'Hotel Zone - Main Lobby',
    v_guide_id,
    v_brand_id,
    110.00,
    'scheduled',
    8,
    '7b0d216f-7a23-44ea-b075-cb919b5424c1'
  )
  RETURNING id INTO v_tour_id;

  -- Add pickup stop
  INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, scheduled_time, guest_count)
  VALUES (v_tour_id, v_brand_id, 1, 'Hotel Zone Central', '16:00:00', 8);

  -- Add some reservations
  INSERT INTO reservation_manifest (
    tour_id, booking_reference, adult_pax, child_pax, hotel_name, room_number, language_code
  ) VALUES 
    (v_tour_id, 'VIATOR-99123', 2, 0, 'Grand Fiesta', '1204', 'US'),
    (v_tour_id, 'GYG-8821', 2, 1, 'Riu Palace', '892', 'DE'),
    (v_tour_id, 'DIRECT-4455', 4, 0, 'Hard Rock', '3401', 'MX');

END $$;

-- Verify
SELECT name, start_time, status, tour_date
FROM tours 
WHERE tour_date = CURRENT_DATE AND status = 'scheduled'
ORDER BY start_time;
