-- Fix expenses table - add missing columns

-- Check current columns first
SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses' ORDER BY ordinal_position;

-- Add missing columns if not present
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS expense_type text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MXN';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tour_id uuid REFERENCES tours(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES profiles(id);

-- Add constraint for expense_type
-- First check if constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%expense_type%'
  ) THEN
    -- Add check constraint (this might fail if column has existing data)
    ALTER TABLE expenses ADD CONSTRAINT chk_expense_type 
    CHECK (expense_type IN ('fuel', 'parking', 'toll', 'meal', 'maintenance', 'supplies', 'other'));
  END IF;
END $$;

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses';
