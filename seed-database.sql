-- ==========================================
-- TOUR OPS PLATFORM - FULL SEED DATA
-- Uses REAL authenticated user IDs from Supabase
-- Run this to populate database with test data
-- ==========================================

-- ==========================================
-- STEP 1: UPDATE REAL USERS WITH PROFILES
-- ==========================================

INSERT INTO profiles (id, first_name, last_name, full_name, email, role, phone, status, created_at)
VALUES 
  ('34ef0245-f2be-4c3d-a870-d5d081296046', 'Diego', 'Fernandez', 'Diego Fernandez', 'diego@tour-ops.com', 'admin', '+529981000001', 'active', now()),
  ('4c9d2d29-699c-4f1a-9417-cc8b43987de6', 'Elena', 'Gomez', 'Elena Gomez', 'elena@tour-ops.com', 'supervisor', '+529981000002', 'active', now()),
  ('bcf3d261-aec7-4ea6-b06d-c1756d197ea5', 'Roberto', 'Sanchez', 'Roberto Sanchez', 'roberto@tour-ops.com', 'supervisor', '+529981000003', 'active', now()),
  ('2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8', 'Ana', 'Martinez', 'Ana Martinez', 'ana@tour-ops.com', 'operations', '+529981000004', 'active', now()),
  ('d2cda25c-35c2-49ac-949c-bc52486d27a0', 'Carlos', 'Rodriguez', 'Carlos Rodriguez', 'carlos@tour-ops.com', 'guide', '+529981000005', 'active', now()),
  ('cbbb22ba-178a-4a1d-ba49-d9f412f88b03', 'Maria', 'Garcia', 'Maria Garcia', 'maria@tour-ops.com', 'guide', '+529981000006', 'active', now()),
  ('d68d3488-1a30-4970-8aff-90e62e605c57', 'Juan', 'Lopez', 'Juan Lopez', 'juan@tour-ops.com', 'guide', '+529981000007', 'active', now()),
  ('594fe2ba-92ca-4870-9e0a-b0d468901f76', 'Ops', 'Director', 'Ops Director', 'opsd@lifeoperations.com', 'operations', '+529981000008', 'active', now()),
  ('4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd', 'Supervisor', 'Lead', 'Supervisor Lead', 'sup@lifeoperations.com', 'supervisor', '+529981000009', 'active', now()),
  ('efb510fa-ff1e-4a77-8737-a6395e4000c5', 'Guide', 'Two', 'Guide Two', 'guide2@lifeoperations.com', 'guide', '+529981000010', 'active', now())
ON CONFLICT (id) DO UPDATE SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  phone = EXCLUDED.phone,
  status = EXCLUDED.status,
  updated_at = now();

-- ==========================================
-- STEP 2: GET COMPANY/BRAND REFERENCES
-- ==========================================

DO $$
DECLARE
  v_company_id uuid;
  v_brand_id uuid;
BEGIN
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  IF v_company_id IS NULL THEN
    INSERT INTO companies (id, name, status, created_at)
    VALUES (gen_random_uuid(), 'Demo Tour Company', 'active', now())
    RETURNING id INTO v_company_id;
  END IF;
  
  SELECT id INTO v_brand_id FROM brands LIMIT 1;
  IF v_brand_id IS NULL THEN
    INSERT INTO brands (id, company_id, name, status, created_at)
    VALUES (gen_random_uuid(), v_company_id, 'Main Brand', 'active', now())
    RETURNING id INTO v_brand_id;
  END IF;
  
  CREATE TEMP TABLE IF NOT EXISTS seed_refs (company_id uuid, brand_id uuid) ON COMMIT DROP;
  DELETE FROM seed_refs;
  INSERT INTO seed_refs VALUES (v_company_id, v_brand_id);
  
  UPDATE profiles SET company_id = v_company_id, brand_id = v_brand_id
  WHERE id IN ('34ef0245-f2be-4c3d-a870-d5d081296046', '4c9d2d29-699c-4f1a-9417-cc8b43987de6', 'bcf3d261-aec7-4ea6-b06d-c1756d197ea5', 
    '2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8', 'd2cda25c-35c2-49ac-949c-bc52486d27a0', 'cbbb22ba-178a-4a1d-ba49-d9f412f88b03',
    'd68d3488-1a30-4970-8aff-90e62e605c57', '594fe2ba-92ca-4870-9e0a-b0d468901f76', '4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd', 'efb510fa-ff1e-4a77-8737-a6395e4000c5');
END $$;

-- ==========================================
-- STEP 3: CREATE VEHICLES
-- ==========================================

