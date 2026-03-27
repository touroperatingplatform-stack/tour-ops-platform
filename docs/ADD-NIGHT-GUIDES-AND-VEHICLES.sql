-- ============================================
-- ADD NIGHT GUIDES AND VEHICLES FOR TESTING
-- Run this in Supabase SQL Editor
-- Creates 2 guides working overnight + demo vehicles
-- ============================================

-- ============================================
-- 1. UPDATE 2 TOURS TO "in_progress" STATUS
-- ============================================

UPDATE tours 
SET status = 'in_progress'
WHERE name = 'Tulum Ruins Express' 
  AND guide_id = (SELECT id FROM profiles WHERE email = 'diego@tour-ops.com');

UPDATE tours 
SET status = 'in_progress'
WHERE name = 'Akumal Snorkeling Tour'
  AND guide_id = (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com');

-- ============================================
-- 2. CREATE VEHICLE FLEET
-- vehicles table: id, plate_number, model, year, capacity, status, last_inspection, created_at, updated_at
-- ============================================

INSERT INTO vehicles (id, plate_number, model, year, capacity, status, created_at)
VALUES 
(gen_random_uuid(), 'YXZ-123', 'Toyota Hiace', 2022, 15, 'in_use', NOW()),
(gen_random_uuid(), 'ABC-456', 'Mercedes Sprinter', 2023, 18, 'in_use', NOW()),
(gen_random_uuid(), 'DEF-789', 'Ford Transit', 2021, 12, 'available', NOW()),
(gen_random_uuid(), 'GHI-012', 'Chevrolet Express', 2020, 10, 'available', NOW());

-- ============================================
-- 3. CREATE NIGHT SHIFT GUIDES (Always Active)
-- ============================================

INSERT INTO profiles (id, email, first_name, last_name, phone, role, brand_id, created_at)
VALUES 
(gen_random_uuid(), 'night1@tour-ops.com', 'Miguel', 'Torres', '+52-998-555-0201', 'guide', 
 '6b6c93b4-4389-4f1a-98ad-deb622f57056', NOW()),
(gen_random_uuid(), 'night2@tour-ops.com', 'Sofia', 'Ramirez', '+52-998-555-0202', 'guide',
 '6b6c93b4-4389-4f1a-98ad-deb622f57056', NOW())
ON CONFLICT (email) DO NOTHING;

-- Create night tours (always in_progress)
INSERT INTO tours (id, brand_id, guide_id, name, tour_date, start_time, status, guest_count, created_at)
VALUES 
(gen_random_uuid(), '6b6c93b4-4389-4f1a-98ad-deb622f57056',
 (SELECT id FROM profiles WHERE email = 'night1@tour-ops.com'),
 'Cancun Airport Night Transfer',
 CURRENT_DATE, '23:00'::time, 'in_progress', 6, NOW()),
(gen_random_uuid(), '6b6c93b4-4389-4f1a-98ad-deb622f57056',
 (SELECT id FROM profiles WHERE email = 'night2@tour-ops.com'),
 'Playa del Carmen Night Out',
 CURRENT_DATE, '22:00'::time, 'in_progress', 4, NOW());

-- ============================================
-- 4. CREATE CHECK-INS FOR NIGHT GUIDES
-- ============================================

INSERT INTO guide_checkins (tour_id, brand_id, guide_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, minutes_early_or_late, notes, created_at)
VALUES 
((SELECT id FROM tours WHERE name = 'Cancun Airport Night Transfer' LIMIT 1),
 '6b6c93b4-4389-4f1a-98ad-deb622f57056',
 (SELECT id FROM profiles WHERE email = 'night1@tour-ops.com'),
 'pre_pickup', NOW() - INTERVAL '15 minutes',
 21.1333, -86.7667, 12.5, 0,
 'Night shift check-in - Airport transfer ready', NOW()),
((SELECT id FROM tours WHERE name = 'Playa del Carmen Night Out' LIMIT 1),
 '6b6c93b4-4389-4f1a-98ad-deb622f57056',
 (SELECT id FROM profiles WHERE email = 'night2@tour-ops.com'),
 'pre_pickup', NOW() - INTERVAL '30 minutes',
 20.2114, -87.4654, 18.2, 5,
 'Night shift check-in - Dinner tour ready', NOW());

-- ============================================
-- VERIFICATION
-- ============================================

-- Check active tours (should show 4: Diego, Carlos, Miguel, Sofia)
SELECT name, status, guide_id 
FROM tours 
WHERE status = 'in_progress';

-- Check vehicles (should show 4 vehicles)
SELECT plate_number, model, status 
FROM vehicles;

-- Check night guides
SELECT p.first_name, p.last_name, t.name, t.status
FROM profiles p
JOIN tours t ON t.guide_id = p.id
WHERE p.email IN ('night1@tour-ops.com', 'night2@tour-ops.com');
