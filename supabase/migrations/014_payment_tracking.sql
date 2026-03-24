-- Payment tracking for tours and guests
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN', -- 'MXN', 'USD'
  exchange_rate DECIMAL(10,4) DEFAULT 1.0, -- if paid in USD
  amount_mxn DECIMAL(10,2), -- Calculated: amount * exchange_rate
  
  -- Payment info
  payment_type TEXT NOT NULL, -- 'deposit', 'full', 'balance', 'refund', 'extra'
  payment_method TEXT, -- 'cash', 'card', 'transfer', 'paypal', 'stripe'
  
  -- Status
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded', 'cancelled'
  
  -- References
  external_reference TEXT, -- Stripe/PayPal transaction ID
  booking_source TEXT, -- 'direct', 'viator', 'getyourguide', 'hotel'
  commission_amount DECIMAL(10,2), -- For external bookings
  
  -- Notes
  notes TEXT,
  
  -- Who recorded
  recorded_by UUID REFERENCES profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_tour ON payments(tour_id);
CREATE INDEX idx_payments_guest ON payments(guest_id);
CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_source ON payments(booking_source);

-- Payment summary view (optional - can be queried)

-- Triggers
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate MXN amount automatically
CREATE OR REPLACE FUNCTION calculate_payment_mxn()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.currency = 'USD' THEN
    NEW.amount_mxn = NEW.amount * COALESCE(NEW.exchange_rate, 18.5);
  ELSE
    NEW.amount_mxn = NEW.amount;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payments_calculate_mxn
  BEFORE INSERT OR UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION calculate_payment_mxn();

-- RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = payments.company_id
    )
  );

CREATE POLICY "Finance can manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = payments.company_id
      AND profiles.role IN ('super_admin', 'company_admin', 'manager', 'operations')
    )
  );
