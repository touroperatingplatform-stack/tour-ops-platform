-- Company configuration for storage and other settings
CREATE TABLE IF NOT EXISTS company_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, config_key)
);

-- Index for company lookups
CREATE INDEX IF NOT EXISTS idx_company_configs_company ON company_configs(company_id);

-- RLS policies
ALTER TABLE company_configs ENABLE ROW LEVEL SECURITY;

-- Company admins can view their company config
CREATE POLICY "Company staff can view config"
  ON company_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.company_id = company_configs.company_id 
      AND profiles.id = auth.uid()
      AND profiles.role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Only super admins can update config
CREATE POLICY "Super admins can update config"
  ON company_configs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER company_configs_updated_at
  BEFORE UPDATE ON company_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add photo_url column to checklist completions
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE checklist_completions ADD COLUMN IF NOT EXISTS photo_provider TEXT; -- 'google_drive', 'supabase', etc.
