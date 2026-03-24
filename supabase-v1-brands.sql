-- ============================================
-- V1.0 BRANDS SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. CREATE TWO DEMO BRANDS
-- ============================================
INSERT INTO brands (id, company_id, name, slug, primary_color, secondary_color, is_active, created_at)
VALUES 
  (gen_random_uuid(), '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Cancun Adventure Tours', 'cancun-adventure', '#1A56DB', '#1E40AF', true, now()),
  (gen_random_uuid(), '6e046c69-93e2-48c9-a861-46c91fd2ae3b', 'Playa Excursions', 'playa-excursions', '#059669', '#047857', true, now())
ON CONFLICT DO NOTHING;

-- 2. VERIFY BRANDS CREATED
-- ============================================
SELECT id, name, slug, primary_color FROM brands ORDER BY created_at;

-- 3. ASSIGN ALL PROFILES TO FIRST BRAND (if not already assigned)
-- ============================================
UPDATE profiles 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 4. ASSIGN ALL TOURS TO FIRST BRAND (if not already assigned)
-- ============================================
UPDATE tours 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 5. ASSIGN ALL VEHICLES TO FIRST BRAND (if not already assigned)
-- ============================================
UPDATE vehicles 
SET brand_id = (SELECT id FROM brands WHERE slug = 'cancun-adventure' LIMIT 1)
WHERE brand_id IS NULL;

-- 6. VERIFY SETUP
-- ============================================
SELECT 'brands' as table_name, count(*) as count FROM brands;
SELECT 'profiles with brand' as table_name, count(*) as count FROM profiles WHERE brand_id IS NOT NULL;
SELECT 'tours with brand' as table_name, count(*) as count FROM tours WHERE brand_id IS NOT NULL;
SELECT 'vehicles with brand' as table_name, count(*) as count FROM vehicles WHERE brand_id IS NOT NULL;

-- ============================================
-- EXPECTED RESULTS:
-- brands: 2 rows
-- All other counts: >0 rows
-- ============================================
