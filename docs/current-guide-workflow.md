# Current Guide Workflow (As Deployed)

## Page Structure

```
/guide
├── page.tsx                    # Guide dashboard (today's tours)
└── tours/
    └── [id]/
        ├── page.tsx            # Main tour page (start tour, in-progress)
        ├── acknowledge/
        │   └── page.tsx        # Step 1: Accept tour assignment
        ├── checkin/
        │   └── page.tsx        # GPS + photo checkin at stops
        ├── checklist/
        │   └── page.tsx        # Old checklist (deprecated?)
        ├── complete/
        │   └── page.tsx        # End of tour report
        ├── guests/
        │   └── page.tsx        # Guest manifest view
        ├── expense/
        │   └── page.tsx        # Submit expenses
        └── incident/
            └── page.tsx        # Report incidents
```

## Workflow Steps

### 1. GUIDE DASHBOARD (`/guide`)
- Shows today's assigned tours
- Each tour card shows: name, time, guest count, status
- Click tour → goes to appropriate page based on status

### 2. ACKNOWLEDGE TOUR (`/guide/tours/[id]/acknowledge`)
**When:** Tour status='scheduled', acknowledged_at=null
**Purpose:** Guide accepts assignment before going to office

**Features:**
- Shows tour details (name, date, time, guest count)
- Shows activities in tour
- Shows pickup locations
- Shows special requirements (dietary, accessibility)
- "Accept Tour" button → sets acknowledged_at
- Creates acknowledgement checkin

### 3. PRE-DEPARTURE (`/guide/tours/[id]` - Main Page)
**When:** Tour status='scheduled', acknowledged_at exists
**Purpose:** At office, before leaving

**Current Features:**
- **Header:** Tour name, vehicle info, status badge
- **Progress bar:** Tour progress percentage
- **Pre-Departure Checklist:**
  - From `tours.checklist_id` → `checklists.items`
  - Usually: Van inspection items
- **Tour Equipment Checklist:**
  - From `tour_equipment_checklists` (auto-generated from activities)
  - Shows all items from ALL activities mixed together
  - Each item prefixed with activity name (e.g., "Tulum Ruins: Entry tickets")
- **Required Photos:**
  - Van photo (cloudinary upload)
  - Equipment photo (cloudinary upload)
- **Start Tour Button:**
  - Disabled until all checklists complete + photos taken
  - On click: Creates `guide_checkins` with `checkin_type='pre_departure'`
  - Updates tour status to 'in_progress'
  - Redirects to `/guide` (dashboard)

### 4. IN-PROGRESS TOUR (`/guide/tours/[id]` - Same page)
**When:** Tour status='in_progress'
**Purpose:** Managing pickups, activities, dropoffs

**Current Features:**
- **Tour Progress Indicator:**
  - Shows 3 phases: Pickups → Activities → Dropoffs
  - Green checkmarks for completed phases
  
- **Pickup Stops:**
  - Shows each pickup location
  - Shows guest count
  - Shows completed/pending status
  - Link to `/guide/tours/[id]/checkin?type=pickup`
  
- **Activity Stops:**
  - Shows each activity stop
  - Shows guest count
  - Link to `/guide/tours/[id]/checkin?type=activity`
  - Locked until pickups complete
  
- **Dropoff Stops:**
  - Shows each dropoff location
  - Link to `/guide/tours/[id]/checkin?type=dropoff`
  - Locked until activities complete
  
- **Guest Manifest:**
  - Expandable section
  - Shows all reservations
  - Shows checked_in/no_show status
  - Shows dietary/accessibility needs
  
- **Complete Tour Button:**
  - Appears when all phases done
  - Links to `/guide/tours/[id]/complete`

### 5. GPS CHECK-IN (`/guide/tours/[id]/checkin`)
**Purpose:** Photo + GPS at each stop

**Features:**
- Shows stop location name
- Shows guest list for this stop
- Required: Photo of guests/location
- Required: GPS coordinates (auto-captured)
- Check-in button
- Creates `guide_checkins` with `checkin_type` (pickup/activity/dropoff)
- Updates `reservation_manifest.checked_in` for guests

### 6. COMPLETE TOUR (`/guide/tours/[id]/complete`)
**When:** After all phases complete
**Purpose:** End of tour report

**Features:**
- Weather condition
- Guest satisfaction
- Incident summary
- Guest count attended
- Tour highlights
- Cash reconciliation (received/spent)
- Ticket count
- Vehicle forgotten items check
- Photo upload for receipts
- Submit button → creates office_return checkin, tour status='completed'

## Data Flow

### Database Tables Used

1. **tours**
   - id, name, status, acknowledged_at, started_at, completed_at
   - guide_id, vehicle_id, brand_id

2. **tour_activities**
   - tour_id, activity_id, sort_order
   - Links tour to activities

3. **tour_equipment_checklists** ← GENERATED
   - tour_id, items (JSON array), completed_items, is_completed
   - Items auto-generated from activity_checklist_links
   - Currently stores ALL items for ALL phases
   - No stage filtering

4. **guide_checkins**
   - tour_id, checkin_type (acknowledgement, pre_departure, pickup, activity, dropoff, completed)
   - checked_in_at, gps_location

5. **pickup_stops**
   - tour_id, location_name, stop_type (pickup, activity, dropoff)
   - guest_count, sort_order

6. **reservation_manifest**
   - tour_id, booking_reference, primary_contact_name
   - adult_pax, child_pax, checked_in, no_show
   - dietary_restrictions, accessibility_needs

## What's Working Now

✅ Acknowledge tour
✅ Pre-departure checklist (all items shown)
✅ Photo uploads (van + equipment)
✅ Start tour → in_progress
✅ Pickup stops with checkin
✅ Activity stops with checkin
✅ Dropoff stops with checkin
✅ Guest manifest
✅ Complete tour report

## What's Broken

❌ Pre-departure shows ALL checklist items (acknowledgement, pre_departure, activity, dropoff, finish all mixed)
❌ No phased checklist display
❌ Can't distinguish which items for which phase
❌ No "stage" field on tour_equipment_checklists items

## The Problem

tour_equipment_checklists.items JSON structure:
```json
[
  {"id": "...", "text": "Tulum Ruins: Entry tickets", "activity": "Tulum Ruins", "required": true},
  {"id": "...", "text": "Cenote Swimming: Snorkel masks", "activity": "Cenote Swimming", "required": true}
  // ... all items from all checklists, no stage field
]
```

The `activity_checklist_links` table has `stage` on the CHECKLIST, but when items are copied to `tour_equipment_checklists`, the stage is lost.

## Solution Options

**Option A: Add stage to tour_equipment_checklists items**
- Modify `generate_tour_equipment_checklist()` function to include stage
- Filter display by current phase

**Option B: Query checklists dynamically**
- Don't use tour_equipment_checklists for display
- Query `activity_checklist_links` → `checklists` directly
- Filter by stage in real-time

**Option C: Create tour_checklist_completions table**
- Track which items completed per tour per phase
- Keep tour_equipment_checklists as just template