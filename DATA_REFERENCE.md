# 📊 LIVE DATA REFERENCE - Tour Ops Platform

**Last Updated:** 2026-03-28 13:46 CST
**Source:** Supabase Production Database
**Warning:** DO NOT ASSUME - VERIFY AGAINST THIS FILE BEFORE CODING

---

## 🗃️ TABLE: tours

**Purpose:** Main tour instances (scheduled tours)

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Primary key |
| company_id | uuid | YES | |
| name | text | NO | Tour name |
| description | text | YES | |
| tour_date | date | NO | Date of tour |
| start_time | text | NO | HH:MM format |
| duration_minutes | integer | YES | |
| capacity | integer | YES | Max guests |
| pickup_location | text | YES | |
| dropoff_location | text | YES | |
| guide_id | uuid | YES | References profiles.id |
| vehicle_id | uuid | YES | References vehicles.id |
| brand_id | uuid | YES | |
| template_id | uuid | YES | References tour_templates.id |
| price | numeric | YES | |
| status | text | YES | scheduled, in_progress, completed, cancelled, delayed |
| guest_count | integer | YES | Number of guests |
| created_by | uuid | YES | |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |
| equipment_photo_url | text | YES | |
| van_photo_url | text | YES | |
| completed_at | timestamptz | YES | |
| report_weather | text | YES | Post-tour report |
| report_guest_satisfaction | text | YES | |
| report_incident | text | YES | |
| report_guest_count | integer | YES | Actual guest count |
| report_highlights | text | YES | |
| report_issues | text | YES | |
| report_photos | ARRAY | YES | |
| report_cash_received | numeric | YES | Cash collected by guide |
| report_cash_spent | numeric | YES | Petty cash spent |
| report_cash_to_return | numeric | YES | Balance to return |
| report_ticket_count | integer | YES | |
| report_expense_receipts | ARRAY | YES | |
| report_forgotten_items | boolean | YES | |
| report_forgotten_items_notes | text | YES | |
| started_at | timestamptz | YES | |
| tour_type | text | YES | |
| driver_id | uuid | YES | References driver_profiles.profile_id |

### Current Data Issues
⚠️ **DUPLICATES EXIST** - Same tour appears 3x with different IDs:
```
Chichen Itza Sunrise     | 2026-03-28 | 06:00 | 3 rows (IDs: a64e303c, 3d012873, ab692251)
Valladolid Cultural Tour | 2026-03-28 | 06:30 | 3 rows (IDs: 68b93bf6, 6b1cb748, 37cffde3)
Coba + Cenote Early Bird | 2026-03-28 | 07:00 | 3 rows (IDs: 61651853, 7c9ca896, e0356c21)
Tulum Ruins Sunrise      | 2026-03-28 | 07:30 | 3 rows (IDs: a0bd4fd5, 660933c0, b156f46d)
```

**All current tours have:**
- guest_count = 0
- guide_id = assigned
- driver_id = NULL
- vehicle_id = NULL

---

## 🗃️ TABLE: profiles

**Purpose:** User accounts (guides, admins, operations, etc.)

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Same as auth.users.id |
| email | text | NO | |
| role | text | NO | super_admin, company_admin, manager, operations, guide, driver, supervisor |
| first_name | text | YES | |
| last_name | text | YES | |
| company_id | uuid | YES | |
| ... (14 total columns) | | | |

### Current Users (Sample)
| Email | Role | Name |
|-------|------|------|
| super@lifeoperations.com | super_admin | Super Admin |
| ops@lifeoperations.com | operations | Operations User |
| manager@lifeoperations.com | manager | Manager User |
| felipe@lifeoperations.com | driver | (no name) |
| driver1@lifeoperations.com | driver | (no name) |
| driver2@lifeoperations.com | driver | (no name) |
| driver3@lifeoperations.com | driver | (no name) |
| diego@tour-ops.com | guide | Diego Fernandez |
| elena@tour-ops.com | guide | Elena Gomez |
| roberto@tour-ops.com | guide | Roberto Sanchez |
| ana@tour-ops.com | guide | Ana Martinez |
| carlos@tour-ops.com | guide | Carlos Rodriguez |

