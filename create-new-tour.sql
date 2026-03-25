-- Create new tour assigned to gude@lifeoperations.com
DO $$
DECLARE
  v_brand_id uuid;
  v_tour_id uuid;
  v_guide_id uuid := '0da9c371-5fe9-4e10-8122-1e3ee1836764';
BEGIN
  SELECT id INTO v_brand_id FROM brands LIMIT 1;

  INSERT INTO tours (company_id, name, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by)
  VALUES ('6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba Cenote Maya', CURRENT_DATE, '16:00', 420, 12, 'Hotel Zone Lobby', 'Hotel Zone Lobby', v_guide_id, v_brand_id, 110.00, 'scheduled', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1')
  RETURNING id INTO v_tour_id;

  INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, scheduled_time, guest_count)
  VALUES (v_tour_id, v_brand_id, 1, 'Hotel Zone Central', '16:00:00', 8);

END $$;

-- Verify
SELECT t.name, t.start_time, t.status, p.email as guide
FROM tours t
JOIN profiles p ON t.guide_id = p.id
WHERE t.status = 'scheduled' AND t.tour_date = CURRENT_DATE;
