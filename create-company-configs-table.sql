-- Create company_configs table for per-client feature flags and limits
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS company_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  
  -- Feature Flags
  enable_guides BOOLEAN DEFAULT true,
  enable_drivers BOOLEAN DEFAULT true,
  enable_operations BOOLEAN DEFAULT true,
  enable_supervisor BOOLEAN DEFAULT true,
  enable_manager BOOLEAN DEFAULT true,
  enable_incidents BOOLEAN DEFAULT true,
  enable_expenses BOOLEAN DEFAULT true,
  enable_reports BOOLEAN DEFAULT true,
  enable_guest_feedback BOOLEAN DEFAULT true,
  enable_activity_feed BOOLEAN DEFAULT true,
  enable_driver_checkin BOOLEAN DEFAULT true,
  enable_pickup_stops BOOLEAN DEFAULT true,
  enable_external_bookings BOOLEAN DEFAULT true,
  enable_multi_company BOOLEAN DEFAULT true,
  enable_custom_branding BOOLEAN DEFAULT true,
  enable_api_integrations BOOLEAN DEFAULT true,
  
  -- Usage Limits
  max_companies INTEGER DEFAULT 5,
  max_users INTEGER DEFAULT 50,
  max_guides INTEGER DEFAULT 20,
  max_drivers INTEGER DEFAULT 10,
  max_tours_per_day INTEGER DEFAULT 100,
  max_guests_per_month INTEGER DEFAULT 10000,
  max_vehicles INTEGER DEFAULT 20,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_company_configs_company_id ON company_configs(company_id);

-- Create config for existing company (Cancun Adventure Tours)
INSERT INTO company_configs (company_id)
SELECT id FROM companies WHERE name = 'Cancun Adventure Tours'
ON CONFLICT (company_id) DO NOTHING;

-- Verify
SELECT 
  c.name as company_name,
  cc.max_companies,
  cc.max_users,
  cc.max_guides,
  cc.enable_external_bookings
FROM company_configs cc
JOIN companies c ON cc.company_id = c.id;
