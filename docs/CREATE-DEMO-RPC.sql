-- ============================================
-- CREATE generate_demo_data RPC function
-- Uses ACTUAL database schema columns
-- Run this ONCE in Supabase SQL Editor
-- ============================================

DROP FUNCTION IF EXISTS generate_demo_data();

CREATE OR REPLACE FUNCTION generate_demo_data()
RETURNS json AS $$
DECLARE
  v_brand_id uuid;
  v_company_id uuid;
  v_guide_ids uuid[];
  v_tour_ids uuid[];
  v_results json;
BEGIN
  -- Get first company and brand
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  
  -- Get guide IDs
  SELECT array_agg(id) INTO v_guide_ids FROM profiles WHERE role = 'guide';
  
  IF v_guide_ids IS NULL OR array_length(v_guide_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No guides found. Create guide users first.';
  END IF;
  
  -- Create 15 tours for today
  SELECT array_agg(id) INTO v_tour_ids
  FROM (
    INSERT INTO tours (company_id, brand_id, guide_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, price, status, guest_count, tour_type)
    SELECT 
      v_company_id,
      v_brand_id,
      v_guide_ids[(row_number() OVER () % array_length(v_guide_ids, 1)) + 1],
      tour_name,
      'Demo tour',
      CURRENT_DATE,
      start_time,
      duration_min,
      capacity,
      'Hotel pickup',
      'Hotel dropoff',
      price,
      'scheduled',
      0,
      tour_type
    FROM (
      VALUES 
        ('Chichen Itza Sunrise', '05:30', 720, 20, 129, 'shared'),
        ('Valladolid Cultural Tour', '06:30', 600, 20, 99, 'shared'),
        ('Coba + Valladolid', '06:30', 660, 20, 99, 'shared'),
        ('Coba Adventure + Cenotes', '07:00', 600, 20, 109, 'shared'),
        ('Tulum Ruins Express', '07:30', 360, 15, 89, 'private'),
        ('Tulum + Akumal Combo', '07:30', 480, 20, 105, 'shared'),
        ('Isla Mujeres Day Trip', '07:30', 600, 20, 119, 'shared'),
        ('Xcaret Park Tour', '08:00', 540, 20, 139, 'shared'),
        ('Akumal Snorkeling Tour', '08:00', 300, 15, 95, 'shared'),
        ('Puerto Morelos Reef', '08:00', 210, 15, 95, 'shared'),
        ('Playa del Carmen Tour', '08:30', 360, 20, 89, 'shared'),
        ('Cenote Route Private', '08:30', 300, 8, 79, 'private'),
        ('Tulum VIP Private', '09:00', 360, 8, 299, 'private'),
        ('Gran Cenote Private', '09:30', 270, 8, 79, 'private'),
        ('Sunset Tulum Tour', '13:30', 300, 15, 69, 'private')
    ) AS t(tour_name, start_time, duration_min, capacity, price, tour_type)
    RETURNING id
  ) AS tours;
  
  -- Create guests for first 5 tours
  INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, notes, checked_in)
  SELECT 
    t.id,
    first_name,
    last_name,
    lower(first_name) || '.' || lower(last_name) || '.' || row_number() OVER (PARTITION BY t.id) || '@email.com',
    '+1-555-' || (1000 + row_number() OVER (PARTITION BY t.id))::text,
    (ARRAY['Grand Velas', 'Beloved', 'Secrets Maroma', 'Finest', 'Hyatt Ziva'])[1 + (row_number() OVER () % 5)::int],
    (100 + row_number() OVER ())::text,
    1 + (row_number() OVER () % 3)::int,
    (row_number() OVER () % 2)::int,
    'Demo guest',
    false
  FROM (
    SELECT id FROM unnest(v_tour_ids[1:5]) AS id
  ) t
  CROSS JOIN (
    VALUES 
      ('John', 'Smith'),
      ('Sarah', 'Johnson'),
      ('Michael', 'Brown'),
      ('Lisa', 'Garcia')
  ) AS names(first_name, last_name);
  
  -- Create pickup stops for shared tours
  INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes)
  SELECT 
    t.id,
    v_brand_id,
    1,
    'Grand Sunset Resort',
    'Carretera Cancun-Tulum Km 240',
    20.6897,
    -87.0739,
    '07:30'::time,
    3,
    'Demo pickup'
  FROM unnest(v_tour_ids[1:3]) AS id
  JOIN tours t ON t.id = id;
  
  -- Create guide check-ins
  INSERT INTO guide_checkins (tour_id, brand_id, guide_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, gps_alert_triggered, scheduled_time, minutes_early_or_late, notes)
  SELECT 
    t.id,
    v_brand_id,
    t.guide_id,
    'pre_pickup',
    NOW() - interval '2 hours',
    20.6 + random() * 0.5,
    -87.0 + random() * 0.3,
    10 + random() * 20,
    false,
    t.start_time,
    (random() * 10 - 5)::int,
    'Demo check-in'
  FROM tours t
  WHERE t.id = ANY(v_tour_ids[1:5]);
  
  -- Create incidents (using ACTUAL schema columns)
  INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, guide_id, resolution_notes, created_at, updated_at)
  SELECT 
    t.id,
    t.guide_id,
    inc_type,
    severity,
    inc_desc,
    inc_status,
    t.guide_id,
    CASE WHEN inc_status = 'resolved' THEN 'Resolved on site' ELSE NULL END,
    NOW(),
    NOW()
  FROM (
    VALUES 
      (v_tour_ids[1], 'medical', 'medium', 'Guest felt dizzy. Possible dehydration.', 'resolved'),
      (v_tour_ids[2], 'vehicle_issue', 'medium', 'AC not working in vehicle.', 'reported'),
      (v_tour_ids[3], 'delay', 'low', 'Traffic delay on highway.', 'reported')
  ) AS i(tour_id, inc_type, severity, inc_desc, inc_status)
  JOIN tours t ON t.id = i.tour_id;
  
  -- Create expenses
  INSERT INTO tour_expenses (tour_id, guide_id, company_id, category, description, amount, currency, has_receipt, status, notes)
  SELECT 
    t.id,
    t.guide_id,
    v_company_id,
    cat,
    desc_text,
    amt,
    'MXN',
    (random() > 0.5),
    'pending',
    'Demo expense'
  FROM (
    VALUES 
      (v_tour_ids[1], 'fuel', 'Van fuel', 45),
      (v_tour_ids[2], 'parking', 'Parking fee', 150),
      (v_tour_ids[3], 'meals', 'Guide lunch', 180),
      (v_tour_ids[4], 'tolls', 'Highway tolls', 140),
      (v_tour_ids[5], 'supplies', 'Bottled water', 95)
  ) AS e(tour_id, cat, desc_text, amt)
  JOIN tours t ON t.id = e.tour_id;
  
  -- Create guest feedback (using ACTUAL schema columns)
  INSERT INTO guest_feedback (tour_id, guest_id, rating, review_title, review_text, review_date, responded, created_at)
  SELECT 
    t.id,
    g.id,
    rating,
    title,
    text,
    NOW(),
    false,
    NOW()
  FROM (
    VALUES 
      (v_tour_ids[1], 5, 'Absolutely Amazing!', 'Best tour of our vacation!'),
      (v_tour_ids[2], 5, 'Great Experience', 'Loved every moment.'),
      (v_tour_ids[3], 4, 'Wonderful Tour', 'Amazing experience!')
  ) AS f(tour_id, rating, title, text)
  JOIN tours t ON t.id = f.tour_id
  JOIN guests g ON g.tour_id = t.id
  LIMIT 3;
  
  -- Return stats
  SELECT json_build_object(
    'tours', (SELECT COUNT(*) FROM tours WHERE tour_date = CURRENT_DATE),
    'guests', (SELECT COUNT(*) FROM guests WHERE tour_id = ANY(v_tour_ids)),
    'incidents', (SELECT COUNT(*) FROM incidents WHERE tour_id = ANY(v_tour_ids)),
    'checkins', (SELECT COUNT(*) FROM guide_checkins WHERE tour_id = ANY(v_tour_ids)),
    'expenses', (SELECT COUNT(*) FROM tour_expenses WHERE tour_id = ANY(v_tour_ids)),
    'feedback', (SELECT COUNT(*) FROM guest_feedback WHERE tour_id = ANY(v_tour_ids))
  ) INTO v_results;
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION generate_demo_data() TO authenticated;

SELECT 'generate_demo_data function created successfully' as status;
