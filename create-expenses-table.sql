-- Create expenses table for tour expense tracking
CREATE TABLE IF NOT EXISTS expenses (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id uuid REFERENCES tours(id) ON DELETE CASCADE,
  brand_id uuid REFERENCES brands(id) ON DELETE CASCADE,
  guide_id uuid REFERENCES profiles(id),
  
  -- Expense details
  expense_type text NOT NULL CHECK (expense_type IN (
    'fuel',
    'parking',
    'toll',
    'meal',
    'maintenance',
    'supplies',
    'other'
  )),
  
  amount numeric NOT NULL,
  currency text DEFAULT 'MXN',
  
  description text,
  
  -- Receipt
  receipt_url text,
  
  -- Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Supervisor approval
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_tour ON expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_guide ON expenses(guide_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- RLS policies
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Guides can view/create expenses for their tours
CREATE POLICY guides_expenses ON expenses
FOR ALL TO authenticated
USING (
  guide_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM tours 
    WHERE tours.id = expenses.tour_id 
    AND tours.guide_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('supervisor', 'manager', 'admin')
  )
);

-- Verify
SELECT 'Expenses table created' as status;
