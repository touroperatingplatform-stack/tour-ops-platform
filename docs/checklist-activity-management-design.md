# Checklist & Activity Management - Design Document

## Current Problem
- Activities and checklists are managed separately
- No visual connection between activities and their required checklists
- Stages (acknowledgement, pre_departure, pre_pickup, activity, dropoff, finish) are scattered
- Company admins can't easily see which checklists apply to which tour phases

## Proposed Solution: Unified Management Interface

### Navigation Structure

```
Admin Sidebar (Company Admin)
├── Activities & Checklists (NEW - Combined)
│   ├── By Tour Phase (Tab View)
│   │   ├── Acknowledgement
│   │   ├── Pre-Departure
│   │   ├── Pre-Pickup
│   │   ├── Activities
│   │   ├── Dropoff
│   │   └── Finish
│   └── By Activity (Alternative View)
├── Tours
├── Staff
└── Settings
```

### Page Layout: Tour Phase View

```
┌─────────────────────────────────────────────────────────────┐
│  Activities & Checklists                          [+ New]   │
├─────────────────────────────────────────────────────────────┤
│  [Acknowledgement] [Pre-Departure] [Pre-Pickup] [Activity]  │
│  [Dropoff] [Finish]                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACKNOWLEDGEMENT CHECKLISTS                                 │
│  These checklists appear when guides acknowledge a tour     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ☑ Guide Readiness Checklist                          │ │
│  │    Items: 8  Required: 6  Photo Required: 2          │ │
│  │    [Edit] [Duplicate] [Deactivate]                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ☑ Vehicle Handoff Checklist                          │ │
│  │    Items: 12  Required: 10  Photo Required: 4      │ │
│  │    [Edit] [Duplicate] [Deactivate]                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [+ Add Checklist to This Phase]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Page Layout: Activity Assignment View

```
┌─────────────────────────────────────────────────────────────┐
│  Activities & Checklists                          [+ New]   │
├─────────────────────────────────────────────────────────────┤
│  [View: By Tour Phase] [View: By Activity ▼]               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACTIVITY: Cenote Swimming                                  │
│  Description: Swimming in natural cenotes                   │
│                                                             │
│  ┌─ Required Checklists ─────────────────────────────────┐  │
│  │                                                       │  │
│  │  Pre-Departure:    ☑ Van Equipment Checklist        │  │
│  │  Activity:         ☑ Cenote Swimming Equipment       │  │
│  │                    ☐ Cenote Safety Checklist         │  │
│  │  Finish:           ☑ Return Equipment Checklist    │  │
│  │                                                       │  │
│  │  [+ Assign Checklist]  [Manage Checklists]           │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ACTIVITY: Mayan Ruins Visit                                │
│  Description: Archaeological site tours                     │
│                                                             │
│  ┌─ Required Checklists ─────────────────────────────────┐  │
│  │                                                       │  │
│  │  Pre-Departure:    ☑ Van Equipment Checklist        │  │
│  │  Activity:         ☑ Ruins Visit Equipment           │  │
│  │                    ☑ Entry Tickets Checklist        │  │
│  │  Finish:           ☑ Return Equipment Checklist    │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Checklist Editor Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Edit Checklist                                    [X]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Name: [Guide Readiness Checklist           ]              │
│                                                             │
│  Stage: [Acknowledgement ▼]                               │
│                                                             │
│  Description:                                               │
│  [Pre-tour guide confirmation checklist                   ]│
│                                                             │
│  ┌─ Checklist Items ─────────────────────────────────────┐ │
│  │                                                       │ │
│  │  ☑ ★ 📷  Guide license verified                    │ │
│  │     ☐ ★ 📷  Vehicle inspection photos taken        │ │
│  │     ☑ ★ ☐  Fuel level confirmed (75%+)              │ │
│  │     ☐ ☐ 📷  Emergency contact verified              │ │
│  │                                                       │ │
│  │  [+ Add Item]                                        │ │
│  │                                                       │ │
│  │  Legend: ☑ = Required  ★ = Has Description  📷 =    │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Cancel]                                    [Save Changes] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema Updates Needed

```sql
-- Add stage to existing checklist management
-- Already in migration 046

-- Add activity_checklist_assignments table for many-to-many
CREATE TABLE activity_checklist_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
  checklist_id uuid REFERENCES checklists(id) ON DELETE CASCADE,
  stage TEXT NOT NULL, -- acknowledgement, pre_departure, etc.
  sort_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, checklist_id, stage)
);

-- Add RLS
ALTER TABLE activity_checklist_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage assignments"
  ON activity_checklist_assignments
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
```

### Key Features

1. **Stage-Based Organization**: Group checklists by when they appear in tour flow
2. **Activity Linking**: Visual connection between activities and their required checklists
3. **Quick Assignment**: Drag-and-drop or checkbox to assign checklists to activities
4. **Clone from Presets**: Superadmin creates presets, companies clone and customize
5. **Visual Indicators**: Icons for required items, photo requirements, descriptions
6. **Bulk Operations**: Assign same checklist to multiple activities

### Migration to New System

1. Existing checklists get stage from migration 046/053
2. Create default assignments based on activity names
3. UI migration - replace old pages with new unified view
4. Keep old URLs redirect to new locations

### Implementation Priority

1. Add activity_checklist_assignments table (migration 054)
2. Update admin checklists page with stage filtering
3. Create activity-to-checklist assignment interface
4. Update guide workflow to load checklists from assignments
5. Migrate existing hardcoded guide checklists to database
