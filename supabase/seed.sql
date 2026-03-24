-- SIMPLE DUMMY DATA SEED
-- Run this in Supabase SQL Editor AFTER running all migrations

-- ============================================
-- COMPANIES (use the one from initial schema or create)
-- ============================================
INSERT INTO companies (id, name, slug) VALUES
('11111111-1111-1111-1111-111111111111', 'Cancun Adventure Tours', 'cancun-adventure-tours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BRANDS
-- ============================================
INSERT INTO brands (id, company_id, name, slug, primary_color, secondary_color, is_active) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chichen Itza', 'chichen-itza', '#1A56DB', '#057A55', true),
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tulum', 'tulum', '#7E3AF2', '#9061F9', true),
('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cenote', 'cenote', '#E02424', '#F98080', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEHICLES (with specific UUIDs)
-- ============================================
INSERT INTO vehicles (id, company_id, plate_number, make, model, year, capacity, status, mileage) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'CAN-001', 'Mercedes', 'Sprinter', 2022, 16, 'available', 45000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'CAN-002', 'Toyota', 'Hiace', 2023, 14, 'available', 32000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'CAN-003', 'Ford', 'Transit', 2021, 15, 'in_use', 78000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', '11111111-1111-1111-1111-111111111111', 'CAN-004', 'Mercedes', 'Sprinter', 2023, 20, 'available', 28000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', '11111111-1111-1111-1111-111111111111', 'CAN-005', 'Volkswagen', 'Crafter', 2022, 18, 'maintenance', 55000),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6', '11111111-1111-1111-1111-111111111111', 'CAN-006', 'Toyota', 'Coaster', 2024, 25, 'available', 12000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TOUR TEMPLATES
-- ============================================
INSERT INTO tour_templates (id, company_id, name, description, duration_minutes, capacity, pickup_location, dropoff_location, price) VALUES
('tttttttt-tttt-tttt-tttt-ttttttttttt1', '11111111-1111-1111-1111-111111111111', 'Chichen Itza Classic', 'Full day tour to Chichen Itza', 600, 16, 'Hotel Zone', 'Hotel Zone', 89.00),
('tttttttt-tttt-tttt-tttt-ttttttttttt2', '11111111-1111-1111-1111-111111111111', 'Tulum Half Day', 'Morning tour to Tulum ruins', 300, 14, 'Hotel Zone', 'Hotel Zone', 65.00),
('tttttttt-tttt-tttt-tttt-ttttttttttt3', '11111111-1111-1111-1111-111111111111', 'Cenote Triple', 'Visit 3 different cenotes', 420, 20, 'Downtown', 'Downtown', 75.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TOURS (for today)
-- ============================================
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, vehicle_id, status, price, guest_count) VALUES
('tttttttt-tttt-tttt-tttt-ttttttttttt4', '11111111-1111-1111-1111-111111111111', 'Chichen Itza Classic', 'Full day tour', CURRENT_DATE, '07:00', 600, 16, 'Hotel Zone Cancun', 'Hotel Zone Cancun', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'in_progress', 89.00, 14),
('tttttttt-tttt-tttt-tttt-ttttttttttt5', '11111111-1111-1111-1111-111111111111', 'Tulum Half Day', 'Morning tour', CURRENT_DATE, '09:00', 300, 14, 'Hotel Zone Cancun', 'Hotel Zone Cancun', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'completed', 65.00, 12),
('tttttttt-tttt-tttt-tttt-ttttttttttt6', '11111111-1111-1111-1111-111111111111', 'Cenote Triple', 'Swimming tour', CURRENT_DATE, '10:00', 420, 20, 'Downtown Cancun', 'Downtown Cancun', NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'scheduled', 75.00, 18),
('tttttttt-tttt-tttt-tttt-ttttttttttt7', '11111111-1111-1111-1111-111111111111', 'Coba & Cenote', 'Ruins tour', CURRENT_DATE + 1, '08:00', 480, 16, 'Hotel Zone', 'Hotel Zone', NULL, NULL, 'scheduled', 85.00, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GUESTS
-- ============================================
INSERT INTO guests (id, tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, checked_in, no_show) VALUES
-- Chichen Itza guests (in progress)
('gggggggg-gggg-gggg-gggg-ggggggggggg1', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', 'John', 'Smith', 'john@email.com', '+1-555-0101', 'Riu Cancun', '1204', 2, 0, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg2', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', 'Mary', 'Johnson', 'mary@email.com', '+1-555-0102', 'Riu Cancun', '1205', 2, 1, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg3', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', 'Robert', 'Williams', 'robert@email.com', '+1-555-0103', 'Hyatt Ziva', '502', 2, 0, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg4', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', 'Patricia', 'Brown', 'patricia@email.com', '+1-555-0104', 'Hyatt Ziva', '503', 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg5', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', 'Michael', 'Davis', 'michael@email.com', '+1-555-0105', 'Moon Palace', '1200', 2, 2, false, false),
-- Tulum guests (completed)
('gggggggg-gggg-gggg-gggg-ggggggggggg6', 'tttttttt-tttt-tttt-tttt-ttttttttttt5', 'Jennifer', 'Miller', 'jen@email.com', '+1-555-0106', 'Secrets Playa', NULL, 2, 0, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg7', 'tttttttt-tttt-tttt-tttt-ttttttttttt5', 'James', 'Wilson', 'james@email.com', '+1-555-0107', 'Secrets Playa', NULL, 2, 0, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg8', 'tttttttt-tttt-tttt-tttt-ttttttttttt5', 'Linda', 'Moore', 'linda@email.com', '+1-555-0108', 'Grand Fiesta', NULL, 2, 1, true, false),
('gggggggg-gggg-gggg-gggg-ggggggggggg9', 'tttttttt-tttt-tttt-tttt-ttttttttttt5', 'David', 'Taylor', 'david@email.com', '+1-555-0109', 'Grand Fiesta', NULL, 2, 0, false, true),
('gggggggg-gggg-gggg-gggg-gggggggggg10', 'tttttttt-tttt-tttt-tttt-ttttttttttt5', 'Elizabeth', 'Anderson', 'liz@email.com', '+1-555-0110', 'Live Aqua', NULL, 2, 0, true, false),
-- Cenote guests (scheduled)
('gggggggg-gggg-gggg-gggg-gggggggggg11', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Thomas', 'Thomas', 'tom@email.com', NULL, 'Hard Rock', NULL, 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg12', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Barbara', 'Jackson', 'barb@email.com', NULL, 'Hard Rock', NULL, 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg13', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Charles', 'White', 'charles@email.com', NULL, 'Royalton', NULL, 2, 1, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg14', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Susan', 'Harris', 'susan@email.com', NULL, 'Royalton', NULL, 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg15', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Christopher', 'Martin', 'chris@email.com', NULL, 'Iberostar', NULL, 2, 2, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg16', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Jessica', 'Thompson', 'jess@email.com', NULL, 'Iberostar', NULL, 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg17', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Daniel', 'Garcia', 'dan@email.com', NULL, 'Breathless', NULL, 2, 0, false, false),
('gggggggg-gggg-gggg-gggg-gggggggggg18', 'tttttttt-tttt-tttt-tttt-ttttttttttt6', 'Sarah', 'Martinez', 'sarah@email.com', NULL, 'Breathless', NULL, 2, 0, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CHECKLISTS
-- ============================================
INSERT INTO checklists (id, company_id, name, description, items) VALUES
('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'Pre-Tour Vehicle Check', 'Check vehicle before starting', 
'[{"id": "1", "text": "Check tire pressure", "required": true}, {"id": "2", "text": "Check fuel level", "required": true}, {"id": "3", "text": "Check first aid kit", "required": true}]'::jsonb),
('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-111111111111', 'Guest Pickup Verification', 'Verify guests', 
'[{"id": "1", "text": "Verify guest count", "required": true}, {"id": "2", "text": "Check special requirements", "required": false}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INCIDENTS
-- ============================================
INSERT INTO incidents (id, tour_id, reported_by, type, severity, description, status) VALUES
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii1', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', NULL, 'vehicle', 'low', 'AC not cooling properly', 'resolved'),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiii2', 'tttttttt-tttt-tttt-tttt-ttttttttttt4', NULL, 'guest', 'medium', 'Guest left phone at hotel', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MAINTENANCE
-- ============================================
INSERT INTO vehicle_maintenance (id, vehicle_id, type, description, scheduled_date, status) VALUES
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmm1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'oil_change', 'Regular oil change', '2026-03-30', 'scheduled'),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmm2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5', 'repair', 'Brake pad replacement', '2026-03-25', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- NOTE: Profiles are created via Supabase Auth signup
-- Sign up these users in the app after running this seed:
-- - super_admin@example.com
-- - manager@example.com  
-- - operations@example.com
-- - supervisor@example.com
-- - guide1@example.com
-- - guide2@example.com
