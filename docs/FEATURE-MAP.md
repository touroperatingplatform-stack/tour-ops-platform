# Tour Ops Platform - Feature Map

## Core Features & Role Permissions

### 1. INCIDENTS

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| Create incident | ✅ | ❌ | ❌ | ❌ | ✅ |
| View own incidents | ✅ | ❌ | ❌ | ❌ | ✅ |
| View all incidents | ❌ | ✅ | ✅ | ✅ | ✅ |
| Acknowledge incident | ❌ | ✅ | ✅ | ✅ | ✅ |
| Resolve incident | ❌ | ✅ | ✅ | ✅ | ✅ |
| Edit incident | ✅ | ❌ | ✅ | ✅ | ✅ |

**Pages:**
- `/guide/tours/[id]/incident` - Create incident (Guide)
- `/operations` - View/acknowledge/resolve (Operations, Supervisor)
- `/supervisor/incidents` - Full incident management (Supervisor)

**Data Flow:**
```
Guide creates → Operations sees → Operations acknowledges → Operations resolves
                     ↓
              Supervisor monitors → Supervisor can override
```

---

### 2. TOURS

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| View assigned tours | ✅ | ✅ (all) | ✅ (all) | ✅ | ✅ |
| View all tours | ❌ | ✅ | ✅ | ✅ | ✅ |
| Check in to tour | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update tour status | ✅ | ❌ | ✅ | ✅ | ✅ |
| Edit tour details | ❌ | ❌ | ✅ | ✅ | ✅ |
| Create tour | ❌ | ❌ | ❌ | ✅ | ✅ |

**Pages:**
- `/guide` - Guide dashboard (assigned tours)
- `/guide/tours` - My tours list
- `/guide/tours/[id]` - Tour detail + check-in
- `/operations` - All tours overview
- `/operations/schedule` - Schedule view
- `/supervisor` - All tours monitoring
- `/supervisor/tours` - Tour management

---

### 3. VEHICLES

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| View vehicles | ❌ | ✅ | ✅ | ✅ | ✅ |
| View assigned vehicle | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update vehicle status | ❌ | ✅ | ❌ | ✅ | ✅ |
| Report vehicle issue | ✅ | ✅ | ✅ | ✅ | ✅ |

**Pages:**
- `/operations/vehicles` - Fleet management (Operations)

---

### 4. GUIDE CHECK-INS

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| Check in | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own check-ins | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all check-ins | ❌ | ✅ | ✅ | ✅ | ✅ |
| Monitor punctuality | ❌ | ✅ | ✅ | ✅ | ✅ |

**Pages:**
- `/guide/checkin` - Check in (Guide)
- `/operations` - Recent check-ins widget
- `/supervisor` - Check-in monitoring

---

### 5. EXPENSES

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| Create expense | ✅ | ❌ | ❌ | ❌ | ❌ |
| View own expenses | ✅ | ❌ | ❌ | ❌ | ❌ |
| View all expenses | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve expense | ❌ | ❌ | ✅ | ✅ | ✅ |

**Pages:**
- `/guide/expenses` - Create/view own (Guide)
- `/supervisor/expenses` - Approve (Supervisor)

---

### 6. REPORTS

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| View reports | ❌ | ✅ (placeholder) | ✅ (placeholder) | ✅ | ✅ |

**Pages:**
- `/operations/reports` - Operations analytics (placeholder)
- `/supervisor/reports` - Supervisor analytics (placeholder)

---

### 7. USER MANAGEMENT

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| View users | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create user | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit user role | ❌ | ❌ | ❌ | ❌ | ✅ |
| Delete user | ❌ | ❌ | ❌ | ❌ | ✅ |

**Pages:**
- `/super-admin/users` - User management (Super Admin only)

---

### 8. COMPANY/BRAND MANAGEMENT

| Feature | Guide | Operations | Supervisor | Manager | Admin |
|---------|-------|------------|------------|---------|-------|
| View companies | ❌ | ❌ | ❌ | ❌ | ✅ |
| Create company | ❌ | ❌ | ❌ | ❌ | ✅ |
| Manage brands | ❌ | ❌ | ❌ | ❌ | ✅ |

**Pages:**
- `/super-admin/companies` - Company management
- `/super-admin/brands` - Brand management

---

## Dashboard Summary

### Guide Dashboard (`/guide`)
- My Tours (list + detail)
- Check In (current tour)
- Expenses (create + view own)
- Incidents (create on tour)

### Operations Dashboard (`/operations`)
- All Tours Overview
- Vehicles (fleet management)
- Schedule (date-filtered)
- Incidents (acknowledge/resolve)
- Check-in Monitoring
- Reports (placeholder)

### Supervisor Dashboard (`/supervisor`)
- All Tours Monitoring
- Guides Management
- Incidents (full management)
- Expenses (approval)
- Reports (placeholder)

### Super Admin Dashboard (`/super-admin`)
- Companies
- Brands
- Users
- Demo Data
- Settings

---

## Testing Checklist

- [ ] **Incidents**: Guide creates → Operations acknowledges → Operations resolves → Supervisor can view all
- [ ] **Tours**: Guide checks in → Operations sees status → Supervisor monitors
- [ ] **Vehicles**: Operations manages → status reflects on dashboards
- [ ] **Check-ins**: Guide checks in → Operations sees → Supervisor monitors
- [ ] **Expenses**: Guide creates → Supervisor approves
- [ ] **Reports**: Placeholder pages load for all roles
- [ ] **Navigation**: Each role sees correct menu items
- [ ] **RLS**: Each role can only access permitted data/actions
