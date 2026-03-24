-- Tour Ops Platform - Sample Data (Fixed for actual schema)
-- Run this in Supabase SQL Editor

-- ============================================
-- SAMPLE VEHICLES
-- ============================================
INSERT INTO vehicles (plate_number, make, model, year, capacity, status, company_id) 
SELECT 'ABC-123', 'Toyota', 'Hiace', 2022, 14, 'available', 
  (SELECT id FROM companies LIMIT 1)
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO vehicles (plate_number, make, model, year, capacity, status, company_id) 
SELECT 'XYZ-789', 'Mercedes', 'Sprinter', 2021, 12, 'available',
  (SELECT id FROM companies LIMIT 1)
ON CONFLICT (plate_number) DO NOTHING;

INSERT INTO vehicles (plate_number, make, model, year, capacity, status, company_id) 
SELECT 'DEF-456', 'Ford', 'Transit', 2020, 10, 'available',
  (SELECT id FROM companies LIMIT 1)
ON CONFLICT (plate_number) DO NOTHING;

-- ============================================
-- SAMPLE EXPENSES
-- ============================================
INSERT INTO expenses (amount, category, description, date, company_id, created_by) 
SELECT 150.00, 'fuel', 'Weekly fuel refill', CURRENT_DATE - 7,
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('super_admin', 'company_admin') LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (amount, category, description, date, company_id, created_by) 
SELECT 500.00, 'maintenance', 'Oil change and tires', CURRENT_DATE - 14,
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('super_admin', 'company_admin') LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO expenses (amount, category, description, date, company_id, created_by) 
SELECT 50.00, 'meals', 'Guide lunch during tour', CURRENT_DATE - 1,
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('super_admin', 'company_admin') LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- SAMPLE INCIDENTS
-- ============================================
INSERT INTO incidents (type, severity, description, status, tour_id, reported_by) 
SELECT 'medical', 'high', 'Guest slipped and fell at archaeological site, minor injury', 'open',
  (SELECT id FROM tours LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO incidents (type, severity, description, status, resolution_notes, resolved_at, tour_id, reported_by) 
SELECT 'vehicle', 'medium', 'AC not working in van, needs repair', 'resolved', 
  'Called mechanic, replaced AC compressor', NOW() - INTERVAL '2 days',
  (SELECT id FROM tours LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO incidents (type, severity, description, status, tour_id, reported_by) 
SELECT 'guest', 'low', 'Guest complained about tour timing being too rushed', 'open',
  (SELECT id FROM tours LIMIT 1),
  (SELECT id FROM profiles WHERE role IN ('guide', 'supervisor') LIMIT 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATE PROFILE FULL_NAMES (if empty)
-- ============================================
UPDATE profiles 
SET full_name = first_name || ' ' || last_name
WHERE full_name IS NULL OR full_name = ''
  AND first_name IS NOT NULL AND last_name IS NOT NULL;

-- ============================================
-- ENSURE COMPANIES TABLE EXISTS (required for foreign keys)
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default company if none exists
INSERT INTO companies (name) 
SELECT 'Tour Ops Platform'
WHERE NOT EXISTS (SELECT 1 FROM companies);
