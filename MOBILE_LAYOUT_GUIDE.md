# Mobile Layout Guide - TOUR OPS PLATFORM

## Critical Pattern: Three-Section Flexbox Layout

**USE THIS FOR ALL MOBILE PAGES:**

```
┌─────────────────┐  ← Top Nav (fixed height, flex-shrink-0)
│                 │
├─────────────────┤
│                 │  ← Main Content (flex-1, overflow-y-auto)
│   SCROLLABLE    │     (fills available space between navs)
│                 │
├─────────────────┤
│                 │
└─────────────────┘  ← Bottom Nav (fixed height, flex-shrink-0)
```

## The WRONG Way (What NOT to do)

❌ **Don't use:** `position: fixed` on navbars
❌ **Don't use:** Padding hacks (`pb-24`, `pb-32`, `pb-48`, etc.)
❌ **Don't use:** Margins or guessing nav heights

These break document flow and never work reliably across devices.

## The RIGHT Way (Use this pattern)

### Layout Structure:

```tsx
// layout.tsx
<div className="h-screen flex flex-col bg-gray-100">
  {/* Top Nav - Fixed height */}
  <header className="flex-shrink-0 h-14 border-b border-gray-200">
    {/* Header content */}
  </header>
  
  {/* Main Content - Scrollable, fills space */}
  <main className="flex-1 overflow-y-auto">
    {children}
  </main>
  
  {/* Bottom Nav - Fixed height */}
  <nav className="flex-shrink-0 h-16 border-t border-gray-200">
    {/* Nav content */}
  </nav>
</div>
```

### Child Pages (no padding hacks needed):

```tsx
// page.tsx
<div className="p-4 space-y-4">
  {/* Your content here */}
  {/* No need for pb-48 or any bottom padding! */}
</div>
```

## Key CSS Classes:

| Element | Class |
|---------|-------|
| Container | `h-screen flex flex-col` |
| Top Nav | `flex-shrink-0 h-14` |
| Main Content | `flex-1 overflow-y-auto` |
| Bottom Nav | `flex-shrink-0 h-16` |

## Why This Works:

1. **Top nav**: `flex-shrink-0` prevents it from shrinking, stays at top
2. **Main content**: `flex-1` fills available space, `overflow-y-auto` scrolls
3. **Bottom nav**: `flex-shrink-0` prevents shrinking, stays at bottom
4. **Content**: Natural height, scrolls within the middle section

## Pages Fixed:

- ✅ Guide Dashboard (`/guide`)
- ✅ Tour Detail (`/guide/tours/[id]`)
- ✅ Incident Report (`/guide/incidents/new`)
- ✅ Tour Completion (`/guide/tours/[id]/complete`)
- ✅ Pickup Check-in (`/guide/tours/[id]/checkin`)

## To Fix Future Pages:

1. Make sure they use the GuideLayout (which has the 3-section structure)
2. Remove any `pb-XX` padding from child pages
3. Let the layout handle the spacing

## References:

- Commit: 93ddc4f "fix: restructure guide layout with proper flexbox"
- Files: `app/guide/layout.tsx`, `app/guide/page.tsx`, `app/guide/tours/[id]/page.tsx`
