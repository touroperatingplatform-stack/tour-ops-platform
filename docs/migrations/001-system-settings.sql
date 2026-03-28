-- System Settings Table
-- Stores application-wide configuration like timezone, currency, etc.
-- Created: March 28, 2026
-- Reason: Driver assignment component showed wrong date due to timezone mismatch

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default timezone setting
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'timezone',
  'America/Cancun',
  'Application timezone for date calculations. IANA timezone string (e.g., America/Cancun, America/Mexico_City)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- RLS Policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view settings
DROP POLICY IF EXISTS "Super admins can view settings" ON system_settings;
CREATE POLICY "Super admins can view settings"
  ON system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Only super_admin can update settings
DROP POLICY IF EXISTS "Super admins can update settings" ON system_settings;
CREATE POLICY "Super admins can update settings"
  ON system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Only super_admin can insert settings
DROP POLICY IF EXISTS "Super admins can insert settings" ON system_settings;
CREATE POLICY "Super admins can insert settings"
  ON system_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key 
ON system_settings(setting_key);