---

## 🗃️ TABLE: vehicles

**Purpose:** Fleet vehicles

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | Primary key |
| plate_number | text | NO | License plate |
| make | text | NO | Brand (Toyota, Mercedes, etc.) |
| model | text | NO | Model + year |
| capacity | integer | NO | Passenger capacity |
| status | text | NO | available, in_use, maintenance |
| owner_id | uuid | YES | NULL = company-owned, UUID = external owner |
| ... (12 total columns) | | | |

### Current Fleet (6 vehicles)
| Plate | Make | Model | Capacity | Status | Owner |
|-------|------|-------|----------|--------|-------|
| DEM-6215-0 | Toyota | Hiace 2020 | 13 | available | NULL (company) |
| DEM-6215-1 | Mercedes | Sprinter 2021 | 19 | available | NULL (company) |
| DEM-6215-2 | Ford | Transit 2019 | 15 | available | NULL (company) |
| DEM-6215-3 | Chevrolet | Express 2018 | 12 | available | NULL (company) |
| DEM-6215-4 | Nissan | Urvan 2020 | 15 | available | NULL (company) |
| DEM-6215-5 | Hyundai | H350 2021 | 16 | available | NULL (company) |

⚠️ **All vehicles show "available"** - none assigned to tours

---

## 🗃️ TABLE: driver_profiles

**Purpose:** Driver-specific profiles (separate from profiles)

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| profile_id | uuid | NO | References profiles.id |
| status | text | NO | active, inactive |
| license_number | text | YES | |
| ... | | | |

### Current Drivers (4 total)
| Profile ID | Status |
|------------|--------|
| 6c519e32-bf75-4336-83ce-65fa6449e48e (Felipe) | active |
| 3a36b161-f26e-471b-9ca7-8ee00aa0da4d (driver1) | active |
| 93c62959-30ff-42fc-ae60-ca54644848fb (driver2) | active |
| 2f3b0d1c-f2a1-4da2-b4e9-db3b3507e6ac (driver3) | active |

---

## 🗃️ TABLE: guide_checkins

**Purpose:** Guide check-in records

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | |
| tour_id | uuid | YES | References tours.id |
| brand_id | uuid | YES | |
| guide_id | uuid | YES | References profiles.id |
| pickup_stop_id | uuid | YES | |
| checkin_type | USER-DEFINED | YES | |
| checked_in_at | timestamptz | YES | |
| latitude | numeric | YES | GPS |
| longitude | numeric | YES | GPS |
| location_accuracy | numeric | YES | Meters |
| gps_alert_triggered | boolean | YES | |
| selfie_url | text | YES | |
| scheduled_time | time | YES | |
| minutes_early_or_late | integer | YES | Negative = early, Positive = late |
| notes | text | YES | |
| created_at | timestamptz | YES | |

### Sample Data (Today)
| Guide | Tour | Minutes Early/Late |
|-------|------|-------------------|
| Diego Fernandez | Chichen Itza Sunrise | +1 (1 min late) |
| Elena Gomez | Valladolid Cultural Tour | -5 (5 min early) |
| Roberto Sanchez | Coba + Cenote Early Bird | +8 (8 min late) |
| Ana Martinez | Tulum Ruins Sunrise | +4 (4 min late) |
| Carlos Rodriguez | Coba Ruins Afternoon | -1 (1 min early) |

---

## 🗃️ TABLE: cash_confirmations

**Purpose:** Cash reconciliation records

