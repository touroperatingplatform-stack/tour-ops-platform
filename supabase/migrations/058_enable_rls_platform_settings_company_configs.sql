-- Enable RLS on platform_settings and company_configs
-- Security fix for tables exposed to PostgREST

-- platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read platform settings
CREATE POLICY "Platform settings are readable by all users" 
  ON public.platform_settings FOR SELECT 
  USING (true);

-- Only super admins can modify platform settings
CREATE POLICY "Only super admins can modify platform settings"
  ON public.platform_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );

-- company_configs
ALTER TABLE public.company_configs ENABLE ROW LEVEL SECURITY;

-- Users can read their own company's config
CREATE POLICY "Users can read own company config"
  ON public.company_configs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = company_configs.company_id
    )
  );

-- Company admins can update their company config
CREATE POLICY "Company admins can update own company config"
  ON public.company_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = company_configs.company_id
      AND profiles.role IN ('super_admin', 'company_admin', 'manager')
    )
  );
