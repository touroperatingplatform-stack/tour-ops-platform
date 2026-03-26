-- ============================================
-- GENERATE REALISTIC DEMO DATA
-- Run this in Supabase SQL Editor AFTER clearing demo data
-- ============================================
-- Uses real tour UUIDs and guide assignments
-- Creates interconnected, realistic demo data
-- ============================================

-- ============================================
-- 1. CREATE PICKUP STOPS (for shared tours)
-- ============================================

-- Coba Adventure + 4 Cenotes (Shared Tour) - maria@tour-ops.com
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes, created_at)
VALUES 
(gen_random_uuid(), 'fda0734d-e41c-43ee-b797-466652f6f07b', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 1, 
 'Grand Sunset Resort', 'Carretera Cancun-Tulum Km 240', 20.6897, -87.0739, '07:30'::time, 3, 
 'Main lobby pickup', NOW()),
(gen_random_uuid(), 'fda0734d-e41c-43ee-b797-466652f6f07b', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 2, 
 'Vidanta Riviera Maya', 'Carretera Federal Cancun-Playa Km 293', 20.6234, -87.0812, '07:45'::time, 5, 
 'Near main entrance', NOW()),
(gen_random_uuid(), 'fda0734d-e41c-43ee-b797-466652f6f07b', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 3, 
 'Playa del Carmen Center', '5ta Avenida & Constituyentes', 20.6296, -87.0739, '08:00'::time, 6, 
 'Corner of 5th Ave', NOW());

-- Chichen Itza Sunrise (Shared Tour) - carlos@tour-ops.com
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes, created_at)
VALUES 
(gen_random_uuid(), 'a5b180de-82eb-4692-a5b6-045bbeec5869', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 1,
 'Cancun Airport Meeting Point', 'Terminal 3, Exit B', 21.0365, -86.8770, '06:00'::time, 8,
 'Look for guide with sign', NOW()),
(gen_random_uuid(), 'a5b180de-82eb-4692-a5b6-045bbeec5869', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 2,
 'Hotel Zone - Zone 1', 'Blvd. Kukulcan Km 9', 21.1333, -86.7667, '06:30'::time, 10,
 'Near Kukulcan Plaza', NOW()),
(gen_random_uuid(), 'a5b180de-82eb-4692-a5b6-045bbeec5869', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 3,
 'Hotel Zone - Zone 2', 'Blvd. Kukulcan Km 12.5', 21.1089, -86.7594, '06:45'::time, 7,
 'In front of La Isla Mall', NOW());

-- Coba Cenote Maya (Shared Tour) - gude@lifeoperations.com
INSERT INTO pickup_stops (id, tour_id, brand_id, sort_order, location_name, address, latitude, longitude, scheduled_time, guest_count, notes, created_at)
VALUES 
(gen_random_uuid(), '09d82e0f-12bf-4149-829e-be29b23a6928', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0', 1,
 'Beloved Playa Mujeres', 'Vialidad Playas del Mar', 20.8089, -86.8234, '07:30'::time, 4,
 'Main entrance', NOW()),
(gen_random_uuid(), '09d82e0f-12bf-4149-829e-be29b23a6928', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0', 2,
 'Secrets Maroma Beach', 'Carretera Cancun-Playa Km 30', 20.7234, -86.9812, '07:45'::time, 6,
 'Beach club entrance', NOW());

-- ============================================
-- 2. CREATE GUESTS FOR ALL TOURS
-- ============================================

-- Tulum Express (Private) - maria@tour-ops.com
INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, notes, checked_in, created_at)
VALUES 
('fda0734d-e41c-43ee-b797-466652f6f07b', 'John', 'Smith', 'john.smith@email.com', '+1-555-0101', 'Grand Velas Riviera Maya', '205', 2, 0, 'Anniversary trip, vegetarian meals', true, NOW()),
('fda0734d-e41c-43ee-b797-466652f6f07b', 'Sarah', 'Smith', 'sarah.smith@email.com', '+1-555-0102', 'Grand Velas Riviera Maya', '205', 2, 0, 'Traveling with John', true, NOW());