### Schema
| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| id | uuid | NO | |
| tour_id | uuid | YES | |
| brand_id | uuid | YES | |
| guide_id | uuid | YES | |
| cash_expected | numeric | YES | |
| cash_actual | numeric | YES | |
| ticket_count_expected | integer | YES | |
| ticket_count_actual | integer | YES | |
| guide_notes | text | YES | |
| discrepancy_notes | text | YES | |
| photo_url | text | YES | |
| status | USER-DEFINED | YES | pending, confirmed, disputed |
| reviewed_by | uuid | YES | |
| reviewed_at | timestamptz | YES | |
| reviewer_notes | text | YES | |
| has_discrepancy | boolean | YES | |
| created_at | timestamptz | YES | |
| updated_at | timestamptz | YES | |

### Current State
⚠️ **EMPTY** - No cash confirmations yet

---

## 🗃️ TABLE: incidents

**Purpose:** Incident tracking

### Schema (partial - verify with query)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| tour_id | uuid | |
| guide_id | uuid | |
| severity | text | L1, L2, L3 |
| status | text | open, acknowledged, resolved |
| description | text | |
| ... | | |

### Current State
⚠️ **3 active incidents** (per dashboard)

---

## 🗃️ TABLE: daily_summaries

**Purpose:** Daily aggregated stats

### Schema
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| company_id | uuid | |
| summary_date | date | |
| total_tours | integer | |
| completed_tours | integer | |
| cancelled_tours | integer | |
| no_show_tours | integer | |
| total_guests | integer | |
| no_shows | integer | |
| total_revenue_mxn | numeric | |
| total_revenue_usd | numeric | |
| total_commissions | numeric | |
| incidents_count | integer | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Current State
⚠️ **EMPTY** - No summaries generated yet

---

## 🔗 KEY RELATIONSHIPS

```
tours.guide_id → profiles.id
tours.driver_id → driver_profiles.profile_id → profiles.id
tours.vehicle_id → vehicles.id
tours.template_id → tour_templates.id
tours.brand_id → brands.id
tours.company_id → companies.id

driver_profiles.profile_id → profiles.id
profiles.company_id → companies.id
vehicles.owner_id → profiles.id (external vehicles)
```

---

## ⚠️ KNOWN ISSUES TO FIX

1. **Duplicate Tours** - Same tour × 3 with different IDs
   - Root cause: Demo data generator or query issue
   - Fix: Deduplicate OR fix the query causing duplicates

2. **All Vehicles Show "available"** - None assigned to tours
   - Tours have vehicle_id = NULL
   - Need to assign vehicles or update status logic

3. **All guest_count = 0** - No guest data populated
   - Demo data not setting guest counts

4. **No cash_confirmations** - Reconciliation not tested yet

5. **RLS Policies** - Recently fixed, need verification
   - profiles: Fixed (2026-03-28 13:22)
   - brands: Fixed
   - checklists: Fixed
   - companies: Fixed
   - tour_templates: Fixed
   - vehicle_maintenance: Fixed

---

## 📝 RULES FOR CODING

1. **ALWAYS CHECK THIS FILE FIRST** before writing queries
2. **NEVER ASSUME** column names or data types
3. **VERIFY WITH LIVE QUERY** if data seems wrong
4. **ASK FOR QUERY RESULTS** if unsure about data state
5. **TEST QUERIES** before embedding in components

---

## 🔍 USEFUL QUERIES FOR VERIFICATION

```sql
-- Check for duplicate tours
SELECT name, tour_date, start_time, COUNT(*) as count
FROM tours
GROUP BY name, tour_date, start_time
HAVING COUNT(*) > 1;

-- Check tours without driver/vehicle
SELECT id, name, guide_id, driver_id, vehicle_id
FROM tours
WHERE driver_id IS NULL OR vehicle_id IS NULL;

-- Check guide check-ins for today
SELECT gc.*, p.first_name, p.last_name
FROM guide_checkins gc
JOIN profiles p ON p.id = gc.guide_id
WHERE gc.checked_in_at >= CURRENT_DATE;

-- Check vehicle status distribution
SELECT status, COUNT(*) as count
FROM vehicles
GROUP BY status;
```

---

**MAINTENANCE:** Update this file whenever:
- Schema changes
- New tables added
- Data issues discovered
- RLS policies modified
