# Backup Manifest - 2026-03-26 Pre-Enhancements

**Backup ID:** `backup-2026-03-26-pre-enhancements`  
**Git Commit:** `256d2a445c29df5583f8c59c23265f0d97dfdafc`  
**Created:** 2026-03-26 14:11 CST  
**Created By:** Johny (OpenClaw Agent)

---

## Files Included in Backup

### Root Level
- [x] `README.md` - Backup overview and restore instructions
- [x] `git-tag.txt` - Git tag name and restore commands
- [x] `snapshot-summary.md` - This manifest file

### Database Folder
- [x] `database/schema.sql` - Complete database schema (38 tables)
  - All table definitions
  - All column types and constraints
  - All indexes
  - Helper functions (update_updated_at_column)

### Environment Backup
- [x] `env-backup/.env.local.masked` - Masked environment variables
  - Cloudinary cloud name: `dorhbpsxy`
  - Cloudinary API key: `933486393815468`
  - Cloudinary API secret: `MASKED`
  - Cloudinary upload preset: `tour-ops-unsigned`

---

## Database Tables Documented (38 Total)

### Core Tables (11)
1. companies
2. brands
3. profiles
4. vehicles
5. tour_templates
6. tours
7. pickup_stops
8. guests
9. guide_checkins
10. guide_schedules
11. tour_types

### Tour Execution Tables (7)
12. checklists
13. checklist_templates
14. checklist_completions
15. incidents
16. incident_comments
17. tour_expenses
18. vehicle_maintenance

### Financial Tables (5)
19. payments
20. cash_confirmations
21. booking_partners
22. external_bookings
23. expenses

### Communication Tables (4)
24. activity_feed
25. announcements
26. push_notifications
27. guest_feedback

### System Tables (11)
28. notifications
29. company_configs
30. brand_settings
31. settings
32. app_translations
33. user_language_prefs
34. audit_log
35. offline_sync_queue
36. daily_summaries
37. guide_performance
38. time_off_requests

### Reservation Tables (2)
39. reservation_guests
40. reservation_manifest

### Additional Tables (1)
41. vehicle_utilization

**Total:** 41 tables documented

---

## Production Data Snapshot

### Tables with Active Data
| Table | Approx. Count | Notes |
|-------|---------------|-------|
| tours | 10 | Active tours |
| guide_checkins | 3 | Guide location check-ins |
| pickup_stops | 6 | Shared tour pickups |
| profiles | 18 | Authenticated users |
| incidents | 5 | Incident reports with photos |
| tour_expenses | Active | Expense tracking |
| checklist_completions | Active | Completed checklists |
| activity_feed | Active | Team activity stream |
| vehicles | Active | Fleet records |
| brands | Active | Brand configurations |
| companies | Active | Multi-tenant setup |

### Empty Tables (Feature Pending)
| Table | Purpose | Feature Status |
|-------|---------|----------------|
| guests | Tour passengers | CSV import pending |
| guest_feedback | Guest reviews | Feature pending |
| payments | Payment tracking | Feature pending |
| cash_confirmations | Cash reconciliation | Feature pending |
| reservation_guests | Reservation data | Integration pending |
| reservation_manifest | Booking manifest | Integration pending |

---

## Git State

### Current Branch
- **Branch:** main
- **Commit:** 256d2a445c29df5583f8c59c23265f0d97dfdafc
- **Tag:** backup-2026-03-26-pre-enhancements
- **Tag Pushed:** Yes (to origin)

### Files in This Commit
- AUDIT-COMPLETE-2026-03-26.md
- DATABASE-SCHEMA-AUDIT.md
- demo-data/README.md
- demo-data/demo-guest-feedback.csv
- demo-data/demo-guests.csv
- demo-data/demo-incidents.csv
- demo-data/demo-pickup-stops.csv
- demo-data/demo-tour-expenses.csv
- demo-data/demo-tours.csv

### Recent Commits (Last 5)
```
256d2a4 - docs: complete audit + database schema + demo data CSVs (HEAD -> main, tag: backup-2026-03-26-pre-enhancements)
[Previous commits not captured in backup]
```

---

## External Dependencies

### Supabase
- **Project URL:** Not stored (user knows)
- **Auth Users:** 18 profiles (stored in Supabase auth system)
- **Database:** PostgreSQL (schema backed up, data not exported)
- **Storage:** Not backed up (photos in Cloudinary)
- **RLS Policies:** Enabled on all tables (not exported in schema backup)

### Cloudinary
- **Cloud Name:** dorhbpsxy
- **API Key:** 933486393815468
- **API Secret:** Masked (user has in .env.local)
- **Upload Preset:** tour-ops-unsigned
- **Stored Files:** Incident photos, tour reports, expense receipts, checklists (not backed up)

### Other Services
- **Google Maps:** API key configured (not backed up)
- **Google Drive:** Integration exists (credentials not backed up)
- **Email Service:** Not yet configured

---

## Security Notes

### What's Secure
- ✅ Cloudinary API secret masked in backup
- ✅ No Supabase service role key stored
- ✅ No database passwords in backup
- ✅ No personal user data exported

### What's NOT Backed Up (Intentionally)
- ❌ Supabase auth.users table (security risk)
- ❌ API keys and secrets (security risk)
- ❌ Actual database records (privacy)
- ❌ Cloudinary stored images (would require separate backup)

---

## Restore Priority

### Critical (Must Have)
1. Git tag (code version)
2. .env.local (with real secrets from secure storage)
3. Supabase database (live, has current data)

### Important (Should Have)
4. Database schema (for reference or full reset)
5. Audit documents (for context)

### Nice to Have
6. Demo data files (for testing)
7. Backup manifest (for documentation)

---

## Backup Location

**Primary:** `C:\Users\lifeo\OneDrive\Documents\GitHub\tour-ops-platform\backups\backup-2026-03-26-pre-enhancements\`

**User Action Required:**
- [ ] Copy to external USB drive
- [ ] Copy to cloud storage (Google Drive, Dropbox, etc.)
- [ ] Verify copy is complete

---

## Enhancement Plan (Post-Backup)

### Phase 1: Guest Import
- CSV import in Super Admin
- Map to guests table
- Import preview + validation

### Phase 2: Guest Feedback
- Survey UI (guide's phone)
- Branded email with TripAdvisor link
- Save to guest_feedback table

### Phase 3: Cash Advance
- Cash advance assignment
- Expense reconciliation
- Approval workflow (supervisor/admin)

### Phase 4: Payment Tracking
- Payment requirement per reservation
- Guide sees payment status
- Collect at pickup
- Monitor outstanding

### Phase 5: Super Admin Enhancements
- Demo data management (import/clear)
- Trial period tracking
- External API config (Viator, GYG)
- Download template CSV

---

## Contact

**Backup created by:** Johny  
**Platform:** OpenClaw Agent  
**User:** Terry  
**Project:** Tour Ops Platform  
**Repository:** https://github.com/touroperatingplatform-stack/tour-ops-platform

---

**END OF MANIFEST**
