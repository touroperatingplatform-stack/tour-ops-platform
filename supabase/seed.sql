-- SIMPLE DUMMY DATA SEED
-- Run this in Supabase SQL Editor after running migrations

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE guests, incidents, vehicle_maintenance, checklist_completions, tours, tour_templates, vehicles, brands, checklists, notifications, company_configs, profiles CASCADE;

-- ============================================
-- COMPANIES
-- ============================================
INSERT INTO companies (id, name, slug) VALUES
('11111111-1111-1111-1111-111111111111', 'Cancun Adventure Tours', 'cancun-adventure-tours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BRANDS
-- ============================================
INSERT INTO brands (id, company_id, name, description) VALUES
('b1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chichen Itza', 'Mayan ruins tours'),
('b2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tulum', 'Beach and ruins tours'),
('b3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cenote', 'Swimming and diving tours'),
('b4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Snorkel', 'Marine life tours')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEHICLES
-- ============================================
INSERT INTO vehicles (id, company_id, plate_number, make, model, year, capacity, status, mileage) VALUES
('v1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CAN-001', 'Mercedes', 'Sprinter', 2022, 16, 'available', 45000),
('v2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'CAN-002', 'Toyota', 'Hiace', 2023, 14, 'available', 32000),
('v3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'CAN-003', 'Ford', 'Transit', 2021, 15, 'in_use', 78000),
('v4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'CAN-004', 'Mercedes', 'Sprinter', 2023, 20, 'available', 28000),
('v5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'CAN-005', 'Volkswagen', 'Crafter', 2022, 18, 'maintenance', 55000),
('v6666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'CAN-006', 'Toyota', 'Coaster', 2024, 25, 'available', 12000)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TOUR TEMPLATES
-- ============================================
INSERT INTO tour_templates (id, company_id, name, description, duration_minutes, capacity, pickup_location, dropoff_location, price) VALUES
('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Chichen Itza Classic', 'Full day tour to Chichen Itza with cenote swim', 600, 16, 'Hotel Zone', 'Hotel Zone', 89.00),
('t2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Tulum Half Day', 'Morning tour to Tulum ruins', 300, 14, 'Hotel Zone', 'Hotel Zone', 65.00),
('t3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Cenote Triple', 'Visit 3 different cenotes', 420, 20, 'Downtown', 'Downtown', 75.00)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TOURS (for today)
-- ============================================
INSERT INTO tours (id, company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, vehicle_id, status, price, guest_count) VALUES
('tour-001', '11111111-1111-1111-1111-111111111111', 'Chichen Itza Classic', 'Full day tour', CURRENT_DATE, '07:00', 600, 16, 'Hotel Zone Cancun', 'Hotel Zone Cancun', NULL, 'v1111111-1111-1111-1111-111111111111', 'in_progress', 89.00, 14),
('tour-002', '11111111-1111-1111-1111-111111111111', 'Tulum Half Day', 'Morning tour', CURRENT_DATE, '09:00', 300, 14, 'Hotel Zone Cancun', 'Hotel Zone Cancun', NULL, 'v2222222-2222-2222-2222-222222222222', 'completed', 65.00, 12),
('tour-003', '11111111-1111-1111-1111-111111111111', 'Cenote Triple', 'Swimming tour', CURRENT_DATE, '10:00', 420, 20, 'Downtown Cancun', 'Downtown Cancun', NULL, 'v4444444-4444-4444-4444-444444444444', 'scheduled', 75.00, 18),
('tour-004', '11111111-1111-1111-1111-111111111111', 'Coba & Cenote', 'Ruins tour', CURRENT_DATE + 1, '08:00', 480, 16, 'Hotel Zone', 'Hotel Zone', NULL, NULL, 'scheduled', 85.00, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- GUESTS
-- ============================================
INSERT INTO guests (id, tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, checked_in, no_show) VALUES
-- Chichen Itza guests (in progress)
('g1111111-1111-1111-1111-111111111111', 'tour-001', 'John', 'Smith', 'john@email.com', '+1-555-0101', 'Riu Cancun', '1204', 2, 0, true, false),
('g2222222-2222-2222-2222-222222222222', 'tour-001', 'Mary', 'Johnson', 'mary@email.com', '+1-555-0102', 'Riu Cancun', '1205', 2, 1, true, false),
('g3333333-3333-3333-3333-333333333333', 'tour-001', 'Robert', 'Williams', 'robert@email.com', '+1-555-0103', 'Hyatt Ziva', '502', 2, 0, true, false),
('g4444444-4444-4444-4444-444444444444', 'tour-001', 'Patricia', 'Brown', 'patricia@email.com', '+1-555-0104', 'Hyatt Ziva', '503', 2, 0, false, false),
('g5555555-5555-5555-5555-555555555555', 'tour-001', 'Michael', 'Davis', 'michael@email.com', '+1-555-0105', 'Moon Palace', '1200', 2, 2, false, false),
-- Tulum guests (completed)
('g6666666-6666-6666-6666-666666666666', 'tour-002', 'Jennifer', 'Miller', 'jen@email.com', '+1-555-0106', 'Secrets Playa', NULL, 2, 0, true, false),
('g7777777-7777-7777-7777-777777777777', 'tour-002', 'James', 'Wilson', 'james@email.com', '+1-555-0107', 'Secrets Playa', NULL, 2, 0, true, false),
('g8888888-8888-8888-8888-888888888888', 'tour-002', 'Linda', 'Moore', 'linda@email.com', '+1-555-0108', 'Grand Fiesta', NULL, 2, 1, true, false),
('g9999999-9999-9999-9999-999999999999', 'tour-002', 'David', 'Taylor', 'david@email.com', '+1-555-0109', 'Grand Fiesta', NULL, 2, 0, false, true),
('g1010101-0101-0101-0101-010101010101', 'tour-002', 'Elizabeth', 'Anderson', 'liz@email.com', '+1-555-0110', 'Live Aqua', NULL, 2, 0, true, false),
-- Cenote guests (scheduled)
('g1111112-1112-1112-1112-111211121112', 'tour-003', 'Thomas', 'Thomas', 'tom@email.com', NULL, 'Hard Rock', NULL, 2, 0, false, false),
('g1212121-2121-2121-2121-212121212121', 'tour-003', 'Barbara', 'Jackson', 'barb@email.com', NULL, 'Hard Rock', NULL, 2, 0, false, false),
('g1313131-3131-3131-3131-313131313131', 'tour-003', 'Charles', 'White', 'charles@email.com', NULL, 'Royalton', NULL, 2, 1, false, false),
('g1414141-4141-4141-4141-414141414141', 'tour-003', 'Susan', 'Harris', 'susan@email.com', NULL, 'Royalton', NULL, 2, 0, false, false),
('g1515151-5151-5151-5151-515151515151', 'tour-003', 'Christopher', 'Martin', 'chris@email.com', NULL, 'Iberostar', NULL, 2, 2, false, false),
('g1616161-6161-6161-6161-616161616161', 'tour-003', 'Jessica', 'Thompson', 'jess@email.com', NULL, 'Iberostar', NULL, 2, 0, false, false),
('g1717171-7171-7171-7171-717171717171', 'tour-003', 'Daniel', 'Garcia', 'dan@email.com', NULL, 'Breathless', NULL, 2, 0, false, false),
('g1818181-8181-8181-8181-818181818181', 'tour-003', 'Sarah', 'Martinez', 'sarah@email.com', NULL, 'Breathless', NULL, 2, 0, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- CHECKLISTS
-- ============================================
INSERT INTO checklists (id, company_id, name, description, items) VALUES
('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Pre-Tour Vehicle Check', 'Check vehicle before starting tour', 
'[{"id": "1", "text": "Check tire pressure", "required": true}, {"id": "2", "text": "Check fuel level", "required": true}, {"id": "3", "text": "Check first aid kit", "required": true}, {"id": "4", "text": "Check water supply", "required": true}]'::jsonb),
('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Guest Pickup Verification', 'Verify all guests are present', 
'[{"id": "1", "text": "Verify guest count", "required": true}, {"id": "2", "text": "Check special requirements", "required": false}, {"id": "3", "text": "Brief guests", "required": true}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INCIDENTS
-- ============================================
INSERT INTO incidents (id, tour_id, reported_by, type, severity, description, status) VALUES
('i1111111-1111-1111-1111-111111111111', 'tour-001', NULL, 'vehicle', 'low', 'AC not cooling properly, but vehicle is operational', 'resolved'),
('i2222222-2222-2222-2222-222222222222', 'tour-001', NULL, 'guest', 'medium', 'Guest left phone at hotel, arranging pickup', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- MAINTENANCE
-- ============================================
INSERT INTO vehicle_maintenance (id, vehicle_id, type, description, scheduled_date, status) VALUES
('m1111111-1111-1111-1111-111111111111', 'v3333333-3333-3333-3333-333333333333', 'oil_change', 'Regular oil change service', '2026-03-30', 'scheduled'),
('m2222222-2222-2222-2222-222222222222', 'v5555555-5555-5555-5555-555555555555', 'repair', 'Brake pad replacement', '2026-03-25', 'in_progress')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DUMMY COMPANY CONFIG
-- ============================================
INSERT INTO company_configs (id, company_id, config_key, config_value) VALUES
('conf-001', '11111111-1111-1111-1111-111111111111', 'google_drive', '{"configured": false}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Profiles need to be created via Supabase Auth signup first
-- Then insert into profiles table with matching UUIDs
