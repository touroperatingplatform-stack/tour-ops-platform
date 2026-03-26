-- DATABASE SCHEMA BACKUP
-- Export Date: 2026-03-26 14:11 CST
-- Database: Supabase PostgreSQL
-- Total Tables: 38
-- 
-- RESTORE: Run this in Supabase SQL Editor to recreate all tables
-- WARNING: This will drop existing tables if they exist!

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- CORE TABLES
-- ============================================

-- Companies (multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands (tour operators)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#1A56DB',
  secondary_color TEXT DEFAULT '#057A55',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- Profiles (user accounts)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'guide',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'active',
  brand_id UUID REFERENCES brands(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  plate_number TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  capacity INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available',
  mileage INTEGER DEFAULT 0,
  next_maintenance DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, plate_number)
);

-- Tour Templates
CREATE TABLE IF NOT EXISTS tour_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  capacity INTEGER DEFAULT 0,
  pickup_location TEXT,
  dropoff_location TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tours (main tour instances)
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tour_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  capacity INTEGER DEFAULT 0,
  pickup_location TEXT,
  dropoff_location TEXT,
  guide_id UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  brand_id UUID REFERENCES brands(id),
  template_id UUID REFERENCES tour_templates(id),
  price DECIMAL(10,2),
  status TEXT DEFAULT 'scheduled',
  guest_count INTEGER,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  equipment_photo_url TEXT,
  van_photo_url TEXT,
  completed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  tour_type TEXT,
  report_weather TEXT,
  report_guest_satisfaction TEXT,
  report_incident TEXT,
  report_guest_count INTEGER,
  report_highlights TEXT,
  report_issues TEXT,
  report_photos TEXT[],
  report_cash_received DECIMAL(10,2),
  report_cash_spent DECIMAL(10,2),
  report_cash_to_return DECIMAL(10,2),
  report_ticket_count INTEGER,
  report_expense_receipts TEXT[],
  report_forgotten_items BOOLEAN,
  report_forgotten_items_notes TEXT
);

-- Pickup Stops (for shared tours)
CREATE TABLE IF NOT EXISTS pickup_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  sort_order INTEGER NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  scheduled_time TIME NOT NULL,
  guest_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests (tour passengers)
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hotel TEXT,
  room_number TEXT,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  checked_in BOOLEAN DEFAULT FALSE,
  no_show BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guide Check-ins
CREATE TABLE IF NOT EXISTS guide_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  guide_id UUID REFERENCES profiles(id),
  pickup_stop_id UUID REFERENCES pickup_stops(id),
  checkin_type TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ,
  latitude NUMERIC,
  longitude NUMERIC,
  location_accuracy NUMERIC,
  gps_alert_triggered BOOLEAN,
  selfie_url TEXT,
  scheduled_time TIME,
  minutes_early_or_late INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guide Schedules
CREATE TABLE IF NOT EXISTS guide_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, schedule_date)
);

-- ============================================
-- TOUR EXECUTION TABLES
-- ============================================

-- Checklists
CREATE TABLE IF NOT EXISTS checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Templates
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  stage TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checklist Completions
CREATE TABLE IF NOT EXISTS checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id),
  guide_id UUID REFERENCES profiles(id),
  template_id UUID REFERENCES checklist_templates(id),
  stage TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  photo_url TEXT,
  text_value TEXT,
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  is_confirmed BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported',
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  photo_urls TEXT[],
  guide_id UUID REFERENCES profiles(id)
);

