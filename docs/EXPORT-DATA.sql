-- ============================================
-- EXPORT ALL DEMO DATA FOR REFERENCE
-- Run this in Supabase SQL Editor and save output
-- This creates a complete snapshot of working data
-- ============================================

-- ============================================
-- 1. COMPANIES
-- ============================================
SELECT '--- COMPANIES ---' as section;
SELECT id, name FROM companies;

-- ============================================
-- 2. BRANDS  
-- ============================================
SELECT '--- BRANDS ---' as section;
SELECT id, name, company_id FROM brands;

-- ============================================
-- 3. PROFILES (Guides)
-- ============================================
SELECT '--- PROFILES ---' as section;
SELECT 
    id,
    company_id,
    brand_id,
    role,
    full_name,
    email,
    phone,
    first_name,
    last_name,
    status
FROM profiles
WHERE role = 'guide';

-- ============================================
-- 4. VEHICLES
-- ============================================
SELECT '--- VEHICLES ---' as section;
SELECT 
    id,
    company_id,
    plate_number,
    make,
    model,
    year,
    capacity,
    status,
    mileage,
    next_maintenance
FROM vehicles;

-- ============================================
-- 5. TOURS (Sample)
-- ============================================
SELECT '--- TOURS ---' as section;
SELECT 
    id,
    brand_id,
    guide_id,
    name,
    tour_date,
    start_time,
    status,
    guest_count
FROM tours
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 6. GUIDE CHECKINS (Sample)
-- ============================================
SELECT '--- GUIDE CHECKINS ---' as section;
SELECT 
    id,
    tour_id,
    brand_id,
    guide_id,
    checkin_type,
    checked_in_at,
    latitude,
    longitude,
    location_accuracy,
    minutes_early_or_late
FROM guide_checkins
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 7. INSTRUCTIONS FOR CREATING NEW RECORDS
-- ============================================
SELECT '--- INSTRUCTIONS ---' as section;
SELECT 'To create new records, copy the format above and:' as instruction
UNION ALL SELECT '1. Use gen_random_uuid() for new IDs'
UNION ALL SELECT '2. Use existing company_id: 6e046c69-93e2-48c9-a861-46c91fd2ae3b'
UNION ALL SELECT '3. Use existing brand_id: 6b6c93b4-4389-4f1a-98ad-deb622f57056'
UNION ALL SELECT '4. For profiles, id MUST exist in auth.users table'
UNION ALL SELECT '5. Create user in Supabase Auth UI first, then add profile';
