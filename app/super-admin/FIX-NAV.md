# Fix Super Admin Navigation

The super-admin page needs to use AdminNav component like other dashboards.

## Manual Fix Required

Replace the return statement in `app/super-admin/page.tsx`:

**Current:**
```tsx
return (
  <RoleGuard requiredRole="super_admin">
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white py-6">
        ...
```

**Should be:**
```tsx
return (
  <RoleGuard requiredRole="super_admin">
    <AdminNav />
    <div className="min-h-screen bg-gray-50 pt-14">
      {/* Remove the old header div, AdminNav provides it */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        ...
```

## Steps:
1. Add `<AdminNav />` after RoleGuard opening
2. Add `pt-14` class to main div (for AdminNav header height)
3. Remove the old dark header div (AdminNav provides navigation)
4. Keep all tab navigation and content as-is

This will make super-admin consistent with operations/supervisor dashboards.
