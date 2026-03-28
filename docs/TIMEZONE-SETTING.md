# Timezone Setting

## Why This Exists

**Date:** March 28, 2026  
**Issue:** Driver assignment component showed wrong date (March 27 instead of 28) due to timezone mismatch between browser (UTC) and server (Cancun).

**Root Cause:** Components using `new Date().toISOString()` get UTC date, which can be different from local date in Americas timezone.

**Solution:** Central timezone setting in Super Admin that all components should use.

---

## Configuration

**Location:** Super Admin → Settings → Timezone

**Default:** `America/Cancun` (EST, no DST)

**Valid Values:** Any IANA timezone string (e.g., `America/Mexico_City`, `America/New_York`, `Europe/London`)

---

## How to Use in Code

```typescript
// ❌ WRONG - Uses UTC, causes date mismatches
const today = new Date().toISOString().split('T')[0]

// ✅ CORRECT - Uses configured timezone
import { getLocalDate } from '@/lib/timezone'
const today = getLocalDate() // Returns date string in configured timezone
```

---

## Database

**Table:** `system_settings`  
**Key:** `timezone`  
**Value:** IANA timezone string (e.g., `America/Cancun`)

---

## Future Reference

When adding any date-based queries:
1. Always use `getLocalDate()` helper
2. Never use `new Date().toISOString()` for date filters
3. Test in different timezones before deploying

---

## Related Files

- `/app/super-admin/settings/page.tsx` - Settings UI
- `/lib/timezone.ts` - Timezone helper functions
- `/app/operations/components/DriverAssignment.tsx` - Where the bug was found
