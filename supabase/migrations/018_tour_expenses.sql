-- Tour expenses (what guides spend on tours)
CREATE TABLE tour_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Expense details
  category TEXT NOT NULL, -- 'fuel', 'meals', 'supplies', 'parking', 'tolls', 'other'
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN', -- 'MXN', 'USD'
  
  -- Receipt/proof
  receipt_url TEXT, -- Photo of receipt stored in Supabase Storage
  has_receipt BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tour_expenses_tour ON tour_expenses(tour_id);
CREATE INDEX idx_tour_expenses_guide ON tour_expenses(guide_id);
CREATE INDEX idx_tour_expenses_status ON tour_expenses(status);
CREATE INDEX idx_tour_expenses_category ON tour_expenses(category);

-- Triggers
CREATE TRIGGER tour_expenses_updated_at
  BEFORE UPDATE ON tour_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE tour_expenses ENABLE ROW LEVEL SECURITY;

-- Guides can view/manage their own expenses
CREATE POLICY "Guides can manage own expenses"
  ON tour_expenses FOR ALL
  USING (guide_id = auth.uid());

-- Admins can view all expenses
CREATE POLICY "Admins can view all expenses"
  ON tour_expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'operations')
    )
  );

-- Admins can approve/reject expenses
CREATE POLICY "Admins can approve expenses"
  ON tour_expenses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'operations')
    )
  );
