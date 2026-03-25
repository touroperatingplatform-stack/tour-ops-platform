# Tour Types: Private vs Shared

## Private Tours
**Quality/Service Standard: Premium Experience**

- **Single pickup location**
- **Single pickup time**
- **20-minute early rule** (strict quality standard)
- **Full punctuality tracking** (early/ontime/late)
- **Higher service expectations**
- **Direct accountability**

**Check-in:**
- Guide must be 20 min early
- Strict punctuality status shown
- Quality metric tracked

---

## Shared Tours
**Service Standard: Efficient Group Logistics**

- **Multiple pickup stops** (3-5 locations)
- **Multiple pickup times** (staggered schedule)
- **NO strict 20-min rule** (traffic/delays expected)
- **Progress tracking** instead of punctuality
- **Passenger count per stop**
- **Flexible timing**

**Check-in:**
- Guide checks in at EACH stop
- Shows: "Pickup 2/4 complete"
- Tracks: Passengers boarded per stop
- Status: "On schedule" / "Running behind" (not strict minutes)

---

## Database Schema Update

### Tours Table
```sql
-- Add tour_type enum
ALTER TABLE tours ADD COLUMN tour_type text CHECK (tour_type IN ('private', 'shared'));

-- Default to private for existing tours
UPDATE tours SET tour_type = 'private' WHERE tour_type IS NULL;
```

### Pickup Stops Table
```sql
-- Already exists: pickup_stops with sort_order
-- Works for both tour types
-- Private: 1 stop
-- Shared: Multiple stops
```

### Guide Check-ins Table
```sql
-- Already exists: guide_checkins
-- For shared tours: multiple check-ins (one per stop)
-- New: track pickup_stop_sequence (1, 2, 3, etc.)
```

---

## UI Differences

### Private Tour Dashboard Card:
```
🏝️ Tulum Private Tour
Pickup: 09:00 at Hotel Zone
Status: Scheduled
Quality: ⭐ Premium
[Start Tour]
```

### Shared Tour Dashboard Card:
```
🏝️ Tulum Shared Tour  
Pickups: 4 stops, starts 08:00
Status: Scheduled
Type: 👥 Shared
[Start Tour]
```

### Private Tour Check-in:
```
📍 Pickup Check-in
Location: Hotel Zone
Scheduled: 09:00
Status: 22 min early ✅
[Take Selfie] [Confirm]
```

### Shared Tour Check-in:
```
📍 Pickup Stop 2/4
Location: Hotel Zone South
Scheduled: 08:30
Passengers: 4 expected
Status: On schedule ✅
Guests boarded: [4] ___
[Take Selfie] [Next Stop]
```

---

## Implementation Plan

### Phase 1: Add Tour Type
1. Add `tour_type` column to tours
2. Update seed data with mixed private/shared
3. Show tour type on dashboard

### Phase 2: Different Check-in Logic
4. Private: Strict 20-min punctuality
5. Shared: Progress tracking (X/Y stops)
6. Shared: Passenger count per stop

### Phase 3: Shared Tour Flow
7. Guide checks in at stop 1
8. Shows "Proceed to stop 2"
9. Check in at stop 2, etc.
10. "All pickups complete" → Proceed with tour

---

## Business Logic

**Private Tour Late Penalty:**
- Track for performance review
- Affects guide rating
- Manager notification if >10 min late

**Shared Tour Delay Handling:**
- Expected and acceptable
- No penalty unless >30 min behind schedule
- Auto-notify passengers of delay
- Supervisor can see "running behind" status

---

## Questions for Terry:

1. Should we add tour type now or later?
2. Do you have more private or shared tours?
3. Should shared tours show estimated delay to passengers?
4. Do shared tour guides collect passenger names at each stop?

---

## Current Status

Right now, the system treats ALL tours as private (single pickup, strict punctuality).

**Next:** Add tour type field and different check-in flows.
