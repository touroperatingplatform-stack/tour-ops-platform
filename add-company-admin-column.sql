-- Add company_admin_id column to companies table
-- Run this in Supabase SQL Editor

-- 1. Add the column
ALTER TABLE companies 
ADD COLUMN company_admin_id UUID REFERENCES auth.users(id);

-- 2. Link existing company to admin@lifeoperations.com
UPDATE companies 
SET company_admin_id = '7b0d216f-7a23-44ea-b075-cb919b5424c1'
WHERE company_admin_id IS NULL;

-- 3. Verify
SELECT 
  c.id,
  c.name,
  c.slug,
  c.company_admin_id,
  p.email as admin_email
FROM companies c
LEFT JOIN profiles p ON c.company_admin_id = p.id;

-- 4. Add index for performance
CREATE INDEX IF NOT EXISTS idx_companies_admin_id ON companies(company_admin_id);