-- Incident Comments
CREATE TABLE IF NOT EXISTS incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  comment_by UUID REFERENCES profiles(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour Expenses
CREATE TABLE IF NOT EXISTS tour_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES profiles(id),
  company_id UUID REFERENCES companies(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  receipt_url TEXT,
  has_receipt BOOLEAN,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Maintenance
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost DECIMAL(10,2),
  mileage INTEGER,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FINANCIAL TABLES
-- ============================================

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  amount_mxn DECIMAL(10,2),
  payment_type TEXT NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  external_reference TEXT,
  booking_source TEXT,
  commission_amount DECIMAL(10,2),
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cash Confirmations
CREATE TABLE IF NOT EXISTS cash_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES profiles(id),
  cash_received DECIMAL(10,2),
  cash_spent DECIMAL(10,2),
  cash_to_return DECIMAL(10,2),
  confirmed_by UUID REFERENCES profiles(id),
  confirmed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Booking Partners
CREATE TABLE IF NOT EXISTS booking_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  commission_percent DECIMAL(5,2) DEFAULT 0,
  commission_fixed DECIMAL(10,2) DEFAULT 0,
  api_endpoint TEXT,
  api_key TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_confirm BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External Bookings
CREATE TABLE IF NOT EXISTS external_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id),
  guest_id UUID REFERENCES guests(id),
  partner_id UUID REFERENCES booking_partners(id),
  external_booking_id TEXT NOT NULL,
  external_voucher TEXT,
  sync_status TEXT DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  sync_error TEXT,
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT false,
  commission_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMUNICATION TABLES
-- ============================================

-- Activity Feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_name TEXT,
  actor_role TEXT,
  activity_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  target_name TEXT,
  message TEXT NOT NULL,
  data JSONB,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_urls TEXT[],
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  audience TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push Notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guest Feedback
CREATE TABLE IF NOT EXISTS guest_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  review_text TEXT,
  review_date TIMESTAMPTZ DEFAULT NOW(),
  responded BOOLEAN DEFAULT false,
  response_text TEXT,
  response_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Configs
CREATE TABLE IF NOT EXISTS company_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  config_key TEXT NOT NULL,
  config_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, config_key)
);

-- Brand Settings
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(brand_id, setting_key)
);

-- Settings (global)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, setting_key)
);

-- App Translations
CREATE TABLE IF NOT EXISTS app_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  en TEXT NOT NULL,
  es TEXT,
  fr TEXT,
  de TEXT,
  pt TEXT,
  it TEXT,
  context TEXT,
  section TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Language Preferences
CREATE TABLE IF NOT EXISTS user_language_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offline Sync Queue
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  last_error TEXT,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Summaries
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  total_tours INTEGER DEFAULT 0,
  completed_tours INTEGER DEFAULT 0,
  cancelled_tours INTEGER DEFAULT 0,
  no_show_tours INTEGER DEFAULT 0,
  total_guests INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  total_revenue_mxn DECIMAL(12,2) DEFAULT 0,
  total_revenue_usd DECIMAL(12,2) DEFAULT 0,
  total_expenses_mxn DECIMAL(12,2) DEFAULT 0,
  total_incidents INTEGER DEFAULT 0,
  avg_guest_satisfaction DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, summary_date)
);

-- Guide Performance
CREATE TABLE IF NOT EXISTS guide_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  review_period DATE NOT NULL,
  total_tours INTEGER DEFAULT 0,
  on_time_percentage DECIMAL(5,2),
  avg_satisfaction DECIMAL(3,2),
  total_incidents INTEGER DEFAULT 0,
  total_expenses_mxn DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_id, review_period)
);

-- Time Off Requests
CREATE TABLE IF NOT EXISTS time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Guests
CREATE TABLE IF NOT EXISTS reservation_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservation Manifest
CREATE TABLE IF NOT EXISTS reservation_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  reservation_reference TEXT NOT NULL,
  booking_source TEXT,
  pax_adults INTEGER DEFAULT 0,
  pax_children INTEGER DEFAULT 0,
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'pending',
  amount_due DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tour Types
CREATE TABLE IF NOT EXISTS tour_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicle Utilization
CREATE TABLE IF NOT EXISTS vehicle_utilization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  utilization_date DATE NOT NULL,
  tours_count INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  total_miles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vehicle_id, utilization_date)
);

-- ============================================
-- INDEXES (Key ones listed)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tours_company ON tours(company_id);
CREATE INDEX IF NOT EXISTS idx_tours_date ON tours(tour_date);
CREATE INDEX IF NOT EXISTS idx_tours_status ON tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_guide ON tours(guide_id);
CREATE INDEX IF NOT EXISTS idx_guests_tour ON guests(tour_id);
CREATE INDEX IF NOT EXISTS idx_guide_checkins_tour ON guide_checkins(tour_id);
CREATE INDEX IF NOT EXISTS idx_pickup_stops_tour ON pickup_stops(tour_id);
CREATE INDEX IF NOT EXISTS idx_incidents_tour ON incidents(tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_tour ON tour_expenses(tour_id);
CREATE INDEX IF NOT EXISTS idx_activity_company ON activity_feed(company_id);

-- ============================================
-- END OF SCHEMA
-- ============================================