INSERT INTO vehicles (make, model, plate_number, year, capacity, status, created_at, updated_at)
VALUES
  ('Mercedes', '[TEST] Sprinter Van 1', 'ABC-123', 2022, 12, 'active', now(), now()),
  ('Ford', '[TEST] Transit Van 2', 'DEF-456', 2023, 14, 'active', now(), now()),
  ('Volvo', '[TEST] Tour Bus 1', 'GHI-789', 2021, 40, 'active', now(), now()),
  ('Scania', '[TEST] Tour Bus 2', 'JKL-012', 2020, 40, 'maintenance', now(), now());

-- ==========================================
-- STEP 4: CREATE SETTINGS
-- ==========================================

INSERT INTO settings (key, value, updated_at) VALUES
  ('company_name', '"Tour Ops Demo"'::jsonb, now())
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- ==========================================
-- STEP 5: CREATE TODAY'S TOURS
-- ==========================================

DO $$
DECLARE
  v_company_id uuid;
  v_brand_id uuid;
  v_carlos_id uuid := 'd2cda25c-35c2-49ac-949c-bc52486d27a0';
  v_maria_id uuid := 'cbbb22ba-178a-4a1d-ba49-d9f412f88b03';
  v_juan_id uuid := 'd68d3488-1a30-4970-8aff-90e62e605c57';
BEGIN
  SELECT company_id, brand_id INTO v_company_id, v_brand_id FROM seed_refs;

  INSERT INTO tours (id, company_id, brand_id, name, tour_date, start_time, duration_minutes, status, guide_id, guest_count, capacity, pickup_location, dropoff_location, price, created_by, created_at, updated_at)
  VALUES
    (gen_random_uuid(), v_company_id, v_brand_id, '[TEST] Chichen Itza Sunrise', CURRENT_DATE, '06:00', 480, 'in_progress', v_carlos_id, 8, 12, 'Hotel Zone Cancun', 'Chichen Itza', 1250.00, v_carlos_id, now(), now()),
    (gen_random_uuid(), v_company_id, v_brand_id, '[TEST] Tulum Express', CURRENT_DATE, '09:00', 300, 'in_progress', v_maria_id, 35, 40, 'Playa del Carmen', 'Tulum Ruins', 950.00, v_maria_id, now(), now()),
    (gen_random_uuid(), v_company_id, v_brand_id, '[TEST] Isla Mujeres Catamaran', CURRENT_DATE, '13:00', 360, 'scheduled', v_carlos_id, 20, 30, 'Puerto Juarez', 'Isla Mujeres', 1500.00, v_carlos_id, now(), now()),
    (gen_random_uuid(), v_company_id, v_brand_id, '[TEST] Cenote Snorkeling', CURRENT_DATE, '15:00', 240, 'scheduled', v_juan_id, 12, 20, 'Cancun Center', 'Cenote Dos Ojos', 750.00, v_juan_id, now(), now());
END $$;

-- ==========================================
-- STEP 6: CREATE GUIDE CHECK-INS
-- ==========================================

DO $$
DECLARE
  v_brand_id uuid;
  v_carlos_id uuid := 'd2cda25c-35c2-49ac-949c-bc52486d27a0';
  v_maria_id uuid := 'cbbb22ba-178a-4a1d-ba49-d9f412f88b03';
BEGIN
  SELECT brand_id INTO v_brand_id FROM seed_refs;

  -- Get tour IDs
  DECLARE
    v_tour1_id uuid;
    v_tour2_id uuid;
  BEGIN
    SELECT id INTO v_tour1_id FROM tours WHERE name = '[TEST] Chichen Itza Sunrise' LIMIT 1;
    SELECT id INTO v_tour2_id FROM tours WHERE name = '[TEST] Tulum Express' LIMIT 1;
    
    IF v_tour1_id IS NOT NULL THEN
      INSERT INTO guide_checkins (tour_id, brand_id, guide_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at)
      VALUES (v_tour1_id, v_brand_id, v_carlos_id, 'pre_pickup', now() - interval '2 hours', 20.6843, -88.5678, 15.5, '06:00:00', -5, '[TEST] Departed on time, smooth traffic', now());
    END IF;
    
    IF v_tour2_id IS NOT NULL THEN
      INSERT INTO guide_checkins (tour_id, brand_id, guide_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, scheduled_time, minutes_early_or_late, notes, created_at)
      VALUES (v_tour2_id, v_brand_id, v_maria_id, 'pre_pickup', now() - interval '1 hour', 20.2150, -87.4290, 8.2, '09:00:00', 0, '[TEST] Arrived at Tulum, guests exploring', now());
    END IF;
  END;
END $$;

-- ==========================================
-- STEP 7: CREATE INCIDENTS
-- ==========================================

