-- DUMMY DATA SEED FOR TOUR OPS PLATFORM
-- Run this in Supabase SQL Editor after migrations

-- ============================================
-- COMPANY
-- ============================================
INSERT INTO companies (id, name, slug, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Cancun Adventures', 'cancun-adventures', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- USERS (using Supabase Auth - these would need to be created via API/signup)
-- For testing, assume these UUIDs exist in auth.users
-- ============================================

-- Super Admin
INSERT INTO profiles (id, company_id, first_name, last_name, role, created_at) VALUES
('11111111-1111-1111-1111-111111111111', '550e8400-e29b-41d4-a716-446655440000', 'Terry', 'Smith', 'super_admin', NOW()),
-- Manager
('22222222-2222-2222-2222-222222222222', '550e8400-e29b-41d4-a716-446655440000', 'Maria', 'Garcia', 'manager', NOW()),
-- Operations
('33333333-3333-3333-3333-333333333333', '550e8400-e29b-41d4-a716-446655440000', 'Carlos', 'Lopez', 'operations', NOW()),
-- Supervisor
('44444444-4444-4444-4444-444444444444', '550e8400-e29b-41d4-a716-446655440000', 'Sofia', 'Martinez', 'supervisor', NOW()),
-- Guides
('55555555-5555-5555-5555-555555555555', '550e8400-e29b-41d4-a716-446655440000', 'Juan', 'Rodriguez', 'guide', NOW()),
('66666666-6666-6666-6666-666666666666', '550e8400-e29b-41d4-a716-446655440000', 'Ana', 'Hernandez', 'guide', NOW()),
('77777777-7777-7777-7777-777777777777', '550e8400-e29b-41d4-a716-446655440000', 'Miguel', 'Perez', 'guide', NOW()),
('88888888-8888-8888-8888-888888888888', '550e8400-e29b-41d4-a716-446655440000', 'Laura', 'Torres', 'guide', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- VEHICLES
-- ============================================
INSERT INTO vehicles (company_id, plate_number, make, model, year, capacity, status, mileage, next_maintenance, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ABC123', 'Mercedes', 'Sprinter', 2022, 16, 'available', 45000, '2026-04-15', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'DEF456', 'Toyota', 'Hiace', 2023, 14, 'available', 32000, '2026-05-20', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'GHI789', 'Ford', 'Transit', 2021, 15, 'available', 78000, '2026-03-30', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'JKL012', 'Mercedes', 'Sprinter', 2023, 20, 'available', 28000, '2026-06-10', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'MNO345', 'Volkswagen', 'Crafter', 2022, 18, 'maintenance', 55000, '2026-03-25', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'PQR678', 'Toyota', 'Coaster', 2024, 25, 'available', 12000, '2026-07-01', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- BRANDS (Tour Brands)
-- ============================================
INSERT INTO brands (company_id, name, description, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Chichen Itza Tours', 'Mayan ruins and cenote experiences', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Tulum Express', 'Beach and ruins combo tours', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Cenote Adventures', 'Swimming and diving in cenotes', NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Snorkeling Paradise', 'Coral reef and marine life tours', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- TOUR TEMPLATES
-- ============================================
INSERT INTO tour_templates (company_id, name, description, duration_minutes, capacity, pickup_location, dropoff_location, price, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Chichen Itza Classic', 'Full day tour to Chichen Itza with cenote swim', 600, 16, 'Hotel Zone', 'Hotel Zone', 89.00, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Tulum Half Day', 'Morning tour to Tulum ruins and beach', 300, 14, 'Hotel Zone', 'Hotel Zone', 65.00, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Cenote Triple', 'Visit 3 different cenotes', 420, 20, 'Downtown Cancun', 'Downtown Cancun', 75.00, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Isla Mujeres Catamaran', 'Sailing and snorkeling tour', 480, 25, 'Marina Cancun', 'Marina Cancun', 120.00, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- TOURS (Today and upcoming)
-- ============================================
-- Today's tours
INSERT INTO tours (company_id, name, description, tour_date, start_time, duration_minutes, capacity, pickup_location, dropoff_location, guide_id, vehicle_id, status, price, guest_count, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Chichen Itza Classic', 'Full day tour with cenote', CURRENT_DATE, '07:00', 600, 16, 'Hotel Zone Cancun', 'Hotel Zone Cancun', '55555555-5555-5555-5555-555555555555', 'abc123', 'in_progress', 89.00, 14, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Tulum Half Day', 'Morning tour to ruins', CURRENT_DATE, '09:00', 300, 14, 'Hotel Zone Cancun', 'Hotel Zone Cancun', '66666666-6666-6666-6666-666666666666', 'def456', 'completed', 65.00, 12, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Cenote Triple', 'Three cenotes swimming', CURRENT_DATE, '10:00', 420, 20, 'Downtown Cancun', 'Downtown Cancun', '77777777-7777-7777-7777-777777777777', 'ghi789', 'scheduled', 75.00, 18, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Isla Mujeres Catamaran', 'Sailing tour', CURRENT_DATE, '11:00', 480, 25, 'Marina Cancun', 'Marina Cancun', '88888888-8888-8888-8888-888888888888', 'pqr678', 'scheduled', 120.00, 22, NOW()),
-- Tomorrow's tours
('550e8400-e29b-41d4-a716-446655440000', 'Chichen Itza Deluxe', 'Premium tour with lunch', CURRENT_DATE + 1, '07:00', 660, 16, 'Playa del Carmen', 'Playa del Carmen', '55555555-5555-5555-5555-555555555555', 'abc123', 'scheduled', 120.00, 0, NOW()),
('550e8400-e29b-41d4-a716-446655440000', 'Tulum Sunset', 'Evening tour with sunset view', CURRENT_DATE + 1, '15:00', 300, 14, 'Tulum Center', 'Tulum Center', '66666666-6666-6666-6666-666666666666', 'def456', 'scheduled', 70.00, 0, NOW()),
-- No guide assigned (for testing alerts)
('550e8400-e29b-41d4-a716-446655440000', 'Coba & Cenote', 'Mayan ruins and swimming', CURRENT_DATE + 2, '08:00', 480, 16, 'Hotel Zone', 'Hotel Zone', NULL, 'jkl012', 'scheduled', 85.00, 0, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- GUESTS
-- ============================================
-- Get the tour IDs first (this is a bit tricky without knowing them)
-- We'll use subqueries

DO $$
DECLARE
    tour1_id UUID;
    tour2_id UUID;
    tour3_id UUID;
    tour4_id UUID;
BEGIN
    -- Get today's tours
    SELECT id INTO tour1_id FROM tours WHERE name = 'Chichen Itza Classic' AND tour_date = CURRENT_DATE LIMIT 1;
    SELECT id INTO tour2_id FROM tours WHERE name = 'Tulum Half Day' AND tour_date = CURRENT_DATE LIMIT 1;
    SELECT id INTO tour3_id FROM tours WHERE name = 'Cenote Triple' AND tour_date = CURRENT_DATE LIMIT 1;
    SELECT id INTO tour4_id FROM tours WHERE name = 'Isla Mujeres Catamaran' AND tour_date = CURRENT_DATE LIMIT 1;

    -- Insert guests for Chichen Itza tour (in progress)
    INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, checked_in, no_show, created_at) VALUES
    (tour1_id, 'John', 'Smith', 'john.smith@email.com', '+1-555-0101', 'Riu Cancun', '1204', 2, 0, true, false, NOW()),
    (tour1_id, 'Mary', 'Johnson', 'mary.j@email.com', '+1-555-0102', 'Riu Cancun', '1205', 2, 1, true, false, NOW()),
    (tour1_id, 'Robert', 'Williams', 'rob.w@email.com', '+1-555-0103', 'Hyatt Ziva', '502', 2, 0, true, false, NOW()),
    (tour1_id, 'Patricia', 'Brown', 'pat.brown@email.com', '+1-555-0104', 'Hyatt Ziva', '503', 2, 0, false, false, NOW()),
    (tour1_id, 'Michael', 'Davis', 'mike.d@email.com', '+1-555-0105', 'Moon Palace', '1200', 2, 2, false, false, NOW());

    -- Insert guests for Tulum tour (completed)
    INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, adults, children, checked_in, no_show, created_at) VALUES
    (tour2_id, 'Jennifer', 'Miller', 'jen.m@email.com', '+1-555-0106', 'Secrets Playa', 2, 0, true, false, NOW()),
    (tour2_id, 'James', 'Wilson', 'jwilson@email.com', '+1-555-0107', 'Secrets Playa', 2, 0, true, false, NOW()),
    (tour2_id, 'Linda', 'Moore', 'linda.m@email.com', '+1-555-0108', 'Grand Fiesta', 2, 1, true, false, NOW()),
    (tour2_id, 'David', 'Taylor', 'dtaylor@email.com', '+1-555-0109', 'Grand Fiesta', 2, 0, false, true, NOW()), -- No show
    (tour2_id, 'Elizabeth', 'Anderson', 'liz.a@email.com', '+1-555-0110', 'Live Aqua', 2, 0, true, false, NOW());

    -- Insert guests for Cenote tour (scheduled)
    INSERT INTO guests (tour_id, first_name, last_name, email, hotel, adults, children, checked_in, no_show, created_at) VALUES
    (tour3_id, 'Thomas', 'Thomas', 'tom.t@email.com', 'Hard Rock', 2, 0, false, false, NOW()),
    (tour3_id, 'Barbara', 'Jackson', 'barb.j@email.com', 'Hard Rock', 2, 0, false, false, NOW()),
    (tour3_id, 'Charles', 'White', 'charlie.w@email.com', 'Royalton', 2, 1, false, false, NOW()),
    (tour3_id, 'Susan', 'Harris', 'susan.h@email.com', 'Royalton', 2, 0, false, false, NOW()),
    (tour3_id, 'Christopher', 'Martin', 'chris.m@email.com', 'Iberostar', 2, 2, false, false, NOW()),
    (tour3_id, 'Jessica', 'Thompson', 'jess.t@email.com', 'Iberostar', 2, 0, false, false, NOW()),
    (tour3_id, 'Daniel', 'Garcia', 'dan.g@email.com', 'Breathless', 2, 0, false, false, NOW()),
    (tour3_id, 'Sarah', 'Martinez', 'sarah.m@email.com', 'Breathless', 2, 0, false, false, NOW());

    -- Insert guests for Catamaran tour
    INSERT INTO guests (tour_id, first_name, last_name, email, hotel, adults, children, checked_in, no_show, created_at) VALUES
    (tour4_id, 'Matthew', 'Robinson', 'matt.r@email.com', 'Le Blanc', 2, 0, false, false, NOW()),
    (tour4_id, 'Ashley', 'Clark', 'ashley.c@email.com', 'Le Blanc', 2, 0, false, false, NOW()),
    (tour4_id, 'Andrew', 'Rodriguez', 'andrew.r@email.com', 'Secrets Impression', 2, 1, false, false, NOW()),
    (tour4_id, 'Emily', 'Lewis', 'emily.l@email.com', 'Secrets Impression', 2, 0, false, false, NOW()),
    (tour4_id, 'Joseph', 'Lee', 'joe.l@email.com', 'Atelier Playa Mujeres', 2, 0, false, false, NOW()),
    (tour4_id, 'Samantha', 'Walker', 'sam.w@email.com', 'Atelier Playa Mujeres', 2, 0, false, false, NOW());
END $$;

-- ============================================
-- CHECKLISTS
-- ============================================
INSERT INTO checklists (company_id, name, description, items, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Pre-Tour Vehicle Check', 'Check vehicle before starting tour', 
'[
  {"id": "1", "text": "Check tire pressure", "required": true},
  {"id": "2", "text": "Check fuel level", "required": true},
  {"id": "3", "text": "Check first aid kit", "required": true},
  {"id": "4", "text": "Check water supply", "required": true},
  {"id": "5", "text": "Check AC functioning", "required": false}
]'::jsonb, NOW()),

('550e8400-e29b-41d4-a716-446655440000', 'Guest Pickup Verification', 'Verify all guests are present', 
'[
  {"id": "1", "text": "Verify guest count matches manifest", "required": true},
  {"id": "2", "text": "Check guest IDs if required", "required": false},
  {"id": "3", "text": "Confirm special requirements", "required": false},
  {"id": "4", "text": "Brief guests on tour itinerary", "required": true}
]'::jsonb, NOW()),

('550e8400-e29b-41d4-a716-446655440000', 'Safety Equipment Check', 'Verify safety equipment onboard', 
'[
  {"id": "1", "text": "Life jackets count", "required": true},
  {"id": "2", "text": "Fire extinguisher check", "required": true},
  {"id": "3", "text": "Emergency contact list", "required": true},
  {"id": "4", "text": "First aid kit stocked", "required": true}
]'::jsonb, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- INCIDENTS
-- ============================================
DO $$
DECLARE
    tour1_id UUID;
BEGIN
    SELECT id INTO tour1_id FROM tours WHERE name = 'Chichen Itza Classic' AND tour_date = CURRENT_DATE LIMIT 1;

    INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, created_at) VALUES
    (tour1_id, '55555555-5555-5555-5555-555555555555', 'vehicle', 'low', 'AC not cooling properly, but vehicle is operational', 'resolved', NOW()),
    (tour1_id, '55555555-5555-5555-5555-555555555555', 'guest', 'medium', 'Guest left phone at hotel, arranging pickup', 'in_progress', NOW());
END $$;

-- ============================================
-- MAINTENANCE RECORDS
-- ============================================
INSERT INTO vehicle_maintenance (vehicle_id, type, description, scheduled_date, status, created_at) VALUES
((SELECT id FROM vehicles WHERE plate_number = 'GHI789'), 'oil_change', 'Regular oil change service', '2026-03-30', 'scheduled', NOW()),
((SELECT id FROM vehicles WHERE plate_number = 'MNO345'), 'repair', 'Brake pad replacement', '2026-03-25', 'in_progress', NOW()),
((SELECT id FROM vehicles WHERE plate_number = 'ABC123'), 'inspection', 'Annual safety inspection', '2026-04-15', 'scheduled', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTIFICATIONS
-- ============================================
INSERT INTO notifications (user_id, type, title, message, data, created_at) VALUES
('44444444-4444-4444-4444-444444444444', 'incident', 'New Incident Reported', 'Vehicle issue reported on Chichen Itza tour', '{"tour_id": "temp"}'::jsonb, NOW()),
('44444444-4444-4444-4444-444444444444', 'tour', 'Tour Started', 'Tulum Half Day tour has started', '{"tour_id": "temp"}'::jsonb, NOW()),
('22222222-2222-2222-2222-222222222222', 'system', 'Vehicle Maintenance Due', 'Vehicle GHI789 needs oil change', '{"vehicle_id": "temp"}'::jsonb, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATE TOUR GUEST COUNTS
-- ============================================
UPDATE tours SET guest_count = (
    SELECT COUNT(*) FROM guests WHERE guests.tour_id = tours.id
) WHERE company_id = '550e8400-e29b-41d4-a716-446655440000';

-- ============================================
-- DUMMY COMPANY CONFIG (for Google Drive)
-- ============================================
INSERT INTO company_configs (company_id, config_key, config_value, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'google_drive', '{"configured": false, "message": "Configure in Admin Settings"}'::jsonb, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- TEST LOGIN CREDENTIALS (for reference)
-- ============================================
-- These would be the emails to sign up with in the app:
-- super_admin@example.com (Terry Smith)
-- manager@example.com (Maria Garcia)
-- operations@example.com (Carlos Lopez)
-- supervisor@example.com (Sofia Martinez)
-- guide1@example.com (Juan Rodriguez)
-- guide2@example.com (Ana Hernandez)
-- guide3@example.com (Miguel Perez)
-- guide4@example.com (Laura Torres)

-- All passwords would be set during signup
