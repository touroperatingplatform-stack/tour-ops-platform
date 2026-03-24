-- Checklists for tours and operations
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]', -- Array of {id, text, required}
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checklists_company ON checklists(company_id);

-- RLS policies
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view checklists"
  ON checklists FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Operations can manage checklists"
  ON checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('operations', 'supervisor', 'manager', 'company_admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
