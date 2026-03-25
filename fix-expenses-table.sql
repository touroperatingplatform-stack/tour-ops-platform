-- Fix expenses table - add missing columns

-- Add guide_id if missing
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS guide_id uuid REFERENCES profiles(id);

-- Add other potentially missing columns
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES brands(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES profiles(id);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses';
