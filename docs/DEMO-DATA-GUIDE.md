# Demo Data Generation Guide

## ⚠️ Critical Rules - DO NOT IGNORE

### 1. NEVER Use RPC Functions for Demo Data
**DO NOT** call `create_demo_tour_data()` or any RPC function.

**Why:** RPC functions become outdated when schema changes. They reference columns that may not exist.

**DO THIS INSTEAD:** Direct Supabase inserts with verified columns.

---

### 2. ALWAYS Verify Columns Before Inserting

Before inserting into any table, check the actual schema:

```sql
-- Run this in Supabase SQL Editor to verify columns
\d vehicles
\d incidents
\d guest_feedback
\d tours
```

**OR** check the migration files in `supabase/migrations/` for the latest schema.

---

### 3. Verified Working Columns (as of March 2026)

#### `vehicles` table
```typescript
{
  company_id: string,      // UUID, required
  plate_number: string,    // required
  make: string,            // required
  model: string,           // required
  year: number,            // required
  capacity: number,        // required
  status: 'available' | 'in_use' | 'maintenance'
}
```

#### `incidents` table
```typescript
{
  tour_id: string,         // UUID, required
  reported_by: string,     // UUID (guide_id), required
  type: string,            // 'medical' | 'vehicle_issue' | 'delay' | etc.
  severity: string,        // 'low' | 'medium' | 'high'
  description: string,     // required
  status: string,          // 'reported' | 'acknowledged' | 'resolved'
  guide_id: string,        // UUID
  resolution_notes: string | null,
  escalation_level: number
}
```

#### `guest_feedback` table
```typescript
{
  tour_id: string,         // UUID, required
  brand_id: string | null, // UUID
  guide_id: string | null, // UUID
  guest_name: string,      // required
  rating: number,          // 1-5, required
  comments: string,
  review_title: string,
  review_text: string,
  review_date: string,     // ISO timestamp
  responded: boolean,
  guest_id: string | null  // UUID, links to guests table
}
```

#### `tours` table
```typescript
{
  company_id: string,      // UUID, required
  brand_id: string | null, // UUID
  guide_id: string,        // UUID, required
  name: string,            // required
  description: string,
  tour_date: string,       // YYYY-MM-DD, required
  start_time: string,      // HH:MM, required
  duration_minutes: number,
  capacity: number,
  pickup_location: string,
  dropoff_location: string,
  price: number,
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  guest_count: number,
  tour_type: 'shared' | 'private',
  created_by: string | null
}
```

#### `guests` table
```typescript
{
  tour_id: string,         // UUID, required
  first_name: string,      // required
  last_name: string,       // required
  email: string,
  phone: string,
  hotel: string,
  room_number: string,
  adults: number,
  children: number,
  notes: string,
  checked_in: boolean,
  no_show: boolean
}
```

---

## Working Demo Data Generator

**Location:** `app/super-admin/demo/page.tsx`

**Key Features:**
1. Direct inserts (no RPC)
2. Random suffix on plate numbers to avoid duplicates
3. Proper foreign key handling (get IDs first, then insert)
4. Progress updates for UX
5. Error handling per table (continues on failure)

**Generation Order (respects FK constraints):**
1. Vehicles
2. Tours
3. Guests
4. Pickup Stops
5. Guide Check-ins
6. Incidents
7. Expenses
8. Guest Feedback
9. Activity Feed

---

## Clear Demo Data Safely

**Location:** Same page - "Clear All Demo Data" button

**What it deletes:**
- All guests, pickup stops, guide check-ins
- All incidents, expenses, feedback
- All tours created TODAY
- All vehicles
- Activity feed entries

**What it preserves:**
- Users/auth (guides, admins, etc.)
- Brands
- Companies
- Configuration

---

## Quick Reference

### Generate Demo Data
1. Super Admin → Demo Data
2. Click "📦 Generate Full Demo"
3. Wait ~15 seconds
4. Creates 6 vehicles, 14 tours, 37 guests, incidents, expenses, reviews

### Clear Demo Data
1. Super Admin → Demo Data
2. Click "🗑️ Clear All Demo Data"
3. Confirms deletion
4. Removes all demo records, preserves config

### For Client Trials
1. Clear demo data (morning of trial)
2. Generate fresh demo data
3. All dashboards show realistic data
4. After trial: clear again

---

## Common Mistakes to Avoid

❌ **Don't** assume column names from old code
❌ **Don't** use RPC functions without verifying they exist
❌ **Don't** insert without checking foreign keys first
❌ **Don't** use hardcoded IDs (use queries to get IDs)
❌ **Don't** skip error handling (one failure shouldn't stop everything)

✅ **Do** verify schema before inserting
✅ **Do** use direct inserts with known-good columns
✅ **Do** get parent IDs (companies, guides) before inserting children
✅ **Do** add random suffixes to avoid unique constraint violations
✅ **Do** handle errors gracefully and continue

---

## If Something Breaks

1. Check Supabase logs for exact error message
2. Verify table schema matches your insert columns
3. Check foreign key constraints (parent record must exist)
4. Look for unique constraint violations (add random suffix)
5. Test single insert in Supabase SQL Editor first

**Debug query:**
```sql
-- Check what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles';
```

---

## Last Updated
March 27, 2026 - Fixed demo generator to use verified columns, no RPC.
