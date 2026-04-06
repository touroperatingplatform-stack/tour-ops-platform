-- Migration 041: Link activities to checklists and add tour equipment tracking

-- Add checklist_template_id to activities table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'activities' 
    AND column_name = 'checklist_template_id'
  ) THEN
    ALTER TABLE activities ADD COLUMN checklist_template_id UUID REFERENCES checklist_templates(id);
  END IF;
END $$;

-- Create tour_equipment_checklists table
CREATE TABLE IF NOT EXISTS tour_equipment_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  activity_id UUID REFERENCES activities(id),
  checklist_template_id UUID REFERENCES checklist_templates(id),
  items JSONB DEFAULT '[]', -- Merged checklist items
  completed_items JSONB DEFAULT '[]', -- Items guide has checked
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  guide_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_equipment_tour ON tour_equipment_checklists(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_equipment_activity ON tour_equipment_checklists(activity_id);

-- RLS policies
ALTER TABLE tour_equipment_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view tour equipment"
  ON tour_equipment_checklists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = tour_equipment_checklists.tour_id
      AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.company_id = tours.company_id
      )
    )
  );

CREATE POLICY "Guide can update tour equipment"
  ON tour_equipment_checklists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tours
      WHERE tours.id = tour_equipment_checklists.tour_id
      AND tours.guide_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER tour_equipment_checklists_updated_at
  BEFORE UPDATE ON tour_equipment_checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
