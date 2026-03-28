-- ============================================
-- GENERATE DEMO DATA FUNCTION
-- ============================================
-- Run this in Supabase SQL Editor
-- Creates realistic demo data for testing

CREATE OR REPLACE FUNCTION generate_demo_data()
RETURNS json AS $$
DECLARE
  v_brand_id uuid;
  v_company_id uuid;
  v_guide_ids uuid[];
  v_tour_ids uuid[];
  v_vehicle_ids uuid[];
  v_stop_ids uuid[];
  v_user_id uuid;
  v_results json;
BEGIN
  -- Get current user's brand/company (for super_admin, use first brand)
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  SELECT company_id INTO v_company_id FROM companies LIMIT 1;
  
  -- Get or create demo users
  SELECT array_agg(id) INTO v_guide_ids 
  FROM profiles 
  WHERE role = 'guide' 
  LIMIT 15;
  
  -- Create 6 demo vehicles
  SELECT array_agg(id) INTO v_vehicle_ids
  FROM (
    INSERT INTO vehicles (brand_id, model, plate_number, status, capacity, year)
    VALUES 
      (v_brand_id, 'Toyota Hiace', 'YXZ-123', 'in_use', 15, 2022),
      (v_brand_id, 'Mercedes Sprinter', 'ABC-456', 'in_use', 18, 2023),
      (v_brand_id, 'Ford Transit', 'DEF-789', 'in_use', 12, 2021),
      (v_brand_id, 'Chevrolet Express', 'GHI-012', 'in_use', 10, 2022),
      (v_brand_id, 'Nissan Urvan', 'JKL-345', 'available', 15, 2020),
      (v_brand_id, 'Maxus H350', 'MNO-678', 'available', 16, 2023)
    ON CONFLICT DO NOTHING
    RETURNING id
  ) AS vehicles;
  
  -- Create 15 demo tours for today
  SELECT array_agg(id) INTO v_tour_ids
  FROM (
    INSERT INTO tours (
      brand_id, 
      name, 
      guide_id, 
      vehicle_id,
      tour_date, 
      start_time, 
      end_time, 
      status, 
      guest_count, 
      capacity
    )
    SELECT 
      v_brand_id,
      tour_name,
      v_guide_ids[(row_number() OVER () % array_length(v_guide_ids, 1)) + 1],
      v_vehicle_ids[(row_number() OVER () % 6) + 1],
      CURRENT_DATE,
      start_time,
      end_time,
      'in_progress',
      (random() * 10 + 5)::int,
      (random() * 10 + 15)::int
    FROM (
      VALUES 
        ('Chichen Itza Sunrise', '05:30', '18:00'),
        ('Valladolid Cultural Tour', '06:30', '17:00'),
        ('Coba + Valladolid', '06:30', '17:30'),
        ('Coba Adventure + Cenotes', '07:00', '18:00'),
        ('Tulum Ruins Express', '07:30', '14:00'),
        ('Tulum + Akumal Combo', '07:30', '16:00'),
        ('Isla Mujeres Day Trip', '07:30', '19:00'),
        ('Xcaret Park Tour', '08:00', '20:00'),
        ('Akumal Snorkeling Tour', '08:00', '13:00'),
        ('Puerto Morelos Reef', '08:00', '13:30'),
        ('Playa del Carmen Tour', '08:30', '15:00'),
        ('Cenote Route Private', '08:30', '14:00'),
        ('Tulum VIP Private', '09:00', '15:00'),
        ('Gran Cenote Private', '09:30', '14:30'),
        ('Sunset Tulum Tour', '13:30', '20:00')
    ) AS t(tour_name, start_time, end_time)
    RETURNING id
  ) AS tours;
  
  -- Create pickup stops for tours
  INSERT INTO pickup_stops (tour_id, hotel_name, pickup_time, status)
  SELECT 
    t.id,
    hotel,
    (t.start_time::time - (random() * interval '2 hours'))::time,
    CASE WHEN random() > 0.3 THEN 'completed' ELSE 'scheduled' END
  FROM unnest(v_tour_ids) AS t(id)
  CROSS JOIN (
    VALUES 
      ('Hotel Gran Caribe'),
      ('Iberostar Selection'),
      ('Grand Sirenis'),
      ('Secrets Akumal'),
      ('Dreams Tulum'),
      ('Hotel Xcaret')
  ) AS h(hotel);
  
  -- Create guide check-ins
  INSERT INTO guide_checkins (tour_id, guide_id, checkin_type, checked_in_at, minutes_early_or_late, location_accuracy)
  SELECT 
    t.id,
    t.guide_id,
    'pre_pickup',
    (t.start_time::timestamp - (random() * interval '30 minutes' + interval '5 minutes')),
    (random() * 20 - 5)::int,  -- Between -5 (late) and +15 (early)
    (random() * 20 + 5)::int
  FROM tours t
  WHERE t.id = ANY(v_tour_ids);
  
  -- Create 3 demo incidents
  INSERT INTO incidents (
    tour_id,
    brand_id,
    guide_id,
    incident_type,
    severity,
    title,
    description,
    status,
    escalation_level,
    reported_at
  )
  SELECT 
    t.id,
    v_brand_id,
    t.guide_id,
    inc_type,
    severity,
    inc_title,
    inc_desc,
    'reported',
    1,
    NOW()
  FROM (
    VALUES 
      (
        (SELECT id FROM tours WHERE name = 'Coba Adventure + Cenotes' LIMIT 1),
        'medical_emergency',
        'medium',
        'Guest felt dizzy',
        'Guest reported feeling dizzy and nauseous during the tour. Possible dehydration or heat exhaustion. Provided water and rest.'
      ),
      (
        (SELECT id FROM tours WHERE name = 'Coba + Valladolid' LIMIT 1),
        'vehicle_breakdown',
        'medium',
        'AC not working',
        'Vehicle AC blowing warm air. Guests uncomfortable. Requesting replacement vehicle or repair.'
      ),
      (
        (SELECT id FROM tours WHERE name = 'Tulum Ruins Express' LIMIT 1),
        'guest_complaint',
        'low',
        'Tour too rushed',
        'Guests complained that the tour felt rushed and they did not have enough time at the ruins.'
      )
  ) AS i(tour_id, inc_type, severity, inc_title, inc_desc);
  
  -- Create tour expenses
  INSERT INTO tour_expenses (tour_id, category, amount, description, paid_by)
  SELECT 
    t.id,
    cat,
    amt,
    desc,
    'guide'
  FROM (
    SELECT id FROM tours LIMIT 5
  ) t
  CROSS JOIN (
    VALUES 
      ('parking', 50.00, 'Parking fee at Tulum'),
      ('tolls', 120.00, 'Highway tolls'),
      ('meals', 300.00, 'Guide lunch'),
      ('fuel', 450.00, 'Fuel refill'),
      ('entrance_fees', 800.00, 'Guest entrance fees')
  ) AS e(cat, amt, desc);
  
  -- Create guest feedback
  INSERT INTO guest_feedback (tour_id, rating, comment, created_at)
  SELECT 
    t.id,
    (random() * 2 + 3)::int,  -- 3-5 stars
    CASE 
      WHEN random() > 0.7 THEN 'Amazing tour! Guide was very knowledgeable.'
      WHEN random() > 0.4 THEN 'Good experience overall, minor issues with timing.'
      ELSE 'Excellent service, would recommend!'
    END,
    NOW()
  FROM tours t
  WHERE t.id = ANY(v_tour_ids)
  LIMIT 3;
  
  -- Create activity feed entries
  INSERT INTO activity_feed (user_id, action_type, description, entity_type, entity_id)
  SELECT 
    (SELECT id FROM profiles WHERE role = 'guide' LIMIT 1),
    action,
    desc,
    entity,
    (SELECT id FROM tours LIMIT 1)
  FROM (
    VALUES 
      ('tour_started', 'Tour Chichen Itza Sunrise started'),
      ('checkin_completed', 'Guide checked in for Valladolid Cultural Tour'),
      ('expense_created', 'Expense added for Tulum Ruins Express'),
      ('incident_reported', 'Incident reported for Coba Adventure'),
      ('tour_completed', 'Tour Isla Mujeres Day Trip completed')
  ) AS a(action, desc);
  
  -- Return stats
  SELECT json_build_object(
    'tours', (SELECT COUNT(*) FROM tours WHERE tour_date = CURRENT_DATE),
    'guests', (SELECT COUNT(*) FROM guests),
    'vehicles', (SELECT COUNT(*) FROM vehicles),
    'incidents', (SELECT COUNT(*) FROM incidents WHERE status = 'reported'),
    'checkins', (SELECT COUNT(*) FROM guide_checkins WHERE checked_in_at::date = CURRENT_DATE),
    'expenses', (SELECT COUNT(*) FROM tour_expenses),
    'feedback', (SELECT COUNT(*) FROM guest_feedback),
    'activity', (SELECT COUNT(*) FROM activity_feed)
  ) INTO v_results;
  
  RETURN v_results;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION generate_demo_data() TO authenticated;

-- Test it
SELECT 'Function created successfully' as status;
SELECT generate_demo_data();
