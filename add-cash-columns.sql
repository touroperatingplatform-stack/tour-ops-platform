-- Add cash reconciliation and vehicle check columns
ALTER TABLE tours 
ADD COLUMN IF NOT EXISTS report_cash_received numeric,
ADD COLUMN IF NOT EXISTS report_cash_spent numeric,
ADD COLUMN IF NOT EXISTS report_cash_to_return numeric,
ADD COLUMN IF NOT EXISTS report_ticket_count integer,
ADD COLUMN IF NOT EXISTS report_expense_receipts text[],
ADD COLUMN IF NOT EXISTS report_forgotten_items boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS report_forgotten_items_notes text;

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tours' 
AND (column_name LIKE 'report_%' OR column_name = 'completed_at')
ORDER BY column_name;
