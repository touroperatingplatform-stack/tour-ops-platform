# Real Tour Company PDF Format

## Header Info (Per Tour Document)
- **Company:** TENOCH TOURS SA DE CV
- **Service:** TULUM CENOTE AKUMAL (tour code: TCA)
- **Operator:** FEDERICO
- **Guide:** JUAN
- **Date:** (implied from document date)

## Per Reservation Entry

| Field | Example | Notes |
|-------|---------|-------|
| HOTEL | VIVA AZTECA | Where to pick up |
| CLIENTE | FRANCESCA Y ADRIANA | Guest names (comma separated) |
| HAB | 1314 | Room number |
| PAX | 2 | Total passengers |
| #CONF | 092+600 | Confirmation number |
| TOUR | TCA | Tour code |
| ID | ES | Nationality code (ES=Spain, FR=France) |
| HORA | 07:50 | Pickup time at hotel |
| REP | PLAYACAR SERVICE | Representative/contact |
| AGENCIA | NS VACATIONS | Booking agency/platform |

## Multiple Tours Per Document
Same document can have multiple tours (different services):
- TULUM CENOTE AKUMAL (TCA)
- COBA (COB)
- Etc.

## Total
Shown at bottom: "TOTAL: 12" (total PAX across all reservations)

---

## Database Schema Update Needed

### Tours Table Additions:
```sql
ALTER TABLE tours ADD COLUMN tour_code text; -- TCA, COB, etc.
ALTER TABLE tours ADD COLUMN operator_name text; -- FEDERICO
ALTER TABLE tours ADD COLUMN service_name text; -- TULUM CENOTE AKUMAL
```

### Reservation Manifest Additions:
```sql
ALTER TABLE reservation_manifest ADD COLUMN hotel_name text;
ALTER TABLE reservation_manifest ADD COLUMN room_number text;
ALTER TABLE reservation_manifest ADD COLUMN nationality_code text; -- ES, FR, etc.
ALTER TABLE reservation_manifest ADD COLUMN pickup_time time; -- 07:50
ALTER TABLE reservation_manifest ADD COLUMN rep_name text; -- PLAYACAR SERVICE
ALTER TABLE reservation_manifest ADD COLUMN agency_name text; -- NS VACATIONS
```

### Guests Sub-table (since CLIENTE can have multiple names):
Need a separate table because "FRANCESCA Y ADRIANA" = 2 people.

```sql
CREATE TABLE reservation_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid REFERENCES reservation_manifest(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  is_primary_contact boolean DEFAULT false
);
```

---

## Example Parsed Data

```json
{
  "company": "TENOCH TOURS SA DE CV",
  "service": "TULUM CENOTE AKUMAL",
  "tour_code": "TCA",
  "operator": "FEDERICO",
  "guide": "JUAN",
  "reservations": [
    {
      "hotel": "VIVA AZTECA",
      "room": "1314",
      "guests": ["FRANCESCA", "ADRIANA"],
      "pax": 2,
      "confirmation": "092+600",
      "nationality": "ES",
      "pickup_time": "07:50",
      "rep": "PLAYACAR SERVICE",
      "agency": "NS VACATIONS"
    },
    {
      "hotel": "ALLEGRO PLAYACAR",
      "room": "064",
      "guests": ["CONTE ANTOINE"],
      "pax": 2,
      "confirmation": "017+600",
      "nationality": "FR",
      "pickup_time": "07:50",
      "rep": "RAUL NS",
      "agency": "NS VACATIONS"
    }
  ],
  "total_pax": 12
}
```

---

## Future: PDF Import Feature
1. Guide uploads PDF
2. System parses with OCR/text extraction
3. Auto-creates tour + reservations
4. Matches to guide by name
5. Sends notification: "New tour assigned for tomorrow"

This is the MANAGER/SALES side - separate from Guide features.
