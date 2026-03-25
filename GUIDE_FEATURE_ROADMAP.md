# Complete Guide Feature Roadmap

## Core Principle
**Guides EXECUTE tours, they don't CREATE them.**

**Data Flow:**
```
Sales/Manager → Creates Tours (import from booking platforms)
    ↓
Guides → Execute Tours (check-ins, photos, incidents, reports)
    ↓
Supervisor/Manager → Monitor, approve, analyze
```

---

## ✅ COMPLETED

### 1. Dashboard
- [x] View today's assigned tours
- [x] Filter by own tours only (RLS)
- [x] Show tour status (scheduled, in_progress, completed)

### 2. Tour Detail (Pre-Tour)
- [x] View tour info (name, time, pickup, guests)
- [x] Pre-trip checklist
- [x] Vehicle/equipment photos
- [x] Start tour button

### 3. Pickup Check-in ⭐ CRITICAL
- [x] Take selfie at pickup
- [x] GPS location capture
- [x] Punctuality tracking (early/ontime/late)
- [x] Multiple pickup stops support
- [x] Save to guide_checkins table

### 4. End Tour Report (Basic)
- [x] Complete tour
- [x] Save completion timestamp
- [x] Mark tour as completed

---

## 🔧 NEEDS IMPLEMENTATION

### 5. Enhanced End Tour Report ⭐ HIGH PRIORITY
**Current:** Just marks complete
**Needed:**
- [ ] **Weather conditions** (sunny, cloudy, rainy, stormy)
- [ ] **Guest satisfaction rating** (1-5 stars)
- [ ] **Actual guest count** (vs expected count)
- [ ] **Tour photos** (up to 6, like incident photos)
- [ ] **Issues/concerns** text field
- [ ] **Highlights/positive notes** text field
- [ ] **Cash reconciliation:**
  - [ ] Cash received from guests
  - [ ] Cash spent (viaticos, fuel, parking, tolls)
  - [ ] Ticket count vs actual
  - [ ] Receipt photos
  - [ ] Reconcile: Expected vs Actual
- [ ] **Vehicle check:** Forgotten items (yes/no + notes)

### 6. Guest Manifest ⭐ HIGH PRIORITY
**Current:** Nothing
**Needed:**
- [ ] View guest names (from imported booking data)
- [ ] Dietary restrictions
- [ ] Accessibility needs
- [ ] Special requirements
- [ ] Check off guests as picked up (checkbox per guest)
- [ ] Note no-shows

### 7. Tour History
**Current:** Nothing
**Needed:**
- [ ] Past tours list
- [ ] Filter by date range
- [ ] View completed reports
- [ ] View photos from past tours
- [ ] Re-download receipts

### 8. Enhanced Incident Reporting ⭐ HIGH PRIORITY
**Current:** Basic incident form
**Needed:**
- [ ] **Incident templates:**
  - Medical emergency
  - Vehicle breakdown
  - Accident/injury
  - Guest complaint
  - Weather delay
  - Lost item
  - Other
- [ ] **Severity levels** (low, medium, high, critical)
- [ ] **Auto-escalation:** Critical/high → immediate supervisor alert
- [ ] **Real-time supervisor notification** (push/SMS/email)
- [ ] **Two-way communication** on incidents (supervisor can reply)
- [ ] **Photo attachments** (multiple, like incident photos now)
- [ ] **GPS location** of incident (auto-captured)
- [ ] **Incident status tracking** (reported → acknowledged → resolved)

### 9. Expense Tracking (Per Tour) ⭐ MEDIUM PRIORITY
**Current:** Nothing
**Needed:**
- [ ] Log expenses during tour:
  - Fuel
  - Parking
  - Tolls
  - Meals (viaticos)
  - Other
- [ ] Photo of receipts (required)
- [ ] Cash received from office vs spent
- [ ] Submit for approval
- [ ] Supervisor approval workflow

### 10. Communication ⭐ MEDIUM PRIORITY
**Current:** Nothing
**Needed:**
- [ ] Team chat/channel
- [ ] Direct message to supervisor
- [ ] Push notifications for:
  - New tour assignments
  - Schedule changes
  - Urgent announcements
  - Incident updates
- [ ] Announcements from office

### 11. Offline Support ⭐ CRITICAL (Later)
**Current:** Nothing
**Needed:**
- [ ] Queue actions when no connection:
  - Check-ins
  - Incidents
  - Tour completions
  - Photos (upload later)
- [ ] Sync when back online
- [ ] Show "pending sync" status
- [ ] Critical for areas with poor cell coverage

### 12. Profile & Performance ⭐ LOW PRIORITY
**Current:** Basic profile
**Needed:**
- [ ] Tour statistics:
  - Total tours completed
  - Average guest satisfaction
  - Punctuality rate
  - Incident rate
- [ ] Earnings/pay tracking
- [ ] Schedule/availability calendar
- [ ] Documents (license, certifications, expiry dates)
- [ ] Performance rating from supervisors

---

## TOUR IMPORT (Manager/Sales Side) - SEPARATE FEATURE

**NOT built by Guides - this is for Managers:**

**Import Sources:**
- [ ] **Viator API** - Auto-import bookings
- [ ] **GetYourGuide API** - Auto-import bookings
- [ ] **Expedia API** - Auto-import bookings
- [ ] **Direct booking CSV** - Upload spreadsheet
- [ ] **Manual entry** - For phone/walk-in bookings

**Import Data Includes:**
- Tour name, date, time
- Pickup location(s)
- Guest names, count, contact info
- Special requirements
- Booking reference numbers
- Price paid
- Commission owed

**This happens BEFORE Guide sees the tour.**

---

## PRIORITY ORDER

### Phase 1 (This Week) - Guide Execution Core
1. **Enhanced End Tour Report** (weather, satisfaction, photos, cash reconciliation)
2. **Guest Manifest** (view guests, check-off, no-shows)
3. **Enhanced Incidents** (templates, severity, supervisor alerts)

### Phase 2 (Next Week) - Guide Operations
4. **Expense Tracking** (receipts, submit for approval)
5. **Tour History** (view past, download receipts)

### Phase 3 (Later) - Nice to Have
6. **Communication** (team chat, push notifications)
7. **Offline Support** (queue & sync)
8. **Profile/Performance** (stats, earnings)

### Phase 4 (Separate) - Manager/Sales
9. **Tour Import** (Viator, GetYourGuide, CSV)

---

## WHAT'S NEXT?

**Pick your top 3 for Phase 1:**

1. **Enhanced End Tour Report** (cash reconciliation, weather, satisfaction)?
2. **Guest Manifest** (names, dietary, check-off)?
3. **Enhanced Incidents** (supervisor alerts, severity)?

Which should we build first?
