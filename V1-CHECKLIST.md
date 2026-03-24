# V1.0 Production Readiness Checklist

## ✅ Complete

### Database
- [x] Brands table exists
- [x] 2 demo brands created (Cancun Adventure Tours, Playa Excursions)
- [x] brand_id in profiles, tours, vehicles tables
- [x] Incident schema matches code

### Features
- [x] Incident reporting with photo upload
- [x] Cloudinary integration (unsigned preset)
- [x] Super admin dashboard (/super-admin)
- [x] Company/brand management
- [x] Google Drive settings UI (ready for credentials)

### Files Created/Updated
- [x] `lib/cloudinary/upload.ts` - Upload utility
- [x] `app/guide/incidents/new/page.tsx` - Photo upload
- [x] `app/super-admin/page.tsx` - Dashboard
- [x] `.env.local` - Cloudinary credentials
- [x] `.env.example` - Template
- [x] `CLOUDINARY-SETUP.md` - Guide
- [x] `V1-CHECKLIST.md` - This file

---

## ⚠️ Before Commit

### 1. Update .env.local
**File:** `.env.local`

Replace:
```env
CLOUDINARY_API_SECRET=your-api-secret-here
```

With your actual secret from Cloudinary dashboard.

---

### 2. Test Build
```bash
cd C:\Users\lifeo\OneDrive\Documents\GitHub\tour-ops-platform
npm run build
```

**Should pass with no errors.**

---

### 3. Test Flows
- [ ] Incident creation with photo
- [ ] Super admin dashboard loads
- [ ] Brands show in DB (5 total: 3 old + 2 new)
- [ ] Photo uploads to Cloudinary

---

## 📦 Commit When Ready

### Files to Commit:
```
app/guide/incidents/new/page.tsx (updated)
app/super-admin/page.tsx (new)
lib/cloudinary/upload.ts (new)
.env.example (new)
CLOUDINARY-SETUP.md (new)
V1-CHECKLIST.md (new)
supabase-v1-brands.sql (new)
```

### Files to NOT Commit:
```
.env.local (gitignored - has secrets)
node_modules/ (gitignored)
.next/ (gitignored)
```

---

## 🎯 Demo Script

### Scene 1: Guide Dashboard
1. Login as guide
2. See today's tours
3. Click "Report Incident"

### Scene 2: Incident Report
1. Select type: Medical
2. Select severity: High
3. Upload photo (optional)
4. Add description
5. Submit

### Scene 3: Supervisor View
1. Login as supervisor
2. See incident list
3. Click incident
4. View photo
5. Mark as resolved

### Scene 4: Super Admin
1. Navigate to /super-admin
2. Show companies tab (1 company)
3. Show brands tab (5 brands)
4. Show settings tab (Cloudinary config)

### Scene 5: Multi-Brand
1. Show 2 demo brands created
2. Explain: same ops, different branding
3. Future: filter by brand

---

## 🚀 V1.0 Scope

**Included:**
- User management
- Incident reporting + photos
- Vehicle management
- Expense tracking
- Supervisor dashboard
- Super admin dashboard
- Multi-brand support
- Cloudinary image upload

**V2 (Future):**
- Tour creation
- Calendar view
- Analytics dashboard
- Push notifications
- Bulk operations
- Google Drive integration (if needed)

---

## ✅ Ready to Commit When:
1. Build passes
2. All flows tested
3. .env.local has real API secret

**I'll confirm when ready.** 🧙