-- Chichen Itza Sunrise (Shared) - carlos@tour-ops.com
INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, notes, checked_in, created_at)
VALUES 
('a5b180de-82eb-4692-a5b6-045bbeec5869', 'Michael', 'Brown', 'm.brown@email.com', '+1-555-0103', 'Beloved Playa Mujeres', '312', 2, 1, 'Family with 8yo child, need car seat', true, NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869', 'Lisa', 'Brown', 'lisa.brown@email.com', '+1-555-0104', 'Beloved Playa Mujeres', '312', 2, 1, 'Traveling with Michael', true, NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869', 'Emma', 'Brown', 'emma.brown@email.com', '+1-555-0105', 'Beloved Playa Mujeres', '312', 0, 1, 'Child (8 years old)', true, NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869', 'David', 'Wilson', 'd.wilson@email.com', '+1-555-0106', 'Secrets Maroma Beach', '418', 2, 0, 'Honeymoon package', true, NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869', 'Jennifer', 'Wilson', 'j.wilson@email.com', '+1-555-0107', 'Secrets Maroma Beach', '418', 2, 0, 'Traveling with David', true, NOW());

-- Coba Cenote Maya (Shared) - gude@lifeoperations.com
INSERT INTO guests (tour_id, first_name, last_name, email, phone, hotel, room_number, adults, children, notes, checked_in, created_at)
VALUES 
('09d82e0f-12bf-4149-829e-be29b23a6928', 'Robert', 'Garcia', 'r.garcia@email.com', '+1-555-0108', 'Finest Playa Mujeres', '521', 4, 0, 'Group of 4 friends', true, NOW()),
('09d82e0f-12bf-4149-829e-be29b23a6928', 'Amanda', 'Martinez', 'a.martinez@email.com', '+1-555-0109', 'Finest Playa Mujeres', '522', 4, 0, 'Group of 4 friends', true, NOW()),
('09d82e0f-12bf-4149-829e-be29b23a6928', 'Christopher', 'Lee', 'c.lee@email.com', '+1-555-0110', 'Finest Playa Mujeres', '523', 4, 0, 'Group of 4 friends', true, NOW()),
('09d82e0f-12bf-4149-829e-be29b23a6928', 'Jessica', 'Lopez', 'j.lopez@email.com', '+1-555-0111', 'Finest Playa Mujeres', '523', 4, 0, 'Group of 4 friends', true, NOW());

-- ============================================
-- 3. CREATE GUIDE CHECK-INS (Realistic GPS + Times)
-- ============================================

-- Maria - Tulum Express (5 min early)
INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, gps_alert_triggered, scheduled_time, minutes_early_or_late, notes, created_at)
VALUES 
('fda0734d-e41c-43ee-b797-466652f6f07b', '6b6c93b4-4389-4f1a-98ad-deb622f57056', 
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'), NULL,
 'pre_pickup', '2026-03-26 07:55:00+00', 20.6897, -87.0739, 15.5, false, '08:00'::time, 5,
 'Arrived early, van clean and fueled', NOW());

-- Carlos - Chichen Itza Sunrise (On time)
INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, gps_alert_triggered, scheduled_time, minutes_early_or_late, notes, created_at)
VALUES 
('a5b180de-82eb-4692-a5b6-045bbeec5869', '6b6c93b4-4389-4f1a-98ad-deb622f57056',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'), NULL,
 'pre_pickup', '2026-03-26 06:00:00+00', 21.0365, -86.8770, 12.3, false, '06:00'::time, 0,
 'At airport meeting point, all guests present', NOW());

-- Guide User - Coba Cenote Maya (3 min late - traffic)
INSERT INTO guide_checkins (tour_id, brand_id, guide_id, pickup_stop_id, checkin_type, checked_in_at, latitude, longitude, location_accuracy, gps_alert_triggered, scheduled_time, minutes_early_or_late, notes, created_at)
VALUES 
('09d82e0f-12bf-4149-829e-be29b23a6928', 'b83ca70d-f545-42f0-a4f7-22155ffcf4d0',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'), NULL,
 'pre_pickup', '2026-03-26 07:33:00+00', 20.8089, -86.8234, 18.2, false, '07:30'::time, -3,
 'Traffic delay on highway, apologized to guests', NOW());

-- ============================================
-- 4. CREATE INCIDENTS (Realistic Scenarios)
-- ============================================

-- Minor delay (Carlos - traffic)
INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, guide_id, resolution_notes, created_at, updated_at)
VALUES 
('a5b180de-82eb-4692-a5b6-045bbeec5869', 
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'),
 'delay', 'low',
 'Traffic jam on highway 307 near Puerto Morelos. Construction zone. Running 20 min behind schedule.',
 'resolved',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'),
 'Took alternative route through local roads. Made up time. Arrived at Chichen Itza only 10 min late. Guests understood.',
 NOW(), NOW());

