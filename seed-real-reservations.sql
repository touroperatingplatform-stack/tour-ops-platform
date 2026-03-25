-- Seed reservations matching REAL tour company PDF format
-- From TENOCH TOURS SA DE CV - TULUM CENOTE AKUMAL

DO $$
DECLARE
  v_tour_id uuid;
  v_res_id uuid;
BEGIN
  -- Get the Tulum tour
  SELECT id INTO v_tour_id 
  FROM tours 
  WHERE name = 'Tulum Ruins and Beach' AND tour_date = CURRENT_DATE;

  -- Only seed if tour exists and no reservations yet
  IF v_tour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM reservation_manifest WHERE tour_id = v_tour_id
  ) THEN
    
    -- ============================================
    -- RESERVATION 1: VIVA AZTECA - FRANCESCA & ADRIANA
    -- ============================================
    INSERT INTO reservation_manifest (
      tour_id, 
      booking_reference, 
      booking_platform,  -- NS VACATIONS
      adult_pax, child_pax, infant_pax,
      hotel_name, room_number,
      nationality_code, pickup_time,
      rep_name, agency_name
    ) VALUES (
      v_tour_id, '092+600', 'NS VACATIONS',
      2, 0, 0,
      'VIVA AZTECA', '1314',
      'ES', '07:50',
      'PLAYACAR SERVICE', 'NS VACATIONS'
    )
    RETURNING id INTO v_res_id;

    -- Add guests for this reservation
    INSERT INTO reservation_guests (reservation_id, guest_name, is_primary_contact)
    VALUES 
      (v_res_id, 'FRANCESCA', true),
      (v_res_id, 'ADRIANA', false);

    -- ============================================
    -- RESERVATION 2: ALLEGRO PLAYACAR - CONTE ANTOINE
    -- ============================================
    INSERT INTO reservation_manifest (
      tour_id, 
      booking_reference, 
      booking_platform,
      adult_pax, child_pax, infant_pax,
      hotel_name, room_number,
      nationality_code, pickup_time,
      rep_name, agency_name
    ) VALUES (
      v_tour_id, '017+600', 'NS VACATIONS',
      2, 0, 0,
      'ALLEGRO PLAYACAR', '064',
      'FR', '07:50',
      'RAUL NS', 'NS VACATIONS'
    )
    RETURNING id INTO v_res_id;

    INSERT INTO reservation_guests (reservation_id, guest_name, is_primary_contact)
    VALUES (v_res_id, 'CONTE ANTOINE', true);

    -- ============================================
    -- RESERVATION 3: Example Family
    -- ============================================
    INSERT INTO reservation_manifest (
      tour_id, 
      booking_reference, 
      booking_platform,
      adult_pax, child_pax, infant_pax,
      hotel_name, room_number,
      nationality_code, pickup_time,
      rep_name, agency_name,
      special_requests
    ) VALUES (
      v_tour_id, '045+600', 'VIATOR',
      2, 2, 0,  -- 2 adults + 2 children
      'Riu Palace Riviera Maya', '2450',
      'US', '07:35',
      'HOTEL RECEPTION', 'VIATOR',
      'Kids ages 8 and 12, vegetarian meals'
    )
    RETURNING id INTO v_res_id;

    INSERT INTO reservation_guests (reservation_id, guest_name, is_primary_contact)
    VALUES 
      (v_res_id, 'SMITH MICHAEL', true),
      (v_res_id, 'SMITH SARAH', false),
      (v_res_id, 'SMITH EMMA', false),
      (v_res_id, 'SMITH LUCAS', false);

    -- ============================================
    -- RESERVATION 4: Solo Traveler
    -- ============================================
    INSERT INTO reservation_manifest (
      tour_id, 
      booking_reference, 
      booking_platform,
      adult_pax, child_pax, infant_pax,
      hotel_name, room_number,
      nationality_code, pickup_time,
      rep_name, agency_name
    ) VALUES (
      v_tour_id, '089+600', 'BOOKING.COM',
      1, 0, 0,
      'Grand Hyatt Playa', '892',
      'DE', '08:00',
      'HOTEL CONCIERGE', 'BOOKING.COM'
    )
    RETURNING id INTO v_res_id;

    INSERT INTO reservation_guests (reservation_id, guest_name, is_primary_contact)
    VALUES (v_res_id, 'MUELLER HANS', true);

  END IF;
END $$;

-- Verify with real format display
SELECT 
  rm.hotel_name,
  rm.room_number as hab,
  string_agg(rg.guest_name, ' Y ' ORDER BY rg.is_primary_contact DESC) as cliente,
  rm.adult_pax || '.' || rm.child_pax || ' PAX' as pax,
  rm.booking_reference as conf,
  rm.nationality_code as id,
  rm.pickup_time::text as hora,
  rm.rep_name as rep,
  rm.agency_name as agencia
FROM reservation_manifest rm
LEFT JOIN reservation_guests rg ON rg.reservation_id = rm.id
WHERE rm.tour_id IN (SELECT id FROM tours WHERE tour_date = CURRENT_DATE)
GROUP BY rm.id, rm.hotel_name, rm.room_number, rm.adult_pax, rm.child_pax, 
         rm.booking_reference, rm.nationality_code, rm.pickup_time, rm.rep_name, rm.agency_name
ORDER BY rm.pickup_time;
