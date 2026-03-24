-- ============================================
-- V1.0 DATABASE FIXES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE TWO BRANDS FOR DEMO COMPANY
-- ============================================
INSERT INTO brands (id, company_id, name, slug, primary_color, secondary_color, is_active)
VALUES 
  (gen_random_uuid(), '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Cancun Adventure Tours', 'cancun-adventure', '#1A56DB', '#1E40AF', true),
  (gen_random_uuid(), '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Playa Excursions', 'playa-excursions', '#059669', '#047857', true)
ON CONFLICT DO NOTHING;

-- 2. ADD brand_id TO profiles TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- 3. ASSIGN ALL PROFILES TO FIRST BRAND
-- ============================================
UPDATE profiles 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 4. ADD brand_id TO vehicles TABLE (if missing)
-- ============================================
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- 5. ASSIGN ALL VEHICLES TO FIRST BRAND
-- ============================================
UPDATE vehicles 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 6. ADD brand_id TO incidents TABLE (if missing)
-- ============================================
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- 7. ASSIGN ALL INCIDENTS TO FIRST BRAND
-- ============================================
UPDATE incidents 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 8. ADD brand_id TO expenses TABLE (if missing)
-- ============================================
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id);

-- 9. ASSIGN ALL EXPENSES TO FIRST BRAND
-- ============================================
UPDATE expenses 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 10. VERIFY BRAND SETUP
-- ============================================
SELECT 'brands' as table_name, count(*) as count FROM brands;
SELECT 'profiles with brand_id' as table_name, count(*) as count FROM profiles WHERE brand_id IS NOT NULL;
SELECT 'tours with brand_id' as table_name, count(*) as count FROM tours WHERE brand_id IS NOT NULL;

-- ============================================
-- EXPECTED RESULTS:
-- brands: 2 rows
-- profiles with brand_id: >0 rows
-- tours with brand_id: >0 rows
-- ============================================
