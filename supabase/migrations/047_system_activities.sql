-- Migration: Create system-level activities (like checklists)
-- Companies can use these without creating their own

-- First, update RLS policy to allow viewing system activities (company_id IS NULL)
DROP POLICY IF EXISTS "Staff can view activities" ON activities;

CREATE POLICY "Staff can view activities"
  ON activities FOR SELECT
  USING (
    company_id IS NULL OR -- System activities visible to all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = activities.company_id
    )
  );

-- Create system activities (industry standard activities)
INSERT INTO activities (name, description, duration_minutes, requires_checklist, is_active, company_id, checklist_template_id) VALUES
  ('Cenote Swimming', 'Swimming in natural freshwater cenote', 60, true, true, NULL, NULL),
  ('Tulum Ruins Visit', 'Guided tour of Mayan archaeological site', 90, true, true, NULL, NULL),
  ('Chichen Itza', 'Visit to world wonder Mayan pyramids', 120, true, true, NULL, NULL),
  ('Snorkeling Activity', 'Guided snorkeling in coral reefs', 90, true, true, NULL, NULL),
  ('Beach Time', 'Relaxation time at beach location', 120, false, true, NULL, NULL),
  ('ATV Adventure', 'Off-road ATV jungle tour', 120, true, true, NULL, NULL),
  ('Zip Line Canopy', 'Aerial canopy tour through jungle', 90, true, true, NULL, NULL),
  ('Horseback Riding', 'Guided horseback beach or jungle tour', 90, true, true, NULL, NULL),
  ('Catamaran Cruise', 'Sailing and snorkeling cruise', 240, true, true, NULL, NULL),
  ('Boat Tour', 'Guided boat excursion', 180, true, true, NULL, NULL),
  ('Coba Ruins', 'Bicycle tour of ancient Mayan city', 120, true, true, NULL, NULL),
  ('Ek Balam', 'Climbable Mayan pyramid visit', 90, true, true, NULL, NULL),
  ('Swimming with Dolphins', 'Interactive dolphin experience', 60, true, true, NULL, NULL),
  ('Sea Turtle Snorkel', 'Swim with sea turtles in natural habitat', 90, true, true, NULL, NULL),
  ('Underwater Museum', 'Snorkel or dive at MUSA sculpture garden', 90, true, true, NULL, NULL),
  ('Whale Shark Tour', 'Seasonal whale shark swimming', 240, true, true, NULL, NULL),
  ('Cave Diving', 'Advanced cenote cave diving', 180, true, true, NULL, NULL),
  ('Bird Watching', 'Guided nature bird watching tour', 120, false, true, NULL, NULL),
  ('Jungle Trek', 'Guided nature walk through jungle', 180, false, true, NULL, NULL),
  ('Cooking Class', 'Traditional Mexican cooking experience', 180, false, true, NULL, NULL),
  ('Lunch Stop', 'Meal break at restaurant', 60, false, true, NULL, NULL),
  ('Shopping Stop', 'Time for souvenirs and shopping', 45, false, true, NULL, NULL),
  ('Transfer / Transportation', 'Travel between locations', 30, false, true, NULL, NULL),
  ('Check-in at Location', 'Arrival and check-in process', 20, false, true, NULL, NULL);

-- Note: Companies can still create their own custom activities with company_id set
-- System activities provide the basics, custom activities for unique needs

-- Verify
SELECT 
  name,
  description,
  duration_minutes,
  CASE 
    WHEN company_id IS NULL THEN 'System Activity'
    ELSE 'Company Activity'
  END as type
FROM activities 
WHERE company_id IS NULL
ORDER BY name;
