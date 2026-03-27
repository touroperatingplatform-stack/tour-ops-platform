-- Create active tours RIGHT NOW for ALL guide users with checkins at different locations
-- This gives us better data to troubleshoot the map

-- First, get all guide users
-- We'll create tours and checkins for each guide

DO $$
DECLARE
  v_company_id uuid;
  v_brand_id uuid;
  v_guide RECORD;
  v_tour_id uuid;
  v_now timestamp := NOW();
  v_today date := CURRENT_DATE;
BEGIN
  -- Get company and brand
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  
  IF v_company_id IS NULL OR v_brand_id IS NULL THEN
    RAISE EXCEPTION 'No company or brand found';
  END IF;

  -- Create tours and checkins for each guide at different locations
  -- Using REAL locations across the Yucatan

  FOR v_guide IN 
    SELECT id, first_name, last_name, role 
    FROM profiles 
    WHERE role = 'guide'
  LOOP
    
    -- Create a tour for this guide
    INSERT INTO tours (
      id, company_id, brand_id, name, tour_date, start_time, 
      duration_minutes, status, guide_id, guest_count, capacity,
      pickup_location, dropoff_location, price, created_by, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_company_id, v_brand_id,
      '[TEST] ' || v_guide.first_name || '''s Tour - ' || v_now::time::text,
      v_today,
      '14:00',
      300,
      'in_progress',
      v_guide.id,
      8 + floor(random() * 20),
      40,
      'Hotel Zone',
      'Tourist Site',
      850.00,
      v_guide.id,
      v_now,
      v_now
    )
    RETURNING id INTO v_tour_id;
    
    -- Create checkin at a different location for each guide
    -- Assign based on first name to spread them out
    CASE 
      -- West (Chichen Itza area)
      WHEN v_guide.first_name LIKE 'C%' THEN
        INSERT INTO guide_checkins (
          tour_id, brand_id, guide_id, checkin_type, checked_in_at,
          latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at
        ) VALUES (
          v_tour_id, v_brand_id, v_guide.id, 'pre_pickup', v_now - interval '1 hour',
          20.6843, -88.5678, 10.0, '14:00:00', -5,
          '[TEST] Carlos at Chichen Itza area', v_now
        );
      
      -- East coast (Tulum area)  
      WHEN v_guide.first_name LIKE 'M%' THEN
        INSERT INTO guide_checkins (
          tour_id, brand_id, guide_id, checkin_type, checked_in_at,
          latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at
        ) VALUES (
          v_tour_id, v_brand_id, v_guide.id, 'pre_pickup', v_now - interval '45 minutes',
          20.2114, -87.4654, 8.0, '14:00:00', 0,
          '[TEST] Maria at Tulum ruins area', v_now
        );
      
      -- Central (Playa del Carmen)
      WHEN v_guide.first_name LIKE 'J%' THEN
        INSERT INTO guide_checkins (
          tour_id, brand_id, guide_id, checkin_type, checked_in_at,
          latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at
        ) VALUES (
          v_tour_id, v_brand_id, v_guide.id, 'pre_pickup', v_now - interval '30 minutes',
          20.6296, -87.0739, 5.0, '14:00:00', 2,
          '[TEST] Juan in Playa del Carmen', v_now
        );
      
      -- North (Cancun area)
      ELSE
        INSERT INTO guide_checkins (
          tour_id, brand_id, guide_id, checkin_type, checked_in_at,
          latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at
        ) VALUES (
          v_tour_id, v_brand_id, v_guide.id, 'pre_pickup', v_now - interval '20 minutes',
          21.1619, -86.8515, 7.0, '14:00:00', 5,
          '[TEST] ' || v_guide.first_name || ' in Cancun area', v_now
        );
    END CASE;
    
    RAISE NOTICE 'Created tour % for guide %', v_tour_id, v_guide.first_name;
  END LOOP;
  
  RAISE NOTICE '=== COMPLETE: Created tours and checkins for all guides ===';
END $$;

-- Verify what was created
SELECT 
  'ACTIVE TOURS' as check_type,
  COUNT(*) as count
FROM tours 
WHERE status = 'in_progress' AND tour_date = CURRENT_DATE AND name LIKE '[TEST]%'

UNION ALL

SELECT 
  'CHECKINS' as check_type,
  COUNT(*) as count
FROM guide_checkins c
JOIN tours t ON c.tour_id = t.id
WHERE t.status = 'in_progress' AND t.tour_date = CURRENT_DATE AND t.name LIKE '[TEST]%'

UNION ALL

SELECT 
  'LOCATIONS' as check_type,
  COUNT(DISTINCT c.latitude || ',' || c.longitude) as count
FROM guide_checkins c
JOIN tours t ON c.tour_id = t.id
WHERE t.status = 'in_progress' AND t.tour_date = CURRENT_DATE AND t.name LIKE '[TEST]%';