-- Migration 040: Function to seed default activities for new companies

-- Create a function that inserts default activities when a company is created
CREATE OR REPLACE FUNCTION seed_company_activities()
RETURNS TRIGGER AS $$
DECLARE
  default_activities TEXT[] := ARRAY[
    'Tulum Ruins Visit',
    'Cenote Swimming', 
    'Beach Time',
    'Snorkeling Activity',
    'Lunch Break',
    'Shopping Stop',
    'Boat Tour',
    'ATV / Adventure',
    'Archaeological Site',
    'Nature / Wildlife',
    'Transfer / Transportation',
    'Check-in at Location'
  ];
  act TEXT;
BEGIN
  -- Insert default activities for the new company
  FOREACH act IN ARRAY default_activities LOOP
    INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
    VALUES (
      NEW.id,
      act,
      CASE act
        WHEN 'Tulum Ruins Visit' THEN 'Guided tour of archaeological site'
        WHEN 'Cenote Swimming' THEN 'Swimming in natural sinkhole'
        WHEN 'Beach Time' THEN 'Free time at beach location'
        WHEN 'Snorkeling Activity' THEN 'Guided snorkeling tour'
        WHEN 'Lunch Break' THEN 'Meal stop'
        WHEN 'Shopping Stop' THEN 'Time for souvenirs'
        WHEN 'Boat Tour' THEN 'Boat excursion'
        WHEN 'ATV / Adventure' THEN 'ATV or adventure sports'
        WHEN 'Archaeological Site' THEN 'Historical ruins visit'
        WHEN 'Nature / Wildlife' THEN 'Nature walk or wildlife'
        WHEN 'Transfer / Transportation' THEN 'Transport between locations'
        WHEN 'Check-in at Location' THEN 'Arrival check-in process'
        ELSE 'Tour activity'
      END,
      CASE act
        WHEN 'Lunch Break' THEN 60
        WHEN 'Check-in at Location' THEN 20
        WHEN 'Shopping Stop' THEN 45
        WHEN 'Transfer / Transportation' THEN 30
        WHEN 'Nature / Wildlife' THEN 60
        WHEN 'Beach Time' THEN 120
        WHEN 'Boat Tour' THEN 120
        ELSE 90
      END,
      act NOT IN ('Lunch Break', 'Shopping Stop', 'Transfer / Transportation', 'Beach Time', 'Check-in at Location'),
      true
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on companies table
DROP TRIGGER IF EXISTS seed_activities_on_company_create ON companies;

CREATE TRIGGER seed_activities_on_company_create
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION seed_company_activities();

-- Also seed activities for existing companies that don't have any
INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT 
  c.id,
  'Tulum Ruins Visit',
  'Guided tour of archaeological site',
  90,
  true,
  true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id
WHERE a.id IS NULL;

-- Add more defaults for existing companies
INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Cenote Swimming', 'Swimming in natural sinkhole', 60, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Cenote Swimming'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Beach Time', 'Free time at beach location', 120, false, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Beach Time'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Snorkeling Activity', 'Guided snorkeling tour', 90, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Snorkeling Activity'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Lunch Break', 'Meal stop', 60, false, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Lunch Break'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Boat Tour', 'Boat excursion', 120, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Boat Tour'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'ATV / Adventure', 'ATV or adventure sports', 90, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'ATV / Adventure'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Transfer / Transportation', 'Transport between locations', 30, false, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Transfer / Transportation'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Shopping Stop', 'Time for souvenirs', 45, false, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Shopping Stop'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Archaeological Site', 'Historical ruins visit', 90, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Archaeological Site'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Nature / Wildlife', 'Nature walk or wildlife', 60, true, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Nature / Wildlife'
WHERE a.id IS NULL;

INSERT INTO activities (company_id, name, description, duration_minutes, requires_checklist, is_active)
SELECT c.id, 'Check-in at Location', 'Arrival check-in process', 20, false, true
FROM companies c
LEFT JOIN activities a ON a.company_id = c.id AND a.name = 'Check-in at Location'
WHERE a.id IS NULL;