-- Insert test tours with pickup stops
-- Using proper UUID format

-- Tour 1: Today's tour, in_progress, NOT checked in
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) 
VALUES 
('11111111-1111-1111-1111-111111111111', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Mayan Ruins Express', 'Visit the ancient Mayan city of Tulum', '2026-03-25', '09:00', 300, 12, 'Hotel Zone Lobby', 'Hotel Zone Lobby', '34ef0245-f2be-4c3d-a870-d5d081296046', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 85.00, 'in_progress', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET status = 'in_progress';

-- Pickup stops for Tour 1
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count) 
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Hotel Zone - Zone 1', 'Kukulkan Blvd, Hotel Zone', 21.1350, -86.7460, '09:00:00', 4),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Hotel Zone - Zone 2', 'Kukulkan Blvd South', 21.1200, -86.7550, '09:30:00', 4)
ON CONFLICT (id) DO NOTHING;

-- Tour 2: Today's tour, in_progress, ALREADY checked in
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) 
VALUES 
('22222222-2222-2222-2222-222222222222', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba and Cenote Adventure', 'Explore Coba ruins and cenote', '2026-03-25', '08:30', 480, 10, 'Downtown Cancun', 'Downtown Cancun', 'd68d3488-1a30-4970-8aff-90e62e605c57', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 120.00, 'in_progress', 6, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET status = 'in_progress';

INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count) 
VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Downtown - ADO Station', 'Av. Uxmal 60, Downtown', 21.1650, -86.8250, '08:30:00', 6)
ON CONFLICT (id) DO NOTHING;

-- Add check-in for Tour 2 (25 min early)
INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, selfie_url, scheduled_time, minutes_early_or_late, notes) 
VALUES 
('22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd68d3488-1a30-4970-8aff-90e62e605c57', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'pre_pickup', NOW() - INTERVAL '2 hours', 21.1650, -86.8250, 5.0, 'https://res.cloudinary.com/demo/sample.jpg', '08:30:00', 25, 'Guide arrived early');

-- Verify
SELECT 'tours' as table_name, COUNT(*) as count FROM tours WHERE tour_date = '2026-03-25'
UNION ALL
SELECT 'pickup_stops', COUNT(*) FROM pickup_stops WHERE tour_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')
UNION ALL
SELECT 'guide_checkins', COUNT(*) FROM guide_checkins WHERE tour_id = '22222222-2222-2222-2222-222222222222';
