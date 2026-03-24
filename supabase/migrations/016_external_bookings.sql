-- External booking partners (Viator, GetYourGuide, hotels)
CREATE TABLE booking_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Partner info
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL, -- 'ota', 'hotel', 'concierge', 'agent'
  
  -- Contact
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Commission structure
  commission_percent DECIMAL(5,2) DEFAULT 0, -- e.g., 15.00 = 15%
  commission_fixed DECIMAL(10,2) DEFAULT 0, -- Fixed amount per booking
  
  -- Integration
  api_endpoint TEXT,
  api_key TEXT, -- Encrypted in app
  webhook_secret TEXT,
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false, -- Auto-confirm bookings from this partner
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_partners_company ON booking_partners(company_id);
CREATE INDEX idx_booking_partners_type ON booking_partners(partner_type);

-- External bookings reference
CREATE TABLE external_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES booking_partners(id) ON DELETE CASCADE,
  
  -- External reference
  external_booking_id TEXT NOT NULL,
  external_voucher TEXT,
  
  -- Sync status
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed', 'cancelled'
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  
  -- Commission
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT false,
  commission_paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(partner_id, external_booking_id)
);

CREATE INDEX idx_external_bookings_tour ON external_bookings(tour_id);
CREATE INDEX idx_external_bookings_partner ON external_bookings(partner_id);
CREATE INDEX idx_external_bookings_sync ON external_bookings(sync_status);

-- Triggers
CREATE TRIGGER booking_partners_updated_at
  BEFORE UPDATE ON booking_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER external_bookings_updated_at
  BEFORE UPDATE ON external_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE booking_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage partners"
  ON booking_partners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = booking_partners.company_id
      AND profiles.role IN ('super_admin', 'company_admin', 'manager')
    )
  );

CREATE POLICY "Staff can view partners"
  ON booking_partners FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = booking_partners.company_id
    )
  );

CREATE POLICY "Staff can view external bookings"
  ON external_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN booking_partners bp ON bp.company_id = p.company_id
      WHERE p.id = auth.uid() 
      AND bp.id = external_bookings.partner_id
    )
  );

CREATE POLICY "Admins can manage external bookings"
  ON external_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN booking_partners bp ON bp.company_id = p.company_id
      WHERE p.id = auth.uid() 
      AND bp.id = external_bookings.partner_id
      AND p.role IN ('super_admin', 'company_admin', 'manager', 'operations')
    )
  );
