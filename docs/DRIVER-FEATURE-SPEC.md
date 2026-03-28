# Driver Feature Specification

## Overview
Add dedicated driver role with separate dashboard for vehicle operations.

## Requirements (Confirmed)

1. **New `driver` role** in profiles table
2. **External/freelance drivers** get login access (professional impression)
3. **Separate assignment**: Operations assigns guide + driver independently to tours
4. **Driver dashboard** (`/driver`): vehicle inspection, check-in, fuel, mileage
5. **RLS**: Drivers see only their assigned tours

## Schema Changes (VERIFIED - Migration Created)

**Migration file:** `supabase/migrations/006_driver_role.sql`

### 1. Add `driver` role to profiles
```sql
-- profiles.role now supports: 'super_admin', 'company_admin', 'manager', 'operations', 'supervisor', 'guide', 'driver'
```

### 2. New `driver_profiles` table ✅
```sql
CREATE TABLE driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_expiry DATE,
  driver_type TEXT CHECK (driver_type IN ('employee', 'freelance')),
  hire_date DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  vehicle_certifications JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Add `driver_id` to tours table ✅
```sql
ALTER TABLE tours ADD COLUMN driver_id UUID REFERENCES profiles(id);
CREATE INDEX idx_tours_driver ON tours(driver_id);
```

### 4. New `driver_checkins` table (vehicle inspections) ✅
```sql
CREATE TABLE driver_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES profiles(id),
  vehicle_id UUID REFERENCES vehicles(id),
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  mileage_start INTEGER,
  mileage_end INTEGER,
  fuel_level_before TEXT CHECK (fuel_level_before IN ('empty', '1/4', '1/2', '3/4', 'full')),
  fuel_level_after TEXT CHECK (fuel_level_after IN ('empty', '1/4', '1/2', '3/4', 'full')),
  vehicle_condition TEXT, -- 'good', 'fair', 'poor'
  issues TEXT,
  inspection_data JSONB, -- {tires: 'ok', brakes: 'ok', ac: 'issue', cleanliness: 'good'}
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Pages to Create

| Path | Purpose | Role Access |
|------|---------|-------------|
| `/driver` | Driver dashboard (today's tour, vehicle, guide contact) | driver |
| `/driver/checkin` | Vehicle inspection + check-in | driver |
| `/driver/tours` | Assigned tours list | driver |
| `/driver/history` | Trip history | driver |

## Operations Workflow

1. Operations creates/edits tour
2. Assigns guide (existing)
3. Assigns driver (new dropdown)
4. Driver gets notified (future: push notification)
5. Driver logs in, sees assigned tour
6. Driver completes vehicle inspection
7. Driver checks in (with guide)

## RLS Policies

- Drivers see only tours where `driver_id = auth.uid()`
- Drivers see only their own check-ins
- Operations/Supervisor see all driver data

---

**STATUS: Pending schema verification before implementation**
