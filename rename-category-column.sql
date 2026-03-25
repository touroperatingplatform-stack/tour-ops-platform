-- Rename category column to expense_type
ALTER TABLE expenses RENAME COLUMN category TO expense_type;

-- Add check constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%expense_type%'
  ) THEN
    ALTER TABLE expenses ADD CONSTRAINT chk_expense_type 
    CHECK (expense_type IN ('fuel', 'parking', 'toll', 'meal', 'maintenance', 'supplies', 'other'));
  END IF;
END $$;

-- Verify
SELECT column_name FROM information_schema.columns WHERE table_name = 'expenses';