DO $$
DECLARE
  v_carlos_id uuid := 'd2cda25c-35c2-49ac-949c-bc52486d27a0';
  v_maria_id uuid := 'cbbb22ba-178a-4a1d-ba49-d9f412f88b03';
  v_tour1_id uuid;
  v_tour2_id uuid;
BEGIN
  SELECT id INTO v_tour1_id FROM tours WHERE name = '[TEST] Chichen Itza Sunrise' LIMIT 1;
  SELECT id INTO v_tour2_id FROM tours WHERE name = '[TEST] Tulum Express' LIMIT 1;

  INSERT INTO incidents (tour_id, guide_id, reported_by, incident_type, severity, title, description, status, created_at, updated_at)
  VALUES
    (v_tour1_id, v_carlos_id, v_carlos_id, 'guest_complaint', 'low', 'Guest feeling unwell', '[TEST] Guest feeling unwell. One guest reports motion sickness on van to Chichen Itza. Provided water and medication.', 'reported', now(), now()),
    (v_tour2_id, v_maria_id, v_maria_id, 'traffic_delay', 'medium', 'Delayed departure - traffic', '[TEST] Delayed departure - traffic. Heavy traffic from Playa del Carmen, departed 15 min late.', 'acknowledged', now(), now()),
    (v_tour1_id, v_carlos_id, v_carlos_id, 'other', 'low', 'Lost sunglasses', '[TEST] Lost sunglasses. Guest left sunglasses at pickup location. Retrieved by guide.', 'closed', now(), now());
END $$;

-- ==========================================
-- STEP 8: CREATE EXPENSES
-- ==========================================

DO $$
DECLARE
  v_carlos_id uuid := 'd2cda25c-35c2-49ac-949c-bc52486d27a0';
  v_maria_id uuid := 'cbbb22ba-178a-4a1d-ba49-d9f412f88b03';
  v_elena_id uuid := '4c9d2d29-699c-4f1a-9417-cc8b43987de6';
  v_tour1_id uuid;
  v_tour2_id uuid;
BEGIN
  SELECT id INTO v_tour1_id FROM tours WHERE name = '[TEST] Chichen Itza Sunrise' LIMIT 1;
  SELECT id INTO v_tour2_id FROM tours WHERE name = '[TEST] Tulum Express' LIMIT 1;

  INSERT INTO expenses (guide_id, tour_id, amount, expense_type, description, status, date, created_by, created_at)
  VALUES
    (v_carlos_id, v_tour1_id, 450.00, 'fuel', '[TEST] Fuel refill for Chichen Itza trip', 'pending', CURRENT_DATE, v_carlos_id, now() - interval '30 minutes'),
    (v_maria_id, v_tour2_id, 120.00, 'parking', '[TEST] Tulum ruins parking fee', 'pending', CURRENT_DATE, v_maria_id, now() - interval '1 hour'),
    (v_carlos_id, v_tour1_id, 85.50, 'toll', '[TEST] Highway tolls', 'approved', CURRENT_DATE, v_carlos_id, now() - interval '2 hours'),
    (v_maria_id, v_tour2_id, 250.00, 'other', '[TEST] Personal meal (not covered)', 'rejected', CURRENT_DATE, v_maria_id, now() - interval '3 hours');
    
  -- Update approved/rejected with approver
  UPDATE expenses SET approved_by = v_elena_id, approved_at = now() - interval '1 hour'
  WHERE description = '[TEST] Highway tolls';
  
  UPDATE expenses SET approved_by = v_elena_id, rejection_reason = 'Personal expenses not covered per policy'
  WHERE description = '[TEST] Personal meal (not covered)';
END $$;

-- ==========================================
-- VERIFICATION
-- ==========================================

SELECT 'SEED COMPLETE' as status;

SELECT 
  (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@tour-ops.com' OR email LIKE '%@lifeoperations.com') as total_users,
  (SELECT COUNT(*) FROM tours WHERE name LIKE '[TEST]%') as test_tours,
  (SELECT COUNT(*) FROM vehicles WHERE model LIKE '[TEST]%') as test_vehicles,
  (SELECT COUNT(*) FROM incidents WHERE description LIKE '[TEST]%') as test_incidents,
  (SELECT COUNT(*) FROM expenses WHERE description LIKE '[TEST]%') as test_expenses,
  (SELECT COUNT(*) FROM guide_checkins WHERE notes LIKE '[TEST]%') as test_checkins;

-- Show user roles
SELECT email, full_name, role FROM profiles 
WHERE email LIKE '%@tour-ops.com' OR email LIKE '%@lifeoperations.com'
ORDER BY role, email;