# Superadmin Preset Management - Design Options

## Current State
- Checklists have stages (acknowledgement, pre_departure, activity, etc.)
- Activities exist but aren't connected to checklists in the UI
- activity_checklist_links table exists but management is clunky
- Superadmin creates system presets → Companies clone them

## The Core Problem
Need a way to manage BOTH:
1. **Checklist Presets** (what equipment/items are needed)
2. **Activity Definitions** (what tours/activities exist)
3. **The Connection** (which checklists at which phases for each activity)

---

## Option 1: Activity-Centric Management (Recommended)

### Concept
Start with activities, then assign checklists to phases for each activity.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Activity Management                              [+ New]   │
├─────────────────────────────────────────────────────────────┤
│  [Search...]  [Filter by Phase ▼]                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CENOTE SWIMMING TOUR                                       │
│  Duration: 4 hours | Type: Water Activity                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Phase              Checklist                        │   │
│  │ ───────────────────────────────────────────────────  │   │
│  │ 👋 Acknowledgement ☐ Guide Readiness               │   │
│  │ 🚐 Pre-Departure   ☑ Van Standard Equipment        │   │
│  │ 📍 Pre-Pickup      ☑ Guest Count Verification      │   │
│  │ 🎯 Activity        ☑ Cenote Swimming Equipment    │   │
│  │ 🏁 Dropoff         ☐ —                             │   │
│  │ ✅ Finish          ☑ Return Equipment Check         │   │
│  │                                                     │   │
│  │ [+ Assign Checklist to Activity]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Edit Activity] [Duplicate] [Deactivate]                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  MAYAN RUINS VISIT                                          │
│  Duration: 6 hours | Type: Land Activity                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Phase              Checklist                        │   │
│  │ ───────────────────────────────────────────────────  │   │
│  │ 👋 Acknowledgement ☑ Guide Readiness               │   │
│  │ 🚐 Pre-Departure   ☑ Van Standard Equipment        │   │
│  │ ...                                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pros
- Mirrors how tour operators think ("My cenote tour needs these checklists")
- Shows gaps clearly ("Dropoff phase has no checklist")
- Easy to see what each activity requires

### Cons
- Checklists are secondary, harder to manage checklist library
- Multiple activities might need same checklist - duplication

---

## Option 2: Phase-Centric + Activity Assignment

### Concept
Manage checklists by phase, then assign to activities as secondary action.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Phase Management                                           │
├─────────────────────────────────────────────────────────────┤
│  [👋 Acknowledgement] [🚐 Pre-Departure] [📍 Pre-Pickup]    │
│  [🎯 Activity] [🏁 Dropoff] [✅ Finish]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ACKNOWLEDGEMENT CHECKLISTS                                 │
│                                                             │
│  ┌─ Guide Readiness Checklist ─────────────────────────┐   │
│  │ Items: 6 | Required: 4 | Photo: 2                   │   │
│  │                                                    │   │
│  │ Used by Activities:                              │   │
│  │ ☑ Mayan Ruins Visit                              │   │
│  │ ☑ ATV Adventure                                  │   │
│  │ ☐ Cenote Swimming                                │   │
│  │                                                    │   │
│  │ [Edit] [Duplicate] [Manage Assignments]          │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Vehicle Handoff Checklist ────────────────────────┐    │
│  │ Items: 8 | Required: 6 | Photo: 3                   │   │
│  │                                                    │   │
│  │ Used by Activities:                              │   │
│  │ ☑ ATV Adventure                                  │   │
│  │ ☑ Zip Line Tour                                  │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
│  [+ Create New Acknowledgement Checklist]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pros
- Checklists are primary focus (good for preset management)
- Reuse is visible (same checklist used by multiple activities)
- Phase context is always clear

### Cons
- Activities are scattered across phases
- Harder to see "what does my Cenote tour need overall?"

---

## Option 3: Dual-View Toggle

### Concept
Tab between Activity view and Phase view.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Manage Checklists & Activities                   [+ New ▼] │
├─────────────────────────────────────────────────────────────┤
│  [View: By Activity ▼]  [Quick: Manage Presets]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Activity View] [Phase View] [Assignment Matrix]           │
│                                                             │
│  (current content based on selected view)                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Activity View**: Like Option 1 - activities with phase checklists
**Phase View**: Like Option 2 - checklists grouped by phase
**Assignment Matrix**: Grid showing activity × phase = checklist

### Pros
- Best of both worlds
- Users can choose their preferred view
- Matrix view gives complete overview

### Cons
- More complex to build
- Might confuse users with too many options

---

## Option 4: Wizard-Style Setup Flow

### Concept
Step-by-step setup: Define Activity → Assign Checklists → Review

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  Setup New Activity Wizard                    Step 2 of 3   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CENOTE SWIMMING TOUR                                       │
│  Duration: 4 hours                                          │
│                                                             │
│  Select checklists for each phase:                          │
│                                                             │
│  👋 Acknowledgement                                         │
│  [Select checklist ▼]                                       │
│  OR [+ Create New]                                          │
│                                                             │
│  🚐 Pre-Departure                                           │
│  [☑ Van Standard Equipment] [Change]                       │
│                                                             │
│  📍 Pre-Pickup                                              │
│  [Select checklist ▼]                                       │
│                                                             │
│  🎯 Activity                                                │
│  [☑ Cenote Swimming Equipment] [Change]                     │
│  [+ Add Additional Checklist]                               │
│                                                             │
│                      [Back] [Next: Review →]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Pros
- Guided setup reduces errors
- Clear context at each step
- Good for new users

### Cons
- Slow for power users
- Hard to get overview of all activities
- Not good for editing existing

---

## Recommendation

**Option 1 (Activity-Centric)** for primary management
**+ Option 2 (Phase-Centric)** as secondary tab

Why:
1. Tour operators think in activities ("my cenote tour needs...")
2. Activities map 1:1 to Viator/GetYourGuide service names
3. Phase context shows what's missing
4. Secondary Phase view allows checklist library management

---

## Questions to Decide

1. Should one activity have MULTIPLE checklists per phase?
   - e.g., Pre-Departure: both "Van Check" AND "Guide Readiness"
   - OR only one checklist per phase?

2. Should activities exist without ANY checklists?
   - e.g., simple walking tour with no equipment
   - OR require at least acknowledgement checklist?

3. Should checklists be created FROM activity view?
   - OR go to separate preset management?

4. How handle shared checklists?
   - e.g., "Van Standard Equipment" used by many activities
   - Edit in one place affects all?
   - OR clone per activity?
