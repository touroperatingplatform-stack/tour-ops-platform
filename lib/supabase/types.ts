export type UserRole =
  | 'super_admin'
  | 'company_admin'
  | 'supervisor'
  | 'manager'
  | 'operations'
  | 'guide'

export interface Company {
  id: string
  name: string
  slug: string
  logo_url: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  country: string
  timezone: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  company_id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  company_id: string
  brand_id: string | null
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  employee_id: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Tour {
  id: string
  brand_id: string
  tour_type_id: string | null
  guide_id: string | null
  vehicle_id: string | null
  tour_date: string
  departure_time: string
  estimated_return_time: string | null
  guest_count: number
  guest_names: string | null
  booking_reference: string | null
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  import_source: string
  external_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Incident {
  id: string
  tour_id: string
  brand_id: string
  guide_id: string
  category:
    | 'guest_injury_medical'
    | 'vehicle_breakdown'
    | 'late_pickup'
    | 'guest_complaint'
    | 'lost_item'
    | 'guide_misconduct'
    | 'weather_force_majeure'
    | 'other'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  latitude: number | null
  longitude: number | null
  location_description: string | null
  media_urls: string[] | null
  guests_involved: number
  guest_names_involved: string | null
  status: 'open' | 'under_review' | 'resolved' | 'closed'
  assigned_to: string | null
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistTemplate {
  id: string
  brand_id: string
  stage: 'pre_departure' | 'pre_pickup' | 'dropoff' | 'finish'
  sort_order: number
  label: string
  description: string | null
  requires_photo: boolean
  requires_text_input: boolean
  requires_gps: boolean
  requires_selfie: boolean
  is_mandatory: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CashConfirmation {
  id: string
  tour_id: string
  brand_id: string
  guide_id: string
  cash_expected: number | null
  cash_actual: number | null
  ticket_count_expected: number | null
  ticket_count_actual: number | null
  guide_notes: string | null
  discrepancy_notes: string | null
  photo_url: string | null
  status: 'pending' | 'approved' | 'discrepancy_flagged'
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
  has_discrepancy: boolean
  created_at: string
  updated_at: string
}