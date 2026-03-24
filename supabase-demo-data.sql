-- ============================================
-- V1.0 DEMO DATA (CORRECTED - BASED ON ACTUAL SCHEMA)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. UPDATE PROFILES WITH BRAND ASSIGNMENTS
-- ============================================

-- Guide 1 - Guide User
UPDATE profiles SET
  full_name = 'Guide User',
  brand_id = 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0'
WHERE email = 'gude@lifeoperations.com';

-- Guide 2 - Guide Two
UPDATE profiles SET
  full_name = 'Guide Two',
  brand_id = 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0'
WHERE email = 'guide2@lifeoperations.com';

-- Guide 3 - Maria Garcia
UPDATE profiles SET
  full_name = 'Maria Garcia',
  brand_id = '37be167b-74ca-4264-ad33-e0a7818e42c6'
WHERE email = 'mariagar@lifeoperations.com';

-- Supervisor - Supervisor User
UPDATE profiles SET
  full_name = 'Supervisor User',
  brand_id = 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0'
WHERE email = 'sup@lifeoperations.com';

-- Manager - Manager User
UPDATE profiles SET
  full_name = 'Manager User',
  brand_id = 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0'
WHERE email = 'manager@lifeoperations.com';

-- Operations - Operations User
UPDATE profiles SET
  full_name = 'Operations User',
  brand_id = 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0'
WHERE email = 'ops@lifeoperations.com';

-- 2. CREATE VEHICLES (using correct columns)
-- ============================================
-- plate_number, make, model, year, capacity, status, company_id

INSERT INTO vehicles (id, plate_number, make, model, year, capacity, status, company_id, created_at)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'ABC-1234', 'Toyota', 'Hiace', 2022, 15, 'available', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', now()),
  ('22222222-2222-2222-2222-222222222202', 'DEF-5678', 'Mercedes', 'Sprinter', 2023, 18, 'available', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', now()),
  ('22222222-2222-2222-2222-222222222203', 'GHI-9012', 'Ford', 'Transit', 2021, 12, 'maintenance', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', now())
ON CONFLICT (id) DO NOTHING;

-- 3. CREATE TOURS (using correct columns)
-- ============================================
-- name, tour_date, start_time, status, guide_id, vehicle_id, brand_id, company_id, guest_count

-- Today's tours
INSERT INTO tours (id, name, tour_date, start_time, status, guide_id, vehicle_id, brand_id, company_id, guest_count, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'Chichen Itza Express', CURRENT_DATE, '07:00', 'scheduled', '0da9c371-5fe9-4e10-8122-1e3ee1836764', '22222222-2222-2222-2222-222222222201', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 12, now()),
  ('33333333-3333-3333-3333-333333333302', 'Tulum Ruins & Beach', CURRENT_DATE, '09:00', 'scheduled', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', '22222222-2222-2222-2222-222222222202', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 8, now()),
  ('33333333-3333-3333-3333-333333333303', 'Cenote Swim Adventure', CURRENT_DATE, '10:00', 'scheduled', '5c005430-27eb-4da2-ba4f-22c3e4d40397', '22222222-2222-2222-2222-222222222203', '37be167b-74ca-4264-ad33-e0a7818e42c6', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 6, now())
ON CONFLICT (id) DO NOTHING;

-- Tomorrow's tours
INSERT INTO tours (id, name, tour_date, start_time, status, guide_id, vehicle_id, brand_id, company_id, guest_count, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333304', 'Chichen Itza VIP', CURRENT_DATE + INTERVAL '1 day', '06:30', 'scheduled', '0da9c371-5fe9-4e10-8122-1e3ee1836764', '22222222-2222-2222-2222-222222222201', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 10, now()),
  ('33333333-3333-3333-3333-333333333305', 'Tulum & Coba Combo', CURRENT_DATE + INTERVAL '1 day', '08:00', 'scheduled', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', '22222222-2222-2222-2222-222222222202', '37be167b-74ca-4264-ad33-e0a7818e42c6', '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 14, now())
ON CONFLICT (id) DO NOTHING;

-- 4. CREATE INCIDENTS (using correct columns)
-- ============================================
-- type, severity, description, status, tour_id, reported_by, brand_id

INSERT INTO incidents (id, type, severity, description, status, tour_id, reported_by, created_at)
VALUES
  ('44444444-4444-4444-4444-444444444401', 'medical', 'medium', 'Guest reported feeling dizzy during the Chichen Itza tour. Provided water and rest. Guest recovered after 15 minutes.', 'open', '33333333-3333-3333-3333-333333333301', '0da9c371-5fe9-4e10-8122-1e3ee1836764', now()),
  ('44444444-4444-4444-4444-444444444402', 'vehicle', 'high', 'Van Beta (Mercedes Sprinter) has AC issues. Blowing warm air. Guest complaints received.', 'open', '33333333-3333-3333-3333-333333333302', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', now()),
  ('44444444-4444-4444-4444-444444444403', 'guest', 'low', 'Guest complained about tour start time being 30 minutes late. Guide explained traffic delay.', 'resolved', '33333333-3333-3333-3333-333333333301', '0da9c371-5fe9-4e10-8122-1e3ee1836764', now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 5. CREATE EXPENSES (using correct columns)
-- ============================================
-- amount, category, description, date, tour_id, created_by

INSERT INTO expenses (id, amount, category, description, date, tour_id, created_by, created_at)
VALUES
  ('55555555-5555-5555-5555-555555555501', 850.00, 'fuel', 'Full tank for Van Alpha - Chichen Itza tour', CURRENT_DATE, '33333333-3333-3333-3333-333333333301', '0da9c371-5fe9-4e10-8122-1e3ee1836764', now()),
  ('55555555-5555-5555-5555-555555555502', 720.00, 'fuel', 'Half tank for Van Beta - Tulum tour', CURRENT_DATE, '33333333-3333-3333-3333-333333333302', 'efb510fa-ff1e-4a77-8737-a6395e4000c5', now()),
  ('55555555-5555-5555-5555-555555555503', 450.00, 'meals', 'Team lunch - 5 guides', CURRENT_DATE, NULL, '4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd', now())
ON CONFLICT (id) DO NOTHING;

-- 6. VERIFY DATA
-- ============================================
SELECT 'vehicles' as table_name, count(*) as count FROM vehicles WHERE id::text LIKE '22222222%';
SELECT 'tours' as table_name, count(*) as count FROM tours WHERE id::text LIKE '33333333%';
SELECT 'incidents' as table_name, count(*) as count FROM incidents WHERE id::text LIKE '44444444%';
SELECT 'expenses' as table_name, count(*) as count FROM expenses WHERE id::text LIKE '55555555%';

-- ============================================
-- EXPECTED RESULTS:
-- vehicles: 3
-- tours: 5
-- incidents: 3
-- expenses: 3
-- ============================================