-- Seed reservations for today's Tulum tour
-- Format: 3.1 pax = 3 adults + 1 child

DO $$
DECLARE
  v_tour_id uuid;
  v_brand_id uuid;
BEGIN
  -- Get tour and brand
  SELECT t.id, t.brand_id INTO v_tour_id, v_brand_id
  FROM tours t
  WHERE t.name = 'Tulum Ruins and Beach' AND t.tour_date = CURRENT_DATE;

  -- Only seed if tour exists and no reservations yet
  IF v_tour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM reservation_manifest WHERE tour_id = v_tour_id
  ) THEN
    
    -- Reservation 1: 2 adults, no children (2.0 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, dietary_restrictions, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'VIATOR-78234', 'viator',
      2, 0, 0,
      'John Smith', '+1-555-0101', 'john.smith@email.com',
      'Hotel Zone North', ARRAY[]::text[], 'Celebrating anniversary'
    );

    -- Reservation 2: 1 adult, 2 children (1.2 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, dietary_restrictions, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'VIATOR-78235', 'viator',
      1, 2, 0,
      'Sarah Johnson', '+1-555-0102', 'sarah.j@email.com',
      'Hotel Zone North', ARRAY['vegetarian']::text[], 'Kids ages 8 and 12'
    );

    -- Reservation 3: 2 adults, 1 child, 1 infant (2.1 pax + 1 infant)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, dietary_restrictions, accessibility_needs, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'GETYOURGUIDE-4521', 'getyourguide',
      2, 1, 1,
      'Robert Chen', '+1-555-0104', 'r.chen@email.com',
      'Hotel Zone North', ARRAY['gluten_free']::text[], ARRAY[]::text[], 'Severe peanut allergy - needs epipen'
    );

    -- Reservation 4: 3 adults, 0 children (3.0 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, accessibility_needs, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'GETYOURGUIDE-4522', 'getyourguide',
      3, 0, 0,
      'Emily Davis', '+1-555-0105', 'emily.d@email.com',
      'Hotel Zone North', ARRAY['wheelchair']::text[], 'Requires accessible vehicle'
    );

    -- Reservation 5: 4 adults, 0 children - group (4.0 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'DIRECT-8921', 'direct',
      4, 0, 0,
      'Michael Wilson', '+44-7700-900001', 'm.wilson@email.com',
      'Hotel Zone North', 'Corporate group - VIP'
    );

    -- Reservation 6: 1 adult, 1 child (1.1 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, dietary_restrictions
    ) VALUES (
      v_tour_id, v_brand_id, 'EXPEDIA-3345', 'expedia',
      1, 1, 0,
      'David Brown', '+1-555-0107', 'd.brown@email.com',
      'Hotel Zone North', ARRAY['vegan', 'dairy_free']::text[]
    );

    -- Reservation 7: 2 adults, 0 children (2.0 pax)
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location
    ) VALUES (
      v_tour_id, v_brand_id, 'BOOKING-9912', 'booking.com',
      2, 0, 0,
      'Jennifer Lee', '+1-555-0108', 'j.lee@email.com',
      'Hotel Zone North'
    );

    -- Reservation 8: 1 adult, 0 children (1.0 pax) - solo traveler
    INSERT INTO reservation_manifest (
      tour_id, brand_id, booking_reference, booking_platform,
      adult_pax, child_pax, infant_pax,
      primary_contact_name, contact_phone, contact_email,
      pickup_location, special_requests
    ) VALUES (
      v_tour_id, v_brand_id, 'VIATOR-78238', 'viator',
      1, 0, 0,
      'James Taylor', '+1-555-0109', 'james.t@email.com',
      'Hotel Zone North', 'Repeat customer'
    );

  END IF;
END $$;

-- Verify with PAX display format
SELECT 
  booking_reference,
  booking_platform,
  adult_pax || '.' || child_pax || ' pax' as pax_display,
  total_pax,
  infant_pax as infants,
  primary_contact_name
FROM reservation_manifest 
WHERE tour_id IN (SELECT id FROM tours WHERE tour_date = CURRENT_DATE AND name = 'Tulum Ruins and Beach')
ORDER BY booking_reference;
