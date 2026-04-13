-- Create linking table for activities to checklists
-- This maps activities to grouped checklists without modifying activities table

CREATE TABLE IF NOT EXISTS activity_checklist_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, checklist_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_checklist_activity ON activity_checklist_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_checklist_checklist ON activity_checklist_links(checklist_id);

-- Enable RLS
ALTER TABLE activity_checklist_links ENABLE ROW LEVEL SECURITY;

-- Staff can view
CREATE POLICY "Staff can view links"
  ON activity_checklist_links FOR SELECT
  USING (true);

-- Superadmin can manage system links
CREATE POLICY "Superadmin can manage system links"
  ON activity_checklist_links FOR ALL
  USING (
    is_system = true AND 
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Companies can manage their own links
CREATE POLICY "Companies can manage their links"
  ON activity_checklist_links FOR ALL
  USING (
    is_system = false AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = (
        SELECT company_id FROM activities WHERE activities.id = activity_checklist_links.activity_id
      )
    )
  );

-- Insert system links for existing activities
-- Cenote Swimming → Snorkeling Equipment
-- Sea Turtle → Snorkeling Equipment
-- etc.

-- First, get the checklists
WITH checklist_ids AS (
  SELECT id, name FROM checklists WHERE company_id IS NULL
),
activity_ids AS (
  SELECT id, name FROM activities WHERE company_id IS NULL
)
INSERT INTO activity_checklist_links (activity_id, checklist_id, is_system)
SELECT 
  a.id,
  c.id,
  true
FROM activity_ids a
CROSS JOIN checklist_ids c
WHERE 
  (a.name ILIKE '%cenote%' OR a.name ILIKE '%snorkel%' OR a.name ILIKE '%turtle%')
  AND c.name ILIKE '%snorkel%'
ON CONFLICT DO NOTHING;

-- Verify
SELECT a.name as activity, c.name as checklist
FROM activity_checklist_links acl
JOIN activities a ON a.id = acl.activity_id
JOIN checklists c ON c.id = acl.checklist_id
WHERE acl.is_system = true;