-- Vehicle issue (Maria - AC problem)
INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, guide_id, resolution_notes, created_at, updated_at)
VALUES 
('fda0734d-e41c-43ee-b797-466652f6f07b',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'),
 'vehicle_issue', 'medium',
 'AC not working properly in van. Blowing warm air. Guests uncomfortable in heat.',
 'in_progress',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'),
 NULL,
 NOW(), NOW());

-- Medical incident (Guide User - guest dizzy)
INSERT INTO incidents (tour_id, reported_by, type, severity, description, status, guide_id, resolution_notes, created_at, updated_at)
VALUES 
('09d82e0f-12bf-4149-829e-be29b23a6928',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'),
 'medical', 'medium',
 'Guest (Amanda Martinez) felt dizzy during hike to cenote. Possible dehydration + heat. Gave water and rest in shade.',
 'resolved',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'),
 'Guest recovered after 30 min rest. Completed tour with no further issues. Recommended to drink more water.',
 NOW(), NOW());

-- ============================================
-- 5. CREATE TOUR EXPENSES (Realistic Receipts)
-- ============================================

-- Maria's expenses (Tulum Express)
INSERT INTO tour_expenses (tour_id, guide_id, company_id, category, description, amount, currency, receipt_url, has_receipt, status, notes, created_at)
VALUES 
('fda0734d-e41c-43ee-b797-466652f6f07b',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'fuel', 'Van fuel for Tulum round trip', 45.50, 'MXN', 
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/tulum-fuel-001.jpg', true, 'pending',
 'Regular gasoline, 15 liters', NOW()),
('fda0734d-e41c-43ee-b797-466652f6f07b',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'parking', 'Tulum ruins parking fee', 150.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/tulum-parking-001.jpg', true, 'pending',
 'Official parking lot', NOW()),
('fda0734d-e41c-43ee-b797-466652f6f07b',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'meals', 'Guide lunch', 180.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/tulum-lunch-001.jpg', true, 'pending',
 'Local restaurant near ruins', NOW());

-- Carlos's expenses (Chichen Itza)
INSERT INTO tour_expenses (tour_id, guide_id, company_id, category, description, amount, currency, receipt_url, has_receipt, status, notes, created_at)
VALUES 
('a5b180de-82eb-4692-a5b6-045bbeec5869',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'fuel', 'Van fuel Chichen Itza trip', 78.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/chichen-fuel-001.jpg', true, 'pending',
 'Long distance trip', NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'tolls', 'Highway tolls round trip', 140.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/chichen-tolls-001.jpg', true, 'pending',
 'Multiple toll booths', NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'meals', 'Guide lunch + drinks', 220.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/chichen-lunch-001.jpg', true, 'pending',
 'Valladolid restaurant', NOW());

-- Guide User expenses (Coba Cenote)
INSERT INTO tour_expenses (tour_id, guide_id, company_id, category, description, amount, currency, receipt_url, has_receipt, status, notes, created_at)
VALUES 
('09d82e0f-12bf-4149-829e-be29b23a6928',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'fuel', 'Local cenote route fuel', 35.00, 'MXN',
 '', false, 'pending',
 'Small local station, no receipt', NOW()),
('09d82e0f-12bf-4149-829e-be29b23a6928',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'),
 '6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 'supplies', 'Bottled water for guests (24 bottles)', 95.00, 'MXN',
 'https://cloudinary.com/dorhbpsxy/tour-ops/receipts/coba-water-001.jpg', true, 'pending',
 'Hot day, guests appreciated', NOW());

-- ============================================
-- 6. CREATE ACTIVITY FEED ENTRIES
-- ============================================

INSERT INTO activity_feed (company_id, actor_id, actor_name, actor_role, activity_type, target_type, target_id, target_name, message, is_public, created_at)
VALUES 
('6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 (SELECT id FROM profiles WHERE email = 'maria@tour-ops.com'), 'Maria Garcia', 'guide',
 'tour_started', 'tour', 'fda0734d-e41c-43ee-b797-466652f6f07b', 'Tulum Express',
 'Maria Garcia started tour "Tulum Express" with 2 guests', true, NOW()),
('6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 (SELECT id FROM profiles WHERE email = 'carlos@tour-ops.com'), 'Carlos Rodriguez', 'guide',
 'tour_started', 'tour', 'a5b180de-82eb-4692-a5b6-045bbeec5869', 'Chichen Itza Sunrise',
 'Carlos Rodriguez started tour "Chichen Itza Sunrise" with 5 guests', true, NOW()),
