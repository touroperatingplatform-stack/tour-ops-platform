-- Seed guest manifest for today's tours
-- This simulates data imported from booking platforms

DO $$
DECLARE
  v_tour_id uuid;
BEGIN
  -- Get the Tulum tour (scheduled for 2:30 PM)
  SELECT id INTO v_tour_id 
  FROM tours 
  WHERE name = 'Tulum Ruins and Beach' 
  AND tour_date = CURRENT_DATE;

  -- Only seed if tour exists and no guests yet
  IF v_tour_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM guest_manifest WHERE tour_id = v_tour_id
  ) THEN
    
    -- Guest 1: Regular guest
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, dietary_restrictions, special_requests)
    VALUES (v_tour_id, 'VIATOR-78234', 'John Smith', 'john.smith@email.com', '+1-555-0101', 'Hotel Zone North', ARRAY[]::text[], 'Celebrating anniversary');

    -- Guest 2: Vegetarian
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, dietary_restrictions, special_requests)
    VALUES (v_tour_id, 'VIATOR-78235', 'Sarah Johnson', 'sarah.j@email.com', '+1-555-0102', 'Hotel Zone North', ARRAY['vegetarian']::text[], NULL);

    -- Guest 3: Family with kids
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, dietary_restrictions, special_requests)
    VALUES (v_tour_id, 'VIATOR-78236', 'Maria Garcia', 'maria.g@email.com', '+52-998-555-0103', 'Hotel Zone North', ARRAY[]::text[], 'Traveling with 2 children ages 8 and 12');

    -- Guest 4: Allergy concern
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, dietary_restrictions, accessibility_needs, special_requests)
    VALUES (v_tour_id, 'GETYOURGUIDE-4521', 'Robert Chen', 'r.chen@email.com', '+1-555-0104', 'Hotel Zone North', ARRAY['gluten_free']::text[], ARRAY[]::text[], 'Severe peanut allergy - needs epipen');

    -- Guest 5: Wheelchair user
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, accessibility_needs, special_requests)
    VALUES (v_tour_id, 'GETYOURGUIDE-4522', 'Emily Davis', 'emily.d@email.com', '+1-555-0105', 'Hotel Zone North', ARRAY['wheelchair']::text[], 'Requires accessible vehicle');

    -- Guest 6: Simple booking
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location)
    VALUES (v_tour_id, 'DIRECT-8921', 'Michael Wilson', 'm.wilson@email.com', '+44-7700-900001', 'Hotel Zone North');

    -- Guest 7: Large group
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, special_requests)
    VALUES (v_tour_id, 'VIATOR-78237', 'Lisa Anderson', 'lisa.a@email.com', '+1-555-0106', 'Hotel Zone North', 'Part of group of 4, others on separate bookings');

    -- Guest 8: Vegan + mobility
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, dietary_restrictions, accessibility_needs)
    VALUES (v_tour_id, 'EXPEDIA-3345', 'David Brown', 'd.brown@email.com', '+1-555-0107', 'Hotel Zone North', ARRAY['vegan', 'dairy_free']::text[], ARRAY['mobility_aid']::text[]);

    -- Guest 9: No special requirements
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location)
    VALUES (v_tour_id, 'BOOKING-9912', 'Jennifer Lee', 'j.lee@email.com', '+1-555-0108', 'Hotel Zone North');

    -- Guest 10: VIP
    INSERT INTO guest_manifest (tour_id, booking_reference, guest_name, email, phone, pickup_location, special_requests)
    VALUES (v_tour_id, 'VIATOR-78238', 'James Taylor', 'james.t@email.com', '+1-555-0109', 'Hotel Zone North', 'VIP - repeat customer');

  END IF;
END $$;

-- Verify guests were added
SELECT 
  guest_name, 
  dietary_restrictions, 
  accessibility_needs,
  special_requests IS NOT NULL as has_notes
FROM guest_manifest 
WHERE tour_id IN (SELECT id FROM tours WHERE tour_date = CURRENT_DATE AND name = 'Tulum Ruins and Beach')
ORDER BY guest_name;
