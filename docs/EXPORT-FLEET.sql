-- ============================================
-- EXPORT FLEET DATA
-- Run this to see actual vehicle records structure
-- ============================================

-- Export all vehicles
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
    next_maintenance,
    created_at
FROM vehicles;

-- Export all active tours with guides
SELECT 
    t.id,
    t.name,
    t.status,
    t.tour_date,
    t.start_time,
    t.guest_count,
    p.id as guide_id,
    p.full_name as guide_name,
    p.email as guide_email,
    t.brand_id
FROM tours t
LEFT JOIN profiles p ON p.id = t.guide_id
WHERE t.status = 'in_progress';

-- Export all profiles with their structure
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
