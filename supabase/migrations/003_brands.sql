-- Brands table for tour operators
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1A56DB',
  secondary_color TEXT DEFAULT '#057A55',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Index for company brands
CREATE INDEX IF NOT EXISTS idx_brands_company ON brands(company_id);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);

-- RLS policies
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view brands"
  ON brands FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage brands"
  ON brands FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('manager', 'company_admin', 'super_admin')
    )
  );

-- Trigger for updated_at
CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
