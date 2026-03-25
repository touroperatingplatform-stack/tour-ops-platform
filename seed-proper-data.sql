-- PROPER TEST DATA
-- Uses existing schema with pickup_stops and guide_checkins

-- Company ID
-- 6e046c69-93e2-48c9-a861-46c91fd2ae3b (Cancun Adventure Tours)

-- Get guide IDs for reference
-- Use one of the existing guides: diego@tour-ops.com (34ef0245-f2be-4c3d-a870-d5d081296046)

-- ============================================
-- CREATE TOURS WITH PICKUP STOPS
-- ============================================

-- Tour 1: Today's tour, in_progress, NOT checked in yet
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Tulum Mayan Ruins Express', 'Visit the ancient Mayan city of Tulum with our expert guide. Includes cenote swim.', '2026-03-25', '09:00', 300, 12, 'Hotel Zone Lobby', 'Hotel Zone Lobby', '34ef0245-f2be-4c3d-a870-d5d081296046', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 85.00, 'in_progress', 8, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Pickup stops for Tour 1
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Hotel Zone - Zone 1', 'Kukulkan Blvd, Hotel Zone', 21.1350, -86.7460, '09:00:00', 4, 'Guests staying in beachfront hotels'),
('a1111111-1111-1111-1111-111111111112', '11111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Hotel Zone - Zone 2', 'Kukulkan Blvd, Hotel Zone South', 21.1200, -86.7550, '09:30:00', 4, 'Guests in southern hotels')
ON CONFLICT (id) DO NOTHING;

-- Tour 2: Today's tour, in_progress, ALREADY checked in (early)
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) VALUES
('22222222-2222-2222-2222-222222222222', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Coba & Cenote Adventure', 'Explore Coba ruins and swim in a beautiful cenote. Lunch included.', '2026-03-25', '08:30', 480, 10, 'Downtown Cancun', 'Downtown Cancun', 'd68d3488-1a30-4970-8aff-90e62e605c57', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 120.00, 'in_progress', 6, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Pickup stops for Tour 2
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes) VALUES
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Downtown - ADO Station', 'Av. Uxmal 60, Downtown', 21.1650, -86.8250, '08:30:00', 6, 'All guests meet here')
ON CONFLICT (id) DO NOTHING;

-- Add check-in for Tour 2 (checked in 25 min early)
INSERT INTO guide_checkins (id, tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, selfie_url, scheduled_time, minutes_early_or_late, notes) VALUES
('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd68d3488-1a30-4970-8aff-90e62e605c57', 'a2222222-2222-2222-2222-222222222222', 'pre_pickup', NOW() - INTERVAL '2 hours', 21.1650, -86.8250, 5.0, 'https://res.cloudinary.com/demo/sample.jpg', '08:30:00', 25, 'Guide arrived early, ready for pickup')
ON CONFLICT (id) DO NOTHING;

-- Tour 3: Tomorrow's tour, scheduled (not started)
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, brand_id, price, status, guest_count, created_by, created_at) VALUES
('33333333-3333-3333-3333-333333333333', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Chichen Itza Wonder', 'World wonder tour with colonial town visit. Full day experience.', '2026-03-26', '07:00', 600, 15, 'Puerto Juarez', 'Puerto Juarez', '2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 150.00, 'scheduled', 12, '7b0d216f-7a23-44ea-b075-cb919b5424c1', NOW())
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

-- Pickup stops for Tour 3
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes) VALUES
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Puerto Juarez Ferry Terminal', 'Av. Lopez Portillo, Puerto Juarez', 21.1900, -86.8050, '07:00:00', 8, 'Early morning pickup'),
('a3333333-3333-3333-3333-333333333334', '33333333-3333-3333-3333-333333333333', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Hotel Zone - Ritz', 'Kukulkan Km 15, Hotel Zone', 21.0800, -86.7700, '07:30:00', 4, 'Luxury hotel guests')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VERIFY
-- ============================================

SELECT 'Tours' as table_name, COUNT(*) as count FROM tours
UNION ALL SELECT 'Pickup Stops', COUNT(*) FROM pickup_stops
UNION ALL SELECT 'Guide Checkins', COUNT(*) FROM guide_checkins
ORDER BY table_name;