('6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'), 'Guide User', 'guide',
 'tour_started', 'tour', '09d82e0f-12bf-4149-829e-be29b23a6928', 'Coba Cenote Maya',
 'Guide User started tour "Coba Cenote Maya" with 4 guests', true, NOW()),
('6e046c69-93e2-48c9-a861-46c91fd2ae3b',
 (SELECT id FROM profiles WHERE email = 'gude@lifeoperations.com'), 'Guide User', 'guide',
 'incident_reported', 'incident', 
 (SELECT id FROM incidents WHERE tour_id = '09d82e0f-12bf-4149-829e-be29b23a6928' LIMIT 1),
 'Medical incident',
 'Medical incident reported: Guest felt dizzy during hike', false, NOW());

-- ============================================
-- 7. CREATE GUEST FEEDBACK (Sample Reviews)
-- ============================================

INSERT INTO guest_feedback (tour_id, guest_id, rating, review_title, review_text, review_date, responded, created_at)
VALUES 
('fda0734d-e41c-43ee-b797-466652f6f07b', 
 (SELECT id FROM guests WHERE tour_id = 'fda0734d-e41c-43ee-b797-466652f6f07b' LIMIT 1),
 5, 'Absolutely Amazing!', 
 'Best tour of our vacation! Maria was knowledgeable and cenote was breathtaking. Highly recommend!',
 NOW(), false, NOW()),
('a5b180de-82eb-4692-a5b6-045bbeec5869',
 (SELECT id FROM guests WHERE tour_id = 'a5b180de-82eb-4692-a5b6-045bbeec5869' LIMIT 1),
 4, 'Great Adventure',
 'Loved climbing the pyramid! Cenotes were beautiful. Only issue was it was very hot, but Carlos took good care of us.',
 NOW(), false, NOW()),
('09d82e0f-12bf-4149-829e-be29b23a6928',
 (SELECT id FROM guests WHERE tour_id = '09d82e0f-12bf-4149-829e-be29b23a6928' LIMIT 1),
 5, 'Unforgettable Experience',
 'This was the highlight of our trip! Coba was incredible and cenotes were refreshing. Guide was excellent!',
 NOW(), false, NOW());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check what was created
SELECT 
  'pickup_stops' as table_name, COUNT(*) as row_count FROM pickup_stops
UNION ALL SELECT 'guests', COUNT(*) FROM guests
UNION ALL SELECT 'guide_checkins', COUNT(*) FROM guide_checkins
UNION ALL SELECT 'incidents', COUNT(*) FROM incidents
UNION ALL SELECT 'tour_expenses', COUNT(*) FROM tour_expenses
UNION ALL SELECT 'guest_feedback', COUNT(*) FROM guest_feedback
UNION ALL SELECT 'activity_feed', COUNT(*) FROM activity_feed;

-- Show tour summary
SELECT 
  t.name as tour_name,
  t.tour_date,
  t.status,
  p.email as guide_email,
  COUNT(DISTINCT g.id) as guest_count,
  COUNT(DISTINCT ps.id) as pickup_stops,
  COUNT(DISTINCT i.id) as incidents,
  COUNT(DISTINCT te.id) as expenses
FROM tours t
LEFT JOIN profiles p ON t.guide_id = p.id
LEFT JOIN guests g ON t.id = g.tour_id
LEFT JOIN pickup_stops ps ON t.id = ps.tour_id
LEFT JOIN incidents i ON t.id = i.tour_id
LEFT JOIN tour_expenses te ON t.id = te.tour_id
WHERE t.id IN (
  'fda0734d-e41c-43ee-b797-466652f6f07b',
  'a5b180de-82eb-4692-a5b6-045bbeec5869',
  '09d82e0f-12bf-4149-829e-be29b23a6928'
)
GROUP BY t.id, t.name, t.tour_date, t.status, p.email
ORDER BY t.tour_date;

-- ============================================
-- DEMO DATA COMPLETE!
-- ============================================
-- You now have:
-- - 3 tours with realistic data
-- - 9 pickup stops (shared tours)
-- - 11 guests across all tours
-- - 3 guide check-ins (with GPS + punctuality)
-- - 3 incidents (various types/severities)
-- - 8 expenses (with receipts)
-- - 3 guest feedback reviews
-- - 4 activity feed entries
-- ============================================
