# User Roles Reference - Demo Configuration

**Created:** 2026-03-26  
**Purpose:** Quick reference for demo/trial user credentials and roles

---

## 🎯 DEMO ROLE STRUCTURE

| Role | Count | Email | Password | UUID |
|------|-------|-------|----------|------|
| **Super Admin** | 1 | `super@lifeoperations.com` | [Your password] | `11307abc-2f53-46c7-a361-591426024a6c` |
| **Supervisor** | 1 | `sup@lifeoperations.com` | [Your password] | `4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd` |
| **Manager** | 1 | `manager@lifeoperations.com` | [Your password] | `23f5d796-65f4-463f-9d14-405bb60425bf` |
| **Guides** | 15 | (see below) | [Your password] | (see below) |

---

## 👥 ALL USERS BY ROLE

### Super Admin (1)
| Email | Name | UUID |
|-------|------|------|
| super@lifeoperations.com | Super Admin | 11307abc-2f53-46c7-a361-591426024a6c |

**Permissions:**
- ✅ Full platform access
- ✅ Import/export data
- ✅ Manage companies & brands
- ✅ Configure external APIs (Viator, GYG)
- ✅ Clear demo data
- ✅ All supervisor/manager/guide features

---

### Supervisor (1)
| Email | Name | UUID |
|-------|------|------|
| sup@lifeoperations.com | Supervisor Lead | 4c04e828-cb3d-4b94-aa1c-2f1573bc6ffd |

**Permissions:**
- ✅ View all tours (live map)
- ✅ Approve/reject expenses
- ✅ Manage incidents
- ✅ Monitor guide performance
- ✅ View all reports
- ❌ Cannot import/export data
- ❌ Cannot manage companies/brands

---

### Manager (1)
| Email | Name | UUID |
|-------|------|------|
| manager@lifeoperations.com | Manager User | 23f5d796-65f4-463f-9d14-405bb60425bf |

**Permissions:**
- ✅ Create/edit tours
- ✅ Assign guides to tours
- ✅ Manage guests (add/import)
- ✅ Manage fleet (vehicles)
- ✅ Create checklists/templates
- ✅ View reports
- ❌ Cannot approve expenses
- ❌ Cannot manage companies/brands

---

### Guides (15)

| # | Email | Name | UUID | Brand |
|---|-------|------|------|-------|
| 1 | guide2@lifeoperations.com | Guide Two | efb510fa-ff1e-4a77-8737-a6395e4000c5 | Brand 1 |
| 2 | mariagar@lifeoperations.com | Maria Garcia | 5c005430-27eb-4da2-ba4f-22c3e4d40397 | Brand 3 |
| 3 | gude@lifeoperations.com | Guide User | 0da9c371-5fe9-4e10-8122-1e3ee1836764 | Brand 2 |
| 4 | carlos@tour-ops.com | Carlos Rodriguez | d2cda25c-35c2-49ac-949c-bc52486d27a0 | Brand 1 |
| 5 | maria@tour-ops.com | Maria Garcia | cbbb22ba-178a-4a1d-ba49-d9f412f88b03 | Brand 1 |
| 6 | juan@tour-ops.com | Juan Lopez | d68d3488-1a30-4970-8aff-90e62e605c57 | Brand 1 |
| 7 | terryplanning@proton.me | Terry Planning | dd546e0a-bec5-406a-af41-405eb3d5abe4 | Brand 1 |
| 8 | terrysmith@lifeoperations.com | Terry Smith | a3862fb2-cd0c-4b74-b9da-aa08a9306137 | Brand 1 |
| 9 | ops@lifeoperations.com | Operations User | 3b8727c0-2f58-4137-8975-0c4d420ffedb | Brand 2 |
| 10 | opsd@lifeoperations.com | Ops Director | 594fe2ba-92ca-4870-9e0a-b0d468901f76 | Brand 1 |
| 11 | admin@lifeoperations.com | Admin User | 7b0d216f-7a23-44ea-b075-cb919b5424c1 | Brand 1 |
| 12 | diego@tour-ops.com | Diego Fernandez | 34ef0245-f2be-4c3d-a870-d5d081296046 | Brand 1 |
| 13 | elena@tour-ops.com | Elena Gomez | 4c9d2d29-699c-4f1a-9417-cc8b43987de6 | Brand 1 |
| 14 | roberto@tour-ops.com | Roberto Sanchez | bcf3d261-aec7-4ea6-b06d-c1756d197ea5 | Brand 1 |
| 15 | ana@tour-ops.com | Ana Martinez | 2fdb9d2b-dc40-4ec9-a0dd-d266bb3c24d8 | Brand 1 |

**Guide Permissions:**
- ✅ View assigned tours
- ✅ Check-in at pickups (GPS + selfie)
- ✅ Complete checklists
- ✅ Submit expenses
- ✅ Report incidents
- ✅ Complete end-of-tour report
- ✅ View guest manifest
- ❌ Cannot create tours
- ❌ Cannot approve expenses
- ❌ Cannot manage guests

---

## 🔐 LOGIN CREDENTIALS

**All users share the same password** (set when you created them in Supabase Auth).

**Password:** [You know this - share with trial clients as needed]

---

## 📋 DEMO WORKFLOW BY ROLE

### Super Admin Demo Flow
1. Login → `/super-admin`
2. Show Import Data tab
3. Import guests CSV
4. Show Demo Management tab
5. Clear demo data (if needed)
6. Configure external APIs (Viator/GYG)

### Supervisor Demo Flow
1. Login → `/supervisor`
2. Show LiveMap with guide locations
3. Review/approve expenses
4. Manage incidents
5. View tour reports

### Manager Demo Flow
1. Login → `/admin`
2. Create new tour
3. Assign guide + vehicle
4. Import/add guests
5. Create checklist template
6. View reports

### Guide Demo Flow
1. Login → `/guide`
2. View today's tours
3. Check-in at pickup (GPS + selfie)
4. Complete checklist
5. Submit expense
6. Complete end-of-tour report

---

## 🏢 COMPANY & BRAND INFO

**Company:**
- ID: `6e046c69-93e2-48c9-a861-46c91fd2ae3b`
- Name: [Check in Supabase → companies table]

**Brands (5 total):**
| Brand | UUID | Assigned Guides |
|-------|------|-----------------|
| Brand 1 | 6b6c93b4-4389-4f1a-98ad-deb622f57056 | Most guides |
| Brand 2 | b83ca70d-f545-42f0-a4f7-22155ffcf4d0 | ops@, gude@, manager@ |
| Brand 3 | 37be167b-74ca-4264-ad33-e0a7818e42c6 | mariagar@ |
| Brand 4 | [Check Supabase] | - |
| Brand 5 | [Check Supabase] | - |

---

## 📞 QUICK REFERENCE

**Need to test...** | **Login as...**
-------------------|----------------
Import guests | super@lifeoperations.com
Approve expenses | sup@lifeoperations.com
Create tour | manager@lifeoperations.com
Check-in to tour | guide2@lifeoperations.com
Report incident | Any guide
View live map | sup@lifeoperations.com

---

**File Location:** `docs/USER-ROLES-REFERENCE.md`  
**Last Updated:** 2026-03-26  
**Maintained By:** Super Admin
