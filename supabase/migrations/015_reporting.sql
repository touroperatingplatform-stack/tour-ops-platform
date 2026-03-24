-- Reporting and analytics tables

-- Daily summary (auto-generated)
CREATE TABLE daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  
  -- Tour stats
  total_tours INTEGER DEFAULT 0,
  completed_tours INTEGER DEFAULT 0,
  cancelled_tours INTEGER DEFAULT 0,
  no_show_tours INTEGER DEFAULT 0,
  
  -- Guest stats
  total_guests INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  
  -- Financial stats
  total_revenue_mxn DECIMAL(12,2) DEFAULT 0,
  total_revenue_usd DECIMAL(12,2) DEFAULT 0,
  total_commissions DECIMAL(12,2) DEFAULT 0,
  
  -- Incident stats
  incidents_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(company_id, summary_date)
);

CREATE INDEX idx_daily_summaries_company ON daily_summaries(company_id);
CREATE INDEX idx_daily_summaries_date ON daily_summaries(summary_date);

-- Guide performance tracking
CREATE TABLE guide_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Stats
  tours_led INTEGER DEFAULT 0,
  total_guests INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  reviews_count INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  incidents_reported INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guide_perf_guide ON guide_performance(guide_id);
CREATE INDEX idx_guide_perf_period ON guide_performance(period_start, period_end);

-- Vehicle utilization
CREATE TABLE vehicle_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Stats
  days_used INTEGER DEFAULT 0,
  total_km_driven INTEGER DEFAULT 0,
  tours_completed INTEGER DEFAULT 0,
  fuel_cost DECIMAL(10,2),
  maintenance_cost DECIMAL(10,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_util_vehicle ON vehicle_utilization(vehicle_id);
CREATE INDEX idx_vehicle_util_period ON vehicle_utilization(period_start, period_end);

-- Triggers
CREATE TRIGGER daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER guide_performance_updated_at
  BEFORE UPDATE ON guide_performance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER vehicle_utilization_updated_at
  BEFORE UPDATE ON vehicle_utilization
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_utilization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view reports"
  ON daily_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = daily_summaries.company_id
    )
  );

CREATE POLICY "Staff can view guide performance"
  ON guide_performance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = guide_performance.company_id
    )
  );

CREATE POLICY "Staff can view vehicle utilization"
  ON vehicle_utilization FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.company_id = vehicle_utilization.company_id
    )
  );
