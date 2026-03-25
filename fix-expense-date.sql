-- Fix expenses table - date column

-- Make date nullable or set default
ALTER TABLE expenses ALTER COLUMN date DROP NOT NULL;

-- OR add default
-- ALTER TABLE expenses ALTER COLUMN date SET DEFAULT CURRENT_DATE;

-- Verify
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' AND column_name = 'date';
