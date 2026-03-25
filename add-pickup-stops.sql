-- Add pickup stops with proper casting from text to time
INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, scheduled_time, guest_count)
SELECT 
    t.id, 
    t.brand_id, 
    1, 
    'Hotel Zone Pickup',
    t.pickup_location,
    t.start_time::time,
    t.guest_count
FROM tours t
WHERE t.name = 'Tulum Test Tour'
ON CONFLICT DO NOTHING;

INSERT INTO pickup_stops (tour_id, brand_id, sort_order, location_name, address, scheduled_time, guest_count)
SELECT 
    t.id, 
    t.brand_id, 
    1, 
    'Downtown Pickup',
    t.pickup_location,
    t.start_time::time,
    t.guest_count
FROM tours t
WHERE t.name = 'Coba Test Tour'
ON CONFLICT DO NOTHING;

-- Verify
SELECT t.name, ps.location_name, ps.scheduled_time
FROM tours t
LEFT JOIN pickup_stops ps ON ps.tour_id = t.id
WHERE t.tour_date = CURRENT_DATE;
