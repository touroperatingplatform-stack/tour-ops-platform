-- Migration: Properly create checklist_completions with company_id
-- Created: 2026-04-02
-- Pattern follows: incidents, tour_expenses, guide_checkins (company-based RLS)

DROP TABLE IF EXISTS checklist_completions CASCADE;

CREATE TABLE checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES checklists(id) ON DELETE SET NULL,
  
  stage TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  photo_url TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_completions_tour ON checklist_completions(tour_id);
CREATE INDEX idx_checklist_completions_company ON checklist_completions(company_id);
CREATE INDEX idx_checklist_completions_guide ON checklist_completions(guide_id);
CREATE INDEX idx_checklist_completions_stage ON checklist_completions(stage);

CREATE TRIGGER checklist_completions_updated_at
  BEFORE UPDATE ON checklist_completions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE checklist_completions ENABLE ROW LEVEL SECURITY;

-- Company staff can view checklist completions
CREATE POLICY "Staff can view checklist_completions"
  ON checklist_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = checklist_completions.company_id
    )
  );

-- Guide can insert their own checklist completions
CREATE POLICY "Guide can insert own checklist_completions"
  ON checklist_completions FOR INSERT
  WITH CHECK (
    guide_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = checklist_completions.company_id
    )
  );

-- Guide can update their own checklist completions
CREATE POLICY "Guide can update own checklist_completions"
  ON checklist_completions FOR UPDATE
  USING (
    guide_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = checklist_completions.company_id
    )
  );

-- Admin can manage all checklist completions in company
CREATE POLICY "Admin can manage checklist_completions"
  ON checklist_completions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = checklist_completions.company_id
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'operations', 'supervisor')
    )
  );

-- Super admin can access any checklist completion (no company restriction)
CREATE POLICY "Super admin bypass company_checklist_completions"
  ON checklist_completions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
