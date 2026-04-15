-- Migration 052: Transform tour_templates into tour_products
-- This enhances the existing template concept and renames it for clarity

-- Step 1: Rename table
ALTER TABLE tour_templates RENAME TO tour_products;

-- Step 2: Add missing columns for full product definition
ALTER TABLE tour_products 
ADD COLUMN IF NOT EXISTS service_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS activity_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pre_tour_checklist_id UUID REFERENCES checklists(id),
ADD COLUMN IF NOT EXISTS requires_guide BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS requires_driver BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 20;

-- Step 3: Add index on service_code per company (not unique - existing data may have duplicates)
CREATE INDEX IF NOT EXISTS idx_tour_products_service_code 
ON tour_products(company_id, service_code);

-- Step 4: Update tours table to reference product_id instead of template_id
-- First check if template_id exists and rename it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tours' AND column_name = 'template_id'
  ) THEN
    -- Rename column
    ALTER TABLE tours RENAME COLUMN template_id TO product_id;
  END IF;
END $$;

-- Step 5: Add service_code normalization trigger
CREATE OR REPLACE FUNCTION normalize_service_code(input_text TEXT)
RETURNS VARCHAR(50) AS $$
BEGIN
  RETURN UPPER(TRIM(REPLACE(input_text, ' ', '')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION normalize_tour_product_service_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.service_code IS NOT NULL THEN
    NEW.service_code := normalize_service_code(NEW.service_code);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_normalize_service_code ON tour_products;
CREATE TRIGGER tr_normalize_service_code
  BEFORE INSERT OR UPDATE ON tour_products
  FOR EACH ROW
  EXECUTE FUNCTION normalize_tour_product_service_code();

-- Step 6: Migrate data from servicio_patterns into tour_products
-- This connects the import flow to the product concept
INSERT INTO tour_products (
  company_id,
  service_code,
  name,
  description,
  duration_minutes,
  activity_ids,
  capacity,
  requires_guide,
  requires_driver,
  max_guests,
  is_active,
  created_at,
  updated_at
)
SELECT 
  sp.company_id,
  normalize_service_code(sp.servicio_name),
  sp.servicio_name,
  'Auto-migrated from servicio_patterns',
  COALESCE(sp.duration_minutes, 480),
  ARRAY(SELECT jsonb_array_elements_text(sp.activities))::uuid[],
  20, -- default capacity
  true,
  true,
  20,
  true,
  sp.created_at,
  sp.updated_at
FROM servicio_patterns sp
WHERE NOT EXISTS (
  SELECT 1 FROM tour_products tp 
  WHERE tp.company_id = sp.company_id 
  AND tp.service_code = normalize_service_code(sp.servicio_name)
);

-- Step 7: Drop old indexes that reference old table name (they're automatically renamed but let's be clean)
-- The unique index we created above handles this

-- Step 8: Create new indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_products_company ON tour_products(company_id);
CREATE INDEX IF NOT EXISTS idx_tour_products_service_code ON tour_products(service_code);
CREATE INDEX IF NOT EXISTS idx_tour_products_active ON tour_products(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_products_activity_ids ON tour_products USING GIN(activity_ids);

-- Step 9: Add index on tours.product_id
CREATE INDEX IF NOT EXISTS idx_tours_product ON tours(product_id);

-- Step 10: Enable/update RLS
ALTER TABLE tour_products ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they reference old table name (they should auto-rename but let's be safe)
DROP POLICY IF EXISTS "Companies can view their templates" ON tour_products;
DROP POLICY IF EXISTS "Admin can manage templates" ON tour_products;

-- Create new policies with correct naming
CREATE POLICY "Companies can view their products"
  ON tour_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = tour_products.company_id
    )
  );

CREATE POLICY "Admin can create products"
  ON tour_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = tour_products.company_id
      AND profiles.role IN ('company_admin', 'manager', 'supervisor', 'super_admin')
    )
  );

CREATE POLICY "Admin can update products"
  ON tour_products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = tour_products.company_id
      AND profiles.role IN ('company_admin', 'manager', 'supervisor', 'super_admin')
    )
  );

CREATE POLICY "Admin can delete products"
  ON tour_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = tour_products.company_id
      AND profiles.role IN ('company_admin', 'manager', 'supervisor', 'super_admin')
    )
  );

-- Step 11: Create utility function to get or create product from service code
CREATE OR REPLACE FUNCTION get_or_create_tour_product(
  p_company_id UUID,
  p_service_code TEXT,
  p_name TEXT DEFAULT NULL,
  p_activities UUID[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_product_id UUID;
  v_normalized_code VARCHAR(50);
BEGIN
  v_normalized_code := normalize_service_code(p_service_code);
  
  -- Try to find existing product
  SELECT id INTO v_product_id
  FROM tour_products
  WHERE company_id = p_company_id
  AND service_code = v_normalized_code;
  
  -- If not found, create it
  IF v_product_id IS NULL THEN
    INSERT INTO tour_products (
      company_id,
      service_code,
      name,
      activity_ids,
      requires_guide,
      requires_driver,
      is_active
    )
    VALUES (
      p_company_id,
      v_normalized_code,
      COALESCE(p_name, v_normalized_code),
      p_activities,
      true,
      true,
      true
    )
    RETURNING id INTO v_product_id;
  END IF;
  
  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
