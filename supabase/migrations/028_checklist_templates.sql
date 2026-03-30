-- Migration: Create checklist_templates table and booking functions
-- Created: 2026-03-30

-- Function to update tour guest count
CREATE OR REPLACE FUNCTION update_tour_guest_count(tour_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tours
  SET guest_count = (
    SELECT COALESCE(SUM(adults + children), 0)
    FROM guests
    WHERE guests.tour_id = tour_id
  )
  WHERE tours.id = tour_id;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  label TEXT NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Company users can view checklists"
  ON checklist_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = checklist_templates.company_id
    )
  );

CREATE POLICY "Company admins can insert checklists"
  ON checklist_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company_admin'
      AND profiles.company_id = checklist_templates.company_id
    )
  );

CREATE POLICY "Company admins can update checklists"
  ON checklist_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company_admin'
      AND profiles.company_id = checklist_templates.company_id
    )
  );

CREATE POLICY "Company admins can delete checklists"
  ON checklist_templates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'company_admin'
      AND profiles.company_id = checklist_templates.company_id
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
