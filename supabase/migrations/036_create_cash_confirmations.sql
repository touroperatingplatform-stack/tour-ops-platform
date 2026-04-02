-- Migration: Properly create cash_confirmations with company_id
-- Created: 2026-04-02
-- Pattern follows: incidents, tour_expenses, guide_checkins (company-based RLS)

DROP TABLE IF EXISTS cash_confirmations CASCADE;

CREATE TABLE cash_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  cash_expected DECIMAL(10,2),
  cash_actual DECIMAL(10,2),
  ticket_count_expected INTEGER,
  ticket_count_actual INTEGER,
  
  guide_notes TEXT,
  discrepancy_notes TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'pending',
  has_discrepancy BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cash_confirmations_tour ON cash_confirmations(tour_id);
CREATE INDEX idx_cash_confirmations_company ON cash_confirmations(company_id);
CREATE INDEX idx_cash_confirmations_guide ON cash_confirmations(guide_id);
CREATE INDEX idx_cash_confirmations_status ON cash_confirmations(status);

CREATE TRIGGER cash_confirmations_updated_at
  BEFORE UPDATE ON cash_confirmations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cash_confirmations ENABLE ROW LEVEL SECURITY;

-- Company staff can view cash confirmations
CREATE POLICY "Staff can view cash_confirmations"
  ON cash_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = cash_confirmations.company_id
    )
  );

-- Guide can insert their own cash confirmations
CREATE POLICY "Guide can insert own cash_confirmations"
  ON cash_confirmations FOR INSERT
  WITH CHECK (
    guide_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = cash_confirmations.company_id
    )
  );

-- Guide can update their own cash confirmations
CREATE POLICY "Guide can update own cash_confirmations"
  ON cash_confirmations FOR UPDATE
  USING (
    guide_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = cash_confirmations.company_id
    )
  );

-- Admin can manage all cash confirmations in company
CREATE POLICY "Admin can manage cash_confirmations"
  ON cash_confirmations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = cash_confirmations.company_id
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'operations', 'supervisor')
    )
  );

-- Super admin can access any cash confirmation (no company restriction)
CREATE POLICY "Super admin bypass company_cash_confirmations"
  ON cash_confirmations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'super_admin'
    )
  );
